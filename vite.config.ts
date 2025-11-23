import { defineConfig, loadEnv, type UserConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }): UserConfig => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    // 开发服务器配置
    server: {
      port: 5173,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://8.134.200.160:611',
          changeOrigin: true,
          secure: false,
          // 开发环境日志
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('proxy error', err)
            })
            proxy.on('proxyReq', (_proxyReq, req, _res) => {
              console.log('Sending Request:', req.method, req.url)
            })
            proxy.on('proxyRes', (proxyRes, req, _res) => {
              console.log('Received Response:', proxyRes.statusCode, req.url)
            })
          },
        },
      },
    },
    // 生产环境构建优化
    build: {
      // 输出目录
      outDir: 'dist',
      // 生成源码映射（生产环境建议关闭）
      sourcemap: false,
      // chunk 大小警告限制（kb）
      chunkSizeWarningLimit: 1000,
      // rollup 打包配置
      rollupOptions: {
        output: {
          // 静态资源分类打包
          chunkFileNames: 'js/[name]-[hash].js',
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: '[ext]/[name]-[hash].[ext]',
          // 代码分割
          manualChunks(id) {
            // 将 node_modules 中的代码单独打包
            if (id.includes('node_modules')) {
              // 单独打包大型依赖
              if (id.includes('element-plus')) {
                return 'element-plus'
              }
              if (id.includes('axios')) {
                return 'axios'
              }
              // 其他 node_modules 代码打包到 vendor
              return 'vendor'
            }
          },
        },
      },
      // 压缩配置
      minify: 'esbuild',
      target: 'es2015',
    },
    // 定义全局常量
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
  }
})
