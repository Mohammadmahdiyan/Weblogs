/** Videos must always play with sound: clear every kind of "muted" state (attribute, property, zero volume). */
export function ensureVideoAudible(video: HTMLVideoElement | null): void {
  if (!video) return
  video.defaultMuted = false
  video.muted = false
  video.removeAttribute('muted')
  if (video.volume === 0) video.volume = 1
}

/** The native control bar sits along the bottom edge: clicks there are for play / volume / seek, not "enlarge". */
const VIDEO_CONTROLS_HEIGHT_PX = 56

export function isVideoControlsClick(video: HTMLVideoElement, clientY: number): boolean {
  return video.getBoundingClientRect().bottom - clientY <= VIDEO_CONTROLS_HEIGHT_PX
}
