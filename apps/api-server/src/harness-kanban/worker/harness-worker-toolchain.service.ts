import { constants as fsConstants } from 'node:fs'
import { access } from 'node:fs/promises'
import { join } from 'node:path'

import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

const DEFAULT_CODEX_TOOLCHAIN_VERSION = '0.116.0'

export type HarnessWorkerToolchainPlatform = {
  arch: 'arm64' | 'x64'
  os: 'linux'
}

export type HarnessWorkerToolchainArtifact = {
  archivePath: string
  kind: 'codex'
  version: string
}

@Injectable()
export class HarnessWorkerToolchainService {
  constructor(private readonly configService: ConfigService) {}

  async resolveCodexToolchainArtifact(
    platform: HarnessWorkerToolchainPlatform,
  ): Promise<HarnessWorkerToolchainArtifact> {
    const version =
      this.configService.get<string>('HARNESS_WORKER_CODEX_TOOLCHAIN_VERSION')?.trim() ||
      DEFAULT_CODEX_TOOLCHAIN_VERSION
    const archivePath = join(
      this.resolveToolchainStoreDir(),
      'codex',
      version,
      `codex-toolchain-${platform.os}-${platform.arch}.tar.gz`,
    )

    try {
      await access(archivePath, fsConstants.R_OK)
    } catch {
      throw new Error(
        `Codex toolchain archive was not found at ${archivePath}. Set HARNESS_WORKER_TOOLCHAIN_STORE_DIR to a directory that contains prebuilt Codex toolchains.`,
      )
    }

    return {
      archivePath,
      kind: 'codex',
      version,
    }
  }

  private resolveToolchainStoreDir(): string {
    const configuredPath = this.configService.get<string>('HARNESS_WORKER_TOOLCHAIN_STORE_DIR')?.trim()
    if (configuredPath) {
      return configuredPath
    }

    return this.resolveDefaultToolchainStoreDir()
  }

  private resolveDefaultToolchainStoreDir(): string {
    const home = process.env.HOME?.trim()
    if (!home) {
      throw new Error(
        'Cannot resolve the default toolchain store directory because HOME is not set. Configure HARNESS_WORKER_TOOLCHAIN_STORE_DIR explicitly.',
      )
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
}
