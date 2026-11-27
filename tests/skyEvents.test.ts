import { describe, expect, it } from 'vitest'
import { CLOUD_SECONDS, CROW_SECONDS, SKY_EVENTS, createSkyEvent, crossing } from '../src/lib/skyEvents.ts'

/** A repeatable «random» sequence. */
function sequence(seed: number) {
  let value = seed
  return () => {
    value = (value * 16807) % 2147483647
    return value / 2147483647
  }
}

describe('createSkyEvent', () => {
  it('always holds one of the listed events', () => {
    const allowed = new Set(SKY_EVENTS.map((event) => `${event.clouds}/${event.crows}`))
    for (let seed = 1; seed <= 200; seed += 1) {
      const actors = createSkyEvent(sequence(seed))
      const clouds = actors.filter((actor) => actor.kind === 'cloud').length
      expect(allowed.has(`${clouds}/${actors.length - clouds}`)).toBe(true)
    }
  })

  it('varies: over many events it makes clouds only, crows only, and a mix', () => {
    const kinds = new Set<string>()
    const counts = new Set<number>()
    for (let seed = 1; seed <= 300; seed += 1) {
      const actors = createSkyEvent(sequence(seed))
      kinds.add([...new Set(actors.map((actor) => actor.kind))].sort().join('+'))
      counts.add(actors.length)
    }
    expect([...kinds].sort()).toEqual(['cloud', 'cloud+crow', 'crow'])
    expect([...counts].sort()).toEqual([1, 2, 3])
  })

  it('is slow: clouds take minutes, crows over a minute', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      for (const actor of createSkyEvent(sequence(seed))) {
        const [low, high] = actor.kind === 'cloud' ? CLOUD_SECONDS : CROW_SECONDS
        expect(actor.duration).toBeGreaterThanOrEqual(low * 0.9)
        expect(actor.duration).toBeLessThanOrEqual(high * 1.1)
      }
    }
  })

  it('lets everything of one event move the same way and stay inside the sky', () => {
    for (let seed = 1; seed <= 100; seed += 1) {
      const actors = createSkyEvent(sequence(seed))
      expect(new Set(actors.map((actor) => actor.direction)).size).toBe(1)
      for (const actor of actors) {
        expect(actor.y).toBeGreaterThan(5)
        expect(actor.y).toBeLessThan(150)
      }
    }
  })

  it('starts part of the way across only when asked', () => {
    expect(createSkyEvent(sequence(7), true).some((actor) => actor.delay < 0)).toBe(true)
    expect(createSkyEvent(sequence(7), false).every((actor) => actor.delay >= 0)).toBe(true)
  })
})

describe('crossing', () => {
  it('runs from one side beyond the picture to the other', () => {
    expect(crossing({ kind: 'cloud', direction: 1 })).toEqual({ from: -170, to: 810 })
    expect(crossing({ kind: 'crow', direction: -1 })).toEqual({ from: 720, to: -80 })
  })
})
