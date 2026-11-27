/**
 * What passes through the sky of the «no image» picture (NoImage.tsx): each time one «event», chosen at random:
 * one, two or three clouds, one, two or three crows (a small flock), or a cloud with a crow. Everything crosses
 * the picture from one side to the other, very slowly, so that at first glance nothing seems to be moving.
 *
 * All the numbers that set how it looks are here, so it is easy to tune: slower = longer durations.
 */

export type SkyActorKind = 'cloud' | 'crow'

export interface SkyActor {
  kind: SkyActorKind
  /** Height in the 640×360 picture. */
  y: number
  scale: number
  /** Seconds the whole crossing takes. */
  duration: number
  /** Seconds before it starts; negative = it is already part of the way across when the picture appears. */
  delay: number
  /** +1: moves to the right, -1: to the left. */
  direction: 1 | -1
  /** Which of the two cloud shapes. */
  shape: 0 | 1
  opacity: number
  /** Where the crow is in its wing beat, seconds (so a flock does not flap in step). */
  flapOffset: number
}

export type Random = () => number

/** Crossing times (seconds): a cloud takes minutes, a crow about a minute and a half or more. */
export const CLOUD_SECONDS = [150, 240] as const
export const CROW_SECONDS = [90, 140] as const

/** What an event holds. The weight says how often it is picked. */
export const SKY_EVENTS: readonly { weight: number; clouds: number; crows: number }[] = [
  { weight: 3, clouds: 1, crows: 0 },
  { weight: 2, clouds: 2, crows: 0 },
  { weight: 1, clouds: 3, crows: 0 },
  { weight: 2, clouds: 0, crows: 1 },
  { weight: 2, clouds: 0, crows: 2 },
  { weight: 1, clouds: 0, crows: 3 },
  { weight: 1, clouds: 1, crows: 1 },
]

const between = (random: Random, [low, high]: readonly [number, number] | readonly number[]) => low + random() * (high - low)

function pickEvent(random: Random) {
  const total = SKY_EVENTS.reduce((sum, event) => sum + event.weight, 0)
  let point = random() * total
  for (const event of SKY_EVENTS) {
    point -= event.weight
    if (point < 0) return event
  }
  return SKY_EVENTS[0]
}

/**
 * One random event. With `underway` the actors start part of the way across, so the picture is not empty the
 * moment it appears (use it for the first event of a picture; the next ones start from the edge).
 */
export function createSkyEvent(random: Random = Math.random, underway = false): SkyActor[] {
  const event = pickEvent(random)
  const direction: 1 | -1 = random() < 0.5 ? 1 : -1
  const actors: SkyActor[] = []
  // How far along the first actor of this event already is (0 = at the edge).
  const progress = underway ? random() * 0.7 : 0

  for (let index = 0; index < event.clouds; index += 1) {
    const duration = between(random, CLOUD_SECONDS)
    // The clouds of one event follow each other, each in its own band of sky.
    const band = 22 + (index * 90) / Math.max(1, event.clouds)
    actors.push({
      kind: 'cloud',
      y: band + random() * (90 / Math.max(1, event.clouds) - 18),
      scale: 0.75 + random() * 0.55,
      duration,
      delay: -progress * duration + index * (duration * 0.16 + random() * duration * 0.1),
      direction,
      shape: random() < 0.5 ? 0 : 1,
      opacity: 0.45 + random() * 0.25,
      flapOffset: 0,
    })
  }

  if (event.crows > 0) {
    const duration = between(random, CROW_SECONDS)
    const baseY = 40 + random() * 60
    const scale = 0.62 + random() * 0.2
    for (let index = 0; index < event.crows; index += 1) {
      actors.push({
        kind: 'crow',
        y: baseY + index * (7 + random() * 6) * (index % 2 === 0 ? 1 : -1),
        scale: scale * (0.92 + random() * 0.16),
        duration: duration * (0.96 + random() * 0.08),
        // A flock keeps close: each crow a few seconds behind the one before.
        delay: -progress * duration + index * (2 + random() * 3),
        direction,
        shape: 0,
        opacity: 1,
        flapOffset: random() * 1.2,
      })
    }
  }
  return actors
}

/** Where an actor starts and ends, in picture units (a little beyond the edges, so it enters and leaves unseen). */
export function crossing(actor: Pick<SkyActor, 'kind' | 'direction'>): { from: number; to: number } {
  const margin = actor.kind === 'cloud' ? 170 : 80
  const left = -margin
  const right = 640 + margin
  return actor.direction === 1 ? { from: left, to: right } : { from: right, to: left }
}
