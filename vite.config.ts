import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const projectRoot = path.dirname(fileURLToPath(import.meta.url))

function runContentBuild(production: boolean): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = ['--import', 'tsx', 'scripts/build-content.ts']
    if (production) args.push('--production')

    const child = spawn(process.execPath, args, {
      cwd: projectRoot,
      stdio: 'inherit',
    })

    child.once('error', reject)
    child.once('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Content builder exited with code ${code ?? 'unknown'}`))
    })
  })
}

function contentBuilder(): Plugin {
  let isProductionBuild = false

  return {
    name: 'blog-content-builder',
    configResolved(config) {
      isProductionBuild = config.command === 'build'
    },
    async buildStart() {
      await runContentBuild(isProductionBuild)
    },
    configureServer(server) {
      const contentRoot = path.resolve(projectRoot, 'content')
      const contentPrefix = `${contentRoot}${path.sep}`
      let timer: ReturnType<typeof setTimeout> | undefined
      let running = false
      let pending = false

      server.watcher.add(contentRoot)
      server.watcher.on('all', (event, file) => {
        if (!['add', 'change', 'unlink', 'addDir', 'unlinkDir'].includes(event)) return
        const absolutePath = path.resolve(file)
        if (!absolutePath.startsWith(contentPrefix)) return

        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
          void rebuildContent()
        }, 120)
      })

      async function rebuildContent() {
        if (running) {
          pending = true
          return
        }

        running = true
        do {
          pending = false
          try {
            await runContentBuild(false)
            server.ws.send({ type: 'full-reload' })
          } catch (error) {
            server.config.logger.error(
              error instanceof Error ? error.message : String(error),
            )
          }
        } while (pending)
        running = false
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: '/Weblogs/',
  plugins: [tailwindcss(), contentBuilder(), react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
