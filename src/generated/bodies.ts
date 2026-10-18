export const articleBodies: Record<string, () => Promise<{ default: string }>> = {
  "_example-article": () => import('./bodies/_example-article.md?raw'),
  "aga-quran-dar-madh-ali-bod": () => import('./bodies/aga-quran-dar-madh-ali-bod.md?raw'),
  "hadis-in-shia": () => import('./bodies/hadis-in-shia.md?raw'),
  "shobahat-ravafez": () => import('./bodies/shobahat-ravafez.md?raw'),
  "tahref-quran-nazd-shia": () => import('./bodies/tahref-quran-nazd-shia.md?raw'),
  "tohen-ba-ahle-beat": () => import('./bodies/tohen-ba-ahle-beat.md?raw'),
}
