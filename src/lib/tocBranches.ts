import type { TocItem } from './toc.ts'

export type TocBranchType = 'single' | 'first' | 'middle' | 'last'

export interface TocBranches {
  types: TocBranchType[]
  ancestorTypes: TocBranchType[][]
}

export function buildTocBranches(items: TocItem[]): TocBranches {
  const types = Array<TocBranchType>(items.length).fill('single')
  const parentIndexes = Array<number>(items.length).fill(-1)
  const stack: number[] = []
  const siblingGroups = new Map<string, number[]>()

  items.forEach((item, index) => {
    while (stack.length > 0 && items[stack[stack.length - 1]]!.level >= item.level) stack.pop()
    const parentIndex = stack.at(-1) ?? -1
    parentIndexes[index] = parentIndex
    const key = `${parentIndex}:${item.level}`
    siblingGroups.set(key, [...(siblingGroups.get(key) ?? []), index])
    stack.push(index)
  })

  for (const siblings of siblingGroups.values()) {
    siblings.forEach((index, position) => {
      if (siblings.length === 1) return
      if (position === 0) types[index] = 'first'
      else if (position === siblings.length - 1) types[index] = 'last'
      else types[index] = 'middle'
    })
  }

  const ancestorTypes = items.map((_, index) => {
    const ancestors: TocBranchType[] = []
    let ancestorIndex = parentIndexes[index] ?? -1
    while (ancestorIndex >= 0) {
      ancestors.unshift(types[ancestorIndex] ?? 'single')
      ancestorIndex = parentIndexes[ancestorIndex] ?? -1
    }
    return ancestors
  })

  return { types, ancestorTypes }
}
