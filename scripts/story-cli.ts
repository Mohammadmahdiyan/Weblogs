import {
  cleanExpiredStory,
  readStoryFolder,
  readStoryState,
  storyFolderHasContent,
  storyToday,
  writeStoryState,
} from './lib/story.ts'
import { runContentBuild } from './lib/blog.ts'
import { pushStoryChanges } from './lib/git.ts'
import { projectRoot } from './lib/blog.ts'
import path from 'node:path'
import type { CollectionId } from './lib/collections.ts'

const command = process.argv[2]
const requestedCategory = process.argv[3]
const category =
  requestedCategory === 'books' || requestedCategory === 'media' ? (requestedCategory as CollectionId) : undefined
if (requestedCategory && !category) {
  console.error('✖ Story category must be "books" or "media".')
  process.exit(1)
}
const folderPath = category ? path.join(projectRoot, 'content', category, 'story') : undefined
const statePath = category ? path.join(projectRoot, 'content', `${category}-story-state.json`) : undefined

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

/** `npm run publishStory`: the pictures + .md currently in /story become TODAY's story. */
async function publish(): Promise<void> {
  const folder = await readStoryFolder(folderPath)
  if (!storyFolderHasContent(folder))
    fail(
      `The story folder is empty. Put Markdown/image files in ${category ? `content/${category}/story` : '/story'} first.`,
    )

  const previous = await readStoryState(statePath)
  await writeStoryState({ date: storyToday(), publishedAt: new Date().toISOString() }, statePath)
  if (!runContentBuild()) {
    await writeStoryState(previous, statePath)
    fail('Content build failed; the story was not published and GitHub was not updated.')
  }
  console.log(
    `✔ Story published for ${storyToday()}: ${folder.markdown.length} story file(s), ${folder.images.length} picture file(s). It stays up until midnight (Asia/Tehran).`,
  )
  if (!pushStoryChanges(`story${category ? ` (${category})` : ''}: ${storyToday()}`, category)) process.exitCode = 1
}

/** `npm run cleanStory`: delete yesterday's story. Runs automatically every day on GitHub. */
async function clean(force: boolean): Promise<void> {
  const removed = await cleanExpiredStory(force, statePath, folderPath)
  console.log(removed ? '✔ Story folder emptied.' : 'ℹ Nothing to clean (no expired story).')
  if (!force) return
  if (!runContentBuild()) fail('Content build failed after deleting the story.')
  if (!pushStoryChanges(`story${category ? ` (${category})` : ''}: deleted`, category)) process.exitCode = 1
}

try {
  if (command === 'publish') await publish()
  else if (command === 'clean') await clean(false)
  else if (command === 'delete') await clean(true)
  else fail(`Unknown command "${command ?? ''}". Use: publish | clean | delete`)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
