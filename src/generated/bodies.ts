export const articleBodies: Record<string, () => Promise<{ default: string }>> = {
  "_adalt": () => import('./bodies/_adalt.md?raw'),
  "_example-article": () => import('./bodies/_example-article.md?raw'),
  "hadis-in-shia": () => import('./bodies/hadis-in-shia.md?raw'),
  "tohen-ba-ahle-beat": () => import('./bodies/tohen-ba-ahle-beat.md?raw'),
}
