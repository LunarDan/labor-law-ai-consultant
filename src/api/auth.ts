import request from './index'
import type {
  LoginForm,
  LoginResponse,
  VerifyCodeRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  RefreshTokenResponse,
  UserInfo,
} from '@/types'

// 登录
export const login = (data: LoginForm): Promise<LoginResponse> => {
  return request.post('/user/login', data)
}

// 刷新 Token
export const refreshToken = (refreshToken: string): Promise<RefreshTokenResponse> => {
  return request.get('/user/refresh-token', { params: { refreshToken } })
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
  return request.get('/user/send-verify-code', { params: data })
}

// 重置密码（忘记密码）
export const resetPassword = (data: ResetPasswordRequest): Promise<void> => {
  return request.post('/user/forget', data)
}

// 修改用户名
export const updateUsername = (data: { username: string }): Promise<void> => {
  return request.put('/auth/username', data)
}

// 修改密码
export const changePassword = (data: ChangePasswordRequest): Promise<void> => {
  return request.post('/user/change-password', data)
}
