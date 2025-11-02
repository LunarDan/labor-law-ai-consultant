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
        <el-dropdown trigger="click" @command="handleCommand">
          <div class="user-dropdown">
            <el-avatar :size="40" :src="userAvatar" class="avatar" />
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled class="user-info-item">
                <div class="user-details">
                  <div class="user-name-row">
                    <span class="label">用户名称</span>
                    <div class="name-edit">
                      <el-input
                        v-if="isEditingName"
                        ref="nameInputRef"
                        v-model="editableName"
                        size="small"
                        style="width: 120px"
                        @blur="handleNameBlur"
                        @keyup.enter="handleNameSave"
                      />
                      <span v-else class="username-text">{{ displayName }}</span>
                      <el-icon v-if="!isEditingName" class="edit-icon" @click.stop="handleNameEdit">
                        <component :is="EditIcon" />
                      </el-icon>
                    </div>
                  </div>
                  <div class="user-id-row">
                    <span class="label">ID</span>
                    <span class="user-id">{{ userId }}</span>
                  </div>
                </div>
              </el-dropdown-item>
              <el-divider style="margin: 8px 0" />
              <el-dropdown-item command="changePassword">
                <el-icon><component :is="LockIcon" /></el-icon>
                修改密码
              </el-dropdown-item>
              <el-dropdown-item command="logout" divided>
                <el-icon><component :is="SwitchButtonIcon" /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="showPasswordDialog"
      title="修改密码"
      width="450px"
      :close-on-click-modal="false"
      align-center
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="90px"
        label-position="left"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码（至少6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        <div class="dialog-hint">
          <el-link type="primary" @click="handleForgotPassword">忘记密码？</el-link>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" :loading="passwordLoading" @click="handlePasswordSubmit">
          确认修改
        </el-button>
      </template>
    </el-dialog>
  </header>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, markRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { updateUsername, changePassword, logout as logoutApi } from '@/api/auth'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Edit, Lock, SwitchButton } from '@element-plus/icons-vue'
import userAvatarImg from '@/assets/images/user.png'

// 图标
const EditIcon = markRaw(Edit)
const LockIcon = markRaw(Lock)
const SwitchButtonIcon = markRaw(SwitchButton)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 用户头像
const userAvatar = userAvatarImg

// 用户名编辑相关
const isEditingName = ref(false)
const editableName = ref('')
const nameInputRef = ref<InstanceType<(typeof import('element-plus'))['ElInput']>>()

// 修改密码相关
const showPasswordDialog = ref(false)
const passwordLoading = ref(false)
const passwordFormRef = ref<FormInstance>()

interface PasswordForm {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

const passwordForm = reactive<PasswordForm>({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 当前是否为认证类页面（登录/忘记密码）
const isAuthPage = computed(() => route.meta.authPage === true)

// 展示名称：优先用户名，其次手机号
const displayName = computed(() => {
  return authStore.userInfo?.username || authStore.userInfo?.phone || '用户'
})

// 用户ID（6位数用户ID）
const userId = computed(() => {
  return authStore.userInfo?.userId || authStore.userInfo?.id || ''
})

// 头像首字母（备用，当图片加载失败时可以显示）
// const avatarLetter = computed(() => {
//   const name = displayName.value
//   return name?.toString().charAt(0).toUpperCase() || 'U'
// })

// 密码表单验证规则
const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = reactive<FormRules<PasswordForm>>({
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
})

// 下拉菜单命令处理
const handleCommand = (command: string) => {
  if (command === 'logout') {
    handleLogout()
  } else if (command === 'changePassword') {
    showPasswordDialog.value = true
  }
}

// 退出登录
const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        // 调用后端登出 API
        const refreshToken = authStore.refreshToken
        if (refreshToken) {
          await logoutApi(refreshToken)
        }

        // 清除本地存储
        authStore.logout()
        ElMessage.success('退出登录成功')
        router.push('/login-before')
      } catch (error) {
        // 即使后端 API 调用失败，也要清除本地数据
        authStore.logout()
        ElMessage.success('退出登录成功')
        router.push('/login-before')
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
    })
}

// 编辑用户名
const handleNameEdit = () => {
  isEditingName.value = true
  editableName.value = displayName.value
  nextTick(() => {
    nameInputRef.value?.focus()
  })
}

// 保存用户名
const handleNameSave = async () => {
  if (!editableName.value.trim()) {
    ElMessage.warning('用户名不能为空')
    return
  }

  if (!userId.value) {
    ElMessage.error('用户信息不完整，请重新登录')
    return
  }

  try {
    // 调用后端API更新用户名
    await updateUsername({
      userId: userId.value,
      newUsername: editableName.value,
    })

    // 更新本地store
    if (authStore.userInfo) {
      authStore.setUserInfo({
        ...authStore.userInfo,
        username: editableName.value,
      })
    }

    ElMessage.success('用户名修改成功')
    isEditingName.value = false

    // 确保下次编辑时能获取到最新的用户名
    await nextTick()
  } catch (error: any) {
    const errorMsg = error?.response?.data?.message || '用户名修改失败'
    ElMessage.error(errorMsg)
  }
}

// 用户名输入框失焦
const handleNameBlur = () => {
  if (!editableName.value.trim()) {
    // 如果为空，取消编辑并恢复原值
    isEditingName.value = false
    editableName.value = displayName.value
  } else if (editableName.value !== displayName.value) {
    // 如果有修改，则保存
    handleNameSave()
  } else {
    // 如果没有修改，直接退出编辑模式
    isEditingName.value = false
  }
}

// 修改密码提交
const handlePasswordSubmit = async () => {
  if (!passwordFormRef.value) return

  try {
    const valid = await passwordFormRef.value.validate()
    if (!valid) return

    passwordLoading.value = true
    try {
      // 检查 userId 是否存在
      if (!userId.value) {
        ElMessage.error('用户信息不完整，请重新登录')
        return
      }

      // 调用后端API修改密码
      await changePassword({
        userId: userId.value,
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      })

      ElMessage.success('密码修改成功，请重新登录')
      showPasswordDialog.value = false

      // 重置表单
      passwordForm.oldPassword = ''
      passwordForm.newPassword = ''
      passwordForm.confirmPassword = ''

      // 延迟退出登录，让用户看到成功提示
      setTimeout(() => {
        authStore.logout()
        router.push('/login-before')
      }, 1500)
    } catch (error: any) {
      // 根据错误信息判断是原密码错误还是其他错误
      const errorMsg = error?.response?.data?.message || ''
      if (errorMsg.includes('原密码') || errorMsg.includes('password')) {
        ElMessage.error('原密码错误')
      } else {
        ElMessage.error('密码修改失败')
      }
    } finally {
      passwordLoading.value = false
    }
  } catch (error) {
    // 表单验证失败
  }
}

// 忘记密码
const handleForgotPassword = () => {
  showPasswordDialog.value = false
  router.push('/forgot-password')
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
}

.user-dropdown {
  cursor: pointer;
  display: flex;
  align-items: center;

  &:hover {
    opacity: 0.8;
  }
}

.avatar {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
}

// 下拉菜单样式
:deep(.el-dropdown-menu) {
  min-width: 220px;
  padding: 8px 0;
}

:deep(.user-info-item) {
  cursor: default !important;

  &:hover {
    background: transparent !important;
  }
}

.user-details {
  padding: 8px 12px;
}

.user-name-row,
.user-id-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  font-size: 14px;
  color: #909399;
  min-width: 70px;
}

.name-edit {
  display: flex;
  align-items: center;
  gap: 6px;
}

.username-text {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.edit-icon {
  color: #409eff;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #66b1ff;
  }
}

.user-id {
  font-size: 14px;
  color: #606266;
  font-family: 'Courier New', monospace;
}

// 修改密码弹窗样式
.dialog-hint {
  text-align: right;
  margin-top: -8px;
  margin-bottom: 12px;
}

:deep(.el-dialog__header) {
  padding: 20px 20px 10px;
  text-align: center;

  .el-dialog__title {
    font-size: 18px;
    font-weight: 600;
  }
}

:deep(.el-dialog__body) {
  padding: 20px;
}

:deep(.el-dialog__footer) {
  padding: 10px 20px 20px;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;

  .el-icon {
    font-size: 16px;
  }
}
</style>
