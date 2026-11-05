# Project structure

```
content/books/<path>/index.md  recursive book/article path; `pages/<number>.md` for book pages
content/media/<path>/index.md  recursive media/article path; media files live beside each index
content/<category>.json       per-category date/name/route registry (`books.json`, `media.json`)
content/<category>/story/     reserved, independent category stories (not article/listing folders)
docs/COMPONENTS.md             cheat-sheet of every markdown directive
public/fonts/                  fonts.css + fonts.json + font files (pluggable)
scripts/
  build-content.ts             content → src/generated + sitemap/rss/robots/_headers
  prerender.ts                 post-build prerender of nested category routes and legacy /blog redirects
  new-article.ts               `npm run new -- slug "title"`
  blog-cli.ts                  publish/delete/create-test commands for media and books
  lib/                         recursive content discovery, category date registries, media/story builders
src/
  emojis/                      emojis.ts (name → svg) + the emoji svg files
  components/                  shell, search, sidebar, lightbox, cover, font controls…
  components/mdx/              components behind markdown directives (SafeEmbed, Source, …)
  layouts/                     ArticleLayout (the single page layout)
  lib/                         markdown pipeline, embed helpers, search, normalize, toc, appearance…
  pages/                       HomePage, ArticlePage, NotFoundPage
  styles/theme.css             design tokens (light/dark) + colour palettes
  styles/blog-styles.css       article look + reader's small variants (quote / accordion / button)
  site.config.ts               site name, nav, footer, embed allowlist…
  generated/                   auto-generated per-category metadata, search, body loaders, stories
tests/                         Vitest unit tests
```
