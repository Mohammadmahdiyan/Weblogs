import {
  cleanExpiredStories,
  readStoryFolder,
  readStoryStates,
  storyDirectories,
  storyToday,
  writeStoryStates,
} from './lib/story.ts'
import { runContentBuild } from './lib/blog.ts'
import { pushStoryChanges } from './lib/git.ts'
import { STORY_SCOPES, type StoryScope } from '../src/lib/story.ts'

const command = process.argv[2]
const requestedScope = process.argv[3]

function fail(message: string): never {
  console.error(`✖ ${message}`)
  process.exit(1)
}

function parseScope(value: string | undefined, defaultScope?: StoryScope): StoryScope {
  if (!value && defaultScope) return defaultScope
  if (value && STORY_SCOPES.includes(value as StoryScope)) return value as StoryScope
  fail(`Story scope must be "home", "media", or "books".`)
}

/** `npm run publishStory [-- media|books]`: publish one scope's folder for today. */
async function publish(scope: StoryScope): Promise<void> {
  const directory = storyDirectories[scope]
  const folder = await readStoryFolder(directory)
  if (!folder.markdown.length && !folder.images.length) {
    fail(
      `The ${scope} story folder is empty. Add Markdown/image files to ${scope === 'home' ? 'story' : `content/${scope}/story`} first.`,
    )
  }

  const previous = await readStoryStates()
  const next = { ...previous, [scope]: { date: storyToday(), publishedAt: new Date().toISOString() } }
  await writeStoryStates(next)
  if (!runContentBuild()) {
    await writeStoryStates(previous)
    fail('Content build failed; the story was not published and GitHub was not updated.')
  }
  console.log(`✔ ${scope} story published for ${storyToday()} (Asia/Tehran).`)
  if (!pushStoryChanges(`story (${scope}): ${storyToday()}`, scope)) process.exitCode = 1
}

/** `npm run cleanStory` removes expired scopes; `deleteStory -- <scope>` forces one scope. */
async function clean(forceScope?: StoryScope): Promise<void> {
  const removed = await cleanExpiredStories(forceScope ? [forceScope] : [])
  if (removed.length === 0) {
    console.log('ℹ Nothing to clean (no expired story).')
    return
  }
  console.log(`✔ Cleaned story scope(s): ${removed.join(', ')}.`)
  if (!forceScope) return
  if (!runContentBuild()) fail('Content build failed after deleting the story.')
  if (!pushStoryChanges(`story (${forceScope}): deleted`, forceScope)) process.exitCode = 1
}

try {
  if (command === 'publish') await publish(parseScope(requestedScope, 'home'))
  else if (command === 'clean') {
    if (requestedScope) fail('cleanStory takes no scope; it cleans every expired scope.')
    await clean()
  } else if (command === 'delete') {
    if (!requestedScope) fail('Usage: npm run deleteStory -- <home|media|books>')
    await clean(parseScope(requestedScope))
  } else fail(`Unknown command "${command ?? ''}". Use: publish | clean | delete`)
} catch (error) {
  fail(error instanceof Error ? error.message : String(error))
}
