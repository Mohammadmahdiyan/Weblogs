# Markdown Components

Markdown directives are converted into accessible React components. Attribute names accept kebab-case; boolean attributes such as `open`, `checked`, and `faq` need no value. All components inherit colors, surfaces, borders, and radii from the CSS theme tokens.

## Accordion and FAQ

```md
::::accordion{faq}
:::item{title="پرسش نخست" open}
پاسخ نمونه.
:::
:::item{title="پرسش دوم"}
پاسخ دوم.
:::
::::
```

Use `{faq}` or set the accordion title to `سوالات متداول` to emit FAQPage JSON-LD.

## Alerts and Identity

```md
:::alert{type="info"}
پیام اطلاع‌رسانی.
:::

::avatar{src="/content/article/author.webp" name="نام نویسنده" size="md"}
:badge[ویژه]{color="blue"}
```

Alert types are `info`, `success`, `warning`, and `danger`. Avatar sizes are `sm`, `md`, and `lg`. Badge colors are `blue`, `green`, `yellow`, `red`, and `brand`.

## Navigation and Actions

```md
:::breadcrumbs
- [خانه](/)
- [مقاله‌ها](/blog)
:::

:button[مطالعه]{href="/blog/example" variant="filled" color="brand"}

:::buttons
:button[اصلی]{href="/start" variant="filled" color="brand"}
:button[ثانویه]{href="/about" variant="outlined" color="blue"}
:button[متنی]{href="/more" variant="text" color="green"}
:::

:iconbutton[جستجو]{icon-name="search" href="/search"}
:::pagination{total="8" current="3"}
:::
```

Icon names include `search`, `home`, `book-open`, `heart`, `play`, `star`, `check`, `info`, `arrow-left`, `arrow-right`, `external-link`, `share-2`, `download`, `plus`, `minus`, `menu`, and `x`.

## Content Blocks

```md
:::card{title="عنوان کارت" image="./cover.webp"}
متن کارت.
:::

:::collapse{title="جزئیات بیشتر"}
محتوای جمع‌شونده.
:::

:::lead
یک مقدمه‌ی برجسته برای مقاله.
:::

:::list{variant="check"}
- نکته‌ی نخست
- نکته‌ی دوم
:::
```

List variants are `check`, `number`, and `bullet`. Ordinary Markdown lists are styled automatically.

## Dialog and Disclosure

```md
:::modal{trigger="نمایش" title="پنجره نمونه"}
محتوای پنجره.
:::

:popover[نمایش راهنما]{content="توضیح کوتاه"}
:tooltip[واژه]{text="معنی یا توضیح واژه"}
```

The modal uses a native dialog for focus trapping and Escape-to-close. Popovers use a keyboard-operable disclosure.

## Media

```md
:::gallery
![تصویر نخست](./one.webp)
![تصویر دوم](./two.webp)
:::

::video{src="./clip.mp4" poster="./cover.webp"}
::audio{src="./audio.ogg"}
```

A gallery accepts photos, GIFs and videos (`![](a.mp4)` or `::video`), one per line, in any mix. They go to the lightbox as one navigable set. Layout by count at 100% font size: 1 = plain media, 2 = side by side, 3 = 2 + 1 full width, 4 = 2 × 2, 5 = 3 + 2, 6 = 3 + 3, more continue with rows of up to 3; larger font size → fewer per row, smaller → more (`src/lib/gallery.ts`). Ordinary Markdown images ending in `.mp4` or `.webm` become video players; `.mp3`, `.ogg`, `.wav`, and `.m4a` become audio players. Images and videos call the Part 5 lightbox hook.

## Status and Inputs

```md
::rating{value="4.5" max="5"}
::select{options="گزینه نخست,گزینه دوم,گزینه سوم"}
::skeleton{lines="3"}
::spinner{size="md"}
::switch{label="فعال‌سازی نمونه" checked}
```

Select is a disabled display-only example. Switch is interactive and keyboard accessible. Spinner sizes are `sm`, `md`, and `lg`.

## Suggested Article and Course

```md
:::suggested{href="/blog/related" label="مقاله پیشنهادی:"}
[عنوان مقاله‌ی مرتبط](/blog/related)
:::

:::course{title="عنوان دوره" href="/courses/example" image="./course.webp" label="دوره پیشنهادی" cta="مشاهده دوره"}
توضیح کوتاه دوره.
:::
```

Both callouts accept internal paths or external URLs. External links open in a new tab with `noopener noreferrer`. Course images are optional.

## Tables and Raw HTML

GFM tables receive a responsive wrapper, sticky header, and zebra rows:

```md
| عنوان | توضیح |
| --- | --- |
| نمونه | متن |
```

Raw HTML is supported, including `<details>`, `<video>`, `<audio>`, `<iframe>`, and Tailwind classes. Script elements and `on*` event attributes are removed. Unknown directives display a warning box in development only.
---

## Embeds and quotes (external content)

Every iframe on the site goes through one component, `SafeEmbed`, so it always
gets safe defaults: `sandbox`, `referrerpolicy="strict-origin-when-cross-origin"`,
lazy loading, a required `title`, a responsive wrapper and a fallback. This also
applies to a **raw `<iframe>`** written inside markdown/HTML (it is rewritten to
`SafeEmbed`). Only `https:` sources and site-relative paths are allowed.

### `::youtube`

```md
::youtube{id="dQw4w9WgXcQ" start="1m30s" title="عنوان" caption="توضیح"}
::youtube{url="https://youtu.be/dQw4w9WgXcQ?t=90" title="عنوان"}
```

Loads `youtube-nocookie.com`. A poster + play button is shown first; the real
player is mounted only after a click (nothing autoplays). `start` accepts
seconds (`90`) or `1m30s`.

### `::instagram`

```md
::instagram{url="https://www.instagram.com/p/XXXX/" caption="پست"}
::instagram{url="https://www.instagram.com/reel/XXXX/"}
```

Supports `/p/`, `/reel/`, `/tv/`. Click-to-load like YouTube.

### `::aparat`

```md
::aparat{id="VIDEO_HASH" title="عنوان"}
```

### `::embed` (any https page)

```md
::embed{src="https://example.org/page" height="500" title="عنوان" caption="توضیح" source="https://example.org/page"}
```

| Attribute | Meaning |
|---|---|
| `src` | https URL (or `/relative/path`) |
| `height` | fixed height (`500`, `60vh`, `30rem`); the page scrolls inside the box. Best for **text pages** |
| `ratio` | aspect ratio instead of a fixed height (default `16/9`) |
| `title` | accessible title (falls back to the hostname) |
| `caption` | text under the frame |
| `source` | URL used by the «مشاهده در منبع» link |
| `facade` | show a click-to-load button instead of loading when scrolled into view |
| `fallback-only` | never use a frame; show only the link card (for sites known to block iframes) |
| `allow-forms` | adds `allow-forms` to the sandbox |

Hosts that are not in `embedAllowlist` (`src/site.config.ts`) still render, but
show an «محتوای خارجی» notice above the frame.

### `:::source` (quote card for hadith / references)

```md
:::source{site="نام سایت" title="عنوان" ref="کتاب، شماره" grade="daif" url="https://..."}
متن نقل‌قول…
:::
```

`grade`: `sahih` (صحیح), `hasan` (حسن), `daif` (ضعیف), `mawdu` (موضوع), `unknown`.
Optional `lang="ar" dir="rtl"` for Arabic text.

### Which one should I use?

| I want to… | Use |
|---|---|
| show a YouTube video (optionally from a given second) | `::youtube` |
| show an Instagram post / reel | `::instagram` |
| show an Aparat video | `::aparat` |
| show another web page (e.g. a hadith page) as visual proof | `::embed` with `height` |
| cite the text of a hadith / reference **so it is searchable and printable** | `:::source` |
| quote a site that I know blocks iframes | `:::source`, or `::embed{fallback-only}` |
| paste existing embed code | a raw `<iframe>` (it becomes `SafeEmbed` automatically) |

### Limitation: many sites block iframes

Sites can forbid being shown inside another page (`X-Frame-Options`,
`Content-Security-Policy: frame-ancestors`). Browsers do not report this error,
so the site waits 8 seconds; if the frame did not load it replaces the empty
box with a card containing the title, the host and a «مشاهده در منبع» button.
This cannot be bypassed from the client. An iframe also cannot show only *part*
of a page. For citing a passage, use `:::source`.

### Other directives added from the reference design

```md
:::suggested{href="/blog/some-article" label="مقاله پیشنهادی:"}
[عنوان مقاله](/blog/some-article)
:::

:::course{title="عنوان دوره" href="https://..." image="./cover.jpg" label="دوره پیشنهادی" cta="مشاهده دوره"}
توضیح کوتاه.
:::

:::accordion{faq}
:::item{title="سوال؟"}
پاسخ.
:::
:::
```

`:::accordion{faq}` also emits `FAQPage` JSON-LD for SEO.

## Small text and emoji (inline)

```md
((سلام دنیا))
((سلام دنیا))(سایز: کوچک،قرارگیری: وسط)
خنده {خخخ} و قلب {قلب}
```

`سایز` is `کوچک` / `متوسط` / `بزرگ` (default `متوسط`); `قرارگیری` is `بالا` / `وسط` / `پایین` (default `بالا`). Both options are optional. `{name}` becomes an emoji only when `name` is listed in `src/emojis/emojis.json` (name → svg file in `src/emojis/`); any other `{text}` stays as written. Neither is converted inside code. Parsing lives in `src/lib/inline.ts`.
