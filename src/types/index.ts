// 用户类型
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  nickname: string
  createdAt: string
}

// 行程类型
export interface Trip {
  id: string
  title: string
  description: string
  destination: string
  startDate: string
  endDate: string
  coverImage?: string
  status: 'planning' | 'ongoing' | 'completed'
  createdBy: string
  members: TripMember[]
  itinerary: ItineraryItem[]
  createdAt: string
  updatedAt: string
}

// 行程成员
export interface TripMember {
  userId: string
  username: string
  avatar?: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
}

// 行程安排项
export interface ItineraryItem {
  id: string
  placeId?: number // 真实的地点ID
  day?: number // 天数
  tripId: string
  title: string
  description?: string
  location: string
  startTime: string
  endTime: string
  type: 'transport' | 'accommodation' | 'activity' | 'dining' | 'other'
  typeId?: number // 地点类型ID
  cost?: number
  notes?: string
  createdBy: string
  createdAt: string
}

// 账单类型
export interface Expense {
  id: string
  tripId: string
  title: string
  amount: number
  currency: string
  category: 'transport' | 'accommodation' | 'food' | 'activity' | 'shopping' | 'other'
  description?: string
  paidBy: string
  participants: string[]
  splitType: 'equal' | 'custom' | 'percentage'
  splits: ExpenseSplit[]
  receipt?: string
  date: string
  createdAt: string
}

// 账单分摊
export interface ExpenseSplit {
  userId: string
  amount: number
  percentage?: number
  settled: boolean
}

// 社区分享
export interface CommunityPost {
  id: string
  title: string
  description: string
  tripId: string
  authorId: string
  author: User
  trip: Trip
  likes: number
  views: number
  tags: string[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// API 响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}