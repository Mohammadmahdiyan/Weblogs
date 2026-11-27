import { useId, type CSSProperties } from 'react'

/** The animation delay of one star / tree / sparkle (read by the CSS as `--d`). */
const delay = (seconds: number): CSSProperties => ({ '--d': `${seconds}s` }) as CSSProperties

/** A theme colour of the scene (the variables are defined in src/styles/theme.css, light and dark). */
const color = (name: string) => `var(--no-image-${name})`

/** Where the small stars of the night sky are: [x, y, radius, animation delay in seconds]. */
const STARS: readonly (readonly [number, number, number, number])[] = [
  [220, 63, 2, 0],
  [285, 108, 1.6, 1.1],
  [572, 57, 2.2, 0.5],
  [120, 48, 1.5, 1.8],
  [352, 38, 1.8, 0.8],
  [418, 150, 1.4, 2.2],
  [60, 150, 1.6, 1.4],
  [620, 118, 1.5, 0.3],
  [165, 92, 1.3, 2.6],
  [520, 24, 1.5, 1.7],
]

/** The twelve rays of the sun: [x1, y1, x2, y2], around (486, 104). */
const RAYS = Array.from({ length: 12 }, (_, index) => {
  const angle = (index * Math.PI) / 6
  const inner = index % 2 === 0 ? 58 : 60
  const outer = index % 2 === 0 ? 80 : 70
  return [
    486 + Math.sin(angle) * inner,
    104 - Math.cos(angle) * inner,
    486 + Math.sin(angle) * outer,
    104 - Math.cos(angle) * outer,
  ] as const
})

/**
 * The picture shown where an article has no image: a mountain landscape that follows the site's theme.
 * By day the sun's light swells and fades, its rays turn slowly, clouds drift and the trees sway; by night (the
 * dark theme) stars twinkle, the moon glows, clouds drift and a crow now and then flies across the sky.
 * Only CSS animations (src/index.css, `.no-image …`); with "reduce motion" switched on nothing moves.
 */
export function NoImage({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '')
  const id = (name: string) => `${uid}-${name}`

  return (
    <div role="img" aria-label="تصویر پیش‌فرض مقاله" className={`no-image aspect-video w-full overflow-hidden ${className}`}>
      <svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true" className="block size-full">
        <defs>
          <linearGradient id={id('sky')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: color('sky') }} />
            <stop offset="100%" style={{ stopColor: color('bg') }} />
          </linearGradient>
          <linearGradient id={id('sun')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: color('sun') }} />
            <stop offset="100%" style={{ stopColor: color('sun'), stopOpacity: 0.55 }} />
          </linearGradient>
          <linearGradient id={id('mountain')} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: color('mountain') }} />
            <stop offset="100%" style={{ stopColor: color('foreground') }} />
          </linearGradient>
          <linearGradient id={id('path')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" style={{ stopColor: color('snow'), stopOpacity: 0.78 }} />
            <stop offset="100%" style={{ stopColor: color('snow'), stopOpacity: 0.12 }} />
          </linearGradient>
          <clipPath id={id('frame')}>
            <rect width="640" height="360" />
          </clipPath>
        </defs>

        <g clipPath={`url(#${id('frame')})`}>
          <rect width="640" height="360" fill={`url(#${id('sky')})`} />

          {/* ── day: the sun */}
          <g className="no-image-day">
            <circle className="ni-glow" cx="486" cy="104" r="71" fill={`url(#${id('sun')})`} />
            <g className="ni-rays" stroke={color('sun')} strokeWidth="2.4" strokeLinecap="round">
              {RAYS.map(([x1, y1, x2, y2], index) => (
                <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
            </g>
            <circle cx="486" cy="104" r="48" fill={`url(#${id('sun')})`} opacity=".94" />
            <circle cx="486" cy="104" r="61" fill="none" stroke={color('sun')} strokeWidth="1.5" opacity=".38" />
          </g>

          {/* ── night: stars, the moon and a crow */}
          <g className="no-image-night">
            <g fill={color('star')}>
              {STARS.map(([x, y, r, starDelay]) => (
                <circle key={`${x}-${y}`} className="ni-star" cx={x} cy={y} r={r} style={delay(starDelay)} />
              ))}
              <path className="ni-star" style={delay(0.6)} d="M190 125l2.2 5.8 5.8 2.2-5.8 2.2-2.2 5.8-2.2-5.8-5.8-2.2 5.8-2.2z" />
              <path className="ni-star" style={delay(1.9)} d="M558 153l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" />
            </g>
            <circle className="ni-glow" cx="486" cy="104" r="68" fill={`url(#${id('sun')})`} />
            <circle cx="486" cy="104" r="44" fill={`url(#${id('sun')})`} opacity=".96" />
            <g fill={color('sky')} opacity=".2">
              <circle cx="472" cy="92" r="8" />
              <circle cx="500" cy="118" r="6" />
              <circle cx="494" cy="88" r="3.5" />
            </g>

            {/* The crow: one pass across the sky, with a wave in its flight and flapping wings. */}
            <g className="ni-crow-path">
              <g transform="translate(700 98)">
                <g className="ni-crow-bob">
                  <g fill="#06090d" stroke="rgba(175,193,210,.45)" strokeWidth=".6" strokeLinejoin="round">
                    <path d="M8 0 16 -2.6 15 2.4Z" />
                    <ellipse cx="0" cy="0" rx="9.5" ry="3.8" />
                    <circle cx="-10.5" cy="-1.6" r="3.1" />
                    <path d="M-13.2 -2.4 -19 -0.9 -13.2 0.2Z" />
                    <path className="ni-wing" d="M-2 -1C2 -11 10 -16 21 -16 15 -10 13 -5 12 1Z" />
                  </g>
                </g>
              </g>
            </g>
          </g>

          {/* ── clouds, by day and by night */}
          <g className="ni-cloud-a">
            <path d="M75 112c0-9 7-16 16-16 3-11 13-18 25-18 13 0 24 9 26 21 9 1 16 8 16 17H75z" fill={color('cloud')} opacity=".62" />
            <path d="M91 124h55" fill="none" stroke={color('cloud')} strokeWidth="2" strokeLinecap="round" opacity=".54" />
          </g>
          <g className="ni-cloud-b">
            <path d="M334 91c0-7 6-13 13-13 2-9 10-15 20-15 11 0 19 7 21 17 7 1 12 6 12 13h-66z" fill={color('cloud')} opacity=".45" />
            <path d="M351 102h35" fill="none" stroke={color('cloud')} strokeWidth="2" strokeLinecap="round" opacity=".54" />
          </g>

          {/* ── the land */}
          <path
            d="M0 221c48-23 84-20 126-8 43-28 85-24 127-5 47-32 99-26 141-5 44-27 90-26 132-7 45-18 77-11 114 4v160H0z"
            fill={color('hill-back')}
          />
          <path
            d="M0 251c50-25 91-25 139-8 41-15 72-15 111 2 47-23 95-18 137 2 48-23 85-20 128 0 47-20 85-16 125-2v115H0z"
            fill={color('hill-back')}
            opacity=".66"
          />
          <path d="M-31 305 105 165l54 61 104-117 132 159 56-62 111 92 94-56 38 29v129H-31z" fill={`url(#${id('mountain')})`} />
          <path d="m87 183 18-18 19 20-9-3-5 5-6-7-7 8-5-5z" fill={color('snow')} opacity=".78" />
          <path d="m237 137 26-28 26 28-10-3-6 7-10-9-10 9-6-7z" fill={color('snow')} />
          <path d="m263 109 132 159-30-13-31 2-29-24-24 7-28-41-22-12z" fill={color('foreground')} opacity=".16" />
          <path d="m435 222 16-16 18 17-8-3-5 5-5-6-7 6-4-5z" fill={color('snow')} opacity=".7" />
          <path d="m263 109 74 144-24-18-20-5-20-37-19-19-16-30z" fill={color('snow')} opacity=".08" />

          <path d="M-20 326c76-46 141-49 210-22 60-29 124-31 186-6 69-35 142-39 264 2v100H-20z" fill={color('foreground')} />
          <path d="M286 360c-6-28-6-46 10-67 12-17 27-27 45-39-5 18-13 31-25 44-13 16-14 35-5 62z" fill={`url(#${id('path')})`} opacity=".8" />
          <path d="M319 360c-3-24 1-39 14-56" fill="none" stroke={color('snow')} strokeWidth="2" opacity=".38" />

          {/* trees (they sway) */}
          <g fill={color('foreground')}>
            <g className="ni-tree" style={delay(0)}>
              <path d="m62 303 23-49 23 49z" />
              <path d="m72 322 28-59 28 59z" />
              <path d="m85 254 8 17h-16z" fill={color('snow')} opacity=".56" />
            </g>
            <g className="ni-tree" style={delay(1.4)}>
              <path d="m547 296 20-43 20 43z" />
              <path d="m537 319 29-61 29 61z" />
              <path d="m566 253 7 15h-14z" fill={color('snow')} opacity=".56" />
            </g>
          </g>

          {/* sparkles in the grass: flowers' glint by day, fireflies by night */}
          <g fill={color('sun')} opacity=".72">
            {(
              [
                [156, 320, 2],
                [178, 333, 1.5],
                [466, 319, 2],
                [492, 336, 1.5],
                [136, 345, 1.4],
                [515, 350, 1.4],
              ] as const
            ).map(([x, y, r], index) => (
              <circle key={index} className="ni-spark" cx={x} cy={y} r={r} style={delay(index * 0.45)} />
            ))}
          </g>
        </g>
      </svg>
    </div>
  )
}
