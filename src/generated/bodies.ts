export const articleBodies: Record<string, () => Promise<{ default: string }>> = {
  "_adalt": () => import('./bodies/_adalt.md?raw'),
  "_example-article": () => import('./bodies/_example-article.md?raw'),
}
