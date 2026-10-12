# وبلاگ استاتیک فارسی · Static Persian blog engine

[فارسی](#فارسی) · [English](#english)

---

# فارسی

## ۱. معرفی

موتور وبلاگ استاتیک (RTL، فارسی‌محور). برای افزودن مقاله فقط یک پوشه می‌سازید؛ لیست مقاله‌ها، جست‌وجو، سایدبار، سئو، sitemap و RSS خودکار ساخته می‌شوند.

ویژگی‌ها: ۸ استایل مقاله، حالت روشن/تیره/سیستم، فونت قابل‌تعویض و تنظیم اندازهٔ متن، جست‌وجوی هوشمند با `suggestions`، بزرگ‌نمایی عکس/گیف/ویدیو، کامپوننت‌های آماده در مارک‌داون، iframe امن (یوتیوب، اینستاگرام، آپارات، صفحهٔ دلخواه)، کارت نقل‌قول منبع (`:::source`)، HTML خام با Tailwind.

## ۲. فناوری‌ها

Vite · React 18 · TypeScript (strict) · Tailwind CSS v4 · react-router-dom v6 · unified/remark/rehype · Fuse.js · highlight.js · Vitest.

## ۳. شروع سریع

```bash
npm install
npm run dev        # توسعه (با بازسازی خودکار محتوا)
npm run build      # ساخت نهایی + prerender
npm run preview    # پیش‌نمایش خروجی
npm test           # تست‌های واحد
npm run lint
```

## ۴. افزودن مقالهٔ جدید در ۳۰ ثانیه

```bash
npm run new -- my-slug "عنوان مقاله"
```

یا دستی:

```
content/blog/my-slug/
├── index.md        ← متن و frontmatter
├── cover.jpg       ← (اختیاری) کاور؛ عکس/گیف/ویدیو/صدا
└── diagram.png     ← هر فایل دیگر
```

کپی‌کردن `content/blog/_example-article` و تغییر نام آن هم کافی است.

### تبدیل یک پوشهٔ آمادهٔ md به وبلاگ

اگر پوشه‌ای دارید که یک فایل `.md` (با frontmatter) و عکس/ویدیوهایش داخل آن است:

```bash
npm run mdtonewblog -- مسیر/پوشه
npm run mdtonewblog -- مسیر/پوشه --move    # بعد از کپی، پوشهٔ مبدأ پاک شود
npm run mdtonewblog -- مسیر/پوشه --force   # اگر مقاله از قبل هست، جایگزین شود
npm run mdtonewblog -- مسیر/پوشه --no-build # بدون اجرای مرحلهٔ content
```

اطلاعات صفحه از frontmatter خوانده می‌شود (`name` آدرس مقاله است، `title` الزامی است)؛ پوشه در `content/blog/<name>/` ساخته و فایل md به `index.md` تغییر نام می‌دهد. فرمت‌های اشتباه (مثلاً `style: 12`) با پیام خوانا رد می‌شوند.

ثبت مقاله خودکار است: `content/blog` تنها منبع واقعی است و همهٔ خروجی‌ها (فهرست مقاله‌ها، جست‌وجو، کپی رسانه‌ها، sitemap، RSS، `_headers`) از آن ساخته می‌شوند. دستور بلافاصله `npm run content` را اجرا می‌کند (slug تکراری و بقیهٔ خطاها همان‌جا معلوم می‌شود و در صورت خطا تغییر برگردانده می‌شود). بعد از آن فقط `npm run build` می‌ماند. هیچ JSON یا کدی را ویرایش نمی‌کنید. پوشه‌هایی که با `_` شروع می‌شوند فقط در حالت توسعه نمایش داده می‌شوند.

## ۵. مرجع frontmatter

| کلید | نوع | پیش‌فرض | توضیح |
|---|---|---|---|
| `title` | string | **الزامی** | همان `<h1>` صفحه |
| `name` | string | نام پوشه | آدرس مقاله (`a-z 0-9 - _`) |
| `description` | string | ۱۶۰ نویسهٔ اول متن | توضیح سئو و کارت‌ها |
| `date` | تاریخ | زمان تغییر فایل | `2025-01-31` |
| `updated` | تاریخ | — | تاریخ به‌روزرسانی |
| `tags` | string[] | `[]` | برچسب‌ها |
| `suggestions` | string[] | `[]` | عبارت‌هایی که جست‌وجوی دقیقشان به این مقاله می‌رسد |
| `cover` | مسیر | `cover.*` خودکار | کاور محلی |
| `coverEmbed` | URL https | — | کاور از یوتیوب/اینستاگرام/آپارات؛ اگر فایل کاور هست، فایل برنده است |
| `style` | 1..8 | `defaultStyle` | استایل مقاله |
| `lang`, `dir` | string | — | زبان/جهت این مقاله (مثلاً `en` / `ltr`) |
| `draft` | boolean | `false` | پیش‌نویس در build نهایی نمی‌آید |

## ۶. کاور (رسانهٔ اول)

اول از همه همیشه کاور نشان داده می‌شود: عکس/گیف، ویدیو (با پوستر هم‌نام)، صدا (پخش‌کنندهٔ سفارشی) یا embed (با دکمهٔ پخش). فایلی به نام `cover.*` خودکار شناخته می‌شود.

## ۷. پیشنهادهای جست‌وجو (suggestions)

```yaml
title: ازدواج پیامبر ص با مادر عایشه رض
suggestions:
  - آیا پیامبر ص با دختر 6 ساله ازدواج کرد
  - دلیل ازدواج پیامبر ص با مادر عایشه رض
```

اگر کاربر دقیقاً یکی از این عبارت‌ها (یا عنوان) را جست‌وجو و Enter بزند، مستقیم به مقاله می‌رود. مقایسه پس از نرمال‌سازی است: یکسان‌سازی «ي/ی» و «ك/ک»، حذف اعراب و نیم‌فاصله، تبدیل ارقام فارسی/عربی به لاتین، حروف کوچک و فاصله‌های اضافه. تطبیق تقریبی فقط لیست نتایج را نشان می‌دهد.

## ۸. مارک‌داون، HTML و Tailwind

مارک‌داون معمولی (`## h2`، جدول، لیست، کد) + کامپوننت‌ها با سینتکس directive. راهنمای کامل: [docs/COMPONENTS.md](docs/COMPONENTS.md). HTML خام و کلاس‌های Tailwind داخل `.md` هم کار می‌کند؛ `<script>` و `on*` و `javascript:` حذف می‌شوند.

اگر کلاس Tailwind را به‌صورت پویا می‌سازید، آن را در `src/index.css` با `@source inline("...")` اضافه کنید.

نکته: `# عنوان` (h1) داخل متن، یک سطح پایین‌تر رندر می‌شود چون h1 صفحه فقط عنوان مقاله است؛ در این حالت سایر سرتیتر‌ها هم یک سطح پایین می‌روند.

## ۹. عکس، گیف و ویدیو

فایل را کنار `index.md` بگذارید و با مسیر نسبی بنویسید: `![توضیح](./photo.jpg)`. کلیک روی عکس/گیف/ویدیو پنجرهٔ بزرگ‌نمایی باز می‌کند (Esc، کلیدهای جهت‌دار، زوم). مسیرها در build خودکار به `/content/<slug>/…` تبدیل می‌شوند.

## ۱۰. افزودن کامپوننت/تگ جدید

مثال کامل `:::note`:

1. `src/components/mdx/Note.tsx`:
   ```tsx
   import type { ReactNode } from 'react'
   export function Note({ children }: { children?: ReactNode }) {
     return <aside className="not-prose my-4 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-alt)] p-4">{children}</aside>
   }
   ```
2. نام را در `directiveNames` در `src/lib/markdown.ts` اضافه کنید: `'note'`.
3. در `src/components/MarkdownRenderer.tsx` نقشهٔ کامپوننت‌ها: `'mdx-note': withMdxErrorBoundary('note', Note),` و در صورت نیاز نام را به مجموعهٔ unwrap اضافه کنید.
4. در `docs/COMPONENTS.md` مستند کنید و استفاده: `:::note` … `:::`.

فقط از توکن‌های رنگی (`var(--surface-alt)` و …) استفاده کنید تا با هر ۸ استایل هماهنگ شود.

## ۱۱. هشت استایل مقاله

| # | نام | مناسب برای |
|---|---|---|
| 1 | آموزشی (الهام از سبزلرن): کارت‌ها روی زمینهٔ خاکستری، سبز | آموزش و راهنما |
| 2 | مینیمال (Medium): ستون باریک، متن درشت | مقالهٔ بلند |
| 3 | توسعه‌دهنده (Dev.to): TOC چسبان، برچسب‌های تک‌فاصله | مطالب فنی |
| 4 | مستندات (Stripe): سه ستون | مرجع و مستند |
| 5 | مجله (Editorial): تیتر درشت، نقل‌قول بزرگ | گزارش و تحلیل |
| 6 | یادداشت (Notion): ساده و روشن | یادداشت |
| 7 | شیشه‌ای (Glass): گرادیان و blur | صفحهٔ ویژه |
| 8 | کنتراست بالا (WCAG AAA) | دسترس‌پذیری |

انتخاب: `style: 3` در frontmatter، یا برای پیش‌نمایش `?style=3` به آدرس اضافه کنید ؛ در صفحهٔ هر مقاله دکمهٔ «استایل» در هدر هم هست که همین کار را با لیست نام استایل‌ها می‌کند.

همهٔ استایل‌ها یک قرارداد توکن مشترک دارند (`--bg --surface --surface-alt --surface-strong --text --text-secondary --muted --border-light --border-strong --brand --brand-dark --brand-contrast --info --warn --danger --code-bg --code-text --radius-card --radius-sm --shadow-card --body-line-height --prose-size --heading-weight`). استایل ۱ شبیه بلاگ آموزشی کارت‌محور با تأکید سبز است. **ساخت استایل نهم:** یک بلاک `.blog-style-N` را در `src/styles/blog-styles.css` کپی کنید، فقط توکن‌ها (روشن و تیره) را عوض کنید، آن را در `src/layouts/config.ts` ثبت کنید و در `validateStyle` (`scripts/lib/validators.ts`) سقف ۸ را بالا ببرید.

## ۱۲. تم روشن/تیره/سیستم و رنگ‌ها

پیش‌فرض «سیستم» است و با `localStorage.theme` ذخیره می‌شود (بدون پرش هنگام بارگذاری). رنگ‌های سراسری در `src/styles/theme.css` و رنگ هر استایل در `src/styles/blog-styles.css` هستند.

## ۱۳. فونت

فونت پیش‌فرض **وزیر** است (فایل‌ها در `public/fonts/vazir/`). اگر فایلی نباشد سایت با فونت جایگزین کار می‌کند. افزودن فونت جدید سه گام دارد: (۱) فایل‌ها را در `public/fonts/` بگذارید، (۲) `@font-face` را در `fonts.css` اضافه کنید، (۳) یک شیء به `fonts.json` اضافه کنید؛ بعد از آن در انتخابگر فونت صفحهٔ اصلی ظاهر می‌شود. راهنمای کامل (مثال IRANYekanX): [public/fonts/README.md](public/fonts/README.md). اندازهٔ متن (۸۰٪ تا ۱۵۰٪) در صفحهٔ اصلی و هدر قابل تنظیم است.

ارقام: محتوا هرگز خودکار تبدیل نمی‌شود؛ فایل‌های `-FD` ارقام لاتین را فارسی نشان می‌دهند.

## ۱۴. سئو، sitemap، RSS، prerender

در `npm run content` ساخته می‌شود: `public/sitemap.xml`، `robots.txt`، `rss.xml`. **حتماً `siteUrl` را در `src/site.config.ts` تنظیم کنید.** صفحات مقاله JSON-LD (`Article`, `BreadcrumbList`, و `FAQPage` برای آکاردئون `faq`)، canonical، Open Graph و Twitter دارند. بعد از `vite build` اسکریپت `scripts/prerender.ts` برای هر مقاله `dist/blog/<slug>/index.html` با title، meta و `<h1>` می‌سازد (متن کامل prerender نمی‌شود).

## ۱۵. استقرار

خروجی `dist/` استاتیک است. باید آدرس‌هایی مثل `/blog/<slug>` با refresh کار کنند:

- **Netlify / Cloudflare Pages:** `public/_redirects` (موجود است) و `public/_headers` (خودکار).
- **Vercel:** `vercel.json` با `{"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}`.
- **GitHub Pages:** فایل `404.html` را کپی `index.html` کنید.
- **Nginx:** `location / { try_files $uri $uri/ /index.html; }`

## ۱۶. عیب‌یابی

- **عکس نمایش داده نمی‌شود:** فایل باید کنار `index.md` باشد و مسیر نسبی (`./a.png`) داشته باشد.
- **تگ جدیدم استایل ندارد:** نام آن در `directiveNames` و نقشهٔ کامپوننت‌ها ثبت شده؟ (بخش ۱۰)
- **فونت بارگذاری نمی‌شود:** نام فایل‌ها در `fonts.css` را بررسی کنید.
- **تعارض slug:** دو مقاله همنام هستند؛ `name` را در یکی تغییر دهید.
- **iframe خالی است:** سایت مبدأ قاب را مسدود کرده؛ از `:::source` یا `fallback-only` استفاده کنید.

## ۱۷. ساختار پروژه

[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) و [CONTENT_PIPELINE.md](CONTENT_PIPELINE.md).

## ۱۸. جاسازی محتوای خارجی (iframe)

| می‌خواهم… | از این استفاده کنید |
|---|---|
| ویدیوی یوتیوب (حتی از ثانیهٔ مشخص) | `::youtube{url="…" start="1m30s"}` |
| پست/ریل اینستاگرام | `::instagram{url="…"}` |
| ویدیوی آپارات | `::aparat{id="…"}` |
| صفحهٔ دیگری (مثلاً سایت احادیث) به‌عنوان مدرک | `::embed{src="https://…" height="500"}` |
| نقل متن حدیث و حکم آن، قابل جست‌وجو و چاپ | `:::source{site="…" grade="daif" url="…"}` |
| کد iframe آماده | همان `<iframe>` (خودکار امن می‌شود) |

- **allowlist:** میزبان سایت احادیث خود را به `embedAllowlist` در `src/site.config.ts` اضافه کنید. میزبان‌های خارج از لیست هم نمایش داده می‌شوند ولی با برچسب «محتوای خارجی».
- **صفحهٔ متنی:** `height="500"` بدهید تا داخل کادر اسکرول شود. iframe نمی‌تواند فقط «بخشی» از صفحه را نشان دهد.
- **محدودیت:** بسیاری از سایت‌ها iframe را مسدود می‌کنند. پس از ۸ ثانیه کارت جایگزین با دکمهٔ «مشاهده در منبع» نمایش داده می‌شود.
- **امنیت:** `sandbox`، `referrerpolicy`، بارگذاری تنبل، بدون پخش خودکار، فقط https. در `public/_headers` (خودکار) CSP `frame-src` فقط برای میزبان‌های allowlist ساخته می‌شود.
- **سئو:** محتوای iframe ایندکس نمی‌شود؛ وزن سئو با متن مقاله و `:::source` است.

---

# English

## Overview

A static, RTL-first Persian blog engine. Adding an article = adding one folder. The article list, search, sidebar, SEO files, sitemap and RSS are generated automatically.

**Stack:** Vite · React 18 · TypeScript (strict) · Tailwind CSS v4 · react-router-dom v6 · unified/remark/rehype · Fuse.js · highlight.js · Vitest.

## Quick start

```bash
npm install
npm run dev
npm run build      # content → tsc → vite build → prerender
npm run preview
npm test
```

## Add an article

```bash
npm run new -- my-slug "Article title"
```

Have a folder with a ready markdown file (+ media)? `npm run mdtonewblog -- path/to/folder [--move] [--force]` validates its frontmatter and creates `content/blog/<name>/index.md` (+ media) from it.

Or copy `content/blog/_example-article`, rename it, edit `index.md`, drop media files into the folder. No JSON or code to edit. A file called `cover.*` becomes the cover (shown first).

## Frontmatter

`title` (required, becomes the page `<h1>`), `name`, `description`, `date`, `updated`, `tags`, `suggestions`, `cover`, `coverEmbed` (https URL; a local cover file wins), `style` (1–8), `lang`, `dir`, `draft`. See the Persian table above for details.

## Search suggestions

If a visitor submits a phrase that exactly equals (after normalization) a `suggestions` entry or a title, they are taken straight to that article. Fuzzy matches only show the result list.

## Markdown & components

Standard markdown + directives (accordion, alert, card, gallery, modal, tooltip, `suggested`, `course`, …) — see [docs/COMPONENTS.md](docs/COMPONENTS.md). Raw HTML with Tailwind classes works (scripts / `on*` / `javascript:` are stripped). For dynamically built class names add `@source inline("…")` in `src/index.css`.

## Embeds (iframes)

`::youtube`, `::instagram`, `::aparat`, `::embed`, raw `<iframe>` and the `:::source` quote card. All frames use `SafeEmbed`: sandbox, referrer policy, lazy loading, click-to-load for video providers, an allowlist notice, an 8-second failure timeout with a link-card fallback, and an expand-to-modal button. Add your hadith site's hostname to `embedAllowlist` in `src/site.config.ts`. `public/_headers` is generated with a matching CSP `frame-src`.

## Styles, themes, fonts

Eight styles (`.blog-style-1 … 8`) share one token contract; themes are light / dark / system (default system); the default font is Vazir and more fonts can be added in 3 steps (`public/fonts/README.md`). Users can change font and size from the home page.

## SEO & deployment

Set `siteUrl` in `src/site.config.ts`. Generated: `sitemap.xml`, `robots.txt`, `rss.xml`, `_headers`; JSON-LD, canonical, Open Graph, Twitter tags; meta prerender per article. Deploy `dist/` with an SPA fallback (`_redirects` is included; see the Persian section for Vercel / GitHub Pages / Nginx).

## Troubleshooting

Image missing → keep it beside `index.md` and use `./file`. New tag unstyled → register it in `directiveNames` and the component map. Empty iframe → the source blocks framing, use `:::source`. Slug conflict → set `name:` on one article.
