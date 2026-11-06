import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface FolderCardConfig {
  slug: string
  title: string
  caption: string
  image: string
}

export interface FolderPageConfig {
  title: string
  subtitle: string
  searchLabel: string
  listHeading: string
  emptyMessage: string
  folders: FolderCardConfig[]
}

export interface FolderPageSource {
  collection: string
  articleSlugs: string[]
}

const defaultSearchLabel = 'عنوان را جست‌وجو کنید؛ برای متن: محتوا::عبارت'

export function folderPageConfigs(sources: FolderPageSource[]): Map<string, FolderPageConfig> {
  const pages = new Map<string, FolderPageConfig>()

  for (const { collection, articleSlugs } of sources) {
    const branches = new Map<string, Set<string>>()
    for (const slug of articleSlugs) {
      const segments = slug.split('/')
      for (let index = 0; index < segments.length - 1; index += 1) {
        const parent = segments.slice(0, index).join('/')
        const children = branches.get(parent) ?? new Set<string>()
        children.add(segments[index])
        branches.set(parent, children)
      }
    }

    for (const [prefix, folders] of branches) {
      const key = `${collection}/${prefix || '_root'}`
      pages.set(key, {
        title: '',
        subtitle: '',
        searchLabel: defaultSearchLabel,
        listHeading: '',
        emptyMessage: '',
        folders: [...folders].sort().map((slug) => ({ slug, title: '', caption: '', image: '' })),
      })
    }
  }

  return pages
}

function mergeFolderPageConfig(existing: FolderPageConfig | null, generated: FolderPageConfig): FolderPageConfig {
  if (!existing) return generated
  const existingFolders = new Map(existing.folders.map((folder) => [folder.slug, folder]))
  return {
    title: existing.title ?? generated.title,
    subtitle: existing.subtitle ?? generated.subtitle,
    searchLabel: existing.searchLabel ?? generated.searchLabel,
    listHeading: existing.listHeading ?? generated.listHeading,
    emptyMessage: existing.emptyMessage ?? generated.emptyMessage,
    folders: generated.folders.map((folder) => ({
      ...folder,
      ...existingFolders.get(folder.slug),
    })),
  }
}

async function readFolderPage(filePath: string): Promise<FolderPageConfig | null> {
  try {
    const content = await readFile(filePath, 'utf8')
    const parsed: unknown = JSON.parse(content)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`Expected a JSON object in ${filePath}`)
    }
    const value = parsed as Partial<FolderPageConfig>
    return {
      title: typeof value.title === 'string' ? value.title : '',
      subtitle: typeof value.subtitle === 'string' ? value.subtitle : '',
      searchLabel: typeof value.searchLabel === 'string' ? value.searchLabel : defaultSearchLabel,
      listHeading: typeof value.listHeading === 'string' ? value.listHeading : '',
      emptyMessage: typeof value.emptyMessage === 'string' ? value.emptyMessage : '',
      folders: Array.isArray(value.folders)
        ? value.folders.filter(
            (folder): folder is FolderCardConfig =>
              Boolean(folder) &&
              typeof folder.slug === 'string' &&
              typeof folder.title === 'string' &&
              typeof folder.caption === 'string' &&
              typeof folder.image === 'string',
          )
        : [],
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function syncFolderPageConfigs(contentRoot: string, sources: FolderPageSource[]): Promise<void> {
  for (const [key, generated] of folderPageConfigs(sources)) {
    const [collection, ...prefix] = key.split('/')
    const fileName = `${prefix.join('/')}.json`
    const filePath = path.join(contentRoot, 'folder-pages', collection, fileName)
    const existing = await readFolderPage(filePath)
    const merged = mergeFolderPageConfig(existing, generated)
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, `${JSON.stringify(merged, null, 2)}\n`, 'utf8')
  }
}
