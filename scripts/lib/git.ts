import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { projectRoot } from './blog.ts'
import type { CollectionId } from './collections.ts'

function pathsFor(slugs: string[], collection: CollectionId): string[] {
  return [`content/${collection}-dates.json`, ...[...new Set(slugs)].map((slug) => `content/${collection}/${slug}`)]
}

/** Quotes one argument for a Windows shell (Node does not: it only joins the arguments with spaces). */
const quoteForShell = (value: string): string => `"${value.replace(/"/g, '""')}"`

function git(args: string[], quiet = false): { status: number; stdout: string; stderr: string } {
  const options = { cwd: projectRoot, encoding: 'utf8' as const, stdio: quiet ? ('pipe' as const) : ('inherit' as const) }
  let result = spawnSync('git', args, options)
  // Normally `git` runs directly, so every argument (e.g. a commit message with spaces) arrives intact. Only if Windows
  // cannot start it that way (a `git.cmd` shim) a shell is needed, and then we must quote the arguments ourselves:
  // with `shell: true` Node simply joins them with spaces, which split `-m "publish: name"` into several arguments
  // ("pathspec 'name' did not match any file(s) known to git").
  if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT' && process.platform === 'win32') {
    result = spawnSync(['git', ...args.map(quoteForShell)].join(' '), { ...options, shell: true })
  }
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

/** Commit and push only blog content and its date registry; unrelated staged files are excluded. */
export function pushBlogChanges(commitMessage: string, slugs: string[], collection: CollectionId = 'blog'): boolean {
  return pushPaths(commitMessage, pathsFor(slugs, collection), collection === 'books' ? 'book' : 'blog')
}

/** Commit and push only the daily story folder and its state file. */
export function pushStoryChanges(commitMessage: string): boolean {
  return pushPaths(commitMessage, ['story', 'content/story-state.json'], 'story')
}

function pushPaths(commitMessage: string, requestedPaths: string[], what: string): boolean {
  const insideRepo = git(['rev-parse', '--is-inside-work-tree'], true)
  if (insideRepo.status !== 0 || insideRepo.stdout.trim() !== 'true') {
    console.error('✖ Git repository not found. Open this project from its cloned Git repository.')
    return false
  }

  const branch = git(['branch', '--show-current'], true)
  if (branch.status !== 0 || !branch.stdout.trim()) {
    console.error('✖ Could not determine the current Git branch.')
    return false
  }
  if (branch.stdout.trim() !== 'main') {
    console.error(`✖ Current branch is "${branch.stdout.trim()}"; switch to "main" before publishing.`)
    return false
  }

  const remote = git(['remote', 'get-url', 'origin'], true)
  if (remote.status !== 0) {
    console.error('✖ Git remote "origin" is not configured.')
    return false
  }
  const remoteUrl = remote.stdout.trim().replace(/\.git$/, '').replace(/\/$/, '').toLowerCase()
  if (!remoteUrl.endsWith('github.com/mohammadmahdiyan/weblogs') && !remoteUrl.endsWith('github.com:mohammadmahdiyan/weblogs')) {
    console.error(`✖ Git remote "origin" points to an unexpected repository: ${remote.stdout.trim()}`)
    console.error('  Expected https://github.com/mohammadmahdiyan/weblogs or git@github.com:mohammadmahdiyan/weblogs.git')
    return false
  }

  // `git add` fails on a path that neither exists nor was ever tracked (e.g. a story state file never written).
  const paths = requestedPaths.filter((target) => existsSync(path.join(projectRoot, target)) || git(['ls-files', '--', target], true).stdout.trim() !== '')
  if (paths.length === 0) {
    console.log(`ℹ No ${what} changes to commit.`)
    return true
  }
  if (git(['add', '-A', '--', ...paths]).status !== 0) return false
  const staged = git(['diff', '--cached', '--quiet', '--', ...paths], true)
  if (staged.status === 0) {
    console.log(`ℹ No ${what} changes to commit.`)
    return true
  }
  if (staged.status !== 1) return false

  if (git(['commit', '-m', commitMessage, '--', ...paths]).status !== 0) {
    console.error('✖ Git commit failed (see the git message above). If it mentions your identity, set it once: git config --global user.name "Your Name" and git config --global user.email "you@example.com".')
    return false
  }
  let pushed = git(['push', 'origin', 'main']).status === 0
  if (!pushed) {
    // GitHub's daily story cleanup also commits to main, so the remote may be ahead: update and try once more.
    console.log('ℹ Push was rejected; updating from GitHub and retrying once…')
    if (git(['pull', '--rebase', '--autostash', 'origin', 'main']).status === 0) pushed = git(['push', 'origin', 'main']).status === 0
  }
  if (!pushed) {
    console.error('✖ Commit created locally, but git push failed. Check your connection and GitHub authentication, then run git push origin main.')
    return false
  }

  console.log('✔ Changes pushed to GitHub. GitHub Actions will build and deploy the site.')
  return true
}
