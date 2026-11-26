import { ensureVideoAudible } from './videoAudio'

/** Every video of an article body, in reading order: a video file, or an embed marked `data-video-embed`. */
export const VIDEO_SELECTOR = 'video, [data-video-embed]'

/** Sent to an embed's `<figure>`: `detail.seconds` is where it should start playing. */
export const VIDEO_SEEK_EVENT = 'article-video-seek'

/** Opens every closed accordion / spoiler (`<details>`) that holds `element`, so the element can be seen. */
export function openAncestors(element: Element): void {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (node instanceof HTMLDetailsElement) node.open = true
  }
}

/** Plays a video from `seconds`. A video file seeks itself; an embed (YouTube) is asked through an event. */
export function seekToVideo(target: Element, seconds: number): void {
  if (target instanceof HTMLVideoElement) {
    const start = () => {
      target.currentTime = seconds
      ensureVideoAudible(target)
      // Without a recent tap or click the browser may refuse to play; the video then waits at that moment.
      void target.play().catch(() => undefined)
    }
    if (target.readyState >= 1) start()
    else target.addEventListener('loadedmetadata', start, { once: true })
    return
  }
  target.dispatchEvent(new CustomEvent(VIDEO_SEEK_EVENT, { detail: { seconds } }))
}
