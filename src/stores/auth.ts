import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, UserType } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const userType = ref<UserType>(localStorage.getItem('userType') as UserType || 'personal')

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
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
    userInfo.value = null
    userType.value = 'personal'
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
  }

  return {
    token,
    userInfo,
    userType,
    isLoggedIn,
    setToken,
    setUserInfo,
    setUserType,
    logout
  }
})

