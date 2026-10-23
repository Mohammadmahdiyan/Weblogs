import { useEffect, useMemo, useState } from 'react'
import { Hourglass, Send } from 'lucide-react'
import siteConfig from '../site.config'
import { FOLLOW_UP_MESSAGES, followUpUrl, pickIndex, telegramUsername } from '../lib/followUp'

const LAST_MESSAGE_KEY = 'followup-last'

function readLast(): number | null {
  try {
    const stored = sessionStorage.getItem(LAST_MESSAGE_KEY)
    const value = Number(stored)
    return stored === null || !Number.isInteger(value) ? null : value
  } catch {
    return null
  }
}

/**
 * Shown at the end of every article that has not been marked with `npm run publishBlog -- <folder>`.
 * One line of text and one link: the link opens the author's Telegram chat with a ready-made message about
 * this article; every click uses a different message out of FOLLOW_UP_MESSAGES (src/lib/followUp.ts).
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
    <section role="status" className="wip-notice not-prose mt-10">
      <span aria-hidden="true" className="wip-icon"><Hourglass className="size-6" /></span>
      <div className="wip-body">
        <p className="wip-title">
          متن مقاله هنوز کامل نشده
          <span aria-hidden="true" className="wip-dots"><i /><i /><i /></span>
        </p>
        {href && (
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={onFollowUpClick} className="wip-link">
            پیگیری از مدیر برای تکمیل این مقاله
            <Send aria-hidden="true" className="size-4 rtl:-scale-x-100" />
          </a>
        )}
      </div>
      <span aria-hidden="true" className="wip-bar" />
    </section>
  )
}
