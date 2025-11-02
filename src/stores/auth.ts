import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, UserType } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 记住我的登录状态（需要先读取，用于后续判断）
  const rememberMe = ref<boolean>(localStorage.getItem('rememberMe') === 'true')

  // 使用 sessionStorage 标记当前会话是否已初始化
  // 如果没有这个标记，说明是重新打开浏览器（新会话）
  const sessionInitialized = sessionStorage.getItem('sessionInitialized')

  // 只在重新打开浏览器时才检查"记住我"状态
  if (!sessionInitialized) {
    // 如果没有勾选"记住我"，清除所有登录数据
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

  // 从 localStorage 恢复 userInfo（安全解析）
  const storedUserInfo = localStorage.getItem('userInfo')
  let parsedUserInfo: UserInfo | null = null
  if (storedUserInfo && storedUserInfo !== 'undefined' && storedUserInfo !== 'null') {
    try {
      parsedUserInfo = JSON.parse(storedUserInfo)
    } catch (e) {
      console.error('解析 userInfo 失败:', e)
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
