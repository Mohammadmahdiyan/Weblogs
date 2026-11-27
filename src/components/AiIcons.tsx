import { useId } from 'react'
import type { SummaryAiId } from '../lib/summaryAi'

/*
  Small drawn marks for the assistants in the «summarize with AI» picker. They are simple hand-made
  approximations, not the official logos. To use an official logo, replace the matching case below.
*/

function Burst() {
  // Claude: twelve rays around a centre.
  return (
    <g stroke="#D97757" strokeWidth="2.4" strokeLinecap="round">
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index * Math.PI) / 6
        const outer = index % 2 === 0 ? 10.5 : 8.5
        const x = Math.sin(angle)
        const y = -Math.cos(angle)
        return <line key={index} x1={12 + x * 3} y1={12 + y * 3} x2={12 + x * outer} y2={12 + y * outer} />
      })}
    </g>
  )
}

export function AiIcon({ id, className }: { id: SummaryAiId; className?: string }) {
  const gradient = useId()
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="none">
      {id === 'claude' && <Burst />}
      {id === 'chatgpt' && (
        <g stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
          {[0, 60, 120].map((angle) => (
            <rect key={angle} x="7.5" y="2.5" width="9" height="19" rx="4.5" transform={`rotate(${angle} 12 12)`} />
          ))}
        </g>
      )}
      {id === 'gemini' && (
        <>
          <defs>
            <linearGradient id={gradient} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
              <stop stopColor="#4285F4" />
              <stop offset="0.55" stopColor="#9B72CB" />
              <stop offset="1" stopColor="#D96570" />
            </linearGradient>
          </defs>
          <path
            fill={`url(#${gradient})`}
            d="M12 1.5C12 7.3 16.7 12 22.5 12 16.7 12 12 16.7 12 22.5 12 16.7 7.3 12 1.5 12 7.3 12 12 7.3 12 1.5Z"
          />
        </>
      )}
      {id === 'grok' && (
        <g stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
          <circle cx="12" cy="12" r="8.2" />
          <line x1="5.5" y1="19" x2="18.5" y2="5" />
        </g>
      )}
      {id === 'deepseek' && (
        <>
          <path
            fill="#4D6BFE"
            d="M2.5 13.2C2.5 8.6 6.4 5.5 11.2 5.5c2.7 0 4.8 1 6.3 2.5 1.6-.3 3.2.1 4 .9-.5 1.1-1.5 1.8-2.7 2-.7 3.6-3.9 5.9-8.2 5.9-3 0-5.5-1.3-6.8-3.4-.7-.3-1.3-.9-1.3-2.2Z"
          />
          <circle cx="8.2" cy="10.6" r="1" fill="#fff" />
        </>
      )}
      {id === 'arena' && (
        <>
          <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="currentColor" />
          <path d="M7.5 17 12 6.5 16.5 17M9.3 13.5h5.4" stroke="var(--surface, #fff)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}
