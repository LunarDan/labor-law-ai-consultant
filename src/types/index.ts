// 用户类型 (1代表个人用户, 2代表企业用户)
export type UserType = '1' | '2'

// 用户信息
export interface UserInfo {
  id?: string
  userId?: string
  username: string
  phone?: string
  email?: string
  userType?: UserType
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
  userId: string
  oldPassword: string
  newPassword: string
}

// API响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 登录响应（双 Token）- 后端返回的是扁平结构
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  userId: string
  username: string
  id: number
  // 注意：后端返回的是扁平结构，不是嵌套的 userInfo 对象
}

// 刷新 Token 响应
export interface RefreshTokenResponse {
  accessToken: string
  refreshToken?: string // 可选：后端可能返回新的 refreshToken
}
