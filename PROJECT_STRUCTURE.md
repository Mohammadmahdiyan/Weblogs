# Project structure

```
content/blog/<slug>/index.md   one folder per article (+ its media files); `_name` = test blog
content/blog-dates.json        date / updated per blog (written by the blog commands)
docs/COMPONENTS.md             cheat-sheet of every markdown directive
public/fonts/                  fonts.css + fonts.json + font files (pluggable)
scripts/
  build-content.ts             content → src/generated + sitemap/rss/robots/_headers
  prerender.ts                 post-build meta prerender of /blog/<slug>/index.html
  new-article.ts               `npm run new -- slug "title"`
  blog-cli.ts                  createNewBlog / updateBlog / deleteBlog / createTest / deleteTest
  lib/                         blog.ts (md parsing, title, dates registry), media path rewriter, validators (unit-tested)
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
  generated/                   auto-generated, git-ignored
tests/                         Vitest unit tests
```
