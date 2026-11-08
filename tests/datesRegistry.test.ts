import { describe, expect, it } from 'vitest'
import { syncDatesRegistry, type DatesRegistry } from '../scripts/lib/blog.ts'

describe('syncDatesRegistry', () => {
  it('migrates a unique legacy leaf record once and removes the old key', () => {
    const registry: DatesRegistry = {
      topic: { date: '2025-01-02', updated: '2025-02-03', completed: true, published: true },
      'section/topic': { name: 'Topic', route: '/media/section/topic' },
    }

    const migrated = syncDatesRegistry(registry, ['section', 'section/topic'], 'media')

    expect(migrated).not.toHaveProperty('topic')
    expect(migrated['section/topic']).toEqual({
      date: '2025-01-02',
      updated: '2025-02-03',
      completed: true,
      published: true,
      name: 'Topic',
      route: '/media/section/topic',
    })
    expect(syncDatesRegistry(migrated, ['section', 'section/topic'], 'media')).toEqual(migrated)
  })

  it('prunes entries whose folders no longer exist', () => {
    const registry: DatesRegistry = {
      current: { date: '2025-01-01', route: '/media/current' },
      removed: { date: '2024-01-01', route: '/media/removed' },
    }

    expect(syncDatesRegistry(registry, ['current'], 'media')).toEqual({
      current: { date: '2025-01-01', route: '/media/current' },
    })
  })

  it('does not share legacy dates between folders with the same leaf name', () => {
    const registry: DatesRegistry = {
      topic: { date: '2025-01-02', updated: '2025-02-03', completed: true, published: true },
      'left/topic': { name: 'Left Topic', route: '/media/left/topic' },
      'right/topic': { name: 'Right Topic', route: '/media/right/topic' },
    }

    const synced = syncDatesRegistry(registry, ['left', 'left/topic', 'right', 'right/topic'], 'media')

    expect(synced).not.toHaveProperty('topic')
    expect(synced['left/topic']).toEqual({ name: 'Left Topic', route: '/media/left/topic' })
    expect(synced['right/topic']).toEqual({ name: 'Right Topic', route: '/media/right/topic' })
  })
})
