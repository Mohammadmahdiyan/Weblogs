import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Send } from 'lucide-react'
import siteConfig from '../site.config'
import { FOLLOW_UP_MESSAGES, followUpUrl, pickIndex, telegramUsername } from '../lib/followUp'

const LAST_MESSAGE_KEY = 'followup-last'

function readLast(): number | null {
  try {
    const value = Number(sessionStorage.getItem(LAST_MESSAGE_KEY))
    return sessionStorage.getItem(LAST_MESSAGE_KEY) === null || !Number.isInteger(value) ? null : value
  } catch {
    return null
  }
}

/**
 * Shown at the end of an article that has not been completed with `npm run publishBlog`.
 * The link opens the author's Telegram chat with a ready-made message about this article; every click
 * uses a different message out of FOLLOW_UP_MESSAGES (src/lib/followUp.ts).
 */
export function IncompleteNotice({ title }: { title: string }) {
  const username = useMemo(() => telegramUsername(siteConfig.social), [])
  const [index, setIndex] = useState(() => pickIndex(FOLLOW_UP_MESSAGES.length, readLast()))
  const href = username ? followUpUrl(username, FOLLOW_UP_MESSAGES[index], title) : null

  useEffect(() => {
    try {
      sessionStorage.setItem(LAST_MESSAGE_KEY, String(index))
    } catch {
      // Storage can be blocked; the next message is then just random.
    }
  }, [index])

  function onFollowUpClick() {
    // The browser opens the link with the message already in it; the next click gets another one.
    window.setTimeout(() => setIndex((current) => pickIndex(FOLLOW_UP_MESSAGES.length, current)), 400)
  }

  return (
    <section role="status" aria-label="مقاله هنوز کامل نشده است" className="wip-notice not-prose mt-10">
      <div aria-hidden="true" className="wip-lines">
        <span style={{ width: '100%' }} />
        <span style={{ width: '88%' }} />
        <span style={{ width: '56%' }} />
      </div>

      <div className="wip-row">
        <p className="wip-title">متن مقاله هنوز کامل نشده</p>
        <span aria-hidden="true" className="wip-loader">
          <i style={{ '--d': '2.4s', '--c': 'var(--brand-bright)' } as CSSProperties} />
          <i style={{ '--d': '1.6s', '--c': 'var(--info)' } as CSSProperties} />
          <i style={{ '--d': '3.2s', '--c': 'var(--warn)' } as CSSProperties} />
        </span>
      </div>

      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" onClick={onFollowUpClick} className="wip-link">
          <Send aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          پیگیری از مدیر برای تکمیل این مقاله
        </a>
      )}
    </section>
  )
}
