# Content pipeline

Create each article in `content/blog/<folder>/index.md` and place its media beside it. `npm run content` builds the generated metadata and public media for development; Vite runs the same builder when content changes and reloads the page.

The Vite production build passes `--production` explicitly to the builder. In production, folders whose names begin with `_` are skipped. Development runs and `npm run content` include those folders, so example articles can be previewed locally.
## Additions (embeds, SEO files)

- `coverEmbed` (https URL) becomes `cover: { type: 'embed', url, embedProvider, poster? }` when no local `cover.*` file exists.
- `lang` / `dir` are copied to `articles.json` and applied to the article body wrapper.
- `npm run content` also writes `public/sitemap.xml`, `public/rss.xml`, `public/robots.txt` and `public/_headers` (CSP `frame-src` from `embedAllowlist`).
- `scripts/prerender.ts` runs after `vite build` and writes `dist/blog/<slug>/index.html`.
