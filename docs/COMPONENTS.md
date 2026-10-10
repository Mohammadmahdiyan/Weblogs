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

Images inside a gallery are passed to the lightbox as one navigable set. Ordinary Markdown images ending in `.mp4` or `.webm` become video players; `.mp3`, `.ogg`, `.wav`, and `.m4a` become audio players. Images and videos call the Part 5 lightbox hook.

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