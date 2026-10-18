# وبلاگ استاتیک فارسی · Static Persian blog engine

[فارسی](#فارسی) · [English](#english)

---

# فارسی

## ۱. معرفی

موتور وبلاگ استاتیک (RTL، فارسی‌محور). برای افزودن مقاله فقط یک پوشه می‌سازید؛ لیست مقاله‌ها، جست‌وجو، سایدبار، سئو، sitemap و RSS خودکار ساخته می‌شوند.

ویژگی‌ها: ۸ استایل مقاله (انتخاب با خواننده)، حالت روشن/تیره/سیستم، فونت قابل‌تعویض و تنظیم اندازهٔ متن، جست‌وجوی هوشمند با `suggestions`، بزرگ‌نمایی عکس/گیف/ویدیو، کامپوننت‌های آماده در مارک‌داون، iframe امن (یوتیوب، اینستاگرام، آپارات، صفحهٔ دلخواه)، کارت نقل‌قول منبع (`:::source`)، HTML خام با Tailwind.

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

## ۴. افزودن، ویرایش و حذف وبلاگ (آموزش کامل)

هر وبلاگ یک **پوشه** است. نام پوشه همان آدرس وبلاگ است (`content/blog/my-post` → `/blog/my-post`) و فقط می‌تواند `a-z`، `0-9`، `-` و `_` داشته باشد.

```
my-post/
├── index.md        ← متن (هر نام .md هم قبول است؛ اگر فقط یک فایل md باشد)
├── cover.jpg       ← (اختیاری) کاور؛ عکس / گیف / ویدیو / صدا. نامش همیشه cover.*
└── diagram.png     ← هر فایل دیگر
```

### فایل md دقیقاً این‌طور نوشته می‌شود

```md
---
tags: [دفاع از اسلام, شبهه اسلام‌ستیزان]
suggestions:
  - آیا پیامبر ص با دختر 6 ساله ازدواج کرد
  - ازدواج پیامبر ص با دختر 6 ساله
---

# ازدواج پیامبر ص با مادر عایشه رض

متن وبلاگ…
```

- **نام (عنوان) وبلاگ** = اولین خطی که با `# ` شروع می‌شود. همین خط عنوان صفحه است و از متن حذف می‌شود (عنوان دوبار نمایش داده نمی‌شود).
- `tags` اختیاری است؛ اگر ننویسید هیچ برچسبی ثبت نمی‌شود.
- `suggestions` اختیاری است؛ اگر ننویسید فقط خود عنوان پیشنهاد جست‌وجو می‌شود.
- چیز دیگری لازم نیست. `date` و `updated` را دستورهای زیر خودکار می‌گذارند؛ `style` را خودِ خواننده از دکمهٔ «استایل» انتخاب می‌کند؛ `draft` وجود ندارد (برای وبلاگ آزمایشی از «تست» استفاده کنید). کلیدهای قدیمی (`title`، `name`، `date`، `style`، `draft`) خوانده نمی‌شوند و فقط یک هشدار می‌گیرید.
- کلیدهای اختیاری پیشرفته: `description` (خلاصهٔ سئو؛ پیش‌فرض ۱۶۰ نویسهٔ اول متن)، `readingTime` (دقیقه؛ پیش‌فرض خودکار از تعداد کلمه‌ها)، `coverEmbed` (کاور از یوتیوب/آپارات/اینستاگرام اگر `cover.*` ندارید)، `cover` (مسیر کاور با نامی غیر از `cover.*`)، `lang`، `dir`.

### دستورها

| دستور | کار |
|---|---|
| `npm run createNewBlog <پوشه>` | ساخت وبلاگ جدید و پر کردن خودکار اطلاعات از md و پوشه |
| `npm run updateBlog <نام‌پوشه>` | ویرایش مقاله؛ اگر مقاله تکمیل شده باشد `updated` را امروز می‌کند |
| `npm run publishBlog <نام‌پوشه>` | اعلام پایان نگارش؛ مقاله را تکمیل‌شده علامت می‌زند و تاریخ انتشار را ثبت می‌کند |
| `npm run deleteBlog <نام‌پوشه>` | حذف وبلاگ (پوشه + تاریخ‌ها + خروجی‌ها) |
| `npm run createTest <پوشه>` | ساخت وبلاگ **آزمایشی** (فقط در توسعه دیده می‌شود) |
| `npm run deleteTest <نام>` | حذف وبلاگ آزمایشی |

`<پوشه>` می‌تواند پوشه‌ای باشد که از قبل در `content/blog` هست، یا هر پوشهٔ دلخواه روی سیستم (شامل یک فایل md و عکس/ویدیوهایش): در حالت دوم کپی می‌شود به `content/blog/<نام‌پوشه>/` و فایل md به `index.md` تغییر نام می‌دهد. بعد از هر دستور خودکار `npm run content` اجرا می‌شود (اعتبارسنجی کل سایت، slug تکراری، ساخت `articles.json`، جست‌وجو، sitemap، RSS)؛ اگر خطایی باشد همهٔ تغییرها **برگردانده می‌شود**. بعد از آن فقط `npm run build` می‌ماند.

گزینه‌ها را بعد از `--` بنویسید (npm بدون آن گزینه‌ها را خودش می‌خورد):

```bash
npm run createNewBlog -- مسیر/پوشه --move       # بعد از کپی، پوشهٔ مبدأ پاک شود
npm run createNewBlog -- مسیر/پوشه --force      # اگر وبلاگ از قبل هست جایگزین شود (تاریخ ساخت حفظ می‌شود)
npm run updateBlog -- my-post --from مسیر/پوشه  # محتوای تازه را از یک پوشهٔ دیگر جایگزین کن
npm run deleteBlog -- my-post --yes             # بدون پرسیدن تأیید
npm run createNewBlog -- مسیر/پوشه --no-build   # بدون اجرای npm run content
```

**روال معمول**

```bash
# ساخت: پوشه‌ای با md و عکس‌ها آماده کنید
npm run createNewBlog -- ~/Desktop/my-post --move

# ویرایش: فایل content/blog/my-post/index.md را عوض کنید، بعد:
npm run updateBlog my-post

# وقتی نگارش مقاله واقعاً تمام شد، یک‌بار اعلام تکمیل کنید:
npm run publishBlog my-post

# حذف:
npm run deleteBlog my-post
```

`deleteBlog` بدون `--yes` تأیید می‌گیرد. اگر قالب خالی می‌خواهید: `npm run new -- my-post "عنوان"` فایل `index.md` می‌سازد؛ بعد `npm run createNewBlog my-post` ثبتش می‌کند.

### تاریخ‌ها (`date` و `updated`)

تاریخ‌ها داخل md نیستند؛ در `content/blog-dates.json` نگه داشته می‌شوند (این فایل را دستورها می‌نویسند و **باید در گیت commit شود** تا نسخهٔ آنلاین هم همین تاریخ‌ها را بسازد).

- `createNewBlog`: مقالهٔ جدید با `completed: false` ثبت می‌شود؛ تاریخ موقت ذخیره می‌شود اما تا اعلام تکمیل، مقاله تاریخ به‌روزرسانی جداگانه نشان نمی‌دهد.
- `publishBlog`: وقتی نگارش واقعاً تمام شد اجرا کنید. `completed` را `true` می‌کند و تاریخ انتشار را تثبیت می‌کند. این دستور برای مقاله‌ای که قبلاً تکمیل شده، تاریخ‌ها را تغییر نمی‌دهد.
- `updateBlog`: پیش از تکمیل، تاریخ به‌روزرسانی را جلو نمی‌برد؛ پس از تکمیل، `updated` را امروز می‌کند و `date` انتشار ثابت می‌ماند. در صفحه فقط وقتی این دو تاریخ متفاوت باشند تاریخ به‌روزرسانی دیده می‌شود.
- اگر پوشه‌ای را دستی در `content/blog` بگذارید و ثبت نکنید، تاریخ از زمان فایل گرفته می‌شود و هشدار می‌بینید؛ `npm run createNewBlog <نام>` آن را ثبت می‌کند.

### وبلاگ آزمایشی (تست)

`createTest` همان کار `createNewBlog` را می‌کند ولی پوشه را `content/blog/_<نام>` می‌سازد. پوشه‌های `_…` در `npm run dev` دیده می‌شوند و در `npm run build` / سایت آنلاین / sitemap / RSS **هرگز نمی‌آیند**. تست‌ها تاریخ ثبت‌شده ندارند. حذف: `npm run deleteTest <نام>` (با یا بدون `_`). مقالهٔ نمونهٔ پروژه (`_example-article`) هم یک تست است. `deleteBlog` روی تست و `deleteTest` روی وبلاگ عادی جواب نمی‌دهد (پیام راهنما می‌دهد)، تا چیزی اشتباهی پاک نشود.

### خروجی ساخته‌شده برای هر وبلاگ (`src/generated/articles.json`)

```json
{
  "slug": "my-post",
  "title": "ازدواج پیامبر ص با مادر عایشه رض",
  "description": "۱۶۰ نویسهٔ اول متن (یا description دستی)",
  "date": "2026-10-12",
  "updated": "2026-10-12",
  "tags": ["دفاع از اسلام", "شبهه اسلام‌ستیزان"],
  "suggestions": ["آیا پیامبر ص با دختر 6 ساله ازدواج کرد"],
  "cover": { "url": "/content/my-post/cover.jpg", "type": "image" },
  "readingTime": 3
}
```

`cover.type` خودکار از پسوند فایل `cover.*` تشخیص داده می‌شود (`image` / `video` / `audio`). `readingTime` اگر در md ننوشته باشید خودکار (۲۰۰ کلمه در دقیقه) حساب می‌شود. این فایل ساخته‌شده است و ویرایش دستی ندارد.

## ۵. مرجع md

| کلید | نوع | پیش‌فرض | توضیح |
|---|---|---|---|
| `# عنوان` (اولین) | متن | **الزامی** | نام/عنوان وبلاگ و `<h1>` صفحه |
| `tags` | string[] | `[]` | برچسب‌ها |
| `suggestions` | string[] | `[عنوان]` | عبارت‌هایی که جست‌وجوی دقیقشان به این وبلاگ می‌رسد |
| `description` | string | ۱۶۰ نویسهٔ اول | توضیح سئو و کارت‌ها (اختیاری) |
| `readingTime` | عدد | خودکار | دقیقهٔ مطالعه (اختیاری) |
| `coverEmbed` | URL https | — | کاور از یوتیوب/اینستاگرام/آپارات؛ اگر فایل کاور هست، فایل برنده است |
| `cover` | مسیر | `cover.*` | فقط اگر کاور نامی غیر از `cover.*` دارد |
| `lang`, `dir` | string | — | زبان/جهت این وبلاگ (مثلاً `en` / `ltr`) |

## ۶. کاور (رسانهٔ اول)

اول از همه همیشه کاور نشان داده می‌شود: عکس/گیف، ویدیو (با پوستر هم‌نام)، صدا (پخش‌کنندهٔ سفارشی) یا embed (با دکمهٔ پخش). فایلی به نام `cover.*` خودکار شناخته می‌شود.

## ۷. پیشنهادهای جست‌وجو (suggestions)

```md
---
suggestions:
  - آیا پیامبر ص با دختر 6 ساله ازدواج کرد
  - دلیل ازدواج پیامبر ص با مادر عایشه رض
---

# ازدواج پیامبر ص با مادر عایشه رض
```

اگر `suggestions` ننویسید، فقط عنوان پیشنهاد جست‌وجو است.

اگر کاربر دقیقاً یکی از این عبارت‌ها (یا عنوان) را جست‌وجو و Enter بزند، مستقیم به مقاله می‌رود. مقایسه پس از نرمال‌سازی است: یکسان‌سازی «ي/ی» و «ك/ک»، حذف اعراب و نیم‌فاصله، تبدیل ارقام فارسی/عربی به لاتین، حروف کوچک و فاصله‌های اضافه. تطبیق تقریبی فقط لیست نتایج را نشان می‌دهد.

## ۸. مارک‌داون، HTML و Tailwind

مارک‌داون معمولی (`## h2`، جدول، لیست، کد) + کامپوننت‌ها با سینتکس directive. راهنمای کامل: [docs/COMPONENTS.md](docs/COMPONENTS.md). HTML خام و کلاس‌های Tailwind داخل `.md` هم کار می‌کند؛ `<script>` و `on*` و `javascript:` حذف می‌شوند.

اگر کلاس Tailwind را به‌صورت پویا می‌سازید، آن را در `src/index.css` با `@source inline("...")` اضافه کنید.

نکته: اولین `# عنوان` همان نام وبلاگ است و از متن حذف می‌شود. اگر بعدتر باز هم `# ` (h1) در متن بیاورید، چون h1 صفحه فقط عنوان است، سرتیتر‌های متن یک سطح پایین‌تر رندر می‌شوند؛ بهتر است بخش‌ها را با `##` شروع کنید.

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

انتخاب استایل با **خوانندهٔ سایت** است، نه با فایل md: در صفحهٔ هر وبلاگ دکمهٔ «استایل» در هدر هست. انتخاب او در مرورگرش ذخیره می‌شود و همهٔ وبلاگ‌ها با همان استایل باز می‌شوند. اگر چیزی انتخاب نکرده باشد، `defaultStyle` در `src/site.config.ts` استفاده می‌شود. برای اشتراک‌گذاری یک استایل مشخص `?style=3` را به آدرس اضافه کنید (روی انتخاب ذخیره‌شده اولویت دارد).

همهٔ استایل‌ها یک قرارداد توکن مشترک دارند (`--bg --surface --surface-alt --surface-strong --text --text-secondary --muted --border-light --border-strong --brand --brand-dark --brand-contrast --info --warn --danger --code-bg --code-text --radius-card --radius-sm --shadow-card --body-line-height --prose-size --heading-weight`). استایل ۱ شبیه بلاگ آموزشی کارت‌محور با تأکید سبز است. **ساخت استایل نهم:** یک بلاک `.blog-style-N` را در `src/styles/blog-styles.css` کپی کنید، فقط توکن‌ها (روشن و تیره) را عوض کنید، و آن را در `src/layouts/config.ts` ثبت کنید (دکمهٔ «استایل» لیست را از همان‌جا می‌سازد).

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
- **تعارض / نام پوشه نامعتبر:** نام پوشه همان آدرس است؛ پوشه را تغییر نام دهید (فقط `a-z 0-9 - _`).
- **خطای «no title found»:** فایل md باید یک خط `# عنوان` داشته باشد.
- **وبلاگ آزمایشی در سایت آنلاین نیست:** درست است؛ پوشه‌های `_…` عمداً در build نهایی نمی‌آیند.
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

## ۱۹. گالری (مجموعهٔ عکس / گیف / ویدیو)

```md
:::gallery
![توضیح عکس](./one.jpg)
![گیف](./two.gif)
![توضیح ویدیو](./clip.mp4)
::video{src="./other.webm" poster="./poster.jpg"}
:::
```

هر ترکیبی از عکس، گیف و ویدیو (به هر تعداد) داخل یک `:::gallery` قرار می‌گیرد؛ هر مورد را در یک خط جدا بنویسید. کلیک روی هر مورد پنجرهٔ بزرگ‌نمایی را باز می‌کند و با کلیدهای جهت‌دار می‌شود بین همهٔ موردهای همان گالری رفت.

**چیدمان بر اساس تعداد** (در اندازهٔ فونت ۱۰۰٪):

| تعداد | چیدمان |
|---|---|
| ۱ | گالری نیست؛ همان رسانه با اندازهٔ عادی |
| ۲ | یکی راست، یکی چپ |
| ۳ | دو تا بالا (راست و چپ)، یکی پایین با تمام عرض |
| ۴ | مثل پنجره: دو تا بالا، دو تا پایین |
| ۵ | سه تا بالا، دو تا پایین |
| ۶ | سه تا بالا، سه تا پایین |
| ۷ و بیشتر | به همین صورت: ردیف‌های حداکثر ۳تایی؛ باقی‌مانده بین ردیف‌ها مساوی پخش می‌شود (۷ = ۳+۲+۲، ۸ = ۳+۳+۲، ۹ = ۳+۳+۳ …) |

**اندازهٔ فونت:** چیدمان بالا برای ۱۰۰٪ است. با بزرگ‌تر شدن متن (تا ۱۵۰٪) تعداد در هر ردیف کمتر می‌شود (مثلاً ۶ مورد در ۱۵۰٪ می‌شود ۲+۲+۲) و با کوچک‌تر شدن (تا ۸۰٪) بیشتر (مثلاً ۸ مورد می‌شود ۴+۴). در صفحهٔ باریک (موبایل) هم تعداد در ردیف خودکار طوری کم می‌شود که هر کاشی کوچک‌تر از حدود ۷rem نشود.

منطق چیدمان در `src/lib/gallery.ts` (با تست در `tests/gallery.test.ts`) و کامپوننت در `src/components/mdx/MediaBlocks.tsx` است. عدد پایهٔ هر ردیف (۲ تا ۴ مورد، ۳ از ۵ مورد به بالا) در تابع `baseColumns` تغییر می‌کند.

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

## Add, update and delete a blog

A blog is a **folder**; the folder name is the URL (`content/blog/my-post` → `/blog/my-post`; `a-z 0-9 - _` only). The markdown file contains only this:

```md
---
tags: [tag one, tag two]      # optional, default: none
suggestions:                  # optional, default: the title
  - a phrase people search for
---

# Blog title                  # the first "# " line = the title (removed from the body)

Text…
```

| Command | What it does |
|---|---|
| `npm run createNewBlog <folder>` | Create/register a blog from a folder (md + media). New articles remain incomplete until explicitly published. |
| `npm run updateBlog <name>` | Re-validate; only completed articles get `updated` = today (`date` stays). |
| `npm run publishBlog <name>` | Mark the article complete and set its publication date; run once when writing is finished. |
| `npm run deleteBlog <name>` | Delete the blog folder, its dates and generated output. Asks to confirm (`-- --yes` skips). |
| `npm run createTest <folder>` | Same as createNewBlog but the folder becomes `content/blog/_<name>`: development only, never built for production. |
| `npm run deleteTest <name>` | Delete a test blog. |

Options go after `--`: `--move`, `--force`, `--no-build`, `--yes`, and `updateBlog -- <name> --from <folder>`. Every command runs `npm run content` and undoes its change if that fails. Dates and completion status live in `content/blog-dates.json` (commit it). New articles stay incomplete until `npm run publishBlog <name>`; later `updateBlog` calls advance `updated` only after completion. The reader's style choice (header button, saved in the browser; `?style=N` wins) decides the style: there is no `style` or `draft` key. `npm run new -- my-post "Title"` writes an empty template.

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

## Gallery

`:::gallery` takes any mix of photos, GIFs and videos (`![](a.jpg)`, `![](b.gif)`, `![](c.mp4)`, `::video{src="…"}`), one per line; click opens a lightbox that steps through the whole set. Layout by count at 100% font size: 1 = plain media (no gallery), 2 = side by side, 3 = 2 + 1 full width, 4 = 2 × 2, 5 = 3 + 2, 6 = 3 + 3, more continue with rows of up to 3 (7 = 3+2+2, 8 = 3+3+2, …). Items per row follow the reader's font size: larger text → fewer per row (6 items at 150% = 2+2+2), smaller → more (8 items at 80% = 4+4); narrow screens also reduce it so tiles never get tiny. Logic: `src/lib/gallery.ts`.

## Troubleshooting

Image missing → keep it beside `index.md` and use `./file`. New tag unstyled → register it in `directiveNames` and the component map. Empty iframe → the source blocks framing, use `:::source`. Invalid folder name / slug conflict → rename the folder (it is the URL). "no title found" → add a `# Title` line.
