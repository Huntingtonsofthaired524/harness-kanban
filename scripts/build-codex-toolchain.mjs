#!/usr/bin/env node
import { execFile as execFileCallback } from 'node:child_process'
import { chmod, cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFile = promisify(execFileCallback)

const DEFAULT_CODEX_VERSION = '0.116.0'
const DEFAULT_NODE_VERSION = 'v24.14.0'
const DEFAULT_TARGETS = ['linux-arm64', 'linux-x64']

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const storeRoot = options.outputDir || resolveDefaultStoreRoot()
  const targets = options.targets.length > 0 ? options.targets : DEFAULT_TARGETS

  for (const target of targets) {
    const platform = parseTarget(target)
    await buildToolchainArtifact({
      codexVersion: options.codexVersion,
      nodeVersion: options.nodeVersion,
      platform,
      storeRoot,
    })
  }
}

function parseArgs(args) {
  const options = {
    codexVersion: DEFAULT_CODEX_VERSION,
    nodeVersion: DEFAULT_NODE_VERSION,
    outputDir: '',
    targets: [],
  }

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index]

    if (value === '--') {
      continue
    }

    if (value === '--codex-version') {
      options.codexVersion = requireNextArg(args, ++index, '--codex-version')
      continue
    }

    if (value === '--node-version') {
      options.nodeVersion = requireNextArg(args, ++index, '--node-version')
      continue
    }

    if (value === '--output-dir') {
      options.outputDir = resolve(requireNextArg(args, ++index, '--output-dir'))
      continue
    }

    if (value === '--target') {
      options.targets.push(requireNextArg(args, ++index, '--target'))
      continue
    }

    if (value === '--targets') {
      options.targets.push(
        ...requireNextArg(args, ++index, '--targets')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean),
      )
      continue
    }

    if (value === '--help' || value === '-h') {
      printHelp()
      process.exit(0)
    }

    throw new Error(`Unknown argument: ${value}`)
  }

  return options
}

function requireNextArg(args, index, flagName) {
  const value = args[index]
  if (!value) {
    throw new Error(`Missing value for ${flagName}`)
  }

  return value
}

function printHelp() {
  console.log(`Build prepackaged Codex toolchains for the harness worker.

Usage:
  pnpm toolchain:build:codex [options]

Options:
  --codex-version <version>  Codex npm package version. Default: ${DEFAULT_CODEX_VERSION}
  --node-version <version>   Node.js version to bundle. Default: ${DEFAULT_NODE_VERSION}
  --output-dir <path>        Toolchain store root directory. Default: platform cache directory
  --target <target>          Target to build, repeatable. Example: linux-arm64
  --targets <list>           Comma-separated targets. Default: ${DEFAULT_TARGETS.join(',')}
  --help                     Show this help text
`)
}

function resolveDefaultStoreRoot() {
  const home = process.env.HOME?.trim()
  if (!home) {
    throw new Error('HOME must be set or --output-dir must be provided')
  }

  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Caches', 'harness-kanban', 'toolchains')
  }

  const xdgCacheHome = process.env.XDG_CACHE_HOME?.trim()
  if (xdgCacheHome) {
    return join(xdgCacheHome, 'harness-kanban', 'toolchains')
  }

  return join(home, '.cache', 'harness-kanban', 'toolchains')
}

function parseTarget(target) {
  if (target === 'linux-arm64') {
    return { os: 'linux', arch: 'arm64' }
  }

  if (target === 'linux-x64') {
    return { os: 'linux', arch: 'x64' }
  }

  throw new Error(`Unsupported target: ${target}`)
}

async function buildToolchainArtifact({ codexVersion, nodeVersion, platform, storeRoot }) {
  const targetLabel = `${platform.os}-${platform.arch}`
  const workDir = await mkdtemp(join(tmpdir(), `harness-kanban-codex-toolchain-${targetLabel}-`))
  const targetOutputDir = join(storeRoot, 'codex', codexVersion)
  const archivePath = join(targetOutputDir, `codex-toolchain-${targetLabel}.tar.gz`)

  try {
    console.log(`Building Codex toolchain ${codexVersion} for ${targetLabel}`)

    const nodeArchiveName = `node-${nodeVersion}-${platform.os}-${platform.arch}.tar.xz`
    const nodeArchiveUrl = `https://nodejs.org/dist/${nodeVersion}/${nodeArchiveName}`
    const nodeArchivePath = join(workDir, nodeArchiveName)
    const runtimeDir = join(workDir, 'runtime')
    const packageDir = join(workDir, 'package')
    const bundleDir = join(workDir, 'bundle')

    await downloadFile(nodeArchiveUrl, nodeArchivePath)
    await mkdir(runtimeDir, { recursive: true })
    await execFile('tar', ['-xJf', nodeArchivePath, '-C', runtimeDir], {
      cwd: repoRoot,
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    })

    await execFile(
      'npm',
      [
        'install',
        '--prefix',
        packageDir,
        `--os=${platform.os}`,
        `--cpu=${platform.arch}`,
        '--libc=glibc',
        `@openai/codex@${codexVersion}`,
      ],
      {
        cwd: repoRoot,
        env: process.env,
        maxBuffer: 20 * 1024 * 1024,
      },
    )

    const extractedNodeDir = join(runtimeDir, `node-${nodeVersion}-${platform.os}-${platform.arch}`)
    const bundleRuntimeNodeDir = join(bundleDir, 'runtime', 'node')
    const bundlePackageDir = join(bundleDir, 'package')
    const bundleBinDir = join(bundleDir, 'bin')

    await mkdir(bundleBinDir, { recursive: true })
    await cp(extractedNodeDir, bundleRuntimeNodeDir, { recursive: true })
    await cp(packageDir, bundlePackageDir, { recursive: true })
    await writeWrapperScripts(bundleBinDir)
    await stripMacMetadata(bundleDir)

    await mkdir(targetOutputDir, { recursive: true })
    await execFile('tar', ['-czf', archivePath, '-C', bundleDir, '.'], {
      cwd: repoRoot,
      env: {
        ...process.env,
        COPYFILE_DISABLE: '1',
      },
      maxBuffer: 10 * 1024 * 1024,
    })

    console.log(`Wrote ${archivePath}`)
  } finally {
    await rm(workDir, { recursive: true, force: true })
  }
}

async function writeWrapperScripts(bundleBinDir) {
  const codexWrapperPath = join(bundleBinDir, 'codex')
  const nodeWrapperPath = join(bundleBinDir, 'node')
  const commonPrefix = [
    '#!/bin/sh',
    'set -eu',
    '',
    'SCRIPT_PATH=$0',
    'while [ -L "$SCRIPT_PATH" ]; do',
    '  LINK_TARGET=$(readlink "$SCRIPT_PATH")',
    '  case "$LINK_TARGET" in',
    '    /*) SCRIPT_PATH="$LINK_TARGET" ;;',
    '    *)',
    '      SCRIPT_DIR=$(CDPATH= cd -- "$(dirname "$SCRIPT_PATH")" && pwd)',
    '      SCRIPT_PATH="$SCRIPT_DIR/$LINK_TARGET"',
    '      ;;',
    '  esac',
    'done',
    '',
    'SELF_DIR=$(CDPATH= cd -- "$(dirname "$SCRIPT_PATH")" && pwd)',
    'ROOT_DIR=$(CDPATH= cd -- "$SELF_DIR/.." && pwd)',
    '',
  ]

  await writeFile(
    codexWrapperPath,
    [
      ...commonPrefix,
      'exec "$ROOT_DIR/runtime/node/bin/node" \\',
      '  "$ROOT_DIR/package/node_modules/@openai/codex/bin/codex.js" \\',
      '  "$@"',
      '',
    ].join('\n'),
    'utf8',
  )

  await writeFile(
    nodeWrapperPath,
    [
      ...commonPrefix,
      'exec "$ROOT_DIR/runtime/node/bin/node" "$@"',
      '',
    ].join('\n'),
    'utf8',
  )

  await chmod(codexWrapperPath, 0o755)
  await chmod(nodeWrapperPath, 0o755)
}

async function stripMacMetadata(directoryPath) {
  if (process.platform !== 'darwin') {
    return
  }

  try {
    await execFile('xattr', ['-cr', directoryPath], {
      cwd: repoRoot,
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    })
  } catch (error) {
    console.warn(
      `Warning: failed to strip macOS metadata from ${directoryPath}: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

async function downloadFile(url, destinationPath) {
  const response = await fetch(url)
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`)
  }

  const chunks = []
  for await (const chunk of response.body) {
    chunks.push(Buffer.from(chunk))
  }

  await writeFile(destinationPath, Buffer.concat(chunks))
}

await main()
