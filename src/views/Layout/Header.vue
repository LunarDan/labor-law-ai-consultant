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
        <!-- 对话操作按钮 -->
        <div class="chat-actions">
          <el-tooltip :content="'开启新对话'" placement="bottom" :show-after="300">
            <div
              class="chat-action-btn"
              @click="handleNewChat"
              @mouseenter="hoverAction = 'new'"
              @mouseleave="hoverAction = ''"
            >
              <img src="@/assets/images/newtalk.png" alt="新对话" class="action-icon" />
              <div v-if="hoverAction === 'new'" class="indicator"></div>
            </div>
          </el-tooltip>

          <!-- 历史对话下拉弹窗 -->
          <el-popover
            v-model:visible="showHistoryPopover"
            placement="bottom"
            :width="320"
            popper-class="history-popover"
          >
            <template #reference>
              <div
                class="chat-action-btn"
                :class="{ active: showHistoryPopover }"
                @click="toggleHistoryPopover"
                @mouseenter="hoverAction = 'history'"
                @mouseleave="hoverAction = ''"
              >
                <el-tooltip :content="'历史对话'" placement="bottom" :show-after="300">
                  <img src="@/assets/images/historytalk.png" alt="历史对话" class="action-icon" />
                </el-tooltip>
                <div v-if="hoverAction === 'history' || showHistoryPopover" class="indicator"></div>
              </div>
            </template>

            <!-- 历史对话列表 -->
            <div class="history-dropdown">
              <div class="history-dropdown-header">
                <h4>历史对话</h4>
              </div>
              <el-scrollbar class="history-dropdown-list" height="300px">
                <div v-for="(group, date) in groupedHistory" :key="date" class="date-group">
                  <div class="date-label">{{ formatDateLabel(date) }}</div>
                  <div
                    v-for="item in group"
                    :key="item.id"
                    class="history-item"
                    :class="{ active: currentChatId === item.id }"
                    @click="loadHistoryChat(item.id)"
                    @mouseenter="hoveredItemId = item.id"
                    @mouseleave="hoveredItemId = ''"
                  >
                    <div class="history-title">{{ item.title }}</div>
                    <el-icon
                      v-if="hoveredItemId === item.id"
                      class="delete-icon"
                      @click.stop="confirmDeleteChat(item.id)"
                    >
                      <component :is="DeleteIcon" />
                    </el-icon>
                  </div>
                </div>
                <div v-if="Object.keys(groupedHistory).length === 0" class="empty-history">
                  <p>暂无历史对话</p>
                </div>
              </el-scrollbar>
            </div>
          </el-popover>
        </div>

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
import { ref, reactive, computed, nextTick, markRaw, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { updateUsername, changePassword, logout as logoutApi } from '@/api/auth'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Edit, Lock, SwitchButton, Delete } from '@element-plus/icons-vue'
import userAvatarImg from '@/assets/images/user.png'

// 图标
const EditIcon = markRaw(Edit)
const LockIcon = markRaw(Lock)
const SwitchButtonIcon = markRaw(SwitchButton)
const DeleteIcon = markRaw(Delete)

// 定义历史对话接口
interface Message {
  role: 'user' | 'ai'
  content: string
}

interface ChatHistory {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 用户头像
const userAvatar = userAvatarImg

// 对话操作状态
const hoverAction = ref<'new' | 'history' | ''>()

// 历史对话弹窗控制
const showHistoryPopover = ref(false)
const chatHistory = ref<ChatHistory[]>([])
const currentChatId = ref<string>('')
const hoveredItemId = ref<string>('')

// 从 localStorage 加载历史对话
const loadChatHistory = () => {
  const stored = localStorage.getItem('chat_history')
  if (stored) {
    try {
      chatHistory.value = JSON.parse(stored)
    } catch (e) {
      console.error('Failed to load chat history:', e)
      chatHistory.value = []
    }
  }
}

// 保存历史对话到 localStorage
const saveChatHistory = () => {
  localStorage.setItem('chat_history', JSON.stringify(chatHistory.value))
}

// 按日期分组历史对话
const groupedHistory = computed(() => {
  const groups: Record<string, ChatHistory[]> = {}

  // 按更新时间倒序排序
  const sorted = [...chatHistory.value].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })

  sorted.forEach((item) => {
    const date = item.updatedAt.split('T')[0] // 获取日期部分 YYYY-MM-DD
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
  })

  return groups
})

// 格式化日期标签
const formatDateLabel = (dateStr: string): string => {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  if (dateStr === todayStr) {
    return '今天'
  }

  return dateStr
}

// 监听历史对话更新事件
const handleHistoryUpdate = () => {
  loadChatHistory()
}

// 切换历史对话弹窗
const toggleHistoryPopover = () => {
  showHistoryPopover.value = !showHistoryPopover.value
  if (showHistoryPopover.value) {
    loadChatHistory() // 每次打开时刷新列表
  }
}

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

// 开启新对话
const handleNewChat = () => {
  currentChatId.value = ''
  showHistoryPopover.value = false // 关闭历史对话弹窗
  // 触发事件，让AiConsult组件知道
  window.dispatchEvent(new CustomEvent('chat:new'))
}

// 加载历史对话
const loadHistoryChat = (chatId: string) => {
  const chat = chatHistory.value.find((item) => item.id === chatId)
  if (chat) {
    currentChatId.value = chatId
    showHistoryPopover.value = false
    // 触发事件，传递对话数据
    window.dispatchEvent(
      new CustomEvent('chat:load', {
        detail: { chatId, messages: chat.messages },
      }),
    )
  }
}

// 确认删除对话
const confirmDeleteChat = (chatId: string) => {
  const chat = chatHistory.value.find((item) => item.id === chatId)
  if (!chat) return

  ElMessageBox.confirm('删除后不可恢复', '确认删除该对话记录吗', {
    confirmButtonText: '是',
    cancelButtonText: '否',
    type: 'warning',
    center: true,
  })
    .then(() => {
      deleteChat(chatId)
    })
    .catch(() => {
      // 用户取消删除
    })
}

// 删除对话
const deleteChat = (chatId: string) => {
  const index = chatHistory.value.findIndex((item) => item.id === chatId)
  if (index !== -1) {
    chatHistory.value.splice(index, 1)
    saveChatHistory()

    // 如果删除的是当前对话，清空当前ID并通知AiConsult组件
    if (currentChatId.value === chatId) {
      currentChatId.value = ''
      window.dispatchEvent(new CustomEvent('chat:deleted', { detail: { chatId } }))
    }

    ElMessage.success('删除成功')
  }
}

// 组件挂载时加载历史记录
onMounted(() => {
  loadChatHistory()
  // 监听历史对话更新事件
  window.addEventListener('chat:history-updated', handleHistoryUpdate)
})

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener('chat:history-updated', handleHistoryUpdate)
})
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
  gap: 16px;
}

.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1.5px solid #e4e7ed;
  border-radius: 50px;
  background: #fff;
  transition: all 0.3s ease;

  &:hover {
    border-color: #c0c4cc;
  }
}

.chat-action-btn {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.3s ease;

  &:hover {
    background: #f5f7fa;
  }

  &.active {
    background: #ecf5ff;
  }

  .action-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
  }

  .indicator {
    position: absolute;
    bottom: 4px;
    left: 50%;
    transform: translateX(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #409eff;
    animation: fadeIn 0.3s ease;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
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

<style lang="scss">
// 历史对话弹窗样式（全局样式，因为 popover 是传送到 body 的）
.history-popover {
  padding: 0 !important;

  .history-dropdown {
    .history-dropdown-header {
      padding: 12px 16px;
      border-bottom: 1px solid #e4e7ed;

      h4 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #303133;
      }
    }

    .history-dropdown-list {
      // 确保滚动条可见
      height: 300px;
      overflow: hidden;

      // Element Plus scrollbar 样式
      .el-scrollbar__wrap {
        overflow-x: hidden;
        overflow-y: auto;

        // 自定义滚动条样式
        &::-webkit-scrollbar {
          width: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;

          &:hover {
            background: #a8a8a8;
          }
        }
      }

      .el-scrollbar__view {
        padding: 0;
      }

      // Element Plus 滚动条轨道
      .el-scrollbar__bar {
        opacity: 1 !important;

        &.is-vertical {
          right: 2px;
          width: 6px;

          .el-scrollbar__thumb {
            background-color: rgba(144, 147, 153, 0.5);
            border-radius: 3px;

            &:hover {
              background-color: rgba(144, 147, 153, 0.7);
            }
          }
        }
      }

      .date-group {
        margin-bottom: 8px;

        .date-label {
          padding: 8px 16px;
          font-size: 12px;
          color: #909399;
          font-weight: 500;
          background: #f5f7fa;
          position: sticky;
          top: 0;
          z-index: 1;
        }

        .history-item {
          padding: 10px 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.2s;

          &:hover {
            background: #f5f7fa;
          }

          &.active {
            background: #ecf5ff;

            .history-title {
              color: #409eff;
              font-weight: 500;
            }
          }

          .history-title {
            flex: 1;
            font-size: 14px;
            color: #303133;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            padding-right: 8px;
          }

          .delete-icon {
            font-size: 16px;
            color: #909399;
            cursor: pointer;
            flex-shrink: 0;

            &:hover {
              color: #f56c6c;
            }
          }
        }
      }

      .empty-history {
        padding: 32px 16px;
        text-align: center;

        p {
          margin: 0;
          font-size: 14px;
          color: #909399;
        }
      }
    }
  }
}
</style>
