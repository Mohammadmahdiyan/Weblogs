# وبلاگ استاتیک فارسی · Static Persian blog engine

[فارسی](#فارسی) · [English](#english)

---

# فارسی

## ۱. معرفی

موتور وبلاگ استاتیک (RTL، فارسی‌محور). برای افزودن مقاله فقط یک پوشه می‌سازید؛ لیست مقاله‌ها، جست‌وجو، سایدبار، سئو، sitemap و RSS خودکار ساخته می‌شوند.

ویژگی‌ها: تغییرات جزئی ظاهر مقاله (رنگ‌بندی، آکاردئون، نقل‌قول، دکمه؛ انتخاب با خواننده)، بسم‌الله خودکار در ابتدای هر مقاله، حالت روشن/تیره/سیستم، فونت قابل‌تعویض و تنظیم اندازهٔ متن، جست‌وجوی هوشمند با `suggestions`، بزرگ‌نمایی عکس/گیف/ویدیو، کامپوننت‌های آماده در مارک‌داون، iframe امن (یوتیوب، اینستاگرام، آپارات، صفحهٔ دلخواه)، کارت نقل‌قول منبع (`:::source`)، HTML خام با Tailwind.

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
- چیز دیگری لازم نیست. `date` و `updated` را دستورهای زیر خودکار می‌گذارند؛ ظاهر مقاله را خودِ خواننده از دکمهٔ «ظاهر» تغییر می‌دهد (نه از md)؛ `draft` وجود ندارد (برای وبلاگ آزمایشی از «تست» استفاده کنید). کلیدهای قدیمی (`title`، `name`، `date`، `style`، `draft`) خوانده نمی‌شوند و فقط یک هشدار می‌گیرید.
- کلیدهای اختیاری پیشرفته: `description` (خلاصهٔ سئو؛ پیش‌فرض ۱۶۰ نویسهٔ اول متن)، `readingTime` (دقیقه؛ پیش‌فرض خودکار از تعداد کلمه‌ها)، `coverEmbed` (کاور از یوتیوب/آپارات/اینستاگرام اگر `cover.*` ندارید)، `cover` (مسیر کاور با نامی غیر از `cover.*`)، `lang`، `dir`.

### دستورها و انتشار خودکار

| دستور | کار |
|---|---|
| `npm run publishBlog -- <نام-پوشه>` | اعلام پایان نگارش مقاله، ثبت وضعیت تکمیل، ساخت مجدد محتوا و `git commit`/`git push` به شاخهٔ `main` |
| `npm run deleteBlog -- <نام-پوشه>` | حذف کامل پوشه و تاریخ‌های آن، بازسازی محتوا و push به GitHub |
| `npm run createTest` | ساخت مجدد مقالهٔ آزمایشی کامل در `content/blog/_example-article/index.md`؛ بدون ورودی و بدون بازنویسی نمونه‌ای که از قبل وجود دارد |
| `npm run deleteTest` | حذف مقالهٔ آزمایشی ثابت `_example-article`؛ بدون ورودی |

دیگر نیازی به دستورهای جداگانهٔ `createNewBlog` و `updateBlog` نیست. برای افزودن مقاله، پوشهٔ آن را مستقیم در `content/blog/<نام-پوشه>/` بساز و فایل `index.md` را قرار بده. هنگام اجرای `npm run dev`، پوشه‌های تازه به‌صورت خودکار ثبت و محتوای سایت بازسازی می‌شوند.

**پس از اجرای `npm run publishBlog -- <نام-پوشه>`، مقاله تکمیل‌شده محسوب می‌شود.** تا وقتی `npm run dev` باز است، هر ذخیرهٔ بعدی در فایل‌ها یا رسانه‌های همان مقاله، تاریخ `updated` را خودکار به‌روز می‌کند، محتوا را بازسازی می‌کند و تغییرات مقاله را به GitHub push می‌کند. مقاله‌هایی که هنوز منتشر/تکمیل نشده‌اند خودکار push نمی‌شوند.

نمونه:

```bash
# پوشهٔ content/blog/my-post از قبل ساخته شده و index.md دارد
npm run publishBlog -- my-post

# حذف کامل مقاله و انتشار حذف در سایت
npm run deleteBlog -- my-post

# ساخت/حذف نمونهٔ آزمایشی؛ هیچ نامی وارد نکنید
npm run createTest
npm run deleteTest
```

برای push خودکار باید مخزن محلی روی شاخهٔ `main` باشد، remote با نام `origin` به `https://github.com/mohammadmahdiyan/weblogs` متصل باشد و احراز هویت GitHub از قبل کار کند. فایل `.github/workflows/deploy.yml` سایت را پس از push به `main` می‌سازد و منتشر می‌کند؛ ممکن است نمایش تغییرات آنلاین چند دقیقه زمان ببرد.

### تاریخ‌ها (`date` و `updated`)

تاریخ‌ها داخل Markdown نیستند؛ در `content/blog-dates.json` نگه داشته می‌شوند و همراه محتوای مقاله commit می‌شوند.

- پوشهٔ مقاله‌ای که در حالت توسعه شناسایی شود، به‌صورت خودکار با `completed: false` ثبت می‌شود.
- `publishBlog` مقدار `completed` را `true` می‌کند و تاریخ تکمیل/انتشار را ثبت می‌کند.
- پس از تکمیل، ذخیرهٔ هر تغییر در فایل‌ها و رسانه‌های مقاله هنگام اجرای `npm run dev` تاریخ `updated` را خودکار جلو می‌برد و به GitHub push می‌کند؛ نیازی به `updateBlog` نیست.
- **تا وقتی `publishBlog` زده نشده**، انتهای مقاله یک اعلان با لودینگ و متن «متن مقاله هنوز کامل نشده» و پیوند «پیگیری از مدیر برای تکمیل این مقاله» نمایش داده می‌شود (مقاله‌های تست `_…` هم همین‌طورند). پیوند، چت تلگرام شما را با یک پیام آمادهٔ مؤدبانه درباره‌ی همین مقاله باز می‌کند و در هر بار کلیک یکی از ۲۵ پیام می‌آید. پیام‌ها در `src/lib/followUp.ts` هستند (هر تعداد قابل‌ویرایش است؛ `{title}` جای عنوان مقاله را می‌گیرد). آیدی تلگرام از اولین پیوند `t.me/…` در `social` فایل `src/site.config.ts` خوانده می‌شود؛ اگر نباشد، فقط متن اعلان نشان داده می‌شود. ظاهر لودینگ در انتهای `src/index.css` (کلاس‌های `wip-*`) است.
- پوشه‌های شروع‌شونده با `_` آزمایشی هستند و در انتشار تولیدی، sitemap و RSS قرار نمی‌گیرند.

### وبلاگ آزمایشی (تست)

`npm run createTest` بدون آرگومان، قالب کامل `scripts/templates/example-article` را به `content/blog/_example-article` کپی می‌کند. اگر پوشه موجود باشد آن را بازنویسی نمی‌کند؛ اگر حذف شده باشد دوباره ساخته می‌شود. `npm run deleteTest` همان پوشهٔ ثابت را حذف می‌کند. این مقاله برای تست محلی است و در build تولیدی منتشر نمی‌شود.

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

**جست‌وجو در محتوا:** با نوشتن `محتوا::عبارت` در کادر جست‌وجوی صفحهٔ خانه، داخل متن مقاله‌ها جست‌وجو می‌شود. اگر عبارتی در عنوان/پیشنهادها پیدا نشود، دو مورد نشان داده می‌شود: «می‌خواهید در محتوا جست‌وجو کنید؟» (با کلیک، کادر به `محتوا::عبارت` تغییر می‌کند و در متن جست‌وجو می‌شود) و «نتیجه‌ای پیدا نشد». اگر جست‌وجوی محتوا هم چیزی نیافت، فقط «نتیجه‌ای پیدا نشد» می‌آید و پیشنهاد دوباره نمی‌آید.

**نتایج جست‌وجوی محتوا:** خط اول هر نتیجه نام مقاله است. زیرش توضیحی هست که عبارت پیداشده همیشه در **وسط** آن است، با تعداد نویسهٔ برابر قبل و بعدش (اگر عبارت نزدیک ابتدا یا انتهای متن باشد، از همان طرف متن کمتری هست). با کلیک روی نتیجه (یا Enter)، مقاله باز می‌شود و **خودکار تا همان جایی که متن نوشته شده اسکرول** می‌کند و آن را هایلایت می‌کند؛ اگر داخل آکاردئون یا `<details>` بسته باشد، اول باز می‌شود. این با پارامتر `?find=عبارت` در آدرس مقاله کار می‌کند (کد: `src/lib/findInPage.ts`).

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

فقط از توکن‌های رنگی (`var(--surface-alt)` و …) استفاده کنید تا با هر رنگ‌بندی هماهنگ شود.

## ۱۱. ظاهر مقاله (تغییرات جزئی)

چیدمان صفحهٔ مقاله **فقط یکی** است و خواننده نمی‌تواند کل صفحه را عوض کند. به‌جایش در صفحهٔ هر وبلاگ دکمهٔ «ظاهر» در هدر هست که فقط این تغییرهای جزئی را می‌دهد:

| گروه | گزینه‌ها |
|---|---|
| رنگ‌بندی | سبز (پیش‌فرض)، آبی، بنفش، قرمز، نارنجی، فیروزه‌ای، خاکستری (هرکدام برای حالت روشن و تیره) |
| آکاردئون (`:::item`) | پر (پیش‌فرض)، کادردار، ساده |
| نقل‌قول (`>`) | کارتی (پیش‌فرض)، خط کناری، کادردار |
| دکمه (`:button`، مودال) | معمولی (پیش‌فرض)، گرد، برجسته |

انتخاب خواننده در مرورگرش ذخیره می‌شود و روی همهٔ صفحه‌های سایت اثر می‌گذارد؛ دکمهٔ «بازگشت به حالت پیش‌فرض» همه را برمی‌گرداند. فایل md هیچ کلیدی برای ظاهر ندارد.

**نقل‌قول:** آیکون نقل‌قول دیگر روی متن نمی‌افتد؛ یکی اول متن و یکی آخر متن می‌آید و آیکون آخر ۱۸۰ درجه چرخیده است. اندازهٔ آیکون‌ها `size-4` است (در `QuoteIcon` در `src/components/MarkdownRenderer.tsx` تغییر می‌کند).

**چطور کار می‌کند:** هر انتخاب یک attribute روی `<html>` می‌گذارد (`data-palette`، `data-accordion`، `data-quote`، `data-button`) و فقط CSS همان گزینه فعال می‌شود. منطق و فهرست گزینه‌ها در `src/lib/appearance.ts`، رنگ‌بندی‌ها در انتهای `src/styles/theme.css` و بقیه در `src/styles/blog-styles.css` هستند. `index.html` انتخاب ذخیره‌شده را پیش از React اعمال می‌کند تا پرشی دیده نشود.

**افزودن گزینهٔ جدید:** یک گزینه به `appearanceGroups` در `src/lib/appearance.ts` اضافه کنید (برای رنگ‌بندی، `swatch` هم بدهید) و قاعدهٔ CSS آن را بنویسید، مثلاً `[data-button='square'] .md-button { border-radius: 0 }`. برای رنگ‌بندی جدید دو خط در `theme.css` کافی است (`:root[data-palette='x']` و `.dark[data-palette='x']`؛ فقط توکن‌های `--brand*`).

## بسم‌الله ابتدای مقاله

بالای متن هر مقاله (بعد از کاور و پیش از فهرست مطالب) خودکار این دو جمله وسط‌چین نمایش داده می‌شود و زیر هرکدام ترجمهٔ فارسی‌اش با اندازهٔ کمی کوچک‌تر است. لازم نیست در md چیزی بنویسید (اگر نوشته‌اید پاک کنید تا دوبار نیاید). متن و ترجمه در `src/components/Basmala.tsx` است.

## متن کوچک و ایموجی (داخل متن)

**متن کوچک** (مثل ³¹²⁴ در تلگرام):

```md
((سلام دنیا))
((سلام دنیا))(سایز: کوچک،قرارگیری: وسط)
((۳))(قرارگیری: پایین)
```

- `سایز`: `کوچک`، `متوسط`، `بزرگ` — پیش‌فرض `متوسط`
- `قرارگیری`: `بالا`، `وسط`، `پایین` — پیش‌فرض `بالا`
- هرکدام را می‌شود ننوشت (`((x))(سایز: کوچک)`) و ترتیب مهم نیست. جداکننده `،` یا `,` است. بدون تنظیمات یعنی `((سلام دنیا))(سایز: متوسط،قرارگیری: بالا)`.
- متن داخل `(( ))` فقط متن ساده باشد (بدون ** و لینک). در جست‌وجو و فهرست مطالب، خود متن حساب می‌شود نه تنظیمات.

**ایموجی/شکلک** با `{نام}`:

```md
این خنده‌دار بود {خخخ} واقعا {قلب}
```

نام‌ها و فایل هرکدام در **یک فایل** `src/emojis/emojis.json` است (کنار خود فایل‌های `.svg` همان پوشه):

```json
{
  "خخخ": "funnyface.svg",
  "قلب": "heart.svg"
}
```

برای افزودن: فایل svg را در `src/emojis/` بگذارید و یک خط `"نام": "فایل.svg"` به `emojis.json` اضافه کنید. فقط نام‌های ثبت‌شده تبدیل می‌شوند؛ هر `{چیز دیگری}` همان متن می‌ماند. موجودها: `خخخ` `لبخند` `چشمک` `باحال` `تعجب` `گریه` `عصبانی` `قلب`. (داخل کد تبدیل نمی‌شود.)

## ۱۲. تم روشن/تیره/سیستم و رنگ‌ها

پیش‌فرض «سیستم» است و با `localStorage.theme` ذخیره می‌شود (بدون پرش هنگام بارگذاری). رنگ‌های سراسری در `src/styles/theme.css` و ظاهر مقاله (نقل‌قول، آکاردئون، دکمه) در `src/styles/blog-styles.css` هستند.

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

A blog is a folder; the folder name is the URL (`content/blog/my-post` → `/blog/my-post`). Put the article in `content/blog/<folder>/index.md` using the Markdown format above.

| Command | What it does |
|---|---|
| `npm run publishBlog -- <folder>` | Mark the article complete, rebuild content, then commit and push blog changes to `main`. |
| `npm run deleteBlog -- <folder>` | Delete the article folder and its dates, rebuild content, then commit and push the deletion. |
| `npm run createTest` | Restore the full `_example-article` test fixture, with no arguments. Existing fixtures are not overwritten. |
| `npm run deleteTest` | Delete the fixed `_example-article` test fixture, with no arguments. |

`createNewBlog` and `updateBlog` are no longer separate commands. Create a new folder directly under `content/blog` and add `index.md`; while `npm run dev` is running, new folders are registered automatically. After `publishBlog` marks an article complete, saving changes to its Markdown or media files automatically updates `updated`, rebuilds the content and pushes the change to GitHub. This watcher runs only while `npm run dev` is running; incomplete articles are not auto-pushed.

Automatic push requires the local clone to be on branch `main`, an `origin` remote pointing to `https://github.com/mohammadmahdiyan/weblogs`, and working GitHub authentication. The existing `.github/workflows/deploy.yml` builds and deploys the site after a push to `main`; the public site may take a few minutes to refresh.

```bash
npm run publishBlog -- my-post
npm run deleteBlog -- my-post
npm run createTest
npm run deleteTest
```

Until `publishBlog` is run, the end of the article shows a «not finished yet» notice with an animated loader and a Telegram link that opens your chat with a ready-made polite message about that article (a different one of 25 on every click; see `src/lib/followUp.ts`). The Telegram username comes from the first `t.me` link in `social` in `src/site.config.ts`. Dates and completion status live in `content/blog-dates.json` and are committed with the article. A folder first detected by the dev watcher is registered as incomplete; `publishBlog` marks it complete. Test folders begin with `_` and are excluded from production output, sitemap and RSS.

## Search suggestions

If a visitor submits a phrase that exactly equals (after normalization) a `suggestions` entry or a title, they are taken straight to that article. Fuzzy matches only show the result list. Typing `محتوا::term` searches inside article text; each result shows the article title, then a description with the found text exactly in the middle (equal context on both sides). Clicking a result opens the article at `?find=term`, which scrolls to the first occurrence, highlights it and opens any accordion / `<details>` hiding it. When a normal search finds nothing, the dropdown offers «search in the content» (which rewrites the box to `محتوا::term`) above the usual «not found» line; if the content search also finds nothing, only «not found» is shown.

## Markdown & components

Standard markdown + directives (accordion, alert, card, gallery, modal, tooltip, `suggested`, `course`, …) — see [docs/COMPONENTS.md](docs/COMPONENTS.md). Raw HTML with Tailwind classes works (scripts / `on*` / `javascript:` are stripped). For dynamically built class names add `@source inline("…")` in `src/index.css`.

## Embeds (iframes)

`::youtube`, `::instagram`, `::aparat`, `::embed`, raw `<iframe>` and the `:::source` quote card. All frames use `SafeEmbed`: sandbox, referrer policy, lazy loading, click-to-load for video providers, an allowlist notice, an 8-second failure timeout with a link-card fallback, and an expand-to-modal button. Add your hadith site's hostname to `embedAllowlist` in `src/site.config.ts`. `public/_headers` is generated with a matching CSP `frame-src`.

## Look, themes, fonts

There is one article layout. Readers can only make small changes from the «ظاهر» menu: colour palette (7), accordion look (3), quote look (3) and button look (3). The choice is saved in the browser and set as `data-palette / data-accordion / data-quote / data-button` on `<html>`; see `src/lib/appearance.ts`, the end of `src/styles/theme.css` and `src/styles/blog-styles.css`. Themes are light / dark / system (default system); the default font is Vazir and more fonts can be added in 3 steps (`public/fonts/README.md`). Users can change font and size from the home page.

Inline extras in Markdown text: small text `((text))(سایز: کوچک|متوسط|بزرگ،قرارگیری: بالا|وسط|پایین)` (defaults: medium, top) and emoji `{name}`, registered in `src/emojis/emojis.json` next to their `.svg` files.

Every article starts with the Basmala and the salawat (centred, each with a smaller Persian translation below); it is added automatically by `src/components/Basmala.tsx`, so do not write it in the md files.

## SEO & deployment

Set `siteUrl` in `src/site.config.ts`. Generated: `sitemap.xml`, `robots.txt`, `rss.xml`, `_headers`; JSON-LD, canonical, Open Graph, Twitter tags; meta prerender per article. Deploy `dist/` with an SPA fallback (`_redirects` is included; see the Persian section for Vercel / GitHub Pages / Nginx).

## Gallery

`:::gallery` takes any mix of photos, GIFs and videos (`![](a.jpg)`, `![](b.gif)`, `![](c.mp4)`, `::video{src="…"}`), one per line; click opens a lightbox that steps through the whole set. Layout by count at 100% font size: 1 = plain media (no gallery), 2 = side by side, 3 = 2 + 1 full width, 4 = 2 × 2, 5 = 3 + 2, 6 = 3 + 3, more continue with rows of up to 3 (7 = 3+2+2, 8 = 3+3+2, …). Items per row follow the reader's font size: larger text → fewer per row (6 items at 150% = 2+2+2), smaller → more (8 items at 80% = 4+4); narrow screens also reduce it so tiles never get tiny. Logic: `src/lib/gallery.ts`.

## Troubleshooting

Image missing → keep it beside `index.md` and use `./file`. New tag unstyled → register it in `directiveNames` and the component map. Empty iframe → the source blocks framing, use `:::source`. Invalid folder name / slug conflict → rename the folder (it is the URL). "no title found" → add a `# Title` line.
