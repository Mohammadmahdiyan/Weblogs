import { useEffect, useRef, useState } from 'react'
import { AudioLines, Pause, Play, Volume2 } from 'lucide-react'
import { clsx } from 'clsx'

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

export function AudioPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const updatePlayback = () => setPlaying(!audio.paused)
    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('play', updatePlayback)
    audio.addEventListener('pause', updatePlayback)
    audio.addEventListener('ended', updatePlayback)
    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('play', updatePlayback)
      audio.removeEventListener('pause', updatePlayback)
      audio.removeEventListener('ended', updatePlayback)
    }
  }, [src])

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) await audio.play().catch(() => undefined)
    else audio.pause()
  }

  function changeVolume(nextVolume: number) {
    const audio = audioRef.current
    if (audio) audio.volume = nextVolume
    setVolume(nextVolume)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <section aria-label={`پخش صوت: ${title}`} className="not-prose my-5 flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-[var(--surface-alt)] p-3 text-[var(--text)] sm:gap-4 sm:p-4">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <div aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--brand)_12%,transparent)] text-[var(--brand)] sm:size-12">
        <AudioLines className="size-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-start text-sm font-semibold">{title}</p>
        <div className="mt-2 flex items-center gap-2" dir="ltr">
          <span className="min-w-9 text-xs tabular-nums text-[var(--text-muted)]">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            aria-label="موقعیت پخش"
            style={{ background: `linear-gradient(to right, var(--brand) ${progress}%, var(--border-strong) ${progress}%)` }}
            onChange={(event) => {
              if (audioRef.current) audioRef.current.currentTime = Number(event.currentTarget.value)
            }}
            className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full accent-[var(--brand)] focus-visible:outline-2 focus-visible:outline-[var(--info)]"
          />
          <span className="min-w-9 text-end text-xs tabular-nums text-[var(--text-muted)]">{formatTime(duration)}</span>
        </div>
      </div>
      <label className="flex shrink-0 items-center gap-1 sm:gap-2" dir="ltr">
        <Volume2 aria-hidden="true" className="size-4 text-[var(--text-muted)]" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(event) => changeVolume(Number(event.currentTarget.value))}
          aria-label="بلندی صدا"
          className="w-12 cursor-pointer accent-[var(--brand)] focus-visible:outline-2 focus-visible:outline-[var(--info)] sm:w-16"
        />
      </label>
      <button
        type="button"
        onClick={() => void togglePlayback()}
        aria-label={playing ? 'توقف موقت' : 'پخش صوت'}
        className={clsx('inline-flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--brand)] text-[var(--brand-foreground)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--info)]')}
      >
        {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
      </button>
    </section>
  )
}