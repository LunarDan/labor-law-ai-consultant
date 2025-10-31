import request from './index'
import type {
  LoginForm,
  LoginResponse,
  VerifyCodeRequest,
  ResetPasswordRequest,
  RefreshTokenResponse,
  UserInfo,
} from '@/types'

// 登录
export const login = (data: LoginForm): Promise<LoginResponse> => {
  return request.post('/auth/login', data)
}

// 刷新 Token
export const refreshToken = (refreshToken: string): Promise<RefreshTokenResponse> => {
  return request.post('/auth/refresh', { refreshToken })
}

// 注册
export const register = (data: any): Promise<any> => {
  return request.post('/auth/register', data)
}

// 获取用户信息
export const getUserInfo = (): Promise<UserInfo> => {
  return request.get('/auth/user')
}

// 获取验证码
export const getVerifyCode = (data: VerifyCodeRequest): Promise<void> => {
  return request.post('/auth/verify-code', data)
}

// 重置密码
export const resetPassword = (data: ResetPasswordRequest): Promise<void> => {
  return request.post('/auth/reset-password', data)
}
