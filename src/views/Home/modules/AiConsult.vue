<template>
  <div class="ai-consult">
    <!-- 聊天消息区域 -->
    <el-scrollbar ref="scrollbarRef" class="message-area">
      <!-- AI欢迎消息 -->
      <div class="message-item ai-message">
        <div class="avatar">
          <img src="@/assets/images/aipicture.png" alt="AI" />
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
          <img src="@/assets/images/aipicture.png" alt="AI" />
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
          <img src="@/assets/images/aipicture.png" alt="AI" />
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
import { useAuthStore } from '@/stores/auth'
import { chatConsult, getChatHistory } from '@/api/chat'
import type { ChatConsultRequest, ChatHistoryMessage } from '@/types'

// 使用 markRaw 优化图标
const LoadingIcon = markRaw(Loading)

// 获取用户认证信息
const authStore = useAuthStore()

interface Message {
  role: 'user' | 'ai'
  content: string
}

interface ChatHistory {
  id: string
  title: string
  messages: Message[]
  conversationId: string // 后端对话ID
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
const currentConversationId = ref<string>('') // 当前会话的后端对话ID

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

// 生成唯一的对话ID
const generateConversationId = (): string => {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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
        conversationId: currentConversationId.value,
        updatedAt: now,
      }
    }
  } else {
    // 创建新对话
    const newChat: ChatHistory = {
      id: `chat_${Date.now()}`,
      title: generateTitle(messages.value),
      messages: [...messages.value],
      conversationId: currentConversationId.value,
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
  currentConversationId.value = ''
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

  // 调用后端AI接口
  loading.value = true
  try {
    await callAiConsult(userMessage)

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

// 调用真实的AI咨询接口
async function callAiConsult(question: string): Promise<void> {
  // 检查用户信息
  if (!authStore.userInfo || !authStore.userInfo.id) {
    ElMessage.error('用户信息缺失，请重新登录')
    throw new Error('User info missing')
  }

  // 如果是新对话，生成新的 conversationId
  if (!currentConversationId.value) {
    currentConversationId.value = generateConversationId()
  }

  // 构建请求参数
  const requestData: ChatConsultRequest = {
    id: parseInt(authStore.userInfo.id),
    userType: authStore.userType === '1' ? 1 : 2,
    conversationId: currentConversationId.value,
    message: question,
  }

  try {
    // 调用API
    const response = await chatConsult(requestData)

    // 检查响应是否有效
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid API response')
    }

    // 更新 conversationId（后端可能返回新的对话ID）
    if (response.conversationId) {
      currentConversationId.value = response.conversationId
    }

    // 获取AI回复内容（API层已经处理了类数组对象转换）
    const aiReply = response.data

    // 检查是否有内容
    if (!aiReply || aiReply.trim() === '') {
      console.warn('AI响应中没有回复内容:', response)
      throw new Error('No reply in response')
    }

    // 将AI回复添加到消息列表
    messages.value.push({
      role: 'ai',
      content: aiReply,
    })
  } catch (error: any) {
    console.error('AI咨询接口调用失败:', error)

    // 根据错误类型显示不同的错误信息
    let errorMessage = '抱歉，咨询服务暂时不可用，请稍后重试。'

    if (error.response) {
      // 后端返回了错误响应
      const status = error.response.status
      if (status === 401) {
        errorMessage = '登录已过期，请重新登录。'
      } else if (status === 429) {
        errorMessage = '请求过于频繁，请稍后再试。'
      } else if (status === 500) {
        errorMessage = '服务器错误，请稍后重试。'
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      errorMessage = '网络连接失败，请检查网络后重试。'
    }

    // 添加错误提示消息
    messages.value.push({
      role: 'ai',
      content: `<p style="color: #f56c6c;">${errorMessage}</p>`,
    })

    throw error
  }
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

// 从后端API加载历史对话记录
const loadHistoryFromApi = async (conversationId: string): Promise<Message[]> => {
  try {
    const historyMessages = await getChatHistory(conversationId)

    if (!historyMessages || !Array.isArray(historyMessages)) {
      return []
    }

    // 将API返回的消息格式转换为组件使用的格式
    const convertedMessages = historyMessages
      .filter((msg: ChatHistoryMessage) => {
        // 过滤掉系统消息和工具执行结果消息
        if (msg.role !== 'USER' && msg.role !== 'AI') {
          return false
        }

        // 过滤掉AI的工具执行消息
        if (msg.role === 'AI' && msg.content && msg.content.includes('toolExecutionRequests')) {
          return false
        }

        // 过滤掉包含过多技术信息的用户消息（保留最纯净的问题）
        if (
          msg.role === 'USER' &&
          msg.content &&
          (msg.content.includes('用户类型') ||
            msg.content.includes('当前问题：') ||
            msg.content.includes('上下文信息'))
        ) {
          return false
        }

        return true
      })
      .map((msg: ChatHistoryMessage) => {
        // 角色映射：USER -> user, AI -> ai
        const role = msg.role === 'USER' ? 'user' : 'ai'

        // 清理content内容，移除技术格式包装
        let content = msg.content || ''

        // 如果是用户消息，尝试提取实际的用户输入
        if (msg.role === 'USER' && content.includes('UserMessage')) {
          // 尝试多种模式提取用户输入
          let extractedText = ''

          // 模式1: text = "内容"
          let textMatch = content.match(/text = "([^"]+)"/)
          if (textMatch) {
            extractedText = textMatch[1]
          } else {
            // 模式2: TextContent { text = "内容" }
            textMatch = content.match(/TextContent.*?text = "([^"]+)"/)
            if (textMatch) {
              extractedText = textMatch[1]
            } else {
              // 如果都无法提取，尝试找到中文内容
              const chineseMatch = content.match(/[\u4e00-\u9fa5].*[\u4e00-\u9fa5？。！]/)
              if (chineseMatch) {
                extractedText = chineseMatch[0]
              }
            }
          }

          if (extractedText) {
            content = extractedText
          }
        }

        return {
          role: role as 'user' | 'ai',
          content: content,
        }
      })

    // 去重处理：对连续重复的AI消息进行去重，但保留完整的对话流程
    const deduplicatedMessages: any[] = []
    let consecutiveLegalAnalysis: any[] = []

    convertedMessages.forEach((msg, index) => {
      // 如果是以【法律分析】开头的AI消息，收集起来
      if (msg.role === 'ai' && msg.content.startsWith('【法律分析】')) {
        consecutiveLegalAnalysis.push(msg)

        // 检查下一条消息是否还是法律分析
        const nextMsg = convertedMessages[index + 1]
        if (!nextMsg || nextMsg.role !== 'ai' || !nextMsg.content.startsWith('【法律分析】')) {
          // 下一条不是法律分析了，保留最后一条（最完整的）
          if (consecutiveLegalAnalysis.length > 0) {
            deduplicatedMessages.push(consecutiveLegalAnalysis[consecutiveLegalAnalysis.length - 1])
            consecutiveLegalAnalysis = []
          }
        }
      } else {
        // 非重复消息，直接保留
        deduplicatedMessages.push(msg)
      }
    })

    return deduplicatedMessages
  } catch (error) {
    console.error('从API加载历史对话失败:', error)
    throw error
  }
}

// 处理加载历史对话事件
const handleLoadChatEvent = async (event: any) => {
  const { chatId, messages: historyMessages, conversationId } = event.detail
  currentChatId.value = chatId

  // 如果有conversationId，优先从API加载最新消息
  if (conversationId) {
    try {
      loading.value = true
      const apiMessages = await loadHistoryFromApi(conversationId)

      if (apiMessages && apiMessages.length > 0) {
        messages.value = apiMessages
        currentConversationId.value = conversationId
      } else {
        // API返回空消息，使用本地数据
        messages.value = [...(historyMessages || [])]
        currentConversationId.value = conversationId
      }
    } catch (error) {
      // API加载失败，使用localStorage的数据
      console.error('API加载失败，使用本地缓存数据:', error)
      messages.value = [...(historyMessages || [])]
      if (conversationId) {
        currentConversationId.value = conversationId
      }
    } finally {
      loading.value = false
    }
  } else {
    // 没有conversationId，直接使用localStorage的数据
    messages.value = [...(historyMessages || [])]
  }

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
    currentConversationId.value = ''
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
