export const articleBodies: Record<string, () => Promise<{ default: string }>> = {
  "_example-article": () => import('./bodies/_example-article.md?raw'),
  "aga-quran-dar-madh-ali-bod": () => import('./bodies/aga-quran-dar-madh-ali-bod.md?raw'),
  "chera-shia-fohsh-mida": () => import('./bodies/chera-shia-fohsh-mida.md?raw'),
  "eid-syasi-qadir": () => import('./bodies/eid-syasi-qadir.md?raw'),
  "hadis-in-shia": () => import('./bodies/hadis-in-shia.md?raw'),
  "kashti-najat": () => import('./bodies/kashti-najat.md?raw'),
  "shia-nabovat-pyambar-ra-batel-kard": () => import('./bodies/shia-nabovat-pyambar-ra-batel-kard.md?raw'),
  "shobahat-ravafez": () => import('./bodies/shobahat-ravafez.md?raw'),
  "tahref-quran-nazd-shia": () => import('./bodies/tahref-quran-nazd-shia.md?raw'),
  "tohen-ba-ahle-beat": () => import('./bodies/tohen-ba-ahle-beat.md?raw'),
}
