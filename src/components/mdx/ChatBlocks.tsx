import type { CSSProperties, ReactNode } from 'react'
import { clsx } from 'clsx'
import { ProfileAvatar } from '../ProfileAvatar'

/** A run of question/answer bubbles inside an accordion item. See src/lib/chat.ts for the Markdown syntax. */
export function ChatThread({ children }: { children?: ReactNode }) {
  return <div role="group" aria-label="پرسش و پاسخ" className="md-chat">{children}</div>
}

export function ChatMessage({ chatRole = 'answer', chatLabel = '', chatIndex = '0', children }: {
  chatRole?: string
  chatLabel?: string
  chatIndex?: string
  children?: ReactNode
}) {
  const question = chatRole === 'question'
  return (
    <div className={clsx('md-chat-row', question ? 'md-chat-question' : 'md-chat-answer')} style={{ '--i': Number(chatIndex) || 0 } as CSSProperties}>
      <span aria-hidden="true" className="md-chat-avatar">
        {/* The answerer is you: your profile picture (site.config.ts → profile.avatar). */}
        {question ? 'س' : <ProfileAvatar fallback="ج" />}
      </span>
      <div className="md-chat-bubble">
        {chatLabel && <span className="md-chat-label">{chatLabel}</span>}
        <div className="md-chat-text">{children}</div>
      </div>
    </div>
  )
}
