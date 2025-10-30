<template>
  <div class="forgot-password-container">
    <el-card class="forgot-box" shadow="hover">
      <template #header>
        <div class="card-header">
          <h2 class="title">重置密码</h2>
        </div>
      </template>

      <el-form ref="forgotFormRef" :model="form" :rules="rules" label-position="top" size="large">
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            clearable
            :prefix-icon="PhoneIcon"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="form.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
            :prefix-icon="LockIcon"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            :prefix-icon="LockIcon"
          />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-wrapper">
            <el-input
              v-model="form.code"
              placeholder="请输入验证码"
              clearable
              :prefix-icon="MessageIcon"
              maxlength="6"
              style="flex: 1"
            />
            <el-button
              type="primary"
              :disabled="countdown > 0"
              :loading="sendingCode"
              style="margin-left: 10px; min-width: 120px"
              @click="getVerificationCode"
            >
              {{ countdown > 0 ? `${countdown}S` : hasSentCode ? '重新发送' : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item>
          <div class="button-group">
            <el-button size="large" @click="backToLogin"> 返回登录 </el-button>
            <el-button type="primary" size="large" :loading="loading" @click="handleResetPassword">
              确认修改
            </el-button>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <footer class="forgot-footer">
      <div class="container">
        <p>
          <a href="javascript:;">关于我们</a>
          <a href="javascript:;">帮助中心</a>
          <a href="javascript:;">商务合作</a>
          <a href="javascript:;">搜索推荐</a>
          <a href="javascript:;">友情链接</a>
        </p>
        <p>CopyRight &copy;AI劳动法</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted, markRaw } from 'vue'
import { useRouter } from 'vue-router'
import { getVerifyCode, resetPassword } from '@/api/auth'
import type { ForgotPasswordForm } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Phone, Lock, Message } from '@element-plus/icons-vue'

const router = useRouter()
const forgotFormRef = ref<FormInstance>()
const loading = ref(false)
const sendingCode = ref(false)
const countdown = ref<number>(0)
const hasSentCode = ref(false) // 是否已发送过验证码
let timer: ReturnType<typeof setInterval> | undefined = undefined

// 图标
const PhoneIcon = markRaw(Phone)
const LockIcon = markRaw(Lock)
const MessageIcon = markRaw(Message)

const form = reactive<ForgotPasswordForm>({
  phone: '',
  code: '',
  newPassword: '',
  confirmPassword: '',
})

// 自定义验证规则：确认密码
const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

// 表单验证规则
const rules = reactive<FormRules<ForgotPasswordForm>>({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号码',
      trigger: 'blur',
    },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
})

// 获取验证码
// 注意：验证码有效时间为2分钟（从发送验证码开始计算）
const getVerificationCode = async () => {
  if (!form.phone) {
    ElMessage.warning('请输入手机号')
    return
  }

  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.warning('请输入正确的手机号')
    return
  }

  sendingCode.value = true
  try {
    await getVerifyCode({ phone: form.phone })
    ElMessage.success('验证码已发送')
    hasSentCode.value = true

    // 开始60秒倒计时，倒计时结束后按钮文字变为"重新发送"
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    ElMessage.error('验证码发送失败，请重试')
  } finally {
    sendingCode.value = false
  }
}

// 重置密码
const handleResetPassword = async () => {
  if (!forgotFormRef.value) return

  // 检查必填项
  if (!form.phone || !form.code || !form.newPassword || !form.confirmPassword) {
    ElMessage.error('修改失败')
    return
  }

  // 检查手机号格式
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    ElMessage.error('修改失败')
    return
  }

  // 检查新密码是否填写
  if (!form.newPassword) {
    ElMessage.error('请输入新密码')
    return
  }

  try {
    const valid = await forgotFormRef.value.validate()
    if (!valid) {
      ElMessage.error('修改失败')
      return
    }

    loading.value = true
    try {
      await resetPassword({
        phone: form.phone,
        code: form.code,
        newPassword: form.newPassword,
      })
      // 修改成功，跳转到登录页并显示成功提示
      router.push('/login')
      // 延迟显示消息，确保页面已跳转
      setTimeout(() => {
        ElMessage.success('修改成功')
      }, 100)
    } catch (error: any) {
      // 根据错误信息判断是验证码错误还是其他错误
      const errorMsg = error?.response?.data?.message || ''
      if (errorMsg.includes('验证码') || errorMsg.includes('code')) {
        ElMessage.error('验证码错误，请重试')
      } else {
        ElMessage.error('修改失败')
      }
    } finally {
      loading.value = false
    }
  } catch (error) {
    ElMessage.error('修改失败')
  }
}

// 返回登录
const backToLogin = () => {
  router.push('/login-before')
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
  flex-direction: column;
  justify-content: center;
  min-height: calc(100vh - 60px);
  padding: 2rem 1rem;
  background: url('@/assets/images/login-bg.png') no-repeat center center;
  background-size: cover;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 30, 60, 0.3);
    z-index: 0;
  }
}

.forgot-box {
  width: 100%;
  max-width: 480px;
  margin: auto;
  position: relative;
  z-index: 1;

  :deep(.el-card__header) {
    padding: 1.5rem 2rem 1rem;
    border-bottom: 1px solid #f0f0f0;
  }

  :deep(.el-card__body) {
    padding: 2rem;
  }
}

.card-header {
  text-align: center;
}

.title {
  margin: 0;
  color: #333;
  font-size: 1.4rem;
  font-weight: 500;
}

.code-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.button-group {
  display: flex;
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;

  .el-button {
    flex: 1;
  }
}

.forgot-footer {
  margin-top: auto;
  padding: 30px 0 50px;
  background: transparent;
  position: relative;
  z-index: 1;

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  p {
    text-align: center;
    color: rgba(255, 255, 255, 0.9);
    padding-top: 20px;
    font-size: 0.9rem;

    a {
      line-height: 1;
      padding: 0 12px;
      color: rgba(255, 255, 255, 0.85);
      display: inline-block;
      text-decoration: none;
      transition: all 0.3s ease;

      ~ a {
        border-left: 1px solid rgba(255, 255, 255, 0.4);
      }

      &:hover {
        color: white;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
      }
    }
  }
}

// Element Plus 组件样式调整
:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #333;
}
</style>
