# Fonts

The site uses **Vazir** (the files in `public/fonts/vazir/`). Nothing is
downloaded from a CDN. If a file is missing the site still works and falls
back to `Tahoma, system-ui, sans-serif`.

Fonts are *pluggable*: no React code needs to change.

## Adding another font — 3 steps

1. **Copy the files** into `public/fonts/` (woff2 preferred).
2. **Add `@font-face` blocks** to `public/fonts/fonts.css`.
3. **Add one object** to `public/fonts/fonts.json`.

After that the font appears automatically in the font selector on the home
page (the selector is hidden while only one font is registered) and is
applied to the whole site, including every colour palette and look option.

### Worked example: adding another font later (e.g. IRANYekanX)

> This is documentation only — nothing below is active code.
> Commercial fonts need a valid license.

Files: `public/fonts/iranyekanx/IRANYekanX-Regular.woff2`,
`IRANYekanX-Bold.woff2`.

Step 2, `fonts.css`:

```css
/*
@font-face {
  font-family: 'IRANYekanX';
  src: url('./iranyekanx/IRANYekanX-Regular.woff2') format('woff2');
  font-weight: 300 600;
  font-display: swap;
}
@font-face {
  font-family: 'IRANYekanX';
  src: url('./iranyekanx/IRANYekanX-Bold.woff2') format('woff2');
  font-weight: 700 900;
  font-display: swap;
}
*/
```

Step 3, `fonts.json` (add this object to the `fonts` array):

```json
{
  "id": "iranyekanx",
  "label": "ایران‌یکان",
  "family": "IRANYekanX",
  "fallback": "Vazir, Tahoma, system-ui, sans-serif"
}
```

## Weights

The site uses weights 400/500/700/800. Vazir ships Thin, Regular,
Medium and Bold, so `fonts.css` maps ranges: 100–200 → Thin, 300–400 →
Regular, 500–600 → Medium, 700–900 → Bold.

## Persian digits

Content is never converted automatically. The `-FD` ("Farsi digits") files
render Latin digits as Persian digits. To keep Latin digits as-is, use the
non-`FD` build of the font instead.
