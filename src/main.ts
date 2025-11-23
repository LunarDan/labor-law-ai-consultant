import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index'
import pinia from './stores/index'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ElMessage } from 'element-plus'
import './assets/css/main.scss'

const app = createApp(App)

// 全局错误处理
app.config.errorHandler = (err, _instance, info) => {
  console.error('全局错误捕获:', err, info)
  ElMessage.error({
    message: '应用发生错误，请刷新页面重试',
    duration: 3000,
  })
}

// 全局警告处理（开发环境）
if (import.meta.env.MODE === 'development') {
  app.config.warnHandler = (msg, _instance, trace) => {
    console.warn('Vue警告:', msg, trace)
  }
}

// 处理未捕获的 Promise 错误
window.addEventListener('unhandledrejection', (event) => {
  console.error('未处理的Promise错误:', event.reason)
  event.preventDefault()
})

app.use(pinia)
app.use(router)
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
