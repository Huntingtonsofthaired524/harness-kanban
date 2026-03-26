const { execSync } = require('child_process')
const path = require('path')

module.exports = async function globalTeardown() {
  execSync('pnpm exec dotenv -e .env.e2e -- pnpm exec tsx ./test/teardown.ts', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
  })
}
