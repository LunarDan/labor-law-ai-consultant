<template>
  <div class="ai-consult">
    <!-- 聊天消息区域 -->
    <el-scrollbar ref="scrollbarRef" class="message-area">
      <!-- AI欢迎消息 -->
      <div class="message-item ai-message">
        <div class="avatar">
          <img src="@/assets/images/logo.png" alt="AI" />
        </div>
        <div class="message-content">
          <div class="message-text welcome-text">
            <p>您好，请描述您遇到的问题，或点击左侧快捷问题开始咨询。</p>
            <div class="feature-list">
              <div class="feature-item">• 解答劳动法律问题（工资、合同、社保、工时等）</div>
              <div class="feature-item">• 审查劳动合同条款</div>
              <div class="feature-item">• 提供维权方案和策略建议</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 聊天记录 -->
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-item"
        :class="msg.role + '-message'"
      >
        <div v-if="msg.role === 'ai'" class="avatar">
          <img src="@/assets/images/logo.png" alt="AI" />
        </div>
        <div class="message-content">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div class="message-text" v-html="msg.content"></div>
        </div>
        <div v-if="msg.role === 'user'" class="avatar user-avatar">
          <img src="@/assets/images/user.png" alt="用户" />
        </div>
      </div>

      <!-- 加载中 -->
      <div v-if="loading" class="message-item ai-message">
        <div class="avatar">
          <img src="@/assets/images/logo.png" alt="AI" />
        </div>
        <div class="message-content">
          <div class="message-text loading-text">
            <el-icon class="is-loading">
              <component :is="LoadingIcon" />
            </el-icon>
            <span>正在思考中...</span>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- 输入区域 -->
    <div class="input-area">
      <el-input
        v-model="inputText"
        type="textarea"
        :rows="3"
        placeholder="请输入您要咨询的问题"
        :maxlength="2000"
        show-word-limit
        @keydown.enter="handleEnter"
      />
      <div class="input-actions">
        <el-button :disabled="!canSend" :type="canSend ? 'primary' : 'info'" @click="sendMessage">
          发送
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, markRaw } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 使用 markRaw 优化图标
const LoadingIcon = markRaw(Loading)

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

const props = defineProps<{
  selectedQuestion?: string
}>()

const emit = defineEmits<{
  (e: 'question-sent'): void
}>()

// 输入框内容
const inputText = ref<string>('')

// 聊天消息列表
const messages = ref<Message[]>([])

// 加载状态
const loading = ref<boolean>(false)

// 滚动容器引用
const scrollbarRef = ref()

// 历史对话相关
const chatHistory = ref<ChatHistory[]>([])
const currentChatId = ref<string>('')

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
  // 通知 Header 组件更新历史列表
  window.dispatchEvent(new CustomEvent('chat:history-updated'))
}

// 生成对话标题（取第一个用户问题的前20个字符）
const generateTitle = (messages: Message[]): string => {
  const firstUserMsg = messages.find((msg) => msg.role === 'user')
  if (!firstUserMsg) return '新对话'

  const content = firstUserMsg.content.replace(/<[^>]*>/g, '').trim() // 移除HTML标签
  if (content.length <= 20) return content
  return content.substring(0, 20) + '...'
}

// 保存当前对话
const saveCurrentChat = () => {
  if (messages.value.length === 0) return

  const now = new Date().toISOString()

  if (currentChatId.value) {
    // 更新现有对话
    const index = chatHistory.value.findIndex((item) => item.id === currentChatId.value)
    if (index !== -1) {
      chatHistory.value[index] = {
        ...chatHistory.value[index],
        messages: [...messages.value],
        title: generateTitle(messages.value),
        updatedAt: now,
      }
    }
  } else {
    // 创建新对话
    const newChat: ChatHistory = {
      id: `chat_${Date.now()}`,
      title: generateTitle(messages.value),
      messages: [...messages.value],
      createdAt: now,
      updatedAt: now,
    }
    chatHistory.value.unshift(newChat)
    currentChatId.value = newChat.id
  }

  saveChatHistory()
}

// 开启新对话
const startNewChat = () => {
  // 保存当前对话
  if (messages.value.length > 0) {
    saveCurrentChat()
  }

  // 清空消息
  messages.value = []
  currentChatId.value = ''
  inputText.value = ''
}

// 是否可以发送（输入框有内容且不在加载中）
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !loading.value
})

// 监听选中的常见问题，自动填充到输入框
watch(
  () => props.selectedQuestion,
  (newVal) => {
    if (newVal) {
      inputText.value = newVal
    }
  },
)

// 发送消息
async function sendMessage() {
  if (!canSend.value) return

  const userMessage = inputText.value.trim()
  if (!userMessage) return

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: userMessage,
  })

  // 清空输入框
  inputText.value = ''

  // 通知父组件已发送
  emit('question-sent')

  // 滚动到底部
  await nextTick()
  scrollToBottom()

  // 模拟AI回复（实际应调用后端接口）
  loading.value = true
  try {
    // TODO: 调用后端AI接口
    await mockAiResponse(userMessage)

    // AI回复完成后，自动保存对话
    saveCurrentChat()
  } catch (error) {
    console.log(error)
    ElMessage.error('咨询失败，请稍后重试')
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

// 模拟AI回复（实际项目中替换为真实接口调用）
async function mockAiResponse(question: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let response = ''

      if (question.includes('工资') || question.includes('拖欠')) {
        response = `
          <p>工资问题回复内容...</p>
        `
      } else if (question.includes('加班')) {
        response = `
          <p>关于加班费的计算.....</p>
         
        `
      } else if (question.includes('试用期') || question.includes('合同')) {
        response = `
          <p>关于劳动合同和试用期的规定：</p>
      
        `
      } else if (question.includes('社保')) {
        response = `
          <p>关于社保缴纳的相关规定：</p>
    
        `
      } else if (question.includes('996')) {
        response = `
          <p>关于996工作制的法律分析：</p>
      
        `
      } else {
        response = `
          通用回复内容...
        `
      }

      messages.value.push({
        role: 'ai',
        content: response,
      })
      resolve()
    }, 1500)
  })
}

// 处理回车键
function handleEnter(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    sendMessage()
  }
}

// 滚动到底部
function scrollToBottom() {
  if (scrollbarRef.value) {
    // Element Plus Scrollbar 的内部滚动容器
    const scrollElement = scrollbarRef.value.wrapRef
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight
    }
  }
}

// 处理新对话事件
const handleNewChatEvent = () => {
  startNewChat()
}

// 处理加载历史对话事件
const handleLoadChatEvent = (event: any) => {
  const { chatId, messages: historyMessages } = event.detail
  currentChatId.value = chatId
  messages.value = [...historyMessages]
  nextTick(() => {
    scrollToBottom()
  })
}

// 处理删除对话事件
const handleDeletedChatEvent = (event: any) => {
  const { chatId } = event.detail
  if (currentChatId.value === chatId) {
    messages.value = []
    currentChatId.value = ''
  }
}

// 组件挂载时加载历史记录并监听事件
onMounted(() => {
  loadChatHistory()
  window.addEventListener('chat:new', handleNewChatEvent)
  window.addEventListener('chat:load', handleLoadChatEvent as EventListener)
  window.addEventListener('chat:deleted', handleDeletedChatEvent as EventListener)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('chat:new', handleNewChatEvent)
  window.removeEventListener('chat:load', handleLoadChatEvent as EventListener)
  window.removeEventListener('chat:deleted', handleDeletedChatEvent as EventListener)
})
</script>

<style scoped lang="scss">
.ai-consult {
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.message-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;

  .message-item {
    display: flex;
    margin-bottom: 24px;
    animation: fadeIn 0.3s ease-in;

    &.ai-message {
      justify-content: flex-start;

      .avatar {
        margin-right: 12px;
      }
    }

    &.user-message {
      justify-content: flex-end;

      .avatar {
        margin-left: 12px;
      }

      .message-content {
        background: #409eff;

        .message-text {
          color: #fff;
        }
      }
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      &.user-avatar {
        background: #909399;
      }
    }

    .message-content {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 8px;
      background: #f4f4f5;

      .message-text {
        font-size: 14px;
        line-height: 1.6;
        color: #303133;
        word-break: break-word;

        &.welcome-text {
          p {
            margin: 0 0 12px 0;
            font-size: 15px;
          }

          .feature-list {
            margin-top: 12px;

            .feature-item {
              padding: 6px 0;
              color: #606266;
              font-size: 13px;
            }
          }
        }

        &.loading-text {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #909399;
        }

        :deep(p) {
          margin: 8px 0;
          line-height: 1.8;
        }

        :deep(ul) {
          margin: 8px 0;
          padding-left: 20px;

          li {
            margin: 4px 0;
            line-height: 1.8;
          }
        }

        :deep(strong) {
          font-weight: 600;
          color: #409eff;
        }
      }
    }
  }
}

.input-area {
  border-top: 1px solid #e4e7ed;
  padding: 16px 20px;
  background: #fff;

  :deep(.el-textarea__inner) {
    box-shadow: none;
    border-color: #dcdfe6;
    resize: none;

    &:focus {
      border-color: #409eff;
    }
  }

  .input-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;

    .el-button {
      min-width: 80px;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
