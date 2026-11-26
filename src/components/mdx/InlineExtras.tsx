import type { ReactNode } from 'react'

/** Small raised/lowered text: `((متن))(سایز: کوچک، قرارگیری: وسط)`. See src/lib/inline.ts. */
export function Mini({ miniSize = 'medium', miniPlacement = 'top', children }: {
  miniSize?: string
  miniPlacement?: string
  children?: ReactNode
}) {
  return <span className="md-mini" data-size={miniSize} data-placement={miniPlacement}>{children}</span>
}

// Every svg in src/emojis/ → its built URL. Names come from src/emojis/emojis.ts.
const emojiUrls = import.meta.glob('../../emojis/*.svg', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

/** Inline sticker: an emoji (😂 or {😂}) → the svg registered for it. */
export function Emoji({
  emojiName = '',
  emojiFile = '',
  emojiLiteral,
}: {
  emojiName?: string
  emojiFile?: string
  emojiLiteral?: string
}) {
  const url = emojiUrls[`../../emojis/${emojiFile}`]
  if (!url) return <>{emojiLiteral ?? `{${emojiName}}`}</>
  return <img src={url} alt={emojiName} title={emojiName} draggable={false} className="md-emoji" />
}
