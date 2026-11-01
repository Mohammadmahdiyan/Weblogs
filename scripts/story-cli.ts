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

const command = process.argv[2]

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

/** `npm run publishStory`: the pictures + .md currently in /story become TODAY's story. */
async function publish(): Promise<void> {
  const folder = await readStoryFolder()
  if (!storyFolderHasContent(folder)) fail('The story folder is empty. Put one .md file per story (index.md, index1.md …) and/or pictures in /story first.')

  const previous = await readStoryState()
  await writeStoryState({ date: storyToday(), publishedAt: new Date().toISOString() })
  if (!runContentBuild()) {
    await writeStoryState(previous)
    fail('Content build failed; the story was not published and GitHub was not updated.')
  }
  console.log(`✔ Story published for ${storyToday()}: ${folder.markdown.length} story file(s), ${folder.images.length} picture file(s). It stays up until midnight (Asia/Tehran).`)
  if (!pushStoryChanges(`story: ${storyToday()}`)) process.exitCode = 1
}

/** `npm run cleanStory`: delete yesterday's story. Runs automatically every day on GitHub. */
async function clean(force: boolean): Promise<void> {
  const removed = await cleanExpiredStory(force)
  console.log(removed ? '✔ Story folder emptied.' : 'ℹ Nothing to clean (no expired story).')
  if (!force) return
  if (!runContentBuild()) fail('Content build failed after deleting the story.')
  if (!pushStoryChanges('story: deleted')) process.exitCode = 1
}

try {
  if (command === 'publish') await publish()
  else if (command === 'clean') await clean(false)
  else if (command === 'delete') await clean(true)
  else fail(`Unknown command "${command ?? ''}". Use: publish | clean | delete`)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
