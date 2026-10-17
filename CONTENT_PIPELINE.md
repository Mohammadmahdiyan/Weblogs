# Content pipeline

Create each article with `npm run createNewBlog <folder>` (see README §4): it lives in `content/blog/<folder>/index.md` with its media beside it. The folder name is the slug. The markdown holds only `tags` and `suggestions`; the title is its first `# ` line. `date` / `updated` are stored in `content/blog-dates.json` (written by `createNewBlog` / `updateBlog`, commit it); `updated` equals `date` until `updateBlog` runs. `npm run content` builds the generated metadata and public media for development; Vite runs the same builder when content changes and reloads the page.

The Vite production build passes `--production` explicitly to the builder. In production, folders whose names begin with `_` (test blogs from `createTest`) are skipped, so tests never reach the online site, the sitemap or the RSS feed. Development runs and `npm run content` include those folders, so example articles can be previewed locally.

## Additions (embeds, SEO files)

- `articles.json` fields: `slug, title, description, date, updated, tags, suggestions, cover{url,type}, readingTime` (+ optional `lang`, `dir`). There is no `style` (the reader picks it) and no `draft`.

- `coverEmbed` (https URL) becomes `cover: { type: 'embed', url, embedProvider, poster? }` when no local `cover.*` file exists.
- `lang` / `dir` are copied to `articles.json` and applied to the article body wrapper.
- `npm run content` also writes `public/sitemap.xml`, `public/rss.xml`, `public/robots.txt` and `public/_headers` (CSP `frame-src` from `embedAllowlist`).
- `scripts/prerender.ts` runs after `vite build` and writes `dist/blog/<slug>/index.html`.


## Inline Islamic honorifics

In article Markdown, write an honorific in parentheses after a name, for example `أبو بكر الصديق (رض)` or `رسول الله (ص)`. The renderer replaces supported markers with SVGs from `public/honorifics/`; the icons use the current text color and a consistent inline box size.

Supported markers include `(ص)`, `(ﷺ)`, `(صلى الله عليه وسلم)`, `(ع)`, `(عليه السلام)`, `(عليه الصلاة والسلام)`, `(رض)`, `(رضي الله عنه)`, `(رضي الله عنها)`, `(رضي الله عنهما)`, `(رضي الله عنهم)`, `(رضي الله عنهن)`, `(رح)`, `(رحمه الله)`, `(رحمها الله)`, `(رحمهم الله)`, `(رحمهما الله)`, `(رحمهن الله)`, `(جل جلاله)`, `(عز وجل)`, `(جل وعلا)`, `(سبحانه وتعالى)` and `(تبارك وتعالى)`.

`(رض)` is treated as the masculine singular form and uses `radu.svg`. For other grammatical forms, use the corresponding full phrase in parentheses. Markers are only transformed in normal Markdown text, not in code spans or fenced code blocks.
