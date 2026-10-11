import type { HLJSApi } from 'highlight.js'

/*
  Syntax highlighting with highlight.js (core + a handful of languages), loaded
  lazily the first time a code block renders. Chosen over shiki because it is
  much smaller (no WASM / grammar bundles) and runs synchronously once loaded.
  Colors come from the `.hljs-*` rules in index.css.
*/

const aliases: Record<string, string> = {
  sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash',
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  html: 'xml', svg: 'xml', yml: 'yaml', py: 'python', toml: 'ini', conf: 'ini',
}
const supported = new Set(['bash', 'python', 'typescript', 'javascript', 'json', 'css', 'xml', 'ini', 'diff', 'yaml', 'sql', 'markdown'])
const MAX_CODE_LENGTH = 20000

let loader: Promise<HLJSApi> | null = null

function load(): Promise<HLJSApi> {
  return Promise.all([
    import('highlight.js/lib/core'),
    import('highlight.js/lib/languages/bash'),
    import('highlight.js/lib/languages/python'),
    import('highlight.js/lib/languages/typescript'),
    import('highlight.js/lib/languages/javascript'),
    import('highlight.js/lib/languages/json'),
    import('highlight.js/lib/languages/css'),
    import('highlight.js/lib/languages/xml'),
    import('highlight.js/lib/languages/ini'),
    import('highlight.js/lib/languages/diff'),
    import('highlight.js/lib/languages/yaml'),
    import('highlight.js/lib/languages/sql'),
    import('highlight.js/lib/languages/markdown'),
  ]).then(([core, bash, python, typescript, javascript, json, css, xml, ini, diff, yaml, sql, markdown]) => {
    const hljs = core.default
    hljs.registerLanguage('bash', bash.default)
    hljs.registerLanguage('python', python.default)
    hljs.registerLanguage('typescript', typescript.default)
    hljs.registerLanguage('javascript', javascript.default)
    hljs.registerLanguage('json', json.default)
    hljs.registerLanguage('css', css.default)
    hljs.registerLanguage('xml', xml.default)
    hljs.registerLanguage('ini', ini.default)
    hljs.registerLanguage('diff', diff.default)
    hljs.registerLanguage('yaml', yaml.default)
    hljs.registerLanguage('sql', sql.default)
    hljs.registerLanguage('markdown', markdown.default)
    return hljs
  })
}

/** Returns escaped, highlighted HTML, or null when the language is unknown / code too long. */
export async function highlightCode(code: string, language: string): Promise<string | null> {
  const name = aliases[language.toLowerCase()] ?? language.toLowerCase()
  if (!supported.has(name) || code.length > MAX_CODE_LENGTH) return null
  loader ??= load()
  const hljs = await loader
  return hljs.highlight(code, { language: name, ignoreIllegals: true }).value
}
