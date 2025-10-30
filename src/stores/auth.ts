import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, UserType } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const userInfo = ref<UserInfo | null>(null)
  const userType = ref<UserType>((localStorage.getItem('userType') as UserType) || 'personal')
  const rememberMe = ref<boolean>(localStorage.getItem('rememberMe') === 'true')

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setRefreshToken(newRefreshToken: string) {
    refreshToken.value = newRefreshToken
    localStorage.setItem('refreshToken', newRefreshToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function setUserType(type: UserType) {
    userType.value = type
    localStorage.setItem('userType', type)
  }

  function setRememberMe(remember: boolean) {
    rememberMe.value = remember
    localStorage.setItem('rememberMe', String(remember))

    if (!remember) {
      // 如果不记住登录状态，清除相关信息
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('userType')
    }
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    userType.value = 'personal'
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userType')
    localStorage.removeItem('rememberMe')
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
