# Content pipeline

Create each article with `npm run createNewBlog <folder>` (see README §4): it lives in `content/blog/<folder>/index.md` with its media beside it. The folder name is the slug. The markdown holds only `tags` and `suggestions`; the title is its first `# ` line. `date` / `updated` are stored in `content/blog-dates.json` (written by `createNewBlog` / `updateBlog`, commit it); `updated` equals `date` until `updateBlog` runs. `npm run content` builds the generated metadata and public media for development; Vite runs the same builder when content changes and reloads the page.

The Vite production build passes `--production` explicitly to the builder. In production, folders whose names begin with `_` (test blogs from `createTest`) are skipped, so tests never reach the online site, the sitemap or the RSS feed. Development runs and `npm run content` include those folders, so example articles can be previewed locally.

## Additions (embeds, SEO files)

- `articles.json` fields: `slug, title, description, date, updated, tags, suggestions, cover{url,type}, readingTime` (+ optional `lang`, `dir`). There is no `style` (the reader picks it) and no `draft`.

- `coverEmbed` (https URL) becomes `cover: { type: 'embed', url, embedProvider, poster? }` when no local `cover.*` file exists.
- `lang` / `dir` are copied to `articles.json` and applied to the article body wrapper.
- `npm run content` also writes `public/sitemap.xml`, `public/rss.xml`, `public/robots.txt` and `public/_headers` (CSP `frame-src` from `embedAllowlist`).
- `scripts/prerender.ts` runs after `vite build` and writes `dist/blog/<slug>/index.html`.
