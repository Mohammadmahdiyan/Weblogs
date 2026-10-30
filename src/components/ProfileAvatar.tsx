import { useState } from 'react'
import { clsx } from 'clsx'
import siteConfig from '../site.config'
import { assetUrl } from '../lib/assetUrl'

/** Your profile picture (site.config.ts → profile.avatar), or `fallback` text when there is none / it fails to load. */
export function ProfileAvatar({ fallback, className }: { fallback: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  const src = assetUrl(siteConfig.profile.avatar)
  if (!src || failed) return <span className={className}>{fallback}</span>
  return <img src={src} alt="" draggable={false} onError={() => setFailed(true)} className={clsx('size-full rounded-full object-cover', className)} />
}
