// 用户类型
export type UserType = 'personal' | 'enterprise'

// 用户信息
export interface UserInfo {
  id?: string
  username: string
  phone?: string
  email?: string
  userType?: UserType
}

// 登录表单
export interface LoginForm {
  userType: UserType
  phone: string
  password: string
  rememberMe?: boolean
}

// 忘记密码表单
export interface ForgotPasswordForm {
  phone: string
  code: string
  newPassword: string
  confirmPassword: string
}

// 验证码请求
export interface VerifyCodeRequest {
  phone: string
}

// 重置密码请求
export interface ResetPasswordRequest {
  phone: string
  code: string
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
  userInfo: UserInfo
}

// 刷新 Token 响应
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken?: string // 可选：后端可能返回新的 refreshToken
}
