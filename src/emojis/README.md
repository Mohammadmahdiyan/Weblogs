# Emoji

`emojis.ts` maps the name written in an article to an svg file in this folder:

```ts
'خخخ': 'funnyface.svg',
```

In Markdown, `{خخخ}` then shows `funnyface.svg` inline (about 1.4em tall, aligned with the text).

Add one: drop `name.svg` here (square `viewBox` works best) and add `'name': 'name.svg',` to `emojis.ts`.
Only registered names are replaced; other `{text}` is left alone. Emoji are removed from search text and the table of contents.
