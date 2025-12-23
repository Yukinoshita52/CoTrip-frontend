import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '@/api'
import type { UserVO } from '@/types/api'

export interface User {
  id?: number
  userId?: number
  username: string
  nickname?: string
  email?: string
  phone?: string
  avatarUrl?: string
  role?: number // 用户角色：0-普通用户，1-管理员
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)

  // 设置用户信息
  const setUser = (userData: User) => {
    user.value = userData
  }

  // 清除用户信息
  const clearUser = () => {
    user.value = null
    localStorage.removeItem('token')
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      return null
    }

    loading.value = true
    try {
      const res = await userApi.getCurrentUser()
      
      if (res.code === 200 && res.data) {
        // 处理头像URL，如果是相对路径则拼接完整地址
        let avatarUrl = res.data.avatarUrl
        if (avatarUrl && !avatarUrl.startsWith('http')) {
          const cleanPath = avatarUrl.startsWith('/') ? avatarUrl.substring(1) : avatarUrl
          avatarUrl = `http://121.40.23.40:9000/cotrip/${cleanPath}`
        }
        
        // 将后端返回的UserVO转换为前端User类型
        const userData: User = {
          id: res.data.id,
          userId: res.data.id, // 兼容性，同时设置userId
          username: res.data.username,
          nickname: res.data.nickname,
          phone: res.data.phone,
          avatarUrl: avatarUrl,
          role: res.data.role
        }
        
        user.value = userData
        return userData
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      clearUser()
    } finally {
      loading.value = false
    }
    return null
  }

  // 登出
  const logout = () => {
    clearUser()
  }

  return {
    user,
    loading,
    setUser,
    clearUser,
    fetchCurrentUser,
    logout
  }
})

