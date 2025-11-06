import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        // 真实后端地址
        target: 'http://8.134.200.160:611',

        // Mock 地址（备用）
        // target: 'http://127.0.0.1:4523/m1/7335686-7065687-default',

        changeOrigin: true,
      },
    },
  },
})
