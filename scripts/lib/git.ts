import { spawnSync } from 'node:child_process'
import { projectRoot } from './blog.ts'

function pathsFor(slugs: string[]): string[] {
  return ['content/blog-dates.json', ...[...new Set(slugs)].map((slug) => `content/blog/${slug}`)]
}

function git(args: string[], quiet = false): { status: number; stdout: string; stderr: string } {
  const result = spawnSync('git', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: quiet ? 'pipe' : 'inherit',
    shell: process.platform === 'win32',
  })
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

/** Commit and push only blog content and its date registry; unrelated staged files are excluded. */
export function pushBlogChanges(commitMessage: string, slugs: string[]): boolean {
  const paths = pathsFor(slugs)
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

  if (git(['add', '-A', '--', ...paths]).status !== 0) return false
  const staged = git(['diff', '--cached', '--quiet', '--', ...paths], true)
  if (staged.status === 0) {
    console.log('ℹ No blog changes to commit.')
    return true
  }
  if (staged.status !== 1) return false

  if (git(['commit', '-m', commitMessage, '--', ...paths]).status !== 0) {
    console.error('✖ Git commit failed. Check your Git user.name and user.email settings.')
    return false
  }
  if (git(['push', 'origin', 'main']).status !== 0) {
    console.error('✖ Commit created locally, but git push failed. Check your connection and GitHub authentication, then run git push origin main.')
    return false
  }

  console.log('✔ Changes pushed to GitHub. GitHub Actions will build and deploy the site.')
  return true
}
