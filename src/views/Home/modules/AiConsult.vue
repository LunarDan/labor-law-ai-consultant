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

          <!-- 可能的后续问题 -->
          <div
            v-if="msg.followUpQuestions && msg.followUpQuestions.length > 0"
            class="follow-up-questions"
          >
            <div
              v-for="(question, qIndex) in msg.followUpQuestions"
              :key="qIndex"
              class="follow-up-question-item"
            >
              <span class="question-text">{{ question }}</span>
              <div class="question-actions">
                <el-button
                  size="small"
                  type="success"
                  plain
                  @click="handleFollowUpAnswer(question, true, index)"
                >
                  是
                </el-button>
                <el-button
                  size="small"
                  type="info"
                  plain
                  @click="handleFollowUpAnswer(question, false, index)"
                >
                  否
                </el-button>
              </div>
            </div>
          </div>
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
import { chatConsult, getChatHistory, createNewChat, createNewChatWithTitle } from '@/api/chat'
import type { ChatConsultRequest, ChatHistoryMessage } from '@/types'

// 使用 markRaw 优化图标
const LoadingIcon = markRaw(Loading)

// 获取用户认证信息
const authStore = useAuthStore()

interface Message {
  role: 'user' | 'ai'
  content: string
  followUpQuestions?: string[] // 可能的后续问题
  originalQuestion?: string // 保存用户原始问题，用于后续问题的上下文
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
      const data = JSON.parse(stored)

      // 去重：使用 conversationId 作为唯一标识
      const uniqueMap = new Map<string, ChatHistory>()
      data.forEach((item: ChatHistory) => {
        if (item.conversationId) {
          // 如果已存在相同conversationId的记录，保留消息更多或更新时间更晚的那个
          const existing = uniqueMap.get(item.conversationId)
          if (!existing) {
            uniqueMap.set(item.conversationId, item)
          } else {
            // 比较哪个记录更完整
            const existingMsgCount = existing.messages?.length || 0
            const currentMsgCount = item.messages?.length || 0
            const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime()
            const currentTime = new Date(item.updatedAt || item.createdAt).getTime()

            // 优先保留消息更多的，如果消息数量相同则保留时间更晚的
            if (
              currentMsgCount > existingMsgCount ||
              (currentMsgCount === existingMsgCount && currentTime > existingTime)
            ) {
              uniqueMap.set(item.conversationId, item)
            }
          }
        } else {
          // 没有conversationId的记录，使用id作为key（临时对话）
          uniqueMap.set(item.id, item)
        }
      })

      chatHistory.value = Array.from(uniqueMap.values())
    } catch (e) {
      console.error('Failed to load chat history:', e)
      chatHistory.value = []
    }
  }
}

// 保存历史对话到 localStorage（保存前自动去重和清理）
const saveChatHistory = () => {
  // 去重：使用 conversationId 作为唯一标识
  const uniqueMap = new Map<string, ChatHistory>()

  chatHistory.value.forEach((item) => {
    const key = item.conversationId || item.id
    if (!key) return

    // 过滤掉空对话（超过5分钟还没有消息的记录）
    const hasMessages = item.messages && item.messages.length > 0
    if (!hasMessages) {
      const createdTime = new Date(item.createdAt || item.updatedAt).getTime()
      const now = Date.now()
      const ageInMinutes = (now - createdTime) / 1000 / 60

      // 如果是超过5分钟的空对话，跳过不保存
      if (ageInMinutes > 5) {
        console.log(`🗑️ 清理空对话记录: ${item.title}`)
        return
      }
    }

    const existing = uniqueMap.get(key)
    if (!existing) {
      uniqueMap.set(key, item)
    } else {
      // 保留消息更多或更新时间更晚的记录
      const existingMsgCount = existing.messages?.length || 0
      const currentMsgCount = item.messages?.length || 0
      const existingTime = new Date(existing.updatedAt || existing.createdAt).getTime()
      const currentTime = new Date(item.updatedAt || item.createdAt).getTime()

      if (
        currentMsgCount > existingMsgCount ||
        (currentMsgCount === existingMsgCount && currentTime > existingTime)
      ) {
        uniqueMap.set(key, item)
      }
    }
  })

  // 更新内存中的数据（去重后）
  chatHistory.value = Array.from(uniqueMap.values())

  // 保存到localStorage
  localStorage.setItem('chat_history', JSON.stringify(chatHistory.value))

  // 通知 Header 组件更新历史列表
  window.dispatchEvent(new CustomEvent('chat:history-updated'))
}

// 格式化AI回复内容，使其更有条理，并提取后续问题
const formatAiReply = (
  content: string,
): { formattedContent: string; followUpQuestions: string[] } => {
  if (!content) return { formattedContent: content, followUpQuestions: [] }

  // 如果已经包含格式化标记，直接返回（避免重复格式化）
  if (content.includes('class="ai-section-title"') || content.includes('class="ai-list-item"')) {
    return { formattedContent: content, followUpQuestions: [] }
  }

  // 按行处理内容
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line)
  const result: string[] = []
  const followUpQuestions: string[] = []
  let inFollowUpSection = false

  for (const line of lines) {
    // 检测是否进入"可能的后续问题"部分
    if (
      line.includes('【可能的后续问题】') ||
      line.includes('【后续问题】') ||
      line.includes('可能的后续问题：') ||
      line.includes('后续问题：')
    ) {
      inFollowUpSection = true
      // 添加标题但不显示后续问题内容（改为交互式显示）
      result.push(line.replace(/【([^】]+)】/g, '<div class="ai-section-title">【$1】</div>'))
      continue
    }

    // 如果在后续问题部分，提取问题
    if (inFollowUpSection) {
      // 匹配编号格式的问题
      const questionMatch = line.match(/^(\d+[\.:、])\s*(.+)$/)
      if (questionMatch) {
        followUpQuestions.push(questionMatch[2])
        continue
      }
      // 匹配纯问题（没有编号）
      if (line.endsWith('？') || line.endsWith('?')) {
        followUpQuestions.push(line)
        continue
      }
    }

    // 1. 处理【标题】格式
    if (line.includes('【') && line.includes('】')) {
      result.push(line.replace(/【([^】]+)】/g, '<div class="ai-section-title">【$1】</div>'))
      continue
    }

    // 2. 处理编号列表（1. 2. 3. 等）
    const listMatch = line.match(/^(\d+[\.:、])\s*(.+)$/)
    if (listMatch) {
      result.push(
        `<div class="ai-list-item"><span class="ai-list-number">${listMatch[1]}</span><span class="ai-list-content">${listMatch[2]}</span></div>`,
      )
      continue
    }

    // 3. 普通段落
    result.push(`<p class="ai-paragraph">${line}</p>`)
  }

  return { formattedContent: result.join(''), followUpQuestions }
}

// 格式化消息数组中的AI回复
const formatMessages = (messages: Message[]): Message[] => {
  return messages.map((msg) => {
    if (msg.role === 'ai') {
      const { formattedContent, followUpQuestions } = formatAiReply(msg.content)
      return {
        ...msg,
        content: formattedContent,
        followUpQuestions,
      }
    }
    return msg
  })
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

  // 关键修复：优先按 conversationId 查找现有记录，避免重复
  let existingChatIndex = -1

  // 1. 先尝试按 conversationId 查找（最重要的唯一标识）
  if (currentConversationId.value) {
    existingChatIndex = chatHistory.value.findIndex(
      (item) => item.conversationId === currentConversationId.value,
    )
  }

  // 2. 如果按 conversationId 没找到，再按 currentChatId 查找
  if (existingChatIndex === -1 && currentChatId.value) {
    existingChatIndex = chatHistory.value.findIndex((item) => item.id === currentChatId.value)
  }

  if (existingChatIndex !== -1) {
    // 更新现有对话
    const existingChat = chatHistory.value[existingChatIndex]
    chatHistory.value[existingChatIndex] = {
      ...existingChat,
      messages: [...messages.value],
      title: generateTitle(messages.value),
      conversationId: currentConversationId.value,
      updatedAt: now,
    }

    // 更新 currentChatId 为找到的记录的 id
    if (!currentChatId.value) {
      currentChatId.value = existingChat.id
    }
  } else {
    // 创建新对话（确保没有相同的 conversationId）
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

// 是否可以发送（输入框有内容且不在加载中）
const canSend = computed(() => {
  return inputText.value.trim().length > 0 && !loading.value
})

// 监听选中的常见问题，自动填充到输入框
watch(
  () => props.selectedQuestion,
  async (newVal) => {
    if (newVal) {
      inputText.value = newVal

      // 检查是否是从知识库跳转过来（通过 localStorage 标记）
      const autoSend = localStorage.getItem('aiConsultAutoSend')
      if (autoSend === 'true') {
        // 从知识库跳转过来时，自动发送问题
        localStorage.removeItem('aiConsultAutoSend') // 清除标记
        await nextTick()
        await sendMessage()
      }
    }
  },
)

// 发送消息
async function sendMessage() {
  if (!canSend.value) return

  const userMessage = inputText.value.trim()
  if (!userMessage) return

  // 保存最后的咨询问题到 localStorage，供知识库使用
  localStorage.setItem('lastConsultQuestion', userMessage)

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

  // 如果是第一个问题（messages.length === 1，即只有用户刚发送的消息）
  // 注意：此时消息已经被添加到messages数组中了，所以length为1而不是0
  if (messages.value.length === 1) {
    try {
      // 如果已有conversationId（如从历史记录加载），使用它更新标题
      if (currentConversationId.value) {
        const newConversationId = await createNewChatWithTitle(
          question,
          currentConversationId.value,
        )
        if (newConversationId) {
          currentConversationId.value = newConversationId
        }
      } else {
        // 没有conversationId，先创建一个空对话
        const initialConversationId = await createNewChat()
        if (initialConversationId) {
          // 然后用第一个问题作为标题更新对话
          const newConversationId = await createNewChatWithTitle(question, initialConversationId)
          currentConversationId.value = newConversationId || initialConversationId
        }
      }
    } catch (error) {
      console.error('创建对话失败:', error)
      // 失败时使用临时ID
      if (!currentConversationId.value) {
        currentConversationId.value = generateConversationId()
      }
    }
  }

  // 如果还是没有conversationId，生成临时ID
  if (!currentConversationId.value) {
    console.warn('⚠️ 没有conversationId，使用临时ID')
    currentConversationId.value = generateConversationId()
  }

  // 构建请求参数
  const requestData: ChatConsultRequest = {
    id:
      typeof authStore.userInfo.id === 'string'
        ? parseInt(authStore.userInfo.id)
        : authStore.userInfo.id,
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

    // 格式化并添加AI回复到消息列表
    const { formattedContent, followUpQuestions } = formatAiReply(aiReply)
    messages.value.push({
      role: 'ai',
      content: formattedContent,
      followUpQuestions,
      originalQuestion: question, // 保存用户原始问题
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

// 处理后续问题的回答（是/否）
function handleFollowUpAnswer(question: string, answer: boolean, messageIndex: number) {
  const message = messages.value[messageIndex]
  if (!message || message.role !== 'ai') return

  // 获取原始问题
  const originalQuestion = message.originalQuestion || ''

  // 根据用户选择处理问题
  let formattedAnswer = ''

  if (answer) {
    // 选择"是" - 直接显示原问题
    formattedAnswer = question
  } else {
    // 选择"否" - 显示原问题 + "的否定"
    formattedAnswer = question + '的否定'
  }

  // 构造完整的补充说明，结合原问题和用户选择
  let fullMessage = ''
  if (originalQuestion) {
    fullMessage = `关于"${originalQuestion}"这个问题，补充说明：${formattedAnswer}。请基于以上信息重新分析。`
  } else {
    fullMessage = `补充说明：${formattedAnswer}。请基于以上信息重新分析。`
  }

  // 将构造的内容填入输入框
  inputText.value = fullMessage

  // 自动滚动到输入框
  nextTick(() => {
    const inputElement = document.querySelector('.input-area textarea')
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      ;(inputElement as HTMLTextAreaElement).focus()
    }
  })
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

// 初始化对话 - 不再在页面加载时创建对话，改为在发送第一条消息时创建
const initializeConversation = async () => {
  // 清空conversationId，等待用户发送第一条消息时再创建
  currentConversationId.value = ''
}

// 处理新对话事件
const handleNewChatEvent = async (event: Event) => {
  const customEvent = event as CustomEvent
  try {
    // 保存当前对话
    if (messages.value.length > 0) {
      saveCurrentChat()
    }

    // 清空消息和对话ID
    messages.value = []
    currentChatId.value = ''
    inputText.value = ''

    // 清空conversationId，等待用户发送第一条消息时再创建对话
    // 如果事件中已经包含conversationId（如从历史记录加载），则使用它
    currentConversationId.value = customEvent.detail?.conversationId || ''
  } catch (error) {
    console.error('创建新对话失败:', error)
    currentConversationId.value = ''
  }
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

          // 模式1: text = "内容" - 贪婪匹配，找到最后一个结束引号之前的内容
          const textStartMatch = content.match(/text\s*=\s*"/)
          if (textStartMatch && textStartMatch.index !== undefined) {
            const startPos = textStartMatch.index + textStartMatch[0].length
            const remainingContent = content.substring(startPos)

            // 从后往前找最后一个引号（排除后面可能的 } 等字符）
            // 优先匹配：text = "内容" } 这种格式
            const endMatch = remainingContent.match(/^(.+?)"\s*\}/)
            if (endMatch) {
              extractedText = endMatch[1]
            } else {
              // 如果没有 }，尝试找到最后一个引号
              const lastQuoteIndex = remainingContent.lastIndexOf('"')
              if (lastQuoteIndex !== -1) {
                extractedText = remainingContent.substring(0, lastQuoteIndex)
              }
            }
          }

          // 如果模式1失败，尝试其他模式
          if (!extractedText) {
            // 模式2: 尝试找到中文内容
            const chineseMatch = content.match(/[\u4e00-\u9fa5].*[\u4e00-\u9fa5？。！]/)
            if (chineseMatch) {
              extractedText = chineseMatch[0]
            }
          }

          if (extractedText) {
            content = extractedText
          }
        }

        // 对AI消息进行格式化处理
        let finalContent = content
        let followUpQuestions: string[] = []

        if (role === 'ai') {
          const formatted = formatAiReply(content)
          finalContent = formatted.formattedContent
          followUpQuestions = formatted.followUpQuestions
        }

        return {
          role: role as 'user' | 'ai',
          content: finalContent,
          followUpQuestions: role === 'ai' ? followUpQuestions : undefined,
        }
      })

    // 去重处理：对连续重复的AI消息进行去重，但保留完整的对话流程
    const deduplicatedMessages: any[] = []
    let consecutiveLegalAnalysis: any[] = []

    convertedMessages.forEach((msg, index) => {
      // 如果是以【法律分析】开头的AI消息，收集起来（需要检查原始内容或格式化后的内容）
      const isLegalAnalysis =
        msg.role === 'ai' &&
        (msg.content.includes('【法律分析】') || msg.content.includes('法律分析'))

      if (isLegalAnalysis) {
        consecutiveLegalAnalysis.push(msg)

        // 检查下一条消息是否还是法律分析
        const nextMsg = convertedMessages[index + 1]
        const nextIsLegalAnalysis =
          nextMsg &&
          nextMsg.role === 'ai' &&
          (nextMsg.content.includes('【法律分析】') || nextMsg.content.includes('法律分析'))

        if (!nextIsLegalAnalysis) {
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
        messages.value = apiMessages // API数据已经在loadHistoryFromApi中格式化过了
        currentConversationId.value = conversationId
      } else {
        // API返回空消息，使用本地数据（需要格式化）
        messages.value = formatMessages([...(historyMessages || [])])
        currentConversationId.value = conversationId
      }
    } catch (error) {
      // API加载失败，使用localStorage的数据（需要格式化）
      console.error('API加载失败，使用本地缓存数据:', error)
      messages.value = formatMessages([...(historyMessages || [])])
      if (conversationId) {
        currentConversationId.value = conversationId
      }
    } finally {
      loading.value = false
    }
  } else {
    // 没有conversationId，直接使用localStorage的数据（需要格式化）
    messages.value = formatMessages([...(historyMessages || [])])
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
  // 初始化conversationId - 页面加载时立即调用创建对话接口
  initializeConversation()

  loadChatHistory()
  window.addEventListener('chat:new', handleNewChatEvent as EventListener)
  window.addEventListener('chat:load', handleLoadChatEvent as EventListener)
  window.addEventListener('chat:deleted', handleDeletedChatEvent as EventListener)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('chat:new', handleNewChatEvent as EventListener)
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

      .message-content {
        max-width: 80%;
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

        // 段落样式
        :deep(p) {
          margin: 8px 0;
          line-height: 1.8;
        }

        // AI格式化段落
        :deep(.ai-paragraph) {
          margin: 10px 0;
          line-height: 1.9;
          text-indent: 0;
        }

        // AI章节标题样式（【法律分析】、【实务建议】等）
        :deep(.ai-section-title) {
          font-size: 15px;
          font-weight: 600;
          color: #409eff;
          margin: 20px 0 12px 0;
          padding: 8px 12px;
          background: linear-gradient(90deg, #e6f2ff 0%, transparent 100%);
          border-left: 4px solid #409eff;
          border-radius: 2px;

          &:first-child {
            margin-top: 0;
          }
        }

        // AI编号列表项
        :deep(.ai-list-item) {
          display: flex;
          margin: 10px 0;
          padding-left: 8px;
          line-height: 1.8;

          .ai-list-number {
            flex-shrink: 0;
            font-weight: 600;
            color: #606266;
            margin-right: 8px;
            min-width: 24px;
          }

          .ai-list-content {
            flex: 1;
            color: #303133;
          }
        }

        // 列表样式
        :deep(ul) {
          margin: 12px 0;
          padding-left: 20px;

          li {
            margin: 6px 0;
            line-height: 1.8;
          }
        }

        // 强调文本
        :deep(strong) {
          font-weight: 600;
          color: #409eff;
        }
      }

      // 后续问题交互区域
      .follow-up-questions {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px dashed #e4e7ed;

        .follow-up-question-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          margin-bottom: 10px;
          background: #f9fafb;
          border-radius: 6px;
          border: 1px solid #e4e7ed;
          transition: all 0.3s;

          &:hover {
            background: #f0f2f5;
            border-color: #409eff;
          }

          &:last-child {
            margin-bottom: 0;
          }

          .question-text {
            flex: 1;
            font-size: 14px;
            color: #303133;
            line-height: 1.6;
            margin-right: 12px;
          }

          .question-actions {
            display: flex;
            gap: 8px;
            flex-shrink: 0;

            :deep(.el-button) {
              min-width: 50px;
              padding: 5px 12px;
              font-size: 13px;
            }
          }
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
