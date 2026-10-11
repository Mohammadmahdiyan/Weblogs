export const articleBodies: Record<string, () => Promise<{ default: string }>> = {
  "example-article": () => import('./bodies/example-article.md?raw'),
}
