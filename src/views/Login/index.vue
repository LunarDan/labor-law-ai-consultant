<template>
  <div class="login-container">
    <div class="login-box">
      <h1>劳动法AI顾问系统</h1>
      <form @submit.prevent="handleLogin">
        <!-- 用户类型选择 -->
        <div class="user-type-tabs">
          <div 
            class="tab-item" 
            :class="{ active: form.userType === 'personal' }"
            @click="form.userType = 'personal'"
          >
            个人用户
          </div>
          <div 
            class="tab-item" 
            :class="{ active: form.userType === 'enterprise' }"
            @click="form.userType = 'enterprise'"
          >
            企业账户
          </div>
        </div>

        <div class="form-group">
          手机号:<input
            v-model="form.username"
            type="text"
            placeholder="请输入手机号"
            required
          />
        </div>
        <div class="form-group">
          <div class="password-row">
            <label class="input-label">密码:</label>
            <div class="password-wrapper">
              <input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                required
              />
              <router-link to="/forgot-password" class="forgot-link">忘记密码？</router-link>
            </div>
          </div>
        </div>
       
        <button type="submit" class="login-btn">登录/注册</button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/api/auth'
import type { LoginForm } from '@/types'

const router = useRouter()
const authStore = useAuthStore()

const form = ref<LoginForm>({
  userType: 'personal', // 默认选中个人用户
  username: '',
  password: ''
})

const handleLogin = async () => {
  try {
    const res = await login(form.value)
    authStore.setToken(res.token)
    authStore.setUserInfo(res.userInfo)
    authStore.setUserType(form.value.userType) // 保存用户类型
    router.push('/')
  } catch (error) {
    alert('登录失败，请重试')
  }
}
</script>

<style scoped lang="scss">
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  min-width: 400px;
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.user-type-tabs {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 0.25rem;
  margin-bottom: 1.5rem;
}

.tab-item {
  flex: 1;
  padding: 0.75rem 1rem;
  text-align: center;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  color: #666;
  transition: all 0.3s ease;
  user-select: none;
  
  &.active {
    background: #667eea;
    color: white;
    font-weight: 500;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  }
}

.form-group {
  margin-bottom: 1rem;
}

.password-row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-label {
  font-size: 0.95rem;
  color: #333;
}

.password-wrapper {
  position: relative;
  
  input {
    width: 100%;
    padding: 0.75rem;
    padding-right: 5.5rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
  }
}

.forgot-link {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.85rem;
  color: #667eea;
  text-decoration: none;
  white-space: nowrap;
  
  &:hover {
    text-decoration: underline;
  }
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.login-btn {
  width: 100%;
  padding: 0.75rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background: #5568d3;
  }
}
</style>