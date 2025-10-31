<template>
  <header class="header">
    <div class="header-content">
      <div class="left">
        <img src="@/assets/images/logo.png" alt="logo" class="logo-icon" />
        <div class="logo-content">
          <h1 class="logo-text">劳动法AI顾问系统</h1>
          <p class="logo-subtitle">专业的劳动法律咨询助手</p>
        </div>
      </div>

      <!-- 业务页面：展示用户登录信息 -->
      <div v-if="!isAuthPage && authStore.isLoggedIn" class="user-info">
        <div class="avatar">{{ avatarLetter }}</div>
        <div class="user">
          <div class="username">{{ displayName }}</div>
          <div v-if="authStore.userType" class="type">{{ userTypeLabel }}</div>
        </div>
        <button class="logout-btn" @click="handleLogout">退出登录</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 当前是否为认证类页面（登录/忘记密码）
const isAuthPage = computed(() => route.meta.authPage === true)

// 展示名称：优先手机号，其次用户名
const displayName = computed(() => {
  return authStore.userInfo?.phone || authStore.userInfo?.username || '用户'
})

// 头像首字母
const avatarLetter = computed(() => {
  const name = displayName.value
  return name?.toString().charAt(0).toUpperCase() || 'U'
})

// 用户类型标签
const userTypeLabel = computed(() => {
  if (authStore.userType === 'enterprise') return '企业账号'
  return '个人用户'
})

const handleLogout = () => {
  authStore.logout()
  router.push('/login-before')
}
</script>

<style scoped lang="scss">
.header {
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 0.75rem 2rem;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: contain;
}

.logo-content {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.logo-text {
  font-size: 1.2rem;
  color: #1e3a5f;
  margin: 0;
  font-weight: 600;
  line-height: 1.2;
}

.logo-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
  line-height: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 600;
  font-size: 0.95rem;
}

.user {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.username {
  color: #111827;
  font-size: 0.95rem;
  font-weight: 500;
}

.type {
  color: #6b7280;
  font-size: 0.8rem;
}

.logout-btn {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  color: #374151;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: #e5e7eb;
    border-color: #d1d5db;
  }
}
</style>
