import request from './index'

// 合同审查结果接口
export interface ReviewResult {
  id: string
  filename: string
  review: string
}

/**
 * 提交内容审查
 * @param text 合同文本内容
 * @param conversationId 对话ID
 * @param fileName 文件名
 * @returns 审查结果
 */
export const submitFileReview = async (
  text: string,
  conversationId: string,
  fileName: string,
): Promise<ReviewResult> => {
  // axios拦截器已经处理了响应，返回的就是 response.data.data
  const response = await request.post<ReviewResult>(`/file/review`, {
    text,
    conversationId,
    fileName,
  })

  // response 本身就是审查结果数据
  return response
}

/**
 * 获取对话ID
 * @returns 对话ID字符串
 */
export const getConversationId = async (): Promise<string> => {
  // axios拦截器已经处理了响应，返回的就是 response.data.data
  const response = await request.post<string>(`/file/review/getId`)

  // response 本身就是对话ID字符串
  return response || ''
}

// 保存审查记录的响应接口
export interface SaveRecordResponse {
  code: number
  message: string
  data: string
  success: boolean
  timestamp: number
}

// 审查记录详情数据结构
export interface FileReviewRecordVO {
  recordId: string
  fileName: string
  reviewContent: string
  createTime: number
  updateTime: number
}

// 获取审查记录详情的响应接口
export interface GetRecordDetailResponse {
  code: number
  message: string
  data: FileReviewRecordVO
  success: boolean
  timestamp: number
}

// 删除审查记录的响应接口
export interface DeleteRecordResponse {
  code: number
  message: string
  data: null
  success: boolean
  timestamp: number
}

// 审查记录列表数据结构
export interface ReviewRecordListVO {
  records: FileReviewRecordVO[]
}

// 获取审查记录列表的响应接口
export interface GetRecordListResponse {
  code: number
  message: string
  data: ReviewRecordListVO
  success: boolean
  timestamp: number
}

// 保存审查记录的请求参数接口
export interface SaveRecordRequest {
  reviewContent: string
  fileName: string
  conversationId?: string
  recordId?: string
}

/**
 * 保存审查记录
 * @param params 保存参数
 * @param flag 标志位
 * @returns 保存结果
 */
export const saveReviewRecord = async (
  params: SaveRecordRequest,
  flag: boolean = true,
): Promise<SaveRecordResponse> => {
  try {
    // 直接使用axios发起请求，不经过拦截器处理
    const response = await request.post(`/file/review/record?flag=${flag}`, params)

    // 如果拦截器返回的是完整响应数据，直接返回
    if (response && typeof response === 'object') {
      // 如果有success字段，说明是完整的响应对象
      if ('success' in response) {
        return response as SaveRecordResponse
      }

      // 如果没有success字段，构造一个默认的响应对象
      return {
        code: 200,
        message: '保存成功',
        data: response.toString(),
        success: true,
        timestamp: Date.now(),
      } as SaveRecordResponse
    }

    // 如果返回的不是对象，构造一个默认响应
    return {
      code: 200,
      message: '保存成功',
      data: response?.toString() || '',
      success: true,
      timestamp: Date.now(),
    } as SaveRecordResponse
  } catch (error: any) {
    // 处理错误情况
    return {
      code: error.response?.status || 500,
      message: error.response?.data?.message || error.message || '保存失败',
      data: '',
      success: false,
      timestamp: Date.now(),
    } as SaveRecordResponse
  }
}

/**
 * 获取指定的审查记录详情
 * @param recordId 记录ID
 * @returns 审查记录详情
 */
export const getReviewRecordDetail = async (recordId: string): Promise<GetRecordDetailResponse> => {
  try {
    // 验证recordId参数
    if (!recordId || typeof recordId !== 'string') {
      return {
        code: 400,
        message: '记录ID不能为空',
        data: {} as FileReviewRecordVO,
        success: false,
        timestamp: Date.now(),
      }
    }

    // 发送GET请求获取记录详情
    const response = await request.get(
      `/file/review/record?recordId=${encodeURIComponent(recordId)}`,
    )

    // 如果拦截器返回的是完整响应数据，直接返回
    if (response && typeof response === 'object') {
      // 如果有success字段，说明是完整的响应对象
      if ('success' in response && 'data' in response) {
        return response as GetRecordDetailResponse
      }

      // 如果没有success字段但有data，构造响应对象
      if ('recordId' in response || 'fileName' in response) {
        return {
          code: 200,
          message: '获取成功',
          data: response as FileReviewRecordVO,
          success: true,
          timestamp: Date.now(),
        }
      }
    }

    // 其他情况，返回默认错误
    return {
      code: 500,
      message: '数据格式异常',
      data: {} as FileReviewRecordVO,
      success: false,
      timestamp: Date.now(),
    }
  } catch (error: any) {
    // 处理错误情况
    const errorCode = error.response?.status || 500
    const errorMessage = error.response?.data?.message || error.message || '获取记录详情失败'

    return {
      code: errorCode,
      message: errorMessage,
      data: {} as FileReviewRecordVO,
      success: false,
      timestamp: Date.now(),
    }
  }
}

/**
 * 获取用户的文件审查记录列表
 * @returns 审查记录列表
 */
export const getReviewRecordList = async (): Promise<GetRecordListResponse> => {
  try {
    // 发送GET请求获取记录列表
    const response = await request.get('/file/review/records')

    // 如果拦截器返回的是完整响应数据，直接返回
    if (response && typeof response === 'object') {
      // 如果有success字段，说明是完整的响应对象
      if ('success' in response && 'data' in response) {
        return response as GetRecordListResponse
      }

      // 如果没有success字段但有records数组，构造响应对象
      if ('records' in response || Array.isArray(response)) {
        const records = Array.isArray(response) ? response : response.records || []
        return {
          code: 200,
          message: '获取成功',
          data: { records },
          success: true,
          timestamp: Date.now(),
        }
      }
    }

    // 其他情况，返回空列表
    return {
      code: 200,
      message: '获取成功',
      data: { records: [] },
      success: true,
      timestamp: Date.now(),
    }
  } catch (error: any) {
    // 处理错误情况
    const errorCode = error.response?.status || 500
    const errorMessage = error.response?.data?.message || error.message || '获取记录列表失败'

    return {
      code: errorCode,
      message: errorMessage,
      data: { records: [] },
      success: false,
      timestamp: Date.now(),
    }
  }
}

/**
 * 删除指定的审查记录
 * @param recordId 记录ID
 * @returns 删除结果
 */
export const deleteReviewRecord = async (recordId: string): Promise<DeleteRecordResponse> => {
  try {
    // 验证recordId参数
    if (!recordId || typeof recordId !== 'string') {
      return {
        code: 400,
        message: '记录ID不能为空',
        data: null,
        success: false,
        timestamp: Date.now(),
      }
    }

    // 发送DELETE请求删除记录
    const response = await request.delete(
      `/file/review/record?recordId=${encodeURIComponent(recordId)}`,
    )

    // 如果拦截器返回的是完整响应数据，直接返回
    if (response && typeof response === 'object') {
      // 如果有success字段，说明是完整的响应对象
      if ('success' in response) {
        return response as DeleteRecordResponse
      }

      // 如果没有success字段，构造响应对象
      return {
        code: 200,
        message: '删除成功',
        data: null,
        success: true,
        timestamp: Date.now(),
      }
    }

    // 其他情况，返回默认成功
    return {
      code: 200,
      message: '删除成功',
      data: null,
      success: true,
      timestamp: Date.now(),
    }
  } catch (error: any) {
    // 处理错误情况
    const errorCode = error.response?.status || 500
    const errorMessage = error.response?.data?.message || error.message || '删除记录失败'

    return {
      code: errorCode,
      message: errorMessage,
      data: null,
      success: false,
      timestamp: Date.now(),
    }
  }
}

// 文件解析结果接口
export interface FileParseResult {
  text: string
  fileName: string
}

/**
 * 解析文件内容
 * @param file 要解析的文件
 * @returns 解析结果（包含文本内容和文件名）
 */
export const parseFileContent = async (file: File): Promise<FileParseResult> => {
  // 创建FormData对象
  const formData = new FormData()
  formData.append('file', file)

  // 发送文件解析请求
  const response = await request.post<FileParseResult>(`/file/upAndwrite`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  // response 本身就是解析结果数据
  return response
}
