# Emoji

`emojis.ts` maps an emoji to an svg file in this folder:

```ts
'😂': 'funnyface.svg',
```

In Markdown, writing 😂 (or `{😂}`) then shows `funnyface.svg` inline (about 1.4em tall, aligned with the text). Several emoji may share one svg (😂 and 🤣 both use `funnyface.svg`).

Add one: drop `name.svg` here (square `viewBox` works best) and add `'😍': 'name.svg',` to `emojis.ts`.
Only registered emoji are replaced; any other emoji or `{text}` is left alone. Emoji are removed from search text and the table of contents.
