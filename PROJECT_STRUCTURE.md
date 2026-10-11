# Project structure

```
content/blog/<slug>/index.md   one folder per article (+ its media files)
docs/COMPONENTS.md             cheat-sheet of every markdown directive
public/fonts/                  fonts.css + fonts.json + font files (pluggable)
scripts/
  build-content.ts             content → src/generated + sitemap/rss/robots/_headers
  prerender.ts                 post-build meta prerender of /blog/<slug>/index.html
  new-article.ts               `npm run new -- slug "title"`
  lib/                         media path rewriter + frontmatter validators (unit-tested)
src/
  components/                  shell, search, sidebar, lightbox, cover, font controls…
  components/mdx/              components behind markdown directives (SafeEmbed, Source, …)
  layouts/                     config.ts (8 style layouts) + ArticleLayout
  lib/                         markdown pipeline, embed helpers, search, normalize, toc…
  pages/                       HomePage, ArticlePage, NotFoundPage
  styles/theme.css             design tokens (light/dark)
  styles/blog-styles.css       the 8 blog styles (.blog-style-1 … .blog-style-8)
  site.config.ts               site name, nav, footer, embed allowlist…
  generated/                   auto-generated, git-ignored
tests/                         Vitest unit tests
```
