import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '@/api'

export interface User {
  id?: number
  userId?: number
  username: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
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
        user.value = res.data
        return res.data
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

