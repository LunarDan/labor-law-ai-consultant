<template>
  <div class="login-container">
    <el-card class="login-box" shadow="hover">
      <!-- 用户类型选择 -->
      <div class="user-type-tabs">
        <div
          class="tab-item"
          :class="{ active: form.userType === '1' }"
          @click="form.userType = '1'"
        >
          个人用户登录
        </div>
        <div
          class="tab-item"
          :class="{ active: form.userType === '2' }"
          @click="form.userType = '2'"
        >
          企业账号登录
        </div>
      </div>

      <el-form ref="loginFormRef" :model="form" :rules="rules" label-position="top" size="large">
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="form.phone"
            placeholder="请输入手机号"
            clearable
            :prefix-icon="PhoneIcon"
            maxlength="11"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            :prefix-icon="LockIcon"
          />
          <div class="forgot-link-wrapper">
            <el-link type="primary" :underline="false" @click="router.push('/forgot-password')">
              忘记密码？
            </el-link>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">
            登录/注册
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <footer class="login-footer">
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
import { ref, reactive, onMounted, markRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { login } from '@/api/auth'
import type { LoginForm, UserType } from '@/types'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Phone, Lock } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const loginFormRef = ref<FormInstance>()
const loading = ref(false)

// 图标
const PhoneIcon = markRaw(Phone)
const LockIcon = markRaw(Lock)

const form = reactive<LoginForm>({
  phone: '',
  password: '',
  userType: '1',
  clientId: 'web:chrome_1a2b3c4d',
})

// 表单验证规则
const rules = reactive<FormRules<LoginForm>>({
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1\d{10}$/,
      message: '请输入11位手机号码',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
})

// 页面加载时，检查路由参数中是否有用户类型
onMounted(() => {
  const typeFromQuery = route.query.type as UserType
  if (typeFromQuery === '1' || typeFromQuery === '2') {
    form.userType = typeFromQuery
  }
})

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    const valid = await loginFormRef.value.validate()
    if (!valid) {
      ElMessage.warning('请完善表单信息')
      return
    }

    loading.value = true
    try {
      const res = await login(form)
      // 保存双 Token
      authStore.setToken(res.accessToken)
      authStore.setRefreshToken(res.refreshToken)
      authStore.setUserInfo(res.userInfo)
      authStore.setUserType(form.userType)

      ElMessage.success('登录成功')

      // 强制刷新页面到home，确保路由守卫使用最新的登录状态
      window.location.href = '/home'
    } catch (error) {
      ElMessage.error('登录失败，请检查手机号和密码')
    } finally {
      loading.value = false
    }
  } catch (error) {
    ElMessage.warning('请完善表单信息')
  }
}
</script>

<style scoped lang="scss">
.login-container {
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

.login-box {
  width: 100%;
  max-width: 420px;
  margin: auto;
  position: relative;
  z-index: 1;
  padding: 2.5rem 2rem;

  :deep(.el-card__body) {
    padding: 2rem;
  }
}

.user-type-tabs {
  display: flex;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 4px;
  margin-bottom: 24px;
  gap: 4px;
}

.tab-item {
  flex: 1;
  padding: 10px 20px;
  text-align: center;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  transition: all 0.3s ease;
  user-select: none;

  &:hover {
    color: #409eff;
  }

  &.active {
    background: #fff;
    color: #303133;
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
}

.forgot-link-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.login-footer {
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

:deep(.el-checkbox__label) {
  color: #666;
  font-size: 14px;
}
</style>
