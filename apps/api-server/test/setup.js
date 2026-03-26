const { execSync } = require('child_process')
const path = require('path')

module.exports = async function globalSetup() {
  // Use tsx which handles TypeScript and path aliases better
  // Load .env.e2e explicitly since dotenv -e doesn't propagate to subprocesses
  try {
    execSync('pnpm exec dotenv -e .env.e2e -- pnpm exec tsx ./test/setup.ts', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    })
  } catch (e) {
    console.error('Setup failed:', e)
    throw e
  }
}
