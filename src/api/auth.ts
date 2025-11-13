import request from './index'
import type {
  LoginForm,
  LoginResponse,
  VerifyCodeRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateUsernameRequest,
  RefreshTokenResponse,
  UserInfo,
  GetUserInfoResponse,
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
export const getUserInfo = (userId: number | string): Promise<UserInfo> => {
  // 根据API文档，参数名为userId，类型为integer
  return request.get<UserInfo>('/user/info', {
    params: { userId: parseInt(userId.toString()) },
  })
}

// 获取验证码（POST 方法，参数在 Query）
export const getVerifyCode = (data: VerifyCodeRequest): Promise<void> => {
  return request.post('/user/send-verify-code', null, { params: data })
}

// 重置密码（忘记密码）
export const resetPassword = (data: ResetPasswordRequest): Promise<void> => {
  return request.post('/user/forget', data)
}

// 修改用户名
export const updateUsername = (data: UpdateUsernameRequest): Promise<void> => {
  return request.post('/user/change-username', data)
}

// 修改密码
export const changePassword = (data: ChangePasswordRequest): Promise<void> => {
  return request.post('/user/change-password', data)
}

// 用户登出
export const logout = (refreshToken: string): Promise<void> => {
  return request.post('/user/logout', null, { params: { refreshToken } })
}
