// API 响应类型定义

// 通用响应结构
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

// 用户相关类型
export interface UserVO {
  id: number
  username: string
  nickname: string
  avatarUrl: string
  phone: string
  role?: number // 用户角色：0-普通用户，1-管理员
}

export interface AuthLoginVO {
  userId: number
  token: string
  avatarUrl: string
}

export interface AuthRegisterVO {
  userId: number
  username: string
}

export interface ImageUrlVO {
  url: string
}

// 邀请相关类型
export interface InvitationVO {
  invitationId: number
  tripId: number
  inviterId: number
  inviterNickname: string
  inviterAvatarUrl: string
  inviterPhone: string
  invitee: string
  inviteeNickname?: string // 被邀请人昵称
  inviteeAvatarUrl?: string // 被邀请人头像URL
  status: number // 0-待接受，1-已接受，2-已拒绝，3-已过期
  sentTime: string
  tripName?: string 
}

// 社区相关类型
export interface AuthorVO {
  userId: number
  nickname: string
  avatar?: string
  username?: string
}

export interface SearchUserVO {
  keyword: string
  users: AuthorVO[]
}

// 评论相关类型
export interface CommentVO {
  commentId: number
  user: AuthorVO
  content: string
  createTime: string
  parentId?: number
  children?: CommentVO[]
}

export interface CommentListVO {
  postId: number
  comments: CommentVO[]
}

export interface CommentDTO {
  postId: number
  content: string
  parentId?: number
}

export interface CommentCreatedVO {
  commentId: number
  postId: number
  createTime: string
}

// 请求参数类型
export interface LoginRequest {
  identifier: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  confirmPassword: string
}

export interface UpdatePasswordRequest {
  oldPassword: string
  newPassword: string
}

export interface UpdateNicknameRequest {
  nickname: string
}

export interface UpdatePhoneRequest {
  phone: string
}

export interface DeleteAccountRequest {
  password: string
}