import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, UserType } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 记住我的登录状态
  const rememberMe = ref<boolean>(localStorage.getItem('rememberMe') === 'true')

  // 标记当前会话是否已初始化
  const sessionInitialized = sessionStorage.getItem('sessionInitialized')

  if (!sessionInitialized) {
    if (!rememberMe.value && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('userType')
    }
    // 标记当前会话已初始化
    sessionStorage.setItem('sessionInitialized', 'true')
  }

  const token = ref<string>(localStorage.getItem('token') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')

  // 从 localStorage 恢复 userInfo
  const storedUserInfo = localStorage.getItem('userInfo')
  let parsedUserInfo: UserInfo | null = null
  if (storedUserInfo && storedUserInfo !== 'undefined' && storedUserInfo !== 'null') {
    try {
      parsedUserInfo = JSON.parse(storedUserInfo)
    } catch (e) {
      localStorage.removeItem('userInfo')
    }
  }
  const userInfo = ref<UserInfo | null>(parsedUserInfo)

  const userType = ref<UserType>((localStorage.getItem('userType') as UserType) || '1')

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setRefreshToken(newRefreshToken: string) {
    refreshToken.value = newRefreshToken
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  function setUserInfo(info: UserInfo | null) {
    userInfo.value = info
    // 保存到 localStorage（只保存有效数据）
    if (info) {
      localStorage.setItem('userInfo', JSON.stringify(info))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  function setUserType(type: UserType) {
    userType.value = type
    localStorage.setItem('userType', type)
  }

  function setRememberMe(remember: boolean) {
    rememberMe.value = remember
    localStorage.setItem('rememberMe', remember.toString())
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    userType.value = '1'
    rememberMe.value = false // 清除记住我状态
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userType')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('rememberMe') // 清除记住我状态
  }

  return {
    token,
    refreshToken,
    userInfo,
    userType,
    rememberMe,
    isLoggedIn,
    setToken,
    setRefreshToken,
    setUserInfo,
    setUserType,
    setRememberMe,
    logout,
  }
})
