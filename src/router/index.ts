import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login-before',
    name: 'LoginBefore',
    component: () => import('@/views/LoginBefore/index.vue'),
    meta: { authPage: true },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login/index.vue'),
    meta: { authPage: true },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/ForgotPassword/index.vue'),
    meta: { authPage: true },
  },
  {
    path: '/home',
    name: 'Home',
    component: () => import('@/views/Home/index.vue'),
    meta: { requiresAuth: true },
    redirect: '/home/ai',
    children: [
      {
        path: 'ai',
        name: 'HomeAI',
        component: () => import('@/views/Home/modules/AiConsult.vue'),
        meta: { title: 'AI咨询' },
      },
      {
        path: 'contract',
        name: 'HomeContract',
        component: () => import('@/views/Home/modules/ContractReview.vue'),
        meta: { title: '合同审查' },
      },
      {
        path: 'kb',
        name: 'HomeKB',
        component: () => import('@/views/Home/modules/KnowledgeBase.vue'),
        meta: { title: '知识库' },
      },
    ],
  },

  {
    path: '/',
    redirect: '/home',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // 如果访问登录选择页或登录页且已登录，直接跳转到主页
  if ((to.path === '/login-before' || to.path === '/login') && authStore.isLoggedIn) {
    next('/home')
    return
  }

  // 如果需要认证的页面但未登录，跳转到登录选择页
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login-before')
    return
  }

  // 其他情况正常通过
  next()
})

export default router
