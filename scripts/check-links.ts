import { checkContentLinks } from './lib/link-check.ts'

const args = process.argv.slice(2)
const unknown = args.filter((argument) => argument !== '--strict')
if (unknown.length > 0) {
  console.error(`Unknown option(s): ${unknown.join(', ')}. Supported option: --strict`)
  process.exitCode = 1
} else {
  await checkContentLinks({ strict: args.includes('--strict') })
}
