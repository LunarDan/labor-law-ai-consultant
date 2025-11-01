import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, UserType } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const refreshToken = ref<string>(localStorage.getItem('refreshToken') || '')
  const userInfo = ref<UserInfo | null>(null)
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

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function setUserType(type: UserType) {
    userType.value = type
    localStorage.setItem('userType', type)
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    userInfo.value = null
    userType.value = '1'
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userType')
  }

  return {
    token,
    refreshToken,
    userInfo,
    userType,
    isLoggedIn,
    setToken,
    setRefreshToken,
    setUserInfo,
    setUserType,
    logout,
  }
})
