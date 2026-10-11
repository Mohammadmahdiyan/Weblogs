# کامپوننت‌های Markdown — راهنمای کاربری

> تمام کامپوننت‌ها با استفاده از [remark-directive](https://github.com/11ty/remark-directive) نوشته می‌شوند.
> رنگ‌ها از متغیرهای تم (`--brand`، `--surface`، ...) استفاده می‌کنند و در تمام ۸ استایل کار می‌کنند.

---

## 📋 فهرست مطالب

- [آکوردئون](#آکوردئون)
- [هشدار / Alert](#هشدار--alert)
- [آواتار](#آواتار)
- [نشان / Badge](#نشان--badge)
- [راهنمای صفحه / Breadcrumbs](#راهنمای-صفحه--breadcrumbs)
- [دکمه / Button](#دکمه--button)
- [گروه دکمه / Button Group](#گروه-دکمه--button-group)
- [کارت / Card](#کارت--card)
- [COLLAPSE](#collapsecollaps)
- [مودال / Modal](#مودال--modal)
- [گالری / Gallery](#گالری--gallery)
- [آیکون‌دار / Icon Button](#آیکون‌دار--icon-button)
- [لیست / List](#لیست--list)
- [صفحه‌بندی / Pagination](#صفحه‌بندی--pagination)
- [پاپ‌اور / Popover](#پاپ‌اور--popover)
- [امتیاز / Rating](#امتیاز--rating)
- [منوی dropdowns / Select](#منوی-dropdowns--select)
- [اسکلتون / Skeleton](#اسکلتون--skeleton)
- [اسپینر / Spinner](#اسپینر--spinner)
- [سوئیچ / Switch](#سوئیچ--switch)
- [جدول / Table](#جدول--table)
- [تولتیپ / Tooltip](#تولتیپ--tooltip)
- [تراشی / Typography](#تراشی--typography)
- [ویدیو / Video](#ویدیو--video)
- [پیشنهادی / Suggested](#پیشنهادی--suggested)
- [دوره / Course](#دوره--course)
- [ناشناخته / Unknown Directive](#ناشناخته--unknown-directive)

---

## آکوردئون

:::accordion
:::item{title="سوال اول" open}
پاسخ سوال اول
:::
:::item{title="سوال دوم"}
پاسخ سوال دوم
:::
:::

---

## هشدار / Alert

:::alert{type="info"}
این یک پیام اطلاعاتی است.
:::

**انواع:** `info` | `success` | `warning` | `danger`

---

## آواتار

::avatar{src="https://example.com/avatar.png" name="علی" size="md"}

**اندازه‌ها:** `sm` | `md` | `lg`

---

## نشان / Badge

:badge[جدید]{color="green"}

**رنگ‌ها:** `blue` | `green` | `yellow` | `red` | `brand`

---

## راهنمای صفحه / Breadcrumbs

:::breadcrumbs
1. [خانه](/)
2. [دسته](/category)
3. [صفحه جاری](#)
:::

---

## دکمه / Button

:button[راحت بزن]{variant="filled" color="brand" href="/"}

**ویژین‌ها:** `filled` | `outlined` | `text`  
**رنگ‌ها:** `blue` | `green` | `yellow` | `red` | `brand`

---

## گروه دکمه / Button Group

:::buttons
:button[گزینه 1]{}
:button[گزینه 2]{}
:button[گزینه 3]{}
:::

---

## کارت / Card

:::card{title="عنوان کارت" image="https://example.com/img.jpg"}
متن توضیحی کارت
:::

---

## Collapse

:::collapse{title="نمایش جزئیات"}
متن مخفی
:::

---

## مودال / Modal

:::modal{trigger="باز کردن" title="عنوان مودال"}
محتوای مودال
:::

---

## گالری / Gallery

:::gallery
![توضیح تصویر 1](photo1.jpg)
![توضیح تصویر 2](photo2.jpg)
:::

---

## آیکون‌دار / Icon Button

:iconbutton[arrow-right]{href="/"}

**آیکون‌ها (نام lucide-react):** `ArrowLeft`, `ArrowRight`, `BookOpen`, `Check`, `ChevronDown`, `CircleAlert`, `CircleCheck`, `Download`, `ExternalLink`, `Heart`, `Home`, `Info`, `Menu`, `Minus`, `Play`, `Plus`, `Search`, `Share2`, `Star`, `X`

---

## لیست / List

:::list{variant="check"}
- آیتم اول
- آیتم دوم
- آیتم سوم
:::

**حالت‌ها:** `check` | `number` | `bullet`

---

## صفحه‌بندی / Pagination

:::pagination{total="10" current="3"}

---

## پاپ‌اور / Popover

:popover[راهنمای من]{content="متن راهنما"}

---

## امتیاز / Rating

::rating{value="4.5" max="5"}

---

## منوی dropdowns / Select

::select{options="گزینه 1, گزینه 2, گزینه 3"}

---

## اسکلتون / Skeleton

::skeleton{lines="4"}

---

## اسپینر / Spinner

::spinner{size="md"}

**اندازه‌ها:** `sm` | `md` | `lg`

---

## سوئیچ / Switch

::switch{label="فعال باشد" checked}

---

## جدول / Table

| ستون 1 | ستون 2 | ستون 3 |
|--------|--------|--------|
| مقدار 1 | مقدار 2 | مقدار 3 |

---

## تولتیپ / Tooltip

:tooltip[واژه ناشناخته]{text="توضیح این واژه"}

---

## تراشی / Typography

### Lead

:::lead
این یک متن رهبری است که برای معرفی بخش استفاده می‌شود.
:::

### Headings

`# Heading 1` → <h2> (تبدیل به h2)
`## Heading 2` → <h3>
`### Heading 3` → <h4>

---

## ویدیو / Video

::video{src="/video.mp4" poster="/poster.jpg"}

**یا با تصویر:** `![](video.mp4)` — به‌صورت خودکار تشخیص داده می‌شود.

---

## پیشنهادی / Suggested

:::suggested{href="/blog/related-post" label="مقاله پیشنهادی:"}
متن پیشنهاد
:::

---

## دوره / Course

:::course{title="دوره PHP" href="/courses/php" image="/course.jpg" label="دوره پیشنهادی" cta="مشاهده دوره"}
توضیح کوتاه درباره دوره
:::

---

## ناشناخته / Unknown Directive

هر دایرکتیو ناشناخته‌ای فقط در حالت توسعه نمایش هشدار می‌دهد. در Production فقط محتوای داخلی نمایش داده می‌شود.
