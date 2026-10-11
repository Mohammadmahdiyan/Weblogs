# Fonts

This directory contains fonts for the blog.

## Adding Vazirmatn

Place Vazirmatn font files in this directory (preferably in a `vazir/` subdirectory). The files should match the names specified in `fonts.json`.

Required weights: 300, 400, 500, 700, 800
Preferred format: woff2

## Adding another font later

### Adding IRANYekanX

1. Copy the IRANYekanX font files (woff2 preferred) into this directory, e.g. in `public/fonts/iranyekanx/`

2. Add `@font-face` blocks to `fonts.css`:

```css
@font-face {
  font-family: 'IRANYekanX';
  src: url('./iranyekanx/IRANYekanX-Thin.woff2') format('woff2');
  font-weight: 300;
  font-display: swap;
}

@font-face {
  font-family: 'IRANYekanX';
  src: url('./iranyekanx/IRANYekanX-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'IRANYekanX';
  src: url('./iranyekanx/IRANYekanX-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

3. Add an entry to `fonts.json`:

```json
{
  "id": "iranyekanx",
  "label": "ایران یکان",
  "family": "IRANYekanX",
  "fallback": "Tahoma, system-ui, sans-serif",
  "weights": {
    "300": "iranyekanx/IRANYekanX-Thin.woff2",
    "400": "iranyekanx/IRANYekanX-Regular.woff2",
    "700": "iranyekanx/IRANYekanX-Bold.woff2"
  }
}
```

> **Note:** Commercial fonts require a valid license.

## Font Weight Guidelines

Blog styles rely on weights 300, 400, 500, 700, and 800. Add at least these weights for each font.

## Persian Digits

If you want to display Persian digits (۰-۹ instead of 0-9), add the following to your CSS:

```css
body {
  font-feature-settings: "tnum" 1;
  font-variant-numeric: tabular-nums;
}
```

Or use a CSS counter that converts digits via JavaScript. Currently, digits in content are not auto-converted.
