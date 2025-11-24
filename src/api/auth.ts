import request from './index'
import type {
  LoginForm,
  LoginResponse,
  VerifyCodeRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateUsernameRequest,
  RefreshTokenResponse,
  ApiResponse,
  UserInfo,
} from '@/types'

// 登录
export const login = (data: LoginForm): Promise<LoginResponse> => {
  return request.post('/user/login', data) as Promise<LoginResponse>
}

// 刷新 Token
export const refreshToken = (refreshTokenStr: string): Promise<RefreshTokenResponse> => {
  return request.post('/user/refresh-token', null, {
    params: { refreshToken: refreshTokenStr },
  }) as Promise<RefreshTokenResponse>
}

// 注册
export const register = (data: any): Promise<any> => {
  return request.post('/auth/register', data)
}

// 获取用户信息
export const getUserInfo = (userId: number): Promise<UserInfo> => {
  return request.get('/user/info', {
    params: { userId },
  }) as Promise<UserInfo>
}

// 获取验证码（POST 方法，参数在 Query）
export const getVerifyCode = (data: VerifyCodeRequest): Promise<void> => {
  return request.post('/user/send-verify-code', null, { params: data })
}

// 重置密码（忘记密码）
export const resetPassword = (data: ResetPasswordRequest): Promise<ApiResponse<string>> => {
  return request.patch('/user/forget', data) as Promise<ApiResponse<string>>
}

// 修改用户名
export const updateUsername = (data: UpdateUsernameRequest): Promise<ApiResponse<string>> => {
  return request.patch('/user/change-username', data) as Promise<ApiResponse<string>>
}

// 修改密码
export const changePassword = (data: ChangePasswordRequest): Promise<ApiResponse<string>> => {
  return request.patch('/user/change-password', data) as Promise<ApiResponse<string>>
}

// 用户登出
export const logout = (refreshToken: string): Promise<ApiResponse> => {
  return request.delete('/user/logout', { params: { refreshToken } }) as Promise<ApiResponse>
}

// 批量注销用户所有登录会话
export const logoutAll = (userId: number): Promise<ApiResponse<string>> => {
  return request.delete('/user/logout-all', { params: { userId } }) as Promise<ApiResponse<string>>
}
