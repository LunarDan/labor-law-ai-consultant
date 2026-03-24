// 用户类型 (1代表个人用户, 2代表企业用户)
export type UserType = '1' | '2'

// 用户信息
export interface UserInfo {
  id?: number // ID编号
  userId?: string | null // 用户ID
  username: string
  phone?: string
  email?: string
  userType?: UserType
  createdAt?: string
  updatedAt?: string
}

// 获取用户信息响应
export interface GetUserInfoResponse {
  code: number
  message: string
  data: UserInfo
}

// 登录表单
export interface LoginForm {
  phone: string
  password: string
  userType: UserType
  clientId: string
  rememberMe?: boolean // 记住我的登录状态
}

// 忘记密码表单
export interface ForgotPasswordForm {
  phone: string
  verifyCode: string
  newPassword: string
  confirmPassword: string
}

// 验证码请求
export interface VerifyCodeRequest {
  phone: string
}

// 重置密码请求（忘记密码）
export interface ResetPasswordRequest {
  phone: string
  verifyCode: string
  newPassword: string
}

// 修改密码请求
export interface ChangePasswordRequest {
  userId: number
  oldPassword: string
  newPassword: string
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 登录响应（双 Token）
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  userId: string
  username: string
  id: number
}

// 刷新 Token 响应数据
export interface RefreshTokenData {
  id: number | null
  userId: string
  username: string
  accessToken: string
  refreshToken: string
  success: boolean
  timestamp: number
}

// 刷新 Token 响应
export interface RefreshTokenResponse {
  code: number
  message: string
  data: RefreshTokenData
  success: boolean
  timestamp: number
}

// 修改用户名请求
export interface UpdateUsernameRequest {
  userId: number
  newUsername: string
}

// AI 聊天请求
export interface ChatConsultRequest {
  id: number
  userType: 0 | 1
  conversationId: string
  message: string
}

// AI 聊天响应
export interface ChatConsultResponse {
  code?: number
  message?: string
  data?: string // AI 回复内容
  success?: boolean
  timestamp?: number
  conversationId?: string // 对话ID
  [key: string]: any // 其他可能的字段
}

// 二级标题项
export interface SecondaryQuestionTitle {
  title: string // 问题标题
  primaryTag: string // 一级标签/分类
}

// 查询二级标题响应
export interface SecondaryQuestionTitlesResponse {
  code: number
  message: string
  data: SecondaryQuestionTitle[][]
  success: boolean
  timestamp: number
}

// 对话记录消息项
export interface ChatHistoryMessage {
  role: string // 角色：user 或 ai
  content: string // 消息内容
  timestamp: string // 时间戳
}

// 查询对话记录响应
export interface ChatHistoryResponse {
  code: number
  message: string
  data: ChatHistoryMessage[] // 消息列表
  success: boolean
  timestamp: number
}

// 对话元信息
export interface ConversationMeta {
  conversationId: string // 对话ID
  userId: number // 用户ID
  title: string // 对话标题
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
}

// 查询历史对话元信息响应
export interface ChatHistoriesResponse {
  code: number
  message: string
  data: ConversationMeta[] // 对话元信息列表
  success: boolean
  timestamp: number
}
