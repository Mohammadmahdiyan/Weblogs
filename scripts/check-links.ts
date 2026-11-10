import { checkContentLinks } from './lib/link-check.ts'

// --strict: exit code 1 when there are BROKEN links (links to pages not written yet are only counted, never fail).
// --verbose: list every link to a page that is not written yet.
const args = process.argv.slice(2)
const unknown = args.filter((argument) => argument !== '--strict' && argument !== '--verbose')
if (unknown.length > 0) {
  console.error(`Unknown option(s): ${unknown.join(', ')}. Supported options: --strict, --verbose`)
  process.exitCode = 1
} else {
  await checkContentLinks({ strict: args.includes('--strict'), verbose: args.includes('--verbose') })
}
