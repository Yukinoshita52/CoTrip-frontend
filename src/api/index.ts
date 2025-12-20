import { request } from '@/utils/api'
import type {
  ApiResponse,
  UserVO,
  AuthLoginVO,
  AuthRegisterVO,
  ImageUrlVO,
  InvitationVO,
  LoginRequest,
  RegisterRequest,
  UpdatePasswordRequest,
  UpdateNicknameRequest,
  UpdatePhoneRequest,
  DeleteAccountRequest
} from '@/types/api'

// 认证相关API
export const authApi = {
  // 登录 (identifier可以是用户名或手机号)
  login(identifier: string, password: string) {
    return request.post<AuthLoginVO>('/auth/login', {
      identifier,
      password
    })
  },

  // 注册
  register(data: RegisterRequest) {
    return request.post<AuthRegisterVO>('/auth/register', data)
  }
}

// 行程相关API
export const tripApi = {
  // 获取行程列表
  getTrips() {
    return request.get('/trips')
  },

  // 获取行程详情
  getTripById(tripId: number) {
    return request.get(`/trips/${tripId}`)
  },

  // 创建行程
  createTrip(data: any) {
    return request.post('/trips', data)
  },

  // 更新行程
  updateTrip(tripId: number, data: any) {
    return request.put(`/trips/${tripId}`, data)
  },

  // 删除行程
  deleteTrip(tripId: number) {
    return request.delete(`/trips/${tripId}`)
  },

  // 退出行程
  leaveTrip(tripId: number) {
    return request.post(`/trips/${tripId}/leave`)
  },

  // 一键规划行程路线
  autoPlanRoute(tripId: number) {
    return request.get(`/trips/${tripId}/auto-plan`)
  },

  // 批量导入地点
  importPlaces(tripId: number, text: string) {
    return request.post(`/trips/${tripId}/places/import`, { text })
  },

  // 删除地点
  deletePlace(tripId: number, placeId: number) {
    return request.delete(`/trips/${tripId}/places/${placeId}`)
  },

  // 更新地点信息
  updatePlace(tripId: number, placeId: number, data: { day: number; typeId?: number }) {
    return request.put(`/trips/${tripId}/places/${placeId}`, data)
  },

  // 更新地点顺序
  updatePlaceOrder(tripId: number, placeIds: number[]) {
    return request.put(`/trips/${tripId}/places/order`, placeIds)
  },

  // 获取地点建议
  getPlaceSuggestions(tripId: number, query: string) {
    return request.get(`/trips/${tripId}/places/suggestion`, {
      params: { query }
    })
  },

  // 添加地点到行程
  addPlaceToTrip(tripId: number, data: { uid: string; day: number; typeId?: number }) {
    return request.post(`/trips/${tripId}/places/add`, data)
  },

  // 获取地点详情
  getPlaceDetail(tripId: number, placeId: number) {
    return request.get(`/trips/${tripId}/places/${placeId}`)
  },

  // 创建邀请
  createInvitation(tripId: number, invitee: string) {
    return request.post(`/trips/${tripId}/invitations`, { invitee })
  },

  // 获取行程邀请列表
  getTripInvitations(tripId: number) {
    return request.get(`/trips/${tripId}/invitations`)
  }
}

// 记账相关API
export const expenseApi = {
  // 创建账本
  createAccountBook(data: { tripId: number; name: string }) {
    return request.post('/account/book', data)
  },

  // 获取账本列表
  getAllAccountBooks() {
    return request.get('/account/book/list')
  },

  // 删除账本
  deleteAccountBook(bookId: number) {
    return request.delete(`/account/book/${bookId}`)
  },

  // 获取账单列表
  getRecords(bookId: number, page: number = 1, size: number = 10) {
    return request.get('/account/record/list', {
      params: { bookId, page, size }
    })
  },

  // 获取账单详情
  getRecord(recordId: number) {
    return request.get(`/account/record/${recordId}`)
  },

  // 创建账单
  createRecord(data: any) {
    return request.post('/account/record', data)
  },

  // 更新账单
  updateRecord(recordId: number, data: any) {
    return request.put(`/account/record/${recordId}`, data)
  },

  // 删除账单
  deleteRecord(recordId: number) {
    return request.delete(`/account/record/${recordId}`)
  },

  // 获取账本统计
  getBookStats(bookId: number) {
    return request.get(`/account/book/${bookId}/stats`)
  },

  // 获取分摊金额
  splitAmount(bookId: number) {
    return request.get(`/account/book/${bookId}/split`)
  },

  // 添加分类
  addCategory(name: string, type: number, file?: File) {
    const formData = new FormData()
    formData.append('name', name)
    formData.append('type', type.toString())
    if (file) {
      formData.append('file', file)
    }
    return request.post('/account/category', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

// 社区相关API
export const communityApi = {
  // 获取内容流Feed
  getFeed(page: number = 1, size: number = 10) {
    return request.get('/community/feed', {
      params: { page, size }
    })
  },

  // 获取帖子详情
  getPostDetail(postId: number) {
    return request.get(`/community/post/${postId}`)
  },

  // 创建帖子
  createPost(data: any) {
    return request.post('/community/post', data)
  },

  // 删除帖子
  deletePost(postId: number) {
    return request.delete(`/community/post/${postId}`)
  },

  // 获取评论列表
  getComments(postId: number) {
    return request.get(`/community/post/${postId}/comments`)
  },

  // 添加评论
  addComment(data: any) {
    return request.post('/community/comment', data)
  },

  // 删除评论
  deleteComment(commentId: number) {
    return request.delete(`/community/comment/${commentId}`)
  },

  // 点赞
  likePost(postId: number) {
    return request.post(`/community/post/${postId}/like`)
  },

  // 取消点赞
  unlikePost(postId: number) {
    return request.delete(`/community/post/${postId}/like`)
  },

  // 获取点赞用户列表
  getPostLikes(postId: number) {
    return request.get(`/community/post/${postId}/likes`)
  },

  // 获取用户主页
  getUserProfile(userId: number) {
    return request.get(`/community/user/${userId}`)
  },

  // 搜索帖子
  searchPosts(keyword: string) {
    return request.get('/community/search', {
      params: { keyword }
    })
  },

  // 搜索用户
  searchUsers(keyword: string) {
    return request.get('/community/search/user', {
      params: { keyword }
    })
  }
}

// 图片上传相关API
export const imageApi = {
  // 上传图片
  uploadImage(file: File, itemType: number = 4, itemId: number = 0) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('itemType', itemType.toString())
    formData.append('itemId', itemId.toString())
    return request.post<ImageUrlVO>('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取图片URL
  getImageUrl(imageId: number) {
    return request.get<ImageUrlVO>(`/images/${imageId}`)
  },

  // 删除图片
  deleteImage(imageId: number) {
    return request.delete<void>(`/images/${imageId}`)
  },

  // 上传行程封面图片
  uploadTripCover(file: File, tripId: number) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<ImageUrlVO>(`/images/trip/${tripId}/cover`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 获取行程封面图片
  getTripCover(tripId: number) {
    return request.get<ImageUrlVO>(`/images/trip/${tripId}/cover`)
  },

  // 删除行程封面图片
  deleteTripCover(tripId: number) {
    return request.delete<void>(`/images/trip/${tripId}/cover`)
  }
}

// 用户相关API
export const userApi = {
  // 获取当前用户信息
  getCurrentUser() {
    return request.get<UserVO>('/user')
  },

  // 修改密码
  updatePassword(oldPassword: string, newPassword: string) {
    return request.put<void>('/user/password', { oldPassword, newPassword })
  },

  // 修改昵称
  updateNickname(nickname: string) {
    return request.put<void>('/user/nickname', { nickname })
  },

  // 上传头像
  uploadAvatar(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return request.put<ImageUrlVO>('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 修改手机号
  updatePhone(phone: string) {
    return request.put<void>('/user/phone', { phone })
  },

  // 注销账号
  deleteAccount(password: string) {
    return request.delete<void>('/user', { data: { password } })
  }
}



// 邀请相关API
export const invitationApi = {
  // 获取我发出的邀请
  getSentInvitations() {
    return request.get<InvitationVO[]>('/invitations/sent')
  },

  // 获取我收到的邀请
  getReceivedInvitations() {
    return request.get<InvitationVO[]>('/invitations/received')
  },

  // 接受邀请
  acceptInvitation(invitationId: number) {
    return request.post<void>(`/invitations/${invitationId}/accept`)
  },

  // 拒绝邀请
  rejectInvitation(invitationId: number) {
    return request.post<void>(`/invitations/${invitationId}/reject`)
  },

  // 撤销邀请（发出的邀请）
  cancelInvitation(invitationId: number) {
    return request.delete<void>(`/invitations/${invitationId}`)
  },

  // 删除收到的邀请
  deleteReceivedInvitation(invitationId: number) {
    return request.delete<void>(`/invitations/received/${invitationId}`)
  }
}

// 地点类型相关API
export const placeTypeApi = {
  // 获取所有地点类型
  getAllPlaceTypes() {
    return request.get('/place-types')
  },

  // 分页获取地点类型
  getPlaceTypes(page: number = 1, size: number = 10) {
    return request.get('/place-types/page', {
      params: { page, size }
    })
  }
}

// 公告相关API
export const announcementApi = {
  // 获取公告列表
  getAnnouncements() {
    return request.get('/announcement')
  },

  // 获取公告详情
  getAnnouncementById(id: number) {
    return request.get(`/announcement/${id}`)
  },

  // 获取最新公告
  getLatestAnnouncements(count: number = 5) {
    return request.get('/announcement/latest', {
      params: { count }
    })
  },

  // 搜索公告
  searchAnnouncements(keyword: string) {
    return request.get('/announcement/search', {
      params: { keyword }
    })
  }
}

