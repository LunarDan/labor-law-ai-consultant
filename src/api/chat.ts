import request from './index'
import type {
  ChatConsultRequest,
  ChatConsultResponse,
  SecondaryQuestionTitle,
  ChatHistoryMessage,
  ConversationMeta,
} from '@/types'

/**
 * AI问答咨询接口
 * @param data 咨询请求参数
 * @returns AI回复响应
 */
export const chatConsult = async (
  requestData: ChatConsultRequest,
): Promise<ChatConsultResponse> => {
  // 后端使用驼峰命名，直接传递
  const response = await request.post<any>('/chat/consult', requestData)

  // axios拦截器会返回 response.data.data，所以这里的response可能是：
  // 1. 字符串（或类数组对象）- 拦截器已经提取了data字段
  // 2. 完整对象 - 拦截器没有提取

  let aiReply = ''

  // 如果response是字符串
  if (typeof response === 'string') {
    aiReply = response
  } else if (typeof response === 'object' && response !== null) {
    // 检查是否是类数组对象（后端返回的特殊格式）
    if ('0' in response && !Array.isArray(response)) {
      aiReply = Object.values(response).join('')
    } else if (response.data) {
      // 如果有data字段
      aiReply = response.data
      if (typeof aiReply === 'object' && !Array.isArray(aiReply) && aiReply !== null) {
        aiReply = Object.values(aiReply).join('')
      }
    }
  }

  // 返回标准格式
  return {
    data: aiReply,
    conversationId: requestData.conversationId,
  }
}

/**
 * 查询常见问题二级标题
 * @param userType 用户类型（1: 个人用户, 2: 企业用户）
 * @returns 二级标题列表（二维数组）
 */
export const getSecondaryQuestionTitles = async (
  userType: 1 | 2,
): Promise<SecondaryQuestionTitle[][]> => {
  // 注意：axios拦截器已经处理了响应，返回的就是 response.data.data
  // 所以这里的 response 直接就是数据数组（二维数组）
  const response = await request.get(`/chat/secondary_question_titles/${userType}`)

  // response 本身就是二级标题数组（二维），不需要再访问 .data
  return (response as unknown as SecondaryQuestionTitle[][]) || []
}

/**
 * 查询对话记录
 * @param conversationId 对话ID
 * @returns 对话记录消息列表
 */
export const getChatHistory = async (conversationId: string): Promise<ChatHistoryMessage[]> => {
  // axios拦截器已经处理了响应，返回的就是 response.data.data
  const response = await request.get(`/chat/history`, {
    params: { conversationId },
  })

  // response 本身就是消息数组
  return (response as unknown as ChatHistoryMessage[]) || []
}

/**
 * 查询当前用户的全部历史对话元信息
 * @param userId 用户ID
 * @returns 对话元信息列表
 */
export const getChatHistories = async (userId: number): Promise<ConversationMeta[]> => {
  // axios拦截器已经处理了响应，返回的就是 response.data.data
  const response = await request.get(`/chat/histories`, {
    params: { userId },
  })

  // response 本身就是对话元信息数组
  return (response as unknown as ConversationMeta[]) || []
}

/**
 * 删除对话历史记录
 * @param conversationId 对话ID
 * @returns Promise<void>
 */
export const deleteChatHistory = async (conversationId: string): Promise<void> => {
  // axios拦截器已经处理了响应
  await request.delete(`/chat/history`, {
    params: { conversationId },
  })
}

/**
 * 创建新对话（初始化）
 * 用户进入AI咨询页面时调用，不需要传参数
 * @returns 初始的对话ID（字符串）
 */
export const createNewChat = async (): Promise<string> => {
  // axios拦截器已经处理了响应，返回的就是 response.data.data
  const response = await request.post(`/chat/newOr`)

  // response 本身就是新的 conversationId（字符串）
  return (response as unknown as string) || ''
}

/**
 * 创建新对话（带标题）
 * 用户发送第一个问题或点击新建对话时调用
 * @param title 对话标题（用户的第一个问题）
 * @param currentConversationId 当前对话ID（从 /chat/newOr 返回的ID）
 * @returns 新的对话ID（字符串）
 */
export const createNewChatWithTitle = async (
  title: string,
  currentConversationId: string,
): Promise<string> => {
  // axios拦截器已经处理了响应，返回的就是 response.data.data
  const response = await request.post(`/chat/new`, null, {
    params: {
      title,
      currentConversationId,
    },
  })

  // response 本身就是新的 conversationId（字符串）
  return (response as unknown as string) || ''
}

/**
 * AI问答咨询流式接口 - 使用 SSE (Server-Sent Events)
 * @param data 咨询请求参数
 * @param onMessage 接收流式消息的回调函数
 * @param onError 错误处理回调函数
 * @param onComplete 完成后的回调函数
 * @returns Promise<void>
 */
export const chatConsultStream = async (
  requestData: ChatConsultRequest,
  onMessage: (chunk: string) => void,
  onError: (error: Error) => void,
  onComplete: () => void,
): Promise<void> => {
  const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
  const token = localStorage.getItem('token')

  // 创建 AbortController 用于超时控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 120秒超时

  try {
    // 使用 fetch API 进行流式请求
    const response = await fetch(`${baseURL}/chat/consult/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(requestData),
      signal: controller.signal,
    })

    // 清除超时定时器
    clearTimeout(timeoutId)

    if (!response.ok) {
      // 尝试解析错误响应
      try {
        const errorData = await response.json()
        const errorMessage = errorData.message || `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      } catch (parseError) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    // 读取流式响应
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // 流结束
        clearTimeout(timeoutId)
        onComplete()
        break
      }

      // 解码当前块
      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk

      // 按行分割数据（SSE 格式）
      const lines = buffer.split('\n')
      // 保留最后一个不完整的行
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()

        // 跳过空行和注释
        if (!trimmedLine || trimmedLine.startsWith(':')) {
          continue
        }

        // 解析 SSE 数据格式：data: 内容
        if (trimmedLine.startsWith('data:')) {
          const data = trimmedLine.slice(5).trim()

          // SSE 流结束标记
          if (data === '[DONE]') {
            clearTimeout(timeoutId)
            onComplete()
            return
          }

          // 处理数据（可能是 JSON 或纯文本）
          try {
            // 尝试解析 JSON
            const jsonData = JSON.parse(data)
            if (jsonData.content || jsonData.data) {
              onMessage(jsonData.content || jsonData.data)
            } else {
              onMessage(data)
            }
          } catch {
            // 不是 JSON，直接作为文本处理
            onMessage(data)
          }
        }
      }
    }
  } catch (error: any) {
    clearTimeout(timeoutId)

    // 处理特定的错误类型
    if (error.name === 'AbortError') {
      onError(new Error('请求超时，请稍后重试'))
    } else if (
      error.message.includes('HttpConnectTimeoutException') ||
      error.message.includes('timed out')
    ) {
      onError(new Error('AI服务连接超时，请稍后重试'))
    } else {
      onError(error as Error)
    }
  }
}
