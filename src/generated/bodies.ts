export const articleBodies: Record<string, () => Promise<{ default: string }>> = {
  "married-prophet-with-ayesha": () => import('./bodies/married-prophet-with-ayesha.md?raw'),
}
