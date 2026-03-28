import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'

function devProxyTarget(viteApiBase: string | undefined): string {
  const raw = (viteApiBase ?? '').trim()
  if (raw && raw !== 'mock') {
    try {
      const withScheme = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`
      return new URL(withScheme).origin
    } catch {
      /* fall through */
    }
  }
  return 'http://142.93.42.3/'
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = devProxyTarget(env.VITE_API_BASE_URL)

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/v1': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
