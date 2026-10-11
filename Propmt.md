ME : (یک پروژه میخام درست کنم 
vite react type script tailwind 
من عکس و فیلم و فایل md میدم خودکار باید درست بشه که خودکار مقاله درست کنه
یک صفحه اصلی داشته باشه به این ادرس
xxxxx/
صفحه مقاله اینطوری باشه 
xxxxx/blog/[name blog]
توی صفحه اصلی یک ایتم هارو لیست کرده باشه عکس اگه داشتن با متن 
یک فایل json یا اگر ایده بهتری داری 
میخام سوال هایی که به اون مقاله اشاره میکنن رو هم بزاریم مثلا
name: married prophet (s) with ayesha (rz)
title: ازدواج پیامبر ص با مادر عایشه رض
suggestions: [
"آیا پیامبر ص با دختر 6 ساله ازدواج کرد", "ازدواج پیامبر ص با دختر 6 ساله" , "دلیل ازدواج پیامبر ص با مادر عایشه رض"
]
یک سرچ باکس توی صفحه xxxxx/ باشه که هر کدوم از suggestions رو سرچ کرد به این صفحه منتقل بشه married prophet (s) with ayesha (rz)
میخام یک عکس یا یک فیلم یا یک صدا همیشه اول نشون داده بشه در وبلاگ 
و میخام title رو همیشه به عنوان h1 صفحه در نظر بگیره
تم دارک مد و لایت مد و سیستم که دیفالت روی سیستم باشه 
میخام به راحت ترین شکل ممکن بشه مقاله جدید اضافه کرد فایل md  مشخصه مثلا ## h2 ، چیزایی مثل اکاردعون و 

* [Accordion](https://www.material-tailwind.com/docs/html/accordion)
* [Alert](https://www.material-tailwind.com/docs/html/alert)
* [Avatar](https://www.material-tailwind.com/docs/html/avatar)
* [Badge](https://www.material-tailwind.com/docs/html/badge)
* [Breadcrumbs](https://www.material-tailwind.com/docs/html/breadcrumbs)
* [Button](https://www.material-tailwind.com/docs/html/button)
* [Button Group](https://www.material-tailwind.com/docs/html/button-group)
* [Card](https://www.material-tailwind.com/docs/html/card)
* [Collapse](https://www.material-tailwind.com/docs/html/collapse)
* [Dialog](https://www.material-tailwind.com/docs/html/dialog)
* [Footer](https://www.material-tailwind.com/docs/html/footer)
* [Gallery](https://www.material-tailwind.com/docs/html/gallery)
* [Icon Button](https://www.material-tailwind.com/docs/html/icon-button)
* [Image](https://www.material-tailwind.com/docs/html/image)
* [List](https://www.material-tailwind.com/docs/html/list)
* [Modal](https://www.material-tailwind.com/docs/html/modal)
* [Pagination](https://www.material-tailwind.com/docs/html/pagination)
* [Popover](https://www.material-tailwind.com/docs/html/popover)
* [Rating](https://www.material-tailwind.com/docs/html/rating)
* [Select](https://www.material-tailwind.com/docs/html/select)
* [Skeleton](https://www.material-tailwind.com/docs/html/skeleton)
* [Spinner](https://www.material-tailwind.com/docs/html/spinner)
* [Switch](https://www.material-tailwind.com/docs/html/switch)
* [Table](https://www.material-tailwind.com/docs/html/table)
* [Tooltip](https://www.material-tailwind.com/docs/html/tooltip)
* [Typography](https://www.material-tailwind.com/docs/html/typography)
* [Video](https://www.material-tailwind.com/docs/html/video)

و روی عکس و گیف و ویدیو وقتی کلیک میشه یک پنجره بزرگ نشون بده برای بزرگ نماییشون اینجوری چیز ها هم اضافه کن و خلاصه اموزش رو در readme بزار اگه تگ اضافه شد 
اگه تگ اچ تی ام ال داخل فایل ام دی شد با استایل باید باز هم کار کنه 
لودینگ زیبا طبق تم لایت و دارک هم بزاری
میخام وبلاگ ها 8 نوع استایل دهی داشته باشت که هر هشتاشون استایل دهی روز دنیا برای وبلاگ ها باشن یکی از تم ها [راهنمای نصب جنگو بدون اینترنت](https://sabzlearn.ir/blog/install-django-without-internet/) این ظاهر رو داشته باشه
README بنویس
فونت وزیر رو میازم ولی جوری بنویس که اگه بعدا فونت اضافه شد بشه توی خروجی(xxxxx/ ) فونت رو عوض کرد 
توی (xxxxx/ ) فونت رو هم بشه کم و زیاد کرد 
یک ساید بار داشته باشه که بلاگ های بعدی و بلاگ های قبلی رو نشون بده 
از تو میخام برای github coplit vscode یک پراپمت با نهایت دقت بنویسی به زبان اینگلیسی که همون چیزی که من میخام رو دقیقا پیاده کنه
و پراپمت رو به ده بخش تقسیم کن که بتونه بدون مشکل همشو درست کنه)
claude : (
# پرامپت ده‌بخشی برای GitHub Copilot (VS Code)

هر بخش را جداگانه و **به ترتیب** در Copilot Chat (حالت Agent) بده. بعد از هر بخش مطمئن شو `npm run dev` و `npm run build` بدون خطا کار می‌کنند و بعد بخش بعدی را بفرست.

چند تصمیم معماری که در پرامپت‌ها گرفتم:
- **ایده بهتر از JSON دستی:** هر مقاله یک پوشه است با `index.md` و frontmatter (به‌جای فایل JSON جدا). title، suggestions، theme و ... داخل خود md هستند، و فایل JSON فهرست مقاله‌ها در زمان build خودکار ساخته می‌شود. افزودن مقاله = ساخت یک پوشه.
- رندر markdown با `unified` (remark + rehype) و کامپوننت‌های سفارشی، بدون نیاز به MDX.
- از **Material Tailwind** پکیج React استفاده نمی‌شود (با Tailwind 4 مشکل دارد)؛ ظاهرش با Tailwind خالص بازسازی می‌شود.

---

## Part 1 — Project scaffold & configuration

```
You are an expert senior front-end engineer. We are building a static, multilingual (RTL-first, Persian) blog engine. Work in the current empty workspace folder. Follow every instruction exactly. Do not skip steps. Do not ask questions; make reasonable decisions and document them.

## PART 1 OF 10: Scaffold and configuration

Goal: Create the base project.

Stack (mandatory): Vite + React 18 + TypeScript (strict) + Tailwind CSS v4 (using @tailwindcss/vite plugin) + react-router-dom v6 (BrowserRouter).

Steps:
1. Scaffold with `npm create vite@latest . -- --template react-ts` (if the folder is not empty, merge sensibly).
2. Install dependencies:
   - runtime: react-router-dom, unified, remark-parse, remark-gfm, remark-rehype, rehype-raw, rehype-slug, rehype-stringify (or rehype-react), remark-directive, unist-util-visit, gray-matter, fuse.js, lucide-react, clsx
   - dev: tailwindcss, @tailwindcss/vite, @tailwindcss/typography, @types/node, tsx
3. Configure `vite.config.ts` with the react plugin, tailwind plugin, and path alias `@` -> `src`. Mirror the alias in `tsconfig.app.json` (paths).
4. Enable TypeScript strict mode. No `any` unless commented why.
5. Create `src/index.css` with `@import "tailwindcss";` and `@plugin "@tailwindcss/typography";`. Add `@custom-variant dark (&:where(.dark, .dark *));` so dark mode is class-based.
6. Set `<html lang="fa" dir="rtl">` in `index.html`. Add a tiny inline script in `<head>` (runs before React, prevents flash) that: reads `localStorage.theme` ("light" | "dark" | "system"; default "system"), and toggles the `dark` class on `<html>` using `matchMedia('(prefers-color-scheme: dark)')`.
7. Create this folder structure (empty files/folders with a `.gitkeep` where needed):

```
content/
  blog/
    _example-article/
      index.md
      cover.jpg   (placeholder; create a tiny valid placeholder or document that user must add)
public/
  fonts/
    README.md          (explains how to add fonts)
    fonts.css          (font-face declarations + registry, see Part 8)
scripts/
  build-content.ts     (will be written in Part 2)
src/
  components/
  components/mdx/        (custom markdown components, Part 4–5)
  layouts/               (blog style layouts, Part 7)
  pages/
  hooks/
  lib/
  styles/
  generated/             (auto-generated JSON, gitignored)
README.md
```

8. Add to `.gitignore`: `src/generated/`, `dist`, `node_modules`.
9. Add npm scripts:
   - `"content": "tsx scripts/build-content.ts"`
   - `"dev": "npm run content && vite"`
   - `"build": "npm run content && tsc -b && vite build"`
   - `"preview": "vite preview"`
10. Add `public/_redirects` containing `/* /index.html 200` and a note in README about SPA fallback hosting.

Acceptance criteria: `npm run dev` starts (even if the app shows only a placeholder "Hello"), `npm run build` passes with zero TypeScript errors.
```

---

## Part 2 — Content model & automatic content builder

```
## PART 2 OF 10: Content model and the automatic content builder script

Context: Parts 1 is done. Now implement the content system. The user adds a new article ONLY by creating a folder in `content/blog/<slug>/` containing `index.md` plus any media files. Nothing else must be edited manually.

### Folder convention
```
content/blog/<slug>/
  index.md       (required)
  cover.jpg|png|webp|gif|mp4|webm|mp3|ogg|wav|m4a   (optional; any file named `cover.*`)
  any-other-media-files...
```
The URL slug is the folder name (or frontmatter `name` if provided, slugified).

### Frontmatter schema (YAML at top of index.md)
```yaml
---
name: married-prophet-with-ayesha      # optional; URL slug. Defaults to folder name. Must be URL-safe (a-z, 0-9, -, _). 
title: ازدواج پیامبر ص با مادر عایشه رض   # REQUIRED. This becomes the page <h1>.
description: short summary              # optional; if missing, auto-extract the first ~160 chars of plain text from the body
date: 2025-01-31                        # optional; if missing use the file's mtime
updated: 2025-02-10                     # optional
tags: [history, family]                 # optional
suggestions:                            # optional; search phrases that should lead to this article
  - آیا پیامبر ص با دختر 6 ساله ازدواج کرد
  - ازدواج پیامبر ص با دختر 6 ساله
  - دلیل ازدواج پیامبر ص با مادر عایشه رض
cover: ./cover.jpg                      # optional; if missing, auto-detect `cover.*` in the folder; if none, article has no cover
style: 1                                # optional; blog style 1..8 (see Part 7). Default: 1
draft: false                            # optional; drafts are excluded from the build
---
```

### Write `scripts/build-content.ts` (run with tsx) that:
1. Scans `content/blog/*/index.md` (ignore folders starting with `_` unless `INCLUDE_EXAMPLES=1`... actually: ignore folders starting with `_` only in production build; include them in dev. Keep it simple: use `process.env.NODE_ENV !== 'production'`... if that's unreliable, add a CLI flag. Document the choice.)
2. Parses frontmatter with `gray-matter`. Validates with a hand-written validator (no extra deps): `title` required; `suggestions` must be string[]; `style` must be integer 1..8; on error print a clear message including the file path and FAIL the build (exit 1).
3. Ensures slugs are unique; fail on duplicates.
4. Copies every media file of each article into `public/content/<slug>/` (so they are served at `/content/<slug>/<file>`). Clean the target folder first so deleted files disappear.
5. Rewrites relative media paths inside the markdown body (`./img.png`, `img.png`, `../x`) AND inside raw HTML attributes (`src`, `href`, `poster`, `srcset`) to `/content/<slug>/<file>`. Leave absolute URLs (http/https/data:/ /) untouched.
6. Detects the cover and its media type: `image | video | audio`, by extension (gif counts as image). Writes `coverType`.
7. Computes `readingTime` (minutes, 200 wpm; works for Persian text by counting whitespace-separated tokens).
8. Generates these files in `src/generated/`:
   - `articles.json`: array of article METADATA only (no body), sorted by date desc: `{ slug, title, description, date, updated, tags, suggestions, cover: { url, type } | null, style, readingTime }`
   - `search-index.json`: array of `{ slug, title, phrases: string[] }` where phrases = `[title, ...suggestions, ...tags]`.
   - `bodies/<slug>.md`: raw markdown body (with rewritten media paths), one file per article.
   - `bodies.ts`: a module exporting a map `slug -> () => import('./bodies/<slug>.md?raw')` for lazy loading (Vite `?raw` imports).
   - `types.ts` is NOT generated; types live in `src/lib/types.ts` (write it now: `ArticleMeta`, `SearchEntry`, `CoverType`).
9. Prints a clean summary table: slug, title, style, cover type, number of suggestions.
10. Also support `npm run content -- --watch`? No — skip. Instead make Vite re-run the script on content change by writing a tiny Vite plugin in `vite.config.ts` that watches `content/**` during dev, runs the build-content script, and triggers a full reload.

### Also create
- `content/blog/_example-article/index.md` with the sample frontmatter above (use the Persian example from the user: name `married-prophet-with-ayesha`, the title and the 3 suggestions) and a body containing a variety of markdown to test later parts (h2, h3, lists, table, blockquote, an image reference, a code block, an accordion directive, an alert directive — syntax defined in Part 4). Use plain placeholder text, not real religious claims; keep it neutral lorem-style Persian text.
- `src/lib/types.ts`.

Acceptance criteria: `npm run content` generates the files and the printed summary; TypeScript compiles; broken frontmatter fails with a readable error.
```

---

## Part 3 — Markdown rendering pipeline (with raw HTML support)

```
## PART 3 OF 10: Markdown → React rendering pipeline

Create `src/lib/markdown.ts` and `src/components/MarkdownRenderer.tsx`.

Requirements:
1. Pipeline (unified): remark-parse → remark-gfm → remark-directive → a custom remark plugin (`remarkComponents`, written in Part 4) → remark-rehype with `allowDangerousHtml: true` → rehype-raw → rehype-slug → convert hast to React elements (use `hast-util-to-jsx-runtime` or `rehype-react`) with a **component map** so that standard tags are replaced by our styled components.
2. **Raw HTML inside markdown must work** (e.g. `<div class="p-4 bg-blue-100 rounded">…</div>`, `<details>`, `<iframe>`, `<video>`, `<img>`). Tailwind classes written in raw HTML must work: configure Tailwind v4 `@source` in `src/index.css` to include `../content/**/*.md` and `../src/generated/bodies/*.md` so those classes get generated. Also add a `@source inline(...)` safelist note in README for dynamic classes.
3. Sanitization: since content is authored by the site owner, trust it, BUT strip `<script>` tags and `on*` event attributes anyway (small rehype plugin) for safety.
4. The component map must override: `h1`→ rendered as `h2` (the page's ONLY h1 is the article `title` from frontmatter; if the markdown body contains `# Heading`, demote to h2 and every other level +1 up to h6), `h2..h6` (with anchor links, auto `id` from rehype-slug), `p`, `a` (external links open in new tab with `rel="noopener noreferrer"`, show a small external icon), `ul/ol/li`, `blockquote`, `code`/`pre` (copy button, language label, horizontal scroll, LTR direction for code), `table` (wrapped in a horizontally-scrollable container), `hr`, `img`, `video`, `audio`, `iframe` (responsive 16:9 wrapper), `details/summary` (styled like an accordion).
5. `img`, GIF and `video` must open in the lightbox on click (Part 5 builds the lightbox; for now create the hook/context stub `useLightbox()` and wire it so Part 5 only fills in the UI).
6. Lazy-load images (`loading="lazy"`, `decoding="async"`), and reserve space to avoid layout shift when width/height are available.
7. Use Tailwind Typography (`prose`) as the base, with RTL-friendly settings (`prose-headings`, logical properties `ms-`, `me-`, `ps-`, `pe-`, `text-start`). Never use `left/right` utilities; use logical ones.
8. Memoize the processor; render asynchronously (`processor.process`) inside a `useEffect`/`use` with a skeleton fallback.

Acceptance criteria: the example article's body renders correctly as a React tree, h1 in markdown is demoted, raw HTML with Tailwind classes is styled, no console warnings.
```

---

## Part 4 — Markdown-friendly UI components (directive syntax)

```
## PART 4 OF 10: Rich components usable from Markdown

Goal: The author writes components in markdown using the **remark-directive** syntax, and optionally raw HTML. Implement a `remarkComponents` plugin (using unist-util-visit) that converts directives into hast nodes with `data.hName` / `data.hProperties` so that `MarkdownRenderer` maps them to React components.

Implement these components in `src/components/mdx/` as accessible, Tailwind-only, RTL-aware, dark-mode-aware React components. Visual reference: Material Tailwind HTML components (https://www.material-tailwind.com/docs/html/*) — recreate their look with plain Tailwind classes. DO NOT install the material-tailwind package. All colors/radii must come from the theme CSS variables defined in Part 7 (e.g. `var(--brand)`, `var(--surface-alt)`, `var(--border-strong)`), never hardcoded, so every blog style (1–8) restyles them automatically.

Supported directives (container = `:::name{attrs}` … `:::`, leaf = `::name{attrs}`, inline = `:name[label]{attrs}`):

| Component | Markdown syntax |
|---|---|
| Accordion | `:::accordion` containing multiple `:::item{title="..." open}` blocks |
| Alert | `:::alert{type="info|success|warning|danger"}` … `:::` |
| Avatar | `::avatar{src="" name="" size="md"}` |
| Badge | `:badge[text]{color="blue"}` |
| Breadcrumbs | `:::breadcrumbs` with a markdown list of links |
| Button | `:button[Label]{href="" variant="filled|outlined|text" color=""}` |
| Button group | `:::buttons` containing buttons |
| Card | `:::card{title="" image=""}` … `:::` |
| Collapse | `:::collapse{title=""}` … `:::` |
| Dialog / Modal | `:::modal{trigger="Open" title=""}` … `:::` (native `<dialog>` or portal; focus trap, ESC to close) |
| Gallery | `:::gallery` containing markdown images → responsive grid; each opens in the lightbox as part of a navigable set |
| Icon button | `:iconbutton[icon-name]{href=""}` using lucide-react names |
| List | standard md lists are styled; `:::list{variant="check|number|bullet"}` for fancy lists |
| Pagination | `:::pagination{total="" current=""}` (static display) |
| Popover | `:popover[trigger text]{content="..."}` |
| Rating | `::rating{value="4.5" max="5"}` |
| Select | `::select{options="a,b,c"}` (display-only demo) |
| Skeleton | `::skeleton{lines="3"}` |
| Spinner | `::spinner{size="md"}` |
| Switch | `::switch{label="" checked}` |
| Table | GFM tables styled (zebra rows, sticky header option, responsive) |
| Tooltip | `:tooltip[word]{text="explanation"}` |
| Typography | headings/paragraph/lead/small via normal md + `:::lead` … `:::` |
| Video | `::video{src="" poster=""}` and plain `![](file.mp4)` auto-detected by extension (mp4/webm) → `<video controls playsinline>`; audio extensions (mp3/ogg/wav/m4a) → `<audio controls>` |
| **Suggested** | `:::suggested{href="" label="مقاله پیشنهادی"}` link text `:::` — see spec below |
| **Course promo** | `:::course{title="" href="" image="" label="دوره پیشنهادی" cta="مشاهده دوره"}` — see spec below |
| Footer | the site footer is a layout component (Part 6), not a directive |

### Spec: `suggested` (inline "recommended article" callout)
A flex row (wraps on mobile), gap 12px, padding 12px (16px on sm+), 1px border `var(--border-light)`, radius 8px, very light tinted background (`color-mix(in srgb, var(--text) 2%, transparent)`, 4% on hover), smooth transition. Left part: label in `var(--info)` demibold (default "مقاله پیشنهادی:"). Right part: the link (medium weight, no underline, `margin:0`). Internal links (starting with `/`) use react-router `Link`; external ones open in a new tab with `rel="noopener noreferrer"`. Must carry the `not-prose` class so Tailwind Typography does not restyle it.

### Spec: `course` (horizontal promo card)
Flex row (column + centered on mobile), gap 14–16px, same border/radius/tint as `suggested`, `not-prose`. Contains: 16:9 thumbnail (width 160px, radius 6px, lazy-loaded), a small pill label (brand color text on brand 10% background, radius 6px), the title (link, 14px), and a small "view" button (info-blue text on info 10% background, radius 6px, with an arrow icon that is flipped correctly in RTL). If `image` is missing, hide the thumbnail gracefully.

### Spec: `accordion` (FAQ look, used by Style 1 and reused by all styles)
Each `item`: rounded-md (6px) container with `var(--surface-alt)` background; header row = `var(--border-light)`-ish gray background (`var(--surface-strong)`), bold small text, chevron icon on the end side that rotates when open; content area padded, 12–14px text. Use `<button aria-expanded aria-controls>` + region; keyboard accessible; animate height with CSS grid-rows trick; respects `prefers-reduced-motion`. Gap between items 16px. Also emit `FAQPage` JSON-LD for the article automatically when an accordion titled "سوالات متداول" or any accordion with `faq` attribute (`:::accordion{faq}`) is present (collect via the markdown AST in the build script or at render time and pass to the SEO component from Part 9).

Rules:
- Every component supports dark mode via theme variables.
- Every interactive component is keyboard accessible with correct ARIA attributes (accordion: `aria-expanded`, `aria-controls`; dialog: `aria-modal`, etc.).
- Unknown directives render a visible dev-only warning box (only in `import.meta.env.DEV`).
- Raw HTML equivalents must ALSO work (e.g. `<details>` styled as an accordion in Part 3; plain HTML + Tailwind classes anywhere).
- Extend `content/blog/_example-article/index.md` so it demonstrates EVERY component above exactly once (neutral placeholder text in Persian).
- Create `docs/COMPONENTS.md` (full cheat-sheet of every directive with copy-paste examples). README (Part 10) links to it.

Acceptance criteria: every directive in the example article renders; invalid usage never crashes the page (error boundary per component); `suggested` and `course` look like the described callouts in light and dark; `npm run build` passes.
## PART 5 OF 10: Lightbox + the "media always first" rule

### 1. Lightbox (`src/components/Lightbox.tsx` + `LightboxProvider` + `useLightbox`)
- Clicking ANY image, GIF or video inside the article body (and the cover) opens a large full-viewport overlay.
- Supports: image, animated GIF, `<video>` (with controls, autoplay on open, pause on close), and audio is excluded.
- Features: ESC to close, click on backdrop to close, close button, focus trap, restore focus on close, body scroll lock, previous/next navigation among all lightbox-able media in the current article (arrow keys + buttons; in RTL the visual direction of arrows must be flipped correctly), pinch/scroll zoom for images (simple: click to toggle 1x/2x + wheel zoom + drag to pan when zoomed), caption from `alt`/`title`, counter "3 / 8", smooth fade/scale animation, respects `prefers-reduced-motion`.
- Render through a React portal. Preload the next image.
- Works with `Gallery` (Part 4) items as a set.
- Cursor: `zoom-in` on hoverable media.

### 2. Media-first rule in the article page
In the article page (built in Part 6), the FIRST thing shown after the header must always be the cover media if it exists:
- image/gif → responsive `<img>` (priority loading, `fetchpriority="high"`, aspect-ratio preserved, rounded, click → lightbox)
- video → `<video controls playsinline preload="metadata">` with poster if a same-named image exists
- audio → a styled custom audio player card (play/pause, seek bar, time, volume; built with the `<audio>` element and Tailwind) with a decorative waveform/icon
If there is no cover, skip the block gracefully (no empty space).
Create `src/components/CoverMedia.tsx` and `src/components/AudioPlayer.tsx`.

Acceptance criteria: lightbox works with keyboard and touch; works in RTL; works in dark/light; no layout shift for the cover.
```

---

## Part 6 — Routing, pages, search box, sidebar

```
## PART 6 OF 10: Routes, Home page, Article page, Search, Sidebar, Header/Footer

### Routes (react-router-dom v6, BrowserRouter)
- `/`  → HomePage
- `/blog/:slug` → ArticlePage (slug = `name`/folder name)
- `*` → NotFoundPage (friendly, with a link home)
Use `React.lazy` + `Suspense` per route with the themed loading screen (Part 9). Scroll to top on route change. Update `document.title` and meta description per page (small `usePageMeta` hook; also set `og:title`, `og:description`, `og:image` when a cover image exists).

### Site shell (shared by all pages) — modeled after a modern Persian education blog
- **Announcement bar** (optional): a thin brand-colored bar above the header with a short text and an optional link. Controlled by `src/site.config.ts` → `announcement: { enabled, text, linkText, linkHref }`. Dismissible (remember in sessionStorage).
- **Header**: white/surface, 1px bottom border (`var(--border-strong)`), height ~80px desktop / 64px mobile. Contains site logo/name (text or `public/logo.svg` if present), main nav links from `site.config.ts` (`nav: [{label, href}]`), theme toggle (Part 7) and font controls popover (Part 8). Mobile: hamburger opens a drawer (focus trap, ESC, backdrop).
- **Footer**: dark rounded block (`#242424` in light theme, slightly lighter surface in dark), 12px radius, a decorative brand-colored rounded square offset behind its top corner (hidden on mobile), 3–4 columns (about text, useful links, suggested articles = latest 4, contact/social links) from `site.config.ts` (`footerLinks`, `social`), and a bottom strip with `rgba(255,255,255,.1)` background containing the copyright text and year. Semantic `<footer>` landmark.
Everything must be driven by `src/site.config.ts` (`siteName`, `siteDescription`, `siteUrl`, `defaultFont`, `defaultStyle`, `announcement`, `nav`, `footerLinks`, `social`).

### HomePage (`/`)
- **Search box** at the top, large and centered, with these behaviors:
  - Data source: `src/generated/search-index.json`.
  - Use `fuse.js` for fuzzy search over `phrases` (Persian/Arabic normalization: unify `ي/ی`, `ك/ک`, remove diacritics/tashkeel, remove ZWNJ/half-space differences, convert Arabic-Indic and Persian digits to ASCII, lowercase Latin, trim, collapse spaces). Put this in `src/lib/normalize.ts` with unit-testable pure functions.
  - Live dropdown of matches: matched phrase highlighted + article title. Max 8 results. Keyboard navigation (↑/↓/Enter/Esc), ARIA combobox pattern.
  - **IMPORTANT BEHAVIOR:** if the user selects/submits a phrase that EXACTLY matches (after normalization) any article's `suggestions` entry (or title), navigate directly to `/blog/<that article slug>`. If it matches multiple articles or is only fuzzy, show the results list and do not auto-navigate unless there is one clearly best match (score threshold documented in code).
  - Friendly empty state when nothing matches.
- Font controls (Part 8) are also visible on the home page, directly under/next to the search box (not only in the header popover).
- Below the search: **grid/list of articles** (sorted by date desc). Each card: cover thumbnail if the cover is an image (video cover → play-icon badge with poster if available; audio → headphones placeholder), title (h2), description, date, reading time, tags. No cover → text-only card. Cards link to `/blog/<slug>`. Card style: white surface, 12px radius, border-light, hover lift.
- View toggle (grid/list) remembered in localStorage. "Load more" when more than 12 articles.
- The home page has exactly one `<h1>` (site title).

### ArticlePage (`/blog/:slug`)
Look up metadata from `articles.json` (unknown slug → NotFound). Lazy-load the markdown body from `bodies.ts`.

Page structure (the visual arrangement per blog style is defined in Part 7; the DOM order below is constant):
1. **Breadcrumb** (small 10–12px text, chevron separators, RTL-aware chevrons): خانه › همه مقالات (links home) › Title.
2. **`<h1>` = frontmatter `title`** (always exactly one h1 per page).
3. **Meta row**: label-over-value pairs (small gray label above, normal value below): published date, updated date (if present), reading time; tags go in the footer row below.
4. **Cover media first** (Part 5).
5. **Inline "table of contents" box** (titled «نگاه کلی به مطالب»): built from h2 (and optionally h3) of the body; each item has a small brand-colored pill (10×4px, fully rounded) before the link; hover turns the link brand-colored; smooth scroll. Collapsible on mobile. (Some styles in Part 7 render the TOC as a sticky side TOC instead of the inline box.)
6. **Article body** via MarkdownRenderer wrapped in the layout chosen by `style`.
7. **Related questions** section: all `suggestions` as small chips (SEO).
8. **Footer row**: label «برچسب ها:» + tag chips (surface-alt background, 6px radius, hover = brand background + white text).
9. **Related articles card** (separate card below the article): icon + title «مقالات مرتبط», 2-column grid (1 on mobile) of gray tiles (`line-clamp-2`), items = up to 4 articles sharing the most tags with the current one; fallback to the newest articles.
10. **Prev/Next** article navigation.
- Sticky scroll-spy TOC where the style needs it, and a reading progress bar at the top.

### ArticleSidebar (`src/components/ArticleSidebar.tsx`)
Fixed-width column on lg+ (`w-80` on lg, `w-96` on xl), stacks under the content on mobile. Every block is a separate surface card with 12px radius and 20–28px padding, containing an icon + bold heading, then content:
- «جدیدترین نوشته‌ها» (newest articles): up to 5, as gray tiles (bg surface-alt, hover darker + border-strong, rounded-md).
- «مقالات قبلی / بعدی» relative to the current article in date order, up to 5 each, with small thumbnails (if image cover) + title; the current article is highlighted when shown.
- «اشتراک‌گذاری» share card: square icon buttons (36px, rounded-md, gray → brand/blue on hover): copy link (with toast/“کپی شد” state), Telegram, X, LinkedIn share URLs built from `siteUrl` + path (plain `<a>` links, no third-party scripts), plus `navigator.share` when available.
- Optional extra cards defined in `site.config.ts` → `sidebarCards: [{ icon, title, text, href }]` (e.g. social channel promos): bordered row with a round icon, small gray label above bold title, and an arrow flipped for RTL.

### NotFoundPage, loading, error handling
Per Part 9.

Acceptance criteria: all routes work with direct URL refresh; searching any `suggestions` phrase from the example article navigates to `/blog/married-prophet-with-ayesha`; exactly one h1 per page; announcement bar/header/footer driven only by `site.config.ts`; sidebar, related card, share buttons and TOC pills work in RTL, light and dark.
## PART 7 OF 10: Theme system and 8 blog layout styles

### A. Light / Dark / System theme
- Three modes: `light`, `dark`, `system`. **Default = `system`.** Persist in `localStorage.theme`. Listen to `matchMedia` changes when in system mode and update live.
- Implement `ThemeProvider` + `useTheme()` and a `ThemeToggle` component (a 3-state segmented control or dropdown with sun / moon / monitor icons from lucide-react). It must be consistent with the inline script from Part 1 (no flash of wrong theme).
- Define design tokens as CSS variables in `src/styles/theme.css` (imported by index.css): `--bg`, `--surface`, `--text`, `--muted`, `--border`, `--primary`, `--primary-contrast`, `--accent`, `--code-bg`, etc., with `:root` (light) and `.dark` values. Map them in Tailwind v4 via `@theme inline { --color-bg: var(--bg); ... }` so classes like `bg-bg`, `text-muted` work.
- Set `color-scheme` on `<html>` accordingly.

### B. Eight blog styles (`style: 1..8` in frontmatter; default from `site.config.ts`)
Create `src/layouts/` with `BlogStyle1.tsx … BlogStyle8.tsx` (or one `ArticleLayout.tsx` that switches on a config object) + `src/layouts/index.ts` exporting `getLayout(style)`. Each style must change the typography scale, header presentation, content width, colors/accents, blockquote/code/table/heading styling, spacing, and decorative details — they must look clearly DIFFERENT while sharing the same markdown components. All 8 must work in light & dark. All 8 must be RTL-correct and responsive. Implement the style differences by scoping CSS under a wrapper class (`.blog-style-1` … `.blog-style-8`) using CSS variables + `prose` modifiers, so components stay shared.

Styles (names + intent, modeled after the best modern blog designs worldwide):
1. **Sabzlearn-like (educational tutorial)** — REQUIRED to resemble https://sabzlearn.ir/blog/install-django-without-internet/ : clean white/very light card on a soft gray page background, rounded large content card with subtle shadow, green primary accent (≈ #22c55e/#16a34a), bold Persian headings with a small green vertical bar or underline before h2, a right-side (in RTL) meta/author/date card, a table of contents box with numbered items, tips/notes as colored left-border (logical `border-s-4`) callout boxes, code blocks with dark background and a language tab + copy button, image figures with rounded corners and captions, a "related posts" strip at the bottom. Before building it, open that page's visual patterns from memory as best as you can; do not copy its text or assets, only the visual language.
2. **Medium-like (minimal reader)** — narrow centered column (~680px), large serif-ish body size 20px, generous line-height, understated headings, no sidebar emphasis, bottom reactions row (decorative).
3. **Dev.to / Hashnode-like (developer)** — card based, rounded, subtle border, monospace accents, tag chips, sticky TOC left, dark-friendly.
4. **Stripe-docs-like (documentation)** — three-column feel: nav sidebar, content, "on this page" TOC; neutral palette with indigo accents, tight headings, callouts.
5. **Magazine / editorial (NYT/Guardian-like)** — large display heading, drop-cap on first paragraph (language-aware: disabled for RTL if it looks wrong, document it), pull-quote styled blockquotes, wide hero cover, thin rules between sections.
6. **Notion-like (clean notes)** — soft emoji-friendly look, light gray callouts, subtle hover states, wide readable column, toggles (details) styled like Notion toggles.
7. **Glass / modern gradient (Vercel/Linear-like)** — gradient mesh background, glassmorphism cards (backdrop blur), bold gradient h1, rounded-2xl, subtle glow in dark mode.
8. **Brutalist / high contrast (accessibility-first)** — thick borders, large font sizes, strong color contrast (WCAG AAA), no shadows, visible focus rings, ideal for readability.

Each style must also define how the page `<h1>` (frontmatter title) looks. The h1 element rules never change: exactly one h1 = title.

### C. Style switching for the author
Show a small dev-only floating panel (`import.meta.env.DEV` only) on the article page to preview styles 1–8 live without editing frontmatter (query param `?style=3` also overrides, for quick previews, in all environments).

Acceptance criteria: change `style` in the example article's frontmatter from 1 to 8 and each looks distinct; Style 1 clearly resembles the sabzlearn tutorial look; theme toggle and system mode work; no flash on reload.
```

---

## PART 7 OF 10: Theme system and 8 blog layout styles

### A. Light / Dark / System theme
- Three modes: `light`, `dark`, `system`. **Default = `system`.** Persist in `localStorage.theme`. Listen to `matchMedia` changes in system mode and update live.
- `ThemeProvider` + `useTheme()` and a `ThemeToggle` (3-state segmented control or dropdown with sun / moon / monitor icons from lucide-react). Must be consistent with the inline script from Part 1 (no flash of wrong theme).
- Set `color-scheme` on `<html>` accordingly.

### B. Design tokens (shared contract for ALL styles)
In `src/styles/theme.css` define global tokens on `:root` (light) and `.dark`, then let each blog style override them inside its scope. Map them to Tailwind v4 with `@theme inline { --color-bg: var(--bg); ... }` so classes like `bg-surface`, `text-muted`, `border-border-strong`, `text-brand` work.

Token names (every style MUST define all of them, in light and dark):
`--bg` (page background), `--surface` (cards), `--surface-alt` (nested blocks, tiles), `--surface-strong` (accordion headers, pressed states), `--text`, `--text-secondary`, `--muted`, `--border-light`, `--border-strong`, `--brand`, `--brand-dark`, `--brand-contrast` (text on brand), `--info`, `--warn`, `--danger`, `--code-bg`, `--code-text`, `--radius-card`, `--radius-sm`, `--shadow-card`, `--body-line-height`, `--prose-size`, `--heading-weight`.
Components from Parts 4–6 must use ONLY these tokens (no hardcoded colors), so switching `style` restyles everything.

### C. Typography rule (important)
Never hardcode a font family in any style. Always use `font-family: var(--app-font-family)` supplied by the font system in Part 8 (default: Vazirmatn). Each style creates its identity through sizes, weights, line-height, colors, spacing, radii, borders and decorations only. If the user adds another font later via Part 8, all 8 styles adopt it automatically.

### D. Eight blog styles (`style: 1..8` in frontmatter; default from `site.config.ts`)
Create `src/layouts/` with `ArticleLayout.tsx` (switches on a config object) or `BlogStyle1.tsx … BlogStyle8.tsx`, plus `src/layouts/index.ts` exporting `getLayout(style)`. Implement differences by scoping CSS under `.blog-style-1` … `.blog-style-8` using the tokens above + `prose` modifiers, keeping React components shared. Each style must change typography scale, header/hero presentation, content width, colors/accents, blockquote/code/table/heading styling, spacing, and decorative details, so they look clearly DIFFERENT. All 8 must work in light & dark, be RTL-correct and responsive. The page `<h1>` rule never changes: exactly one h1 = frontmatter title.

**Style 1 — Sabzlearn-like (educational tutorial).** Must closely match this design language (reproduce the visual language only; do not copy any text, logo or assets):

Tokens (light): `--bg:#f7f7f7` (soft gray page), `--surface:#ffffff`, `--surface-alt:#f7f7f7`, `--surface-strong:#f0f0f0`, `--text:#242424`, `--text-secondary:#575757`, `--muted:#a3a3a3`, `--border-light:#f0f0f0`, `--border-strong:#e3e3e3`, `--brand:#1eb35b`, `--brand-dark:#1a9d50`, `--brand-contrast:#ffffff`, `--info:#029af2`, `--warn:#ffbf0a`, `--danger:#dd373d`, `--code-bg:#242424`, `--code-text:#f0f0f0`, `--radius-card:12px`, `--radius-sm:6px`, `--shadow-card:0 1px 2px rgba(0,0,0,.04)`, `--body-line-height:2`.
Tokens (dark): `--bg:#141414`, `--surface:#1c1c1c`, `--surface-alt:#242424`, `--surface-strong:#2e2e2e`, `--text:#f0f0f0`, `--text-secondary:#bdbdbd`, `--muted:#8a8a8a`, `--border-light:#2a2a2a`, `--border-strong:#363636`, brand stays green (`#1eb35b`), `--code-bg:#0f0f0f`.
Sizes: body 14px on mobile / 16px on desktop (scaled by the Part 8 font-size control), caption 12–14px, micro 10px; headings weights 800 (h1) and 700 (h2/h3); paragraphs justified (`text-align: justify`) with line-height 2.

Layout:
- Two columns on lg+: main column (flex-grow) + fixed sidebar (`ArticleSidebar`), gap 20px (28px on xl); sidebar stacks below on mobile. Page background = `--bg`; every content block is a white card (`--surface`), radius 12px, padding 20px mobile / 28px desktop. Main column = stacked cards with 24px gaps.
- **Card A (article)**: h1 (extrabold) → 1px `--border-light` divider → meta row (label-over-value, generous horizontal gaps; on mobile spaced evenly) → cover (16:9, `rounded-xl`, `object-cover`, 32px bottom margin, bottom border divider after the whole intro block) → TOC box (1px `--border-strong`, radius 8px, header strip with `--surface-alt` background + list icon + «نگاه کلی به مطالب», items with a 10×4px brand pill, link hover = brand) → body → FAQ accordion («سوالات متداول», 16px gaps) → footer row (tags).
- Body typography: h2 bold with ~72px `scroll-margin-top`; h3 smaller; links `--info` and underlined; lists with comfortable spacing; `:::suggested` and `:::course` callouts as defined in Part 4; code blocks `dir="ltr"` with dark background, rounded, language label and copy button; inline code with `--surface-strong` background; images centered, rounded, with alt/title as caption; tables bordered with `--surface-alt` header.
- **Card B**: «مقالات مرتبط» (see Part 6).
- Sidebar cards (Part 6) are white, 12px radius, 20/28px padding.
- Header: white, 1px bottom `--border-strong`; Footer: dark rounded block with a decorative brand-colored offset square (Part 6).

**Style 2 — Medium-like (minimal reader):** narrow centered column (~680px), large 20px body size, generous line-height, understated headings, no sidebar emphasis, bottom decorative reactions row.
**Style 3 — Dev.to / Hashnode-like (developer):** card based, rounded, subtle border, monospace accents, tag chips, sticky left (start-side) TOC, dark-friendly.
**Style 4 — Stripe-docs-like (documentation):** three-column feel: nav sidebar, content, "on this page" TOC; neutral palette with indigo accents, tight headings, callouts.
**Style 5 — Magazine / editorial (NYT/Guardian-like):** large display heading, drop-cap on first paragraph (language-aware: auto-disabled when it looks wrong for RTL; document it), pull-quote blockquotes, wide hero cover, thin rules between sections.
**Style 6 — Notion-like (clean notes):** soft emoji-friendly look, light gray callouts, subtle hover states, wide readable column, `<details>` toggles styled like Notion toggles.
**Style 7 — Glass / modern gradient (Vercel/Linear-like):** gradient mesh background, glassmorphism cards (backdrop blur), bold gradient h1, rounded-2xl, subtle glow in dark mode.
**Style 8 — Brutalist / high contrast (accessibility-first):** thick borders, large font sizes, WCAG AAA contrast, no shadows, strong visible focus rings, ideal for readability.

Each of styles 2–8 must also define the full token set from section B (light + dark) at the top of its scope.

### E. Style switching for the author
A small dev-only floating panel (`import.meta.env.DEV` only) on the article page to preview styles 1–8 live without editing frontmatter. Query param `?style=3` also overrides, in all environments.

Acceptance criteria: changing `style` in the example article's frontmatter from 1 to 8 gives eight distinctly different looks; Style 1 clearly matches the described educational card-based green look (cards on gray page, TOC box with green pills, gray related tiles, dark footer); theme toggle and system mode work; no flash on reload; no style hardcodes a font family; no component uses hardcoded colors.

## PART 8 OF 10: Font system (pluggable, Vazirmatn default) + font size control

### Requirements
1. **Default and only built-in font: Vazirmatn.** The user places Vazirmatn files in `public/fonts/` (woff2 preferred; woff/ttf accepted). Do NOT download fonts at build time, no external CDN. Do NOT reference, import or declare any other font (e.g. IRANYekanX) in code, CSS or `fonts.json`.
2. Fonts must be **pluggable without touching React code**. Implement a runtime registry `public/fonts/fonts.json` AND matching `@font-face` rules in `public/fonts/fonts.css` (linked from `index.html`). Initial `fonts.json`:
```json
{
  "default": "vazirmatn",
  "fonts": [
    {
      "id": "vazirmatn",
      "label": "وزیرمتن",
      "family": "Vazirmatn",
      "fallback": "Tahoma, system-ui, sans-serif"
    }
  ]
}
```
`fonts.css` contains `@font-face` blocks with `font-display: swap` for Vazirmatn. Support both setups, documented in comments: (a) a single variable file `Vazirmatn[wght].woff2` with `font-weight: 100 900`, or (b) static files `Vazirmatn-Light.woff2` (300), `-Regular` (400), `-Medium` (500), `-Bold` (700), `-ExtraBold` (800). If a font file is missing, the app must still work with the fallback stack and must not crash. Missing weights fall back gracefully to the nearest available weight. All blog styles rely on weights 300/400/500/700/800.
3. **Adding a new font later = 3 steps**: (a) copy the files into `public/fonts/`, (b) add `@font-face` blocks to `fonts.css`, (c) add one object to `fonts.json`. After that it appears automatically in the font selector. Document this in `public/fonts/README.md` and in the main README. In `public/fonts/README.md` include a worked example titled **"Adding another font later (e.g. IRANYekanX)"** with the example `@font-face` and `fonts.json` snippets written as commented/quoted documentation ONLY (never active code), plus a note that commercial fonts require a valid license.
4. `FontProvider` + `useFont()`: loads `fonts.json` at runtime (`fetch` with `cache: 'no-cache'`, graceful failure → defaults), exposes `fonts`, `current`, `setFont(id)`, `size`, `setSize(n)`, `resetFont()`. Persist in localStorage (`font`, `fontSize`). Apply through CSS variables on `<html>`: `--app-font-family` and `--app-font-scale`, with `html { font-size: calc(16px * var(--app-font-scale, 1)); }` so every rem-based size scales. Use a tiny pre-React inline script (in `index.html`) to apply stored values early (avoids FOUT/jump).
5. **Controls on the Home page (`/`)** (shown near the search box) and also in the header as a compact popover on all pages: `FontControls` component with:
   - font family `<select>` populated from fonts.json (hidden when only one font exists)
   - font size: "A−" and "A+" buttons plus a range slider; range 80%–150% in 5% steps, default 100%, current percentage shown, reset button
   - keyboard accessible, labels in Persian
6. Body text uses `font-family: var(--app-font-family, "Vazirmatn", Tahoma, system-ui, sans-serif)`. Code blocks always keep a monospace stack. Blog styles (Part 7) must never hardcode a font family.
7. Digits: add a note/option in the README about Persian digits (do not auto-convert content).

Acceptance criteria: with no font files present the site still renders using the fallback stack; adding a second entry to fonts.json (with its files and @font-face) makes the selector appear and live-switch the font in the whole app including all 8 blog styles; the size slider scales text everywhere including the article body; settings persist across reloads; no reference to any font other than Vazirmatn exists in active code.

## PART 8 OF 10: Font system (pluggable, Vazirmatn default) + font size control

### Requirements
1. **Default and only built-in font: Vazirmatn.** The user places Vazirmatn files in `public/fonts/` (woff2 preferred; woff/ttf accepted). Do NOT download fonts at build time, no external CDN. Do NOT reference, import or declare any other font (e.g. IRANYekanX) in code, CSS or `fonts.json`.
2. Fonts must be **pluggable without touching React code**. Implement a runtime registry `public/fonts/fonts.json` AND matching `@font-face` rules in `public/fonts/fonts.css` (linked from `index.html`). Initial `fonts.json`:
```json
{
  "default": "vazirmatn",
  "fonts": [
    {
      "id": "vazirmatn",
      "label": "وزیرمتن",
      "family": "Vazirmatn",
      "fallback": "Tahoma, system-ui, sans-serif"
    }
  ]
}
```
`fonts.css` contains `@font-face` blocks with `font-display: swap` for Vazirmatn. Support both setups, documented in comments: (a) a single variable file `Vazirmatn[wght].woff2` with `font-weight: 100 900`, or (b) static files `Vazirmatn-Light.woff2` (300), `-Regular` (400), `-Medium` (500), `-Bold` (700), `-ExtraBold` (800). If a font file is missing, the app must still work with the fallback stack and must not crash. Missing weights fall back gracefully to the nearest available weight. All blog styles rely on weights 300/400/500/700/800.
3. **Adding a new font later = 3 steps**: (a) copy the files into `public/fonts/`, (b) add `@font-face` blocks to `fonts.css`, (c) add one object to `fonts.json`. After that it appears automatically in the font selector. Document this in `public/fonts/README.md` and in the main README. In `public/fonts/README.md` include a worked example titled **"Adding another font later (e.g. IRANYekanX)"** with the example `@font-face` and `fonts.json` snippets written as commented/quoted documentation ONLY (never active code), plus a note that commercial fonts require a valid license.
4. `FontProvider` + `useFont()`: loads `fonts.json` at runtime (`fetch` with `cache: 'no-cache'`, graceful failure → defaults), exposes `fonts`, `current`, `setFont(id)`, `size`, `setSize(n)`, `resetFont()`. Persist in localStorage (`font`, `fontSize`). Apply through CSS variables on `<html>`: `--app-font-family` and `--app-font-scale`, with `html { font-size: calc(16px * var(--app-font-scale, 1)); }` so every rem-based size scales. Use a tiny pre-React inline script (in `index.html`) to apply stored values early (avoids FOUT/jump).
5. **Controls on the Home page (`/`)** (shown near the search box) and also in the header as a compact popover on all pages: `FontControls` component with:
   - font family `<select>` populated from fonts.json (hidden when only one font exists)
   - font size: "A−" and "A+" buttons plus a range slider; range 80%–150% in 5% steps, default 100%, current percentage shown, reset button
   - keyboard accessible, labels in Persian
6. Body text uses `font-family: var(--app-font-family, "Vazirmatn", Tahoma, system-ui, sans-serif)`. Code blocks always keep a monospace stack. Blog styles (Part 7) must never hardcode a font family.
7. Digits: add a note/option in the README about Persian digits (do not auto-convert content).

Acceptance criteria: with no font files present the site still renders using the fallback stack; adding a second entry to fonts.json (with its files and @font-face) makes the selector appear and live-switch the font in the whole app including all 8 blog styles; the size slider scales text everywhere including the article body; settings persist across reloads; no reference to any font other than Vazirmatn exists in active code.

## Part 9 — Loading experience, error handling, SEO, accessibility, performance

```
## PART 9 OF 10: Loading screens, error handling, SEO, accessibility, performance

### Loading
- Create a beautiful, theme-aware **loading screen** (`src/components/LoadingScreen.tsx`) used for route-level Suspense: animated, minimal (e.g. a pulsing logo mark / orbiting dots / gradient ring) using only CSS (Tailwind + a few keyframes in CSS), with distinct, pleasant palettes for light and dark (uses theme tokens). Respect `prefers-reduced-motion` (fallback to a simple fade). Include `role="status"` and visually-hidden text "در حال بارگذاری…".
- Also an **initial HTML loader** inside `index.html` `#root` (pure HTML+CSS, dark/light aware via the pre-React script) so the user sees something before JS loads.
- Skeleton components for article cards on the home page and for the article body while the markdown loads (use the shared `Skeleton` from Part 4).
- Images: blur/skeleton placeholder until loaded (fade-in on `load`).

### Errors
- Global `ErrorBoundary` with a friendly Persian message and a "reload" button. Per-component boundaries for markdown components (Part 4).
- NotFound page styled with the theme.

### SEO
- Per page: `<title>`, meta description, canonical, Open Graph, Twitter card; JSON-LD `Article` (for article pages; includes headline = title, datePublished, dateModified, image) and `WebSite` + `SearchAction` for home. Implement in `usePageMeta` / a small `Seo` component without extra dependencies.
- Extend `scripts/build-content.ts` to also generate `public/sitemap.xml` and `public/robots.txt` (using `siteUrl` from `src/site.config.ts`, with a note in the README to set it) and an `rss.xml` feed. Add `siteUrl`.
- Optional but implement: a `scripts/prerender.ts` that, after `vite build`, generates a static `dist/blog/<slug>/index.html` for each article containing the correct `<title>`, meta tags and the `<h1>` + a `<noscript>` text fallback so crawlers see the title (the SPA still hydrates normally). Hook it into `npm run build`. Keep it simple and robust; if too complex, implement the meta-only version and document the limitation.

### Accessibility
- Skip-to-content link, landmarks (`header`, `nav`, `main`, `aside`, `footer`), visible focus rings in all themes, sufficient contrast in all 8 styles × 2 themes, `lang`/`dir` attributes (allow per-article `lang` and `dir` override in frontmatter: `lang: en`, `dir: ltr`; the article wrapper must apply them and layouts must remain correct).
- All icons-only buttons have `aria-label` in Persian.

### Performance
- Code-split routes, lazy-load markdown bodies, lazy-load heavy components (lightbox, code highlight).
- Add syntax highlighting using `rehype-highlight` or `shiki` (lazy-loaded, themes for light and dark). Choose the lighter option and justify in a code comment.
- `loading="lazy"` for below-the-fold media; `preload="metadata"` for video; no autoplay except in the lightbox.

Acceptance criteria: `npm run build` passes; no layout shift on the cover; Lighthouse (desktop) accessibility ≥ 95, best-practices ≥ 95 on the example article (document how to check, don't fail the build); sitemap/rss are generated.
```

---

## Part 10 — README, docs, polish, and final verification

```
## PART 10 OF 10: Documentation, DX polish, and a final end-to-end verification

### 1. README.md (write in BOTH Persian and English, Persian first, with a language anchor at the top)
Sections:
1. Overview + features list
2. Tech stack
3. Quick start (`npm install`, `npm run dev`, `npm run build`, `npm run preview`)
4. **How to add a new article in 30 seconds** (step-by-step with a folder tree screenshot-style code block):
   - copy `content/blog/_example-article` → rename → edit `index.md` → drop images/videos/audio in the folder → done. No JSON editing, no code changes.
5. Frontmatter reference table (every key, type, default, example).
6. Cover media rules (image/gif/video/audio, `cover.*` auto-detection, "media is always shown first").
7. Search suggestions: how `suggestions` works, with the example `married-prophet-with-ayesha`, and how search normalization works.
8. Markdown cheat sheet + link to `docs/COMPONENTS.md`; how to use raw HTML + Tailwind classes; the safelist note for dynamic classes.
9. Adding images/GIF/videos and the lightbox behavior.
10. **How to add a new component/tag** (summary tutorial): create the React component in `src/components/mdx/`, register it in the component map in `MarkdownRenderer`, register the directive name in `remarkComponents`, document it in `docs/COMPONENTS.md`. Include a complete tiny example (a `:::note` component) from start to finish.
11. The 8 blog styles: table with number, name, best for; how to select (`style:` in frontmatter, `?style=N` preview).
12. Themes (light/dark/system) and design tokens: how to change colors.
13. **Fonts**: how to add Vazirmatn files and how to add more fonts (3 steps), how users change font and font size on the home page.
14. SEO, sitemap, RSS, prerender: what's generated and how to configure `siteUrl`.
15. Deployment (Netlify / Vercel / GitHub Pages / Nginx) with the SPA fallback rules for `/blog/:slug` direct URLs.
16. Troubleshooting (e.g., "my image doesn't show", "my new tag isn't styled", "font not loading", "slug conflict").
17. Project structure map.

### 2. Developer-experience polish
- Add ESLint (flat config) + Prettier config with `prettier-plugin-tailwindcss`; scripts `lint`, `format`, `typecheck`.
- Add `.vscode/settings.json` and `.vscode/extensions.json` recommendations (Tailwind IntelliSense, ESLint, Prettier, Markdown All in One) and a `.vscode/launch.json` for Vite debugging.
- Add a `scripts/new-article.ts` CLI: `npm run new -- my-slug "عنوان مقاله"` that creates `content/blog/my-slug/index.md` from a template (frontmatter + sample sections) so authors do not even need to copy folders. Document it.
- Add Vitest with unit tests for `normalize.ts`, the frontmatter validator, the media path rewriter, and the search "exact suggestion → navigate" logic. Script `npm test`.

### 3. FINAL VERIFICATION CHECKLIST (do each one, fix any failure, and report results at the end)
- [ ] `npm run build` and `npm run lint` and `npm test` all pass with zero errors.
- [ ] `/` shows the search box, controls (font family if >1 fonts, font size), theme toggle, and the article list (cards with cover when present, text-only when not).
- [ ] Typing each `suggestions` phrase of the example article and pressing Enter navigates to `/blog/married-prophet-with-ayesha`.
- [ ] `/blog/married-prophet-with-ayesha` has exactly ONE `<h1>` equal to the frontmatter title; cover media is displayed first; TOC, sidebar (previous/next articles), related-question chips and prev/next work.
- [ ] Image, GIF and video open in the lightbox with keyboard navigation; RTL arrows are correct.
- [ ] All directive components in `docs/COMPONENTS.md` render; raw HTML with Tailwind classes renders styled.
- [ ] Styles 1–8 each render properly in light and dark; Style 1 matches the sabzlearn-like educational look.
- [ ] Theme default is "system" on a fresh browser profile; switching persists; no flash on reload.
- [ ] Missing font files do not break the site; adding a font to fonts.json shows the selector.
- [ ] Direct refresh of `/blog/<slug>` works in `vite preview`.
- [ ] No console errors or warnings in dev or preview.
End by printing a concise report: what was built, anything that deviated from this spec and why, and the exact commands the user should run next.

- In README section "Fonts": state that the default font is Vazirmatn only and link to `public/fonts/README.md` for the "Adding another font later (e.g. IRANYekanX)" guide.
- In README section "The 8 blog styles": document the shared token contract (Part 7, section B), explain that Style 1 mimics a card-based green educational blog, and explain how to create a ninth style by copying a `.blog-style-N` scope and overriding tokens only.
```

---

## نکات استفاده

1. **ترتیب مهم است.** بخش ۲ و ۳ و ۴ به هم وابسته‌اند؛ اگر Copilot چیزی را جا انداخت، بنویس: *"Re-read Part N requirements and fix whatever is missing, then re-run build."*
2. **مدل قوی‌تر انتخاب کن** (Claude Sonnet/Opus یا GPT-5 در حالت Agent) تا بخش‌های بزرگ‌تر (۴، ۶، ۷) کامل پیاده شوند.
3. فونت وزیرمتن را (`Vazirmatn-Regular.woff2`, `Vazirmatn-Bold.woff2`, ...) در `public/fonts/` بگذار.
4. برای هر مقاله جدید فقط یک پوشه در `content/blog/` بساز یا `npm run new -- slug "عنوان"` بزن.
5. **توجه:** بخش ۷ برای استایل شماره ۱ ظاهر سبزلرن را از «الگوی بصری» بازسازی می‌کند (نه کپی متن یا فایل)، چون Copilot به صفحه دسترسی مستقیم ندارد. اگر خواستی دقیق‌تر شود، اسکرین‌شات صفحه را در چت Copilot ضمیمه کن و بگو "match this look in BlogStyle1".

اگر خواستی، می‌توانم هر بخش را بعد از اجرا بازبینی کنم یا نمونه کامل فایل `index.md` را هم بنویسم.
)

ME : (یک تگی بود توی html فکنم بود iframe که توی پروژه ما بشدت مهمه کاربردش اینجوریه که 
مثلا از سایت احادیث یک تیکه رو میخام نشون بدیم برای صحت و ضعف یک حدیث از توی اینستگرام یا یوتوب یک ویدیو نشون بدیم جواب بدیم باید اینم باشه در نظرش بگیریم)
claude AI : (# راه‌حل: پرامپت‌های «وصله» (Patch) برای بخش‌هایی که قبلاً اجرا شده

چون Part 1 تا 4 را قبلاً به Copilot داده‌ای، بازنویسی آن‌ها فایده ندارد. به‌جایش **یک پرامپت وصله** می‌دهیم که روی کد موجود اعمال شود و فقط تغییرات را انجام دهد. این پرامپت اول را **قبل از Part 5** بفرست. بخش‌های ۵ تا ۱۰ هنوز نرفته‌اند، پس نسخه‌های اصلاح‌شان را همان‌طور که قبلاً دادم استفاده کن.

## ترتیب پیشنهادی

| مرحله | چه بفرستی |
|---|---|
| ۱ | **پرامپت وصله A** (پایین): iframe/embed + کامپوننت‌های suggested و course و ظاهر آکاردئون روی Part 3 و 4 |
| ۲ | **پرامپت وصله B** (پایین): تغییر در اسکریپت content از Part 2 (کلید `coverEmbed`) |
| ۳ | Part 5 با بند «Embeds as cover media» |
| ۴ | Part 6 جدید (که قبلاً دادم) |
| ۵ | Part 7 جدید (که قبلاً دادم) |
| ۶ | Part 8 جدید (که قبلاً دادم) |
| ۷ | Part 9 با موارد امنیتی embed |
| ۸ | Part 10 با تغییرات README |

> نکته: اگر Part 4 را فقط با **توکن‌های رنگی** ساخته باشد (چون Part 7 هنوز نیامده)، در وصله A از Copilot می‌خواهیم رنگ‌های hardcode را موقتاً با CSS variable (و مقدار پیش‌فرض) عوض کند تا بعد از Part 7 بدون دردسر وصل شود.

---

## پرامپت وصله A: iframe امن، source، suggested، course

````
## PATCH A: Safe embeds (iframe), source quotes, and two extra components

IMPORTANT: Parts 1–4 are ALREADY implemented in this workspace. Do NOT recreate or overwrite them. First, read the existing code (`src/lib/markdown.ts`, `src/components/MarkdownRenderer.tsx`, `src/components/mdx/*`, the remark plugin `remarkComponents`, `content/blog/_example-article/index.md`, `docs/COMPONENTS.md`, `src/site.config.ts` if it exists) and extend it in place, following the existing conventions (naming, folder layout, how directives are registered, how error boundaries wrap components). If something referenced here does not exist yet, create it minimally.

### 1. Sanitization change (Part 3 rule)
Currently raw `<iframe>` is rendered as a plain responsive wrapper. Change this: content is authored by the site owner, so trust it, BUT strip `<script>` tags, `on*` event attributes and `javascript:` URLs (keep/adjust the existing rehype plugin). `<iframe>` is ALLOWED but every raw `<iframe>` found in markdown/HTML must be rewritten (rehype step) to the new `SafeEmbed` component so it always gets the safe defaults. Only `https:` sources (plus relative paths) are allowed; other schemes render a dev-only warning box and nothing in production. In the component map, `iframe` now maps to `SafeEmbed`.

### 2. New component `SafeEmbed` (`src/components/mdx/SafeEmbed.tsx`)
Used by `::embed`, `::youtube`, `::instagram`, `::aparat` and by raw `<iframe>`.
- Wrapper: `<figure>` with optional `<figcaption>` (from `caption`), radius 12px, 1px border, nested-surface background, `not-prose`, overflow hidden. Responsive: aspect-ratio from `ratio` (default 16/9) OR a fixed `height` (px or vh) for text pages (iframe scrolls inside the box).
- Safe defaults on every iframe: `loading="lazy"`, `referrerpolicy="strict-origin-when-cross-origin"`, `sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"` (add `allow-forms` only if attribute `allow-forms` is set), a meaningful `title` (required; fall back to the hostname), and `allow="fullscreen; picture-in-picture; encrypted-media"` only for video providers.
- Allowlist: add `embedAllowlist: string[]` to `src/site.config.ts` (create the file if missing) defaulting to `["youtube.com","www.youtube-nocookie.com","instagram.com","www.instagram.com","aparat.com","www.aparat.com"]` plus a commented placeholder for the user's hadith website(s). Hosts not in the list still render but show a small "external content" notice bar (hostname + «محتوای خارجی») above the frame; in `import.meta.env.DEV` also log a console hint to add the host.
- Click-to-load facade: for YouTube, Aparat and Instagram show a lightweight facade first (poster or gradient, provider icon, title, large play/«نمایش» button) and mount the real iframe only after click or Enter. YouTube poster = `https://i.ytimg.com/vi/ID/hqdefault.jpg` loaded lazily (if it fails, gradient); add `embedPoster: boolean` (default true) in `site.config.ts` to disable that third-party image. Generic `::embed` loads when scrolled into view (IntersectionObserver) unless attribute `facade` is set. Never autoplay before a user click.
- URL builders: YouTube → `https://www.youtube-nocookie.com/embed/ID?rel=0&modestbranding=1&start=SECONDS` (parse id from watch/shorts/youtu.be URLs when `url=` is given; `start` accepts seconds or `1m30s`). Instagram → `https://www.instagram.com/p/CODE/embed` (support /p/, /reel/, /tv/; ratio ~4/5, min-height 480px, scroll allowed). Aparat → `https://www.aparat.com/video/video/embed/videohash/ID/vt/frame`. Put these in `src/lib/embed.ts` as pure, unit-testable functions.
- Fallback for sites that block embedding: below the frame always render a slim bar with host name, an «مشاهده در منبع» link (`target="_blank" rel="noopener noreferrer"`, arrow icon flipped for RTL) and a «نمایش نشد؟» hint. Browsers do not report X-Frame-Options errors, so implement a best-effort timeout: if the iframe `load` event does not fire within 8 seconds, replace the empty frame with a fallback card (title, host, big «مشاهده در منبع» button). Attribute `fallback-only` renders only the link card.
- Expand button on each embed opens it in the existing lightbox shell/modal if one exists (otherwise a simple accessible modal: Esc closes, focus trap, focus restore). Part 5 will later integrate it with the full Lightbox; keep a clean extension point (`useLightbox` stub if present).
- Accessibility/motion: unique `title`, Persian `aria-label` on the facade button (e.g. «پخش ویدیو: …»), keyboard reachable, `prefers-reduced-motion` disables hover animations. Wrap in the existing per-component error boundary.

### 3. New directives (register in `remarkComponents` + component map)
- `::embed{src="https://..." title="" ratio="16/9" height="" caption="" source="" allow-scroll allow-forms facade fallback-only}`
- `::youtube{id="" url="" start="" title="" caption=""}`
- `::instagram{url="" caption=""}`
- `::aparat{id="" title="" caption=""}`
- `:::source{title="" url="" site="" ref="" grade="" lang="" dir=""}` quoted markdown `:::`

### 4. New component `Source` (`src/components/mdx/Source.tsx`)
Quote card for citing a text from another site (e.g. a hadith and its authenticity ruling) in an accessible, indexable and printable way (unlike an iframe). Render as `<figure>`: start-side accent border (`border-s-4`, color by `grade`), header with `site` name and `title`, quoted body (blockquote typography; supports Arabic with `lang="ar" dir="rtl"` via attributes), footer with `ref` (e.g. book / hadith number), optional grade badge (`sahih`, `hasan`, `daif`, `mawdu`, `unknown` → green / blue / amber / red / gray, Persian labels: صحیح، حسن، ضعیف، موضوع، نامشخص) and a link «مشاهده در منبع» to `url`. `not-prose`, `<cite>` for the reference.

### 5. Two more components (from a reference blog design)
- `:::suggested{href="" label="مقاله پیشنهادی:"}` link text `:::` → flex row (wraps on mobile), gap 12px, padding 12px (16px on sm+), 1px light border, radius 8px, very light tinted background (`color-mix(in srgb, currentColor 2%, transparent)`, 4% on hover), label in info-blue demibold + link (medium weight, no underline). Internal links (starting with `/`) use react-router `Link`; external links open in a new tab with `rel="noopener noreferrer"`. `not-prose`.
- `:::course{title="" href="" image="" label="دوره پیشنهادی" cta="مشاهده دوره"}` → horizontal promo card (column + centered on mobile): 16:9 thumbnail 160px wide (radius 6px, lazy; hidden if `image` missing), small pill label (brand text on 10% brand background, radius 6px), title link, small «view» button (info-blue text on 10% info background, radius 6px, arrow flipped in RTL). Same border/radius/tint as `suggested`, `not-prose`.

### 5b. Accordion restyle (FAQ look)
Restyle the existing `accordion` so each item is: rounded-md (6px) container with a nested-surface background; header = slightly darker gray background, bold small text, chevron on the end side rotating when open; padded content with 12–14px text; 16px gap between items; height animation via the CSS grid-rows trick; `prefers-reduced-motion` respected; keep `aria-expanded`/`aria-controls`. Add attribute `faq` (`:::accordion{faq}`): when present (or when the accordion's title is «سوالات متداول»), collect its items from the markdown AST and expose them for `FAQPage` JSON-LD (store in the generated article metadata or pass via a context, whichever fits the existing architecture; Part 9 will consume it).

### 6. Theming safety
Because the theme token system (Part 7) is not built yet, every NEW or restyled component must take colors/radii from CSS variables with fallbacks, e.g. `var(--surface-alt, #f7f7f7)`, `var(--border-light, #f0f0f0)`, `var(--border-strong, #e3e3e3)`, `var(--text, #242424)`, `var(--brand, #1eb35b)`, `var(--info, #029af2)`, `var(--radius-card, 12px)`, `var(--radius-sm, 6px)`, and must have `dark:` fallbacks. Never hardcode colors without a variable. Part 7 will define these variables later.

### 7. Example article and docs
- Extend `content/blog/_example-article/index.md` so it demonstrates, exactly once each: `::youtube` (a generic public video id), `::embed` with `example.com` (to show the fallback card), `::instagram` (placeholder URL), `::aparat` (placeholder id), a raw `<iframe src="https://example.com">` (to prove the rewrite to SafeEmbed), `:::source` (neutral placeholder text with a `grade`), `:::suggested`, `:::course`, and an accordion with `faq`. Use neutral Persian placeholder text, no real religious claims.
- Update `docs/COMPONENTS.md` with all new directives, a decision table (when to use `::youtube` / `::instagram` / `::aparat` / `::embed` / raw `<iframe>` / `:::source`), the allowlist setup, the fixed-`height` scrolling trick for text pages, and the limitation "many sites block iframes (X-Frame-Options / frame-ancestors); the fallback card appears and `:::source` is the recommended alternative".
- Add unit tests (Vitest; install and configure it if it does not exist yet, add `"test": "vitest run"`) for `src/lib/embed.ts` (URL parsing for watch / youtu.be / shorts / start time formats, Instagram /p/ /reel/ /tv/, invalid schemes rejected).

### Acceptance criteria
`npm run build` and `npm run test` pass; every new directive and a raw `<iframe>` render in the example article; YouTube loads the real player only after clicking its facade; a blocked or failing embed shows the fallback card after the timeout; no iframe lacks `title`, `sandbox` or `referrerpolicy`; no new component hardcodes colors without a CSS variable fallback; existing directives and pages from Parts 1–4 still work unchanged.
````

---

## پرامپت وصله B: `coverEmbed` در اسکریپت content (Part 2)

````
## PATCH B: coverEmbed support in the content build script

Parts 1–4 already exist. Do not rewrite them. Modify `scripts/build-content.ts`, `src/lib/types.ts` and any validator you already wrote:

1. Frontmatter: add optional key `coverEmbed` (string). Validation: must start with `https://`, otherwise FAIL the build (exit 1) with a message including the file path.
2. Cover resolution order: (a) `cover:` key or auto-detected `cover.*` file; (b) else `coverEmbed`; (c) else null. A local cover file always wins over `coverEmbed`.
3. `CoverType` becomes `'image' | 'video' | 'audio' | 'embed'`. For `embed`, `cover` in `articles.json` is `{ url: <the embed URL>, type: 'embed' }`; also include `embedProvider: 'youtube' | 'instagram' | 'aparat' | 'other'` and, for YouTube, `poster: https://i.ytimg.com/vi/ID/hqdefault.jpg` (derive the id using the pure functions from `src/lib/embed.ts` if it exists; if not yet, implement a minimal local parser and leave a TODO to reuse it).
4. In the printed summary table, show `embed` as the cover type.
5. Do NOT change how markdown bodies or media are copied. Keep the existing output files and shapes backward compatible (only add fields).
6. Add a unit test (Vitest) for the validator: valid https URL passes, `http://` and empty string fail.

Acceptance criteria: `npm run content` runs; an article with only `coverEmbed` gets `coverType: embed` in `articles.json`; an article with both `cover.jpg` and `coverEmbed` uses the image; invalid `coverEmbed` fails with a readable error.
````

---

## بخش‌هایی که اصلاً نیاز به وصله ندارند

- **Part 5، 6، 7، 8، 9، 10:** هنوز نفرستاده‌ای، پس **نسخه‌های جدید** را که در پیام‌های قبلی دادم مستقیم بفرست. Part 5 همراه بند «Embeds as cover media»، Part 9 همراه موارد CSP و امنیت embed، و Part 10 همراه بخش ۱۸ README و چک‌لیست.
- از نظر ترتیب، **Part 7 (توکن‌ها)** که بیاید، متغیرهایی مثل `--surface-alt` و `--brand` که در وصله A با fallback نوشته شدند، به‌طور خودکار مقدار واقعی می‌گیرند.

اگر خواستی، می‌توانم **Part 5 تا 10 نهایی** را هم یک‌جا و تمیز (با همه اصلاحات) در یک پاسخ جمع کنم تا فقط کپی و ارسال کنی.)