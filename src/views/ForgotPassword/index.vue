<template>
  <div class="forgot-password-container">
    <div class="forgot-box">
      <h1>忘记密码</h1>
      <form @submit.prevent="handleResetPassword">
        <div class="form-group">
          <label>手机号</label>
          <input
            v-model="form.phone"
            type="tel"
            placeholder="请输入手机号"
            maxlength="11"
            required
          />
        </div>

        <div class="form-group">
          <label>验证码</label>
          <div class="code-wrapper">
            <input
              v-model="form.code"
              type="text"
              placeholder="请输入验证码"
              maxlength="6"
              required
            />
            <button
              type="button"
              class="code-btn"
              :disabled="countdown > 0"
              @click="getVerificationCode"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label>新密码</label>
          <input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码"
            minlength="6"
            required
          />
        </div>

        <div class="form-group">
          <label>确认密码</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            minlength="6"
            required
          />
        </div>

        <div class="button-group">
          <button type="button" class="back-btn" @click="backToLogin">
            返回登录
          </button>
          <button type="submit" class="submit-btn">
            确认修改
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { getVerifyCode, resetPassword } from '@/api/auth'
import type { ForgotPasswordForm } from '@/types'

const router = useRouter()

const form = ref<ForgotPasswordForm>({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

const countdown = ref<number>(0)
let timer: ReturnType<typeof setInterval> | undefined = undefined

// 获取验证码
const getVerificationCode = async () => {
  if (!form.value.phone) {
    alert('请输入手机号')
    return
  }
  
  if (!/^1[3-9]\d{9}$/.test(form.value.phone)) {
    alert('请输入正确的手机号')
    return
  }

  try {
    await getVerifyCode({ phone: form.value.phone })
    alert('验证码已发送，请查收')
    
    // 开始倒计时
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    alert('验证码发送失败，请重试')
  }
}

// 重置密码
const handleResetPassword = async () => {
  if (form.value.newPassword !== form.value.confirmPassword) {
    alert('两次输入的密码不一致')
    return
  }

  if (form.value.newPassword.length < 6) {
    alert('密码长度不能少于6位')
    return
  }

  try {
    await resetPassword({
      phone: form.value.phone,
      code: form.value.code,
      newPassword: form.value.newPassword
    })
    alert('密码修改成功，请重新登录')
    router.push('/login')
  } catch (error) {
    alert('密码修改失败，请检查验证码是否正确')
  }
}

// 返回登录
const backToLogin = () => {
  router.push('/login')
}

// 组件卸载时清理定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped lang="scss">
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.forgot-box {
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
  font-size: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
    color: #333;
    font-weight: 500;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 1rem;
    
    &:focus {
      outline: none;
      border-color: #667eea;
    }
  }
}

.code-wrapper {
  display: flex;
  gap: 0.5rem;

  input {
    flex: 1;
  }
}

.code-btn {
  padding: 0.75rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  min-width: 100px;
  
  &:hover:not(:disabled) {
    background: #5568d3;
  }
  
  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.back-btn,
.submit-btn {
  flex: 1;
  padding: 0.75rem;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.back-btn {
  background: #f0f0f0;
  color: #666;
  
  &:hover {
    background: #e0e0e0;
  }
}

.submit-btn {
  background: #667eea;
  color: white;
  
  &:hover {
    background: #5568d3;
  }
}
</style>

