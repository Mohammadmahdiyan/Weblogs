# Content pipeline

## Categories, articles, and routes

Every immediate directory under `content/` is a top-level category with its own route and date registry:

- `content/books/` → `/books/`, registry `content/books.json`
- `content/media/` → `/media/`, registry `content/media.json`

Discovery is recursive. A directory containing `index.md` is an article; a directory without it is a folder listing, no matter how deeply nested it is. For example, `content/media/lives-nour/spider-house/topic/index.md` is `/media/lives-nour/spider-house/topic`. The first category segment stays in every URL. Put an article's media next to its `index.md`; relative media links are rewritten to the generated public media URL.

At `/`, visitors see image cards for the top-level categories and one search field to filter them. The page title, subtitle, search label, empty-state text, and each card's category, title, caption, and image are configured in `content/home.json`. Image paths are relative to `public/` (for example, `profile.jpg` or `books-media/.../cover.jpg`); absolute image URLs are also supported.

Category and nested folder listings use the same search header and image-card grid. A folder with child folders gets an editable page configuration in `content/folder-pages/<category>/`; for example, `/media/` is configured by `_root.json` and `/media/lives-nour/` by `lives-nour.json`. These JSON files contain the page title, subtitle, search label, list heading, empty message, and each child folder's Persian title, caption, and optional image. `npm run dev` and `npm run content` create missing configurations and add newly discovered folders while preserving text already entered. Fill in the empty Persian fields and image paths; image paths are relative to `public/`. Folders that contain article pages but no child folders remain regular article listings. The reserved `content/<category>/story/` directory is never treated as an article or listing.

### Date registry fields

Each category registry is a JSON object keyed by the article's relative folder path (for nested articles, for example `lives-nour/spider-house/topic`). Each value has:

- `date`: creation date (`YYYY-MM-DD`)
- `updated`: last update date (`YYYY-MM-DD`)
- `completed`: whether the article is complete; completed files update `updated` when saved in development
- `published`: whether to show the unfinished notice
- `route`: canonical site route, such as `/media/lives-nour/spider-house/topic`
- `name`: folder-card display name. Development fills in an English name from the folder when missing; a manually entered Persian name is retained.

On `npm run dev`, new nested articles are registered in the matching category JSON. Existing leaf-slug records are reused when moving an article into a nested directory; their date/completion/publication values are preserved. Legacy category registries can keep their old entries.

`npm run content` rebuilds generated metadata and media. The production build excludes any article nested beneath a folder beginning with `_`; development includes such fixtures. `show: false` in article frontmatter hides the article from production search, sitemap, and generated text while keeping the route available for the hidden-page notice.

Use the optional `aliases` frontmatter list for old route segments. A unique matching alias redirects to the canonical article route; aliases are checked after unique short-slug matches.

### Book pages

Book page files stay beside the book's `index.md`, under `pages/<number>.md`. For example:

```
content/books/answer-to-shobhat/alhad-noven-part1/
  index.md
  cover.jpg
  pages/27.md
```

This becomes `/books/answer-to-shobhat/alhad-noven-part1` with page 27 at `/books/answer-to-shobhat/alhad-noven-part1/27`. Page media may live under `pages/` or in the book folder.

## Header stories

The header story has three scopes: `story/` for `/`, `content/media/story/` for `/media/**`, and `content/books/story/` for `/books/**`. Manual stories are published for the current Tehran date and tracked together in `content/story-state.json`. Each Markdown file is a slide; standalone pictures are slides too. `npm run publishStory` publishes home, `npm run publishStory -- media` publishes media, and `npm run publishStory -- books` publishes books. `npm run cleanStory` removes all expired scopes; `npm run deleteStory -- <home|media|books>` removes one immediately.

For a route in a category, the header uses its current manual story first, then the deepest matching directory's automatic story, then a random story for the whole category, and finally the home story. Book page routes use the book's parent directory. Automatic selection is deterministic per day and scope. Eligible sections are level-two headings with at least 140 plain-text characters and at most 4,000 Markdown characters; test, adult, hidden, and (in production) unfinished articles are excluded. The build emits the unified `src/generated/stories.json`.

## Generated files and local workflow

`npm run dev` registers nested articles, watches content changes, and rebuilds the generated files. `npm run content` runs the builder once. `npm run build` runs the production builder, TypeScript, Vite, and prerendering. Generated metadata, search indexes, body loaders, sitemap, RSS, robots, and hosting headers are written by the builder and should not be edited by hand.

Old `/blog/<slug>` links redirect to the matching media article when a unique leaf slug is found, or to `/media` otherwise.
