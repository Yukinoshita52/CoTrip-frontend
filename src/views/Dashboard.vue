<template>
  <Layout>
    <div class="dashboard">
      <!-- 统计卡片 -->
      <el-row :gutter="24" class="stats-row">
        <!-- 管理员统计 -->
        <template v-if="isAdmin">
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon users">
                  <el-icon><User /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ adminStats.totalUsers }}</div>
                  <div class="stat-label">用户总数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon trips">
                  <el-icon><MapLocation /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ adminStats.totalTrips }}</div>
                  <div class="stat-label">行程总数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="8">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon posts">
                  <el-icon><ChatDotSquare /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ adminStats.totalPosts }}</div>
                  <div class="stat-label">社区帖子总数</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </template>
        
        <!-- 普通用户统计 -->
        <template v-else>
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon trips">
                  <el-icon><MapLocation /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ stats.totalTrips }}</div>
                  <div class="stat-label">总行程数</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon expenses">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">¥{{ stats.totalExpenses }}</div>
                  <div class="stat-label">总支出</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon ongoing">
                  <el-icon><Timer /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ stats.ongoingTrips }}</div>
                  <div class="stat-label">进行中</div>
                </div>
              </div>
            </el-card>
          </el-col>
          
          <el-col :span="6">
            <el-card class="stat-card">
              <div class="stat-content">
                <div class="stat-icon community">
                  <el-icon><Share /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-number">{{ stats.sharedTrips }}</div>
                  <div class="stat-label">已分享</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </template>
      </el-row>

      <!-- 快速操作（仅普通用户显示） -->
      <el-row :gutter="24" class="quick-actions" v-if="!isAdmin">
        <el-col :span="24">
          <el-card>
            <template #header>
              <span>快速操作</span>
            </template>
            <div class="action-buttons">
              <el-button type="primary" @click="$router.push('/trips/create')">
                <el-icon><Plus /></el-icon>
                创建新行程
              </el-button>
              <el-button @click="$router.push('/expenses/create')">
                <el-icon><Money /></el-icon>
                添加账单
              </el-button>
              <el-button @click="$router.push('/community')">
                <el-icon><View /></el-icon>
                浏览社区
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 公告 -->
      <el-row :gutter="24" class="announcements-row" v-if="announcements.length > 0">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最新公告</span>
                <el-button text @click="showAllAnnouncements = true">查看全部</el-button>
              </div>
            </template>
            <div class="announcements-list">
              <div v-for="announcement in announcements.slice(0, 3)" :key="announcement.id" class="announcement-item">
                <el-icon class="announcement-icon"><Bell /></el-icon>
                <div class="announcement-content">
                  <div class="announcement-title">{{ announcement.title }}</div>
                  <div class="announcement-time">{{ formatDate(announcement.publishTime) }}</div>
                </div>
                <el-button text @click="viewAnnouncement(announcement.id)">查看详情</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近行程和账单（仅普通用户显示） -->
      <el-row :gutter="24" v-loading="loading" v-if="!isAdmin">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最近行程</span>
                <el-button text @click="$router.push('/trips')">查看全部</el-button>
              </div>
            </template>
            <div class="recent-trips">
              <el-empty v-if="!loading && recentTrips.length === 0" description="暂无行程" :image-size="80" />
              <div v-for="trip in recentTrips" :key="trip.id" class="trip-item" v-else>
                <div class="trip-info">
                  <div class="trip-title">{{ trip.title }}</div>
                  <div class="trip-meta">
                    <span>{{ trip.destination }}</span>
                    <el-tag :type="getTripStatusType(trip.status)" size="small">
                      {{ getTripStatusText(trip.status) }}
                    </el-tag>
                  </div>
                </div>
                <el-button text @click="$router.push(`/trips/${trip.id}`)">
                  查看详情
                </el-button>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最近账单</span>
                <el-button text @click="$router.push('/expenses')">查看全部</el-button>
              </div>
            </template>
            <div class="recent-expenses">
              <el-empty v-if="!loading && recentExpenses.length === 0" description="暂无账单" :image-size="80" />
              <div v-for="expense in recentExpenses" :key="expense.id" class="expense-item" v-else>
                <div class="expense-info">
                  <div class="expense-title">{{ expense.title }}</div>
                  <div class="expense-amount">¥{{ expense.amount }}</div>
                </div>
                <div class="expense-meta">
                  <el-tag size="small">{{ getCategoryText(expense.category) }}</el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 公告详情对话框 -->
    <el-dialog v-model="showAnnouncementDialog" title="公告详情" width="600px" v-if="currentAnnouncement">
      <div class="announcement-detail">
        <h3>{{ currentAnnouncement.title }}</h3>
        <div class="announcement-meta">
          <span>发布时间：{{ formatDate(currentAnnouncement.publishTime) }}</span>
        </div>
        <div class="announcement-content-text" v-html="currentAnnouncement.content"></div>
      </div>
    </el-dialog>

    <!-- 全部公告对话框 -->
    <el-dialog v-model="showAllAnnouncements" title="全部公告" width="800px">
      <div class="all-announcements">
        <div v-for="announcement in announcements" :key="announcement.id" class="announcement-item-full">
          <div class="announcement-header">
            <h4>{{ announcement.title }}</h4>
            <span class="announcement-time">{{ formatDate(announcement.publishTime) }}</span>
          </div>
          <div class="announcement-content-preview">{{ announcement.content }}</div>
          <el-button text @click="viewAnnouncement(announcement.id)">查看详情</el-button>
        </div>
        <el-empty v-if="announcements.length === 0" description="暂无公告" />
      </div>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElDialog } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { Trip, Expense } from '@/types'
import { tripApi, expenseApi, announcementApi, communityApi, adminApi } from '@/api'
import { useUserStore } from '@/stores/user'
import dayjs from 'dayjs'

const loading = ref(false)
const userStore = useUserStore()
// 直接从userStore中的role字段判断是否是管理员
const isAdmin = computed(() => {
  return userStore.user?.role === 1
})

// 管理员统计数据
const adminStats = ref({
  totalUsers: 0,
  totalTrips: 0,
  totalPosts: 0
})

// 普通用户统计数据
const stats = ref({
  totalTrips: 0,
  totalExpenses: 0,
  ongoingTrips: 0,
  sharedTrips: 0
})

// 所有行程
const allTrips = ref<Trip[]>([])
// 所有账本
const accountBooks = ref<any[]>([])
// 所有账单
const allExpenses = ref<Expense[]>([])

// 公告
const announcements = ref<any[]>([])
const showAllAnnouncements = ref(false)
const currentAnnouncement = ref<any>(null)
const showAnnouncementDialog = ref(false)

// 最近行程（取前5个）
const recentTrips = computed(() => {
  return allTrips.value
    .sort((a, b) => {
      const dateA = dayjs(a.createdAt || a.updatedAt)
      const dateB = dayjs(b.createdAt || b.updatedAt)
      return dateB.diff(dateA)
    })
    .slice(0, 5)
})

// 最近账单（取前5个）
const recentExpenses = computed(() => {
  return allExpenses.value
    .sort((a, b) => {
      const dateA = dayjs(a.date || a.createdAt)
      const dateB = dayjs(b.date || b.createdAt)
      return dateB.diff(dateA)
    })
    .slice(0, 5)
})

// 加载管理员统计数据
const loadAdminStats = async () => {
  try {
    const statsRes = await adminApi.getStatistics()
    if (statsRes.code === 200 && statsRes.data) {
      adminStats.value = {
        totalUsers: statsRes.data.totalUsers || 0,
        totalTrips: statsRes.data.totalTrips || 0,
        totalPosts: statsRes.data.totalPosts || 0
      }
    }
  } catch (error) {
    console.error('加载管理员统计数据失败:', error)
  }
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    // 如果用户信息不存在，先获取用户信息
    if (!userStore.user && localStorage.getItem('token')) {
      await userStore.fetchCurrentUser()
    }
    
    // 如果是管理员，加载管理员统计数据和公告数据
    if (isAdmin.value) {
      await Promise.all([
        loadAdminStats(),
        announcementApi.getLatestAnnouncements(5).catch(() => ({ code: 200, data: [] }))
      ]).then(([_, announcementsRes]) => {
        if (announcementsRes.code === 200 && announcementsRes.data) {
          announcements.value = Array.isArray(announcementsRes.data) ? announcementsRes.data : []
        }
      })
      loading.value = false
      return
    }
    
    // 普通用户加载原有数据
    // 并行加载所有数据
    const [tripsRes, booksRes, announcementsRes] = await Promise.all([
      tripApi.getTrips().catch(() => ({ code: 200, data: [] })),
      expenseApi.getAllAccountBooks().catch(() => ({ code: 200, data: [] })),
      announcementApi.getLatestAnnouncements(5).catch(() => ({ code: 200, data: [] }))
    ])
    
    // 处理行程数据
    if (tripsRes.code === 200 && tripsRes.data) {
      const tripsData = Array.isArray(tripsRes.data) ? tripsRes.data : []
      allTrips.value = tripsData.map((trip: any) => {
        const startDate = trip.startDate || trip.start_date
        const endDate = trip.endDate || trip.end_date
        const now = dayjs()
        const start = dayjs(startDate)
        const end = dayjs(endDate)
        
        let status = 'planning'
        if (startDate && endDate) {
          if (now.isAfter(end)) {
            status = 'completed'
          } else if (now.isAfter(start) && now.isBefore(end)) {
            status = 'ongoing'
          }
        }
        
        return {
          id: String(trip.tripId || trip.id || ''),
          title: trip.name || trip.title || '',
          description: trip.description || '',
          destination: trip.region || trip.destination || '',
          startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : '',
          endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : '',
          status: trip.status || status,
          coverImage: trip.coverImage || trip.coverImageUrl || '',
          createdBy: String(trip.createdBy || trip.userId || ''),
          members: trip.members || trip.participants || [],
          itinerary: trip.itinerary || trip.places || [],
          createdAt: trip.createdTime ? dayjs(trip.createdTime).format('YYYY-MM-DD') : '',
          updatedAt: trip.updatedTime ? dayjs(trip.updatedTime).format('YYYY-MM-DD') : ''
        }
      })
    }
    
    // 处理账本数据
    if (booksRes.code === 200 && booksRes.data) {
      accountBooks.value = Array.isArray(booksRes.data) ? booksRes.data : []
      
      // 加载每个账本的账单
      const expensePromises = accountBooks.value.map((book: any) =>
        expenseApi.getRecords(book.id || book.bookId, 1, 100).catch(() => ({ code: 200, data: { items: [] } }))
      )
      
      const expenseResults = await Promise.all(expensePromises)
      
      // 合并所有账单
      allExpenses.value = []
      expenseResults.forEach((res: any) => {
        if (res.code === 200 && res.data) {
          const items = res.data.items || res.data.list || []
          items.forEach((record: any) => {
            // 只处理支出类型（type === 2），收入类型（type === 1）不计入支出统计
            if (record.type === 2) {
              // 根据 categoryName 映射到前端类别，如果没有则使用 'other'
              let category: 'transport' | 'accommodation' | 'food' | 'activity' | 'shopping' | 'other' = 'other'
              const categoryName = (record.categoryName || '').toLowerCase()
              if (categoryName.includes('交通') || categoryName.includes('transport')) {
                category = 'transport'
              } else if (categoryName.includes('住宿') || categoryName.includes('accommodation') || categoryName.includes('酒店')) {
                category = 'accommodation'
              } else if (categoryName.includes('餐饮') || categoryName.includes('food') || categoryName.includes('美食')) {
                category = 'food'
              } else if (categoryName.includes('活动') || categoryName.includes('activity')) {
                category = 'activity'
              } else if (categoryName.includes('购物') || categoryName.includes('shopping')) {
                category = 'shopping'
              }
              
              allExpenses.value.push({
                id: String(record.recordId || record.id || ''),
                tripId: String(record.bookId || record.tripId || ''),
                title: record.categoryName || record.note || '未命名',
                amount: Number(record.amount || 0),
                currency: 'CNY',
                category: category,
                paidBy: record.user?.userId ? String(record.user.userId) : '',
                participants: [],
                splitType: 'equal',
                splits: [],
                date: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : '',
                createdAt: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : ''
              })
            }
          })
        }
      })
    }
    
    // 计算统计数据
    stats.value.totalTrips = allTrips.value.length
    stats.value.ongoingTrips = allTrips.value.filter(t => t.status === 'ongoing').length
    stats.value.totalExpenses = allExpenses.value
      .reduce((sum, e) => sum + e.amount, 0)
    // 获取已分享的行程数量
    try {
      const communityRes = await communityApi.getFeed(1, 100).catch(() => ({ code: 200, data: { list: [] } }))
      if (communityRes.code === 200 && communityRes.data) {
        const myPosts = (communityRes.data.list || []).filter((post: any) => 
          post.author?.userId === userStore.user?.userId || post.author?.userId === userStore.user?.id
        )
        stats.value.sharedTrips = myPosts.length
      } else {
        stats.value.sharedTrips = 0
      }
    } catch (error) {
      stats.value.sharedTrips = 0
    }
    
    // 处理公告数据
    if (announcementsRes.code === 200 && announcementsRes.data) {
      announcements.value = Array.isArray(announcementsRes.data) ? announcementsRes.data : []
    }
    
  } catch (error: any) {
    console.error('加载数据失败:', error)
    ElMessage.error(error.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

const getTripStatusType = (status: string) => {
  const types: Record<string, string> = {
    planning: '',
    ongoing: 'success',
    completed: 'info'
  }
  return types[status] || ''
}

const getTripStatusText = (status: string) => {
  const texts: Record<string, string> = {
    planning: '计划中',
    ongoing: '进行中',
    completed: '已完成'
  }
  return texts[status] || status
}

const getCategoryText = (category: string) => {
  const texts: Record<string, string> = {
    transport: '交通',
    accommodation: '住宿',
    food: '餐饮',
    activity: '活动',
    shopping: '购物',
    other: '其他'
  }
  return texts[category] || category
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

// 查看公告详情
const viewAnnouncement = async (id: number) => {
  try {
    const res = await announcementApi.getAnnouncementById(id)
    if (res.code === 200 && res.data) {
      currentAnnouncement.value = res.data
      showAnnouncementDialog.value = true
    } else {
      ElMessage.error(res.message || '加载公告失败')
    }
  } catch (error: any) {
    console.error('加载公告详情失败:', error)
    ElMessage.error(error.message || '加载公告详情失败')
  }
}
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  height: 100px;
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: #fff;
}

.stat-icon.trips {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.expenses {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.ongoing {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.community {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.posts {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.quick-actions {
  margin-bottom: 24px;
}

.action-buttons {
  display: flex;
  gap: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trip-item, .expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.trip-item:last-child, .expense-item:last-child {
  border-bottom: none;
}

.trip-title, .expense-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.trip-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.expense-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.expense-amount {
  font-weight: bold;
  color: #f56c6c;
}

.expense-meta {
  display: flex;
  align-items: center;
}

.announcements-row {
  margin-bottom: 24px;
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s;
}

.announcement-item:hover {
  background: #f8f9fa;
}

.announcement-icon {
  font-size: 20px;
  color: #409eff;
}

.announcement-content {
  flex: 1;
}

.announcement-title {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.announcement-time {
  font-size: 12px;
  color: #999;
}

.announcement-detail h3 {
  margin: 0 0 12px 0;
  color: #333;
}

.announcement-meta {
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;
}

.announcement-content-text {
  line-height: 1.6;
  color: #666;
}

.all-announcements {
  max-height: 500px;
  overflow-y: auto;
}

.announcement-item-full {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 16px;
}

.announcement-item-full:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.announcement-header h4 {
  margin: 0;
  color: #333;
}

.announcement-content-preview {
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>