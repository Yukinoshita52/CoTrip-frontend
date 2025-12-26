<template>
  <Layout>
    <div class="dashboard">
      <!-- 统计卡片 -->
      <el-row :gutter="24" class="stats-row">
        <!-- 管理员统计 -->
        <template v-if="isAdmin">
          <el-col :span="8">
            <div class="stat-card-wrapper">
              <div class="stat-card modern-card">
                <div class="stat-content">
                  <div class="stat-icon users">
                    <el-icon><User /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ adminStats.totalUsers }}</div>
                    <div class="stat-label">用户总数</div>
                  </div>
                  <div class="stat-decoration"></div>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="8">
            <div class="stat-card-wrapper">
              <div class="stat-card modern-card">
                <div class="stat-content">
                  <div class="stat-icon trips">
                    <el-icon><MapLocation /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ adminStats.totalTrips }}</div>
                    <div class="stat-label">行程总数</div>
                  </div>
                  <div class="stat-decoration"></div>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="8">
            <div class="stat-card-wrapper">
              <div class="stat-card modern-card">
                <div class="stat-content">
                  <div class="stat-icon posts">
                    <el-icon><ChatDotSquare /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ adminStats.totalPosts }}</div>
                    <div class="stat-label">社区帖子总数</div>
                  </div>
                  <div class="stat-decoration"></div>
                </div>
              </div>
            </div>
          </el-col>
        </template>
        
        <!-- 普通用户统计 -->
        <template v-else>
          <el-col :span="6">
            <div class="stat-card-wrapper">
              <div class="stat-card modern-card">
                <div class="stat-content">
                  <div class="stat-icon trips">
                    <el-icon><MapLocation /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ stats.totalTrips }}</div>
                    <div class="stat-label">总行程数</div>
                  </div>
                  <div class="stat-decoration"></div>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="stat-card-wrapper">
              <div class="stat-card modern-card">
                <div class="stat-content">
                  <div class="stat-icon expenses">
                    <el-icon><Money /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">¥{{ stats.totalExpenses }}</div>
                    <div class="stat-label">总支出</div>
                  </div>
                  <div class="stat-decoration"></div>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="stat-card-wrapper">
              <div class="stat-card modern-card">
                <div class="stat-content">
                  <div class="stat-icon ongoing">
                    <el-icon><Timer /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ stats.ongoingTrips }}</div>
                    <div class="stat-label">进行中</div>
                  </div>
                  <div class="stat-decoration"></div>
                </div>
              </div>
            </div>
          </el-col>
          
          <el-col :span="6">
            <div class="stat-card-wrapper">
              <div class="stat-card modern-card">
                <div class="stat-content">
                  <div class="stat-icon community">
                    <el-icon><Share /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">{{ stats.sharedTrips }}</div>
                    <div class="stat-label">已分享</div>
                  </div>
                  <div class="stat-decoration"></div>
                </div>
              </div>
            </div>
          </el-col>
        </template>
      </el-row>

      <!-- 快速操作（仅普通用户显示） -->
      <el-row :gutter="24" class="quick-actions" v-if="!isAdmin">
        <el-col :span="24">
          <el-card class="modern-card action-card" shadow="hover">
            <template #header>
              <div class="card-header-modern">
                <span class="card-title">快速操作</span>
              </div>
            </template>
            <div class="action-buttons">
              <div class="action-button-item" @click="$router.push('/trips/create')">
                <div class="action-icon-wrapper primary">
                  <el-icon><Plus /></el-icon>
                </div>
                <div class="action-text">
                  <div class="action-title">创建新行程</div>
                  <div class="action-desc">开始规划你的旅行</div>
                </div>
                <el-icon class="action-arrow"><ArrowRight /></el-icon>
              </div>
              <div class="action-button-item" @click="$router.push('/expenses')">
                <div class="action-icon-wrapper success">
                  <el-icon><Money /></el-icon>
                </div>
                <div class="action-text">
                  <div class="action-title">记账管理</div>
                  <div class="action-desc">管理旅行支出</div>
                </div>
                <el-icon class="action-arrow"><ArrowRight /></el-icon>
              </div>
              <div class="action-button-item" @click="$router.push('/community')">
                <div class="action-icon-wrapper info">
                  <el-icon><View /></el-icon>
                </div>
                <div class="action-text">
                  <div class="action-title">浏览社区</div>
                  <div class="action-desc">发现精彩行程</div>
                </div>
                <el-icon class="action-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 公告 -->
      <el-row :gutter="24" class="announcements-row" v-if="announcements.length > 0">
        <el-col :span="24">
          <el-card class="modern-card" shadow="hover">
            <template #header>
              <div class="card-header-modern">
                <span class="card-title">最新公告</span>
                <el-button text type="primary" @click="showAllAnnouncements = true">
                  查看全部
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </template>
            <div class="announcements-list">
              <div v-for="announcement in announcements.slice(0, 3)" :key="announcement.id" class="announcement-item-modern" @click="viewAnnouncement(announcement.id)">
                <div class="announcement-icon-wrapper">
                  <el-icon class="announcement-icon"><Bell /></el-icon>
                </div>
                <div class="announcement-content">
                  <div class="announcement-title">{{ announcement.title }}</div>
                  <div class="announcement-time">{{ formatDate(announcement.publishTime) }}</div>
                </div>
                <el-icon class="announcement-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 最近行程和账单（仅普通用户显示） -->
      <el-row :gutter="24" v-loading="loading" v-if="!isAdmin">
        <el-col :span="12">
          <el-card class="modern-card" shadow="hover">
            <template #header>
              <div class="card-header-modern">
                <span class="card-title">最近行程</span>
                <el-button text type="primary" @click="$router.push('/trips')">
                  查看全部
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </template>
            <div class="recent-trips">
              <el-empty v-if="!loading && recentTrips.length === 0" description="暂无行程" :image-size="80" />
              <div v-for="trip in recentTrips" :key="trip.id" class="trip-item-modern" v-else @click="$router.push(`/trips/${trip.id}`)">
                <div class="trip-info">
                  <div class="trip-title">{{ trip.title }}</div>
                  <div class="trip-meta">
                    <el-icon class="meta-icon"><Location /></el-icon>
                    <span>{{ trip.destination }}</span>
                    <el-tag :type="getTripStatusType(trip.status)" size="small" class="status-tag">
                      {{ getTripStatusText(trip.status) }}
                    </el-tag>
                  </div>
                </div>
                <el-icon class="item-arrow"><ArrowRight /></el-icon>
              </div>
            </div>
          </el-card>
        </el-col>
        
        <el-col :span="12">
          <el-card class="modern-card" shadow="hover">
            <template #header>
              <div class="card-header-modern">
                <span class="card-title">最近账单</span>
                <el-button text type="primary" @click="$router.push('/expenses')">
                  查看全部
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </template>
            <div class="recent-expenses">
              <el-empty v-if="!loading && recentExpenses.length === 0" description="暂无账单" :image-size="80" />
              <div v-for="expense in recentExpenses" :key="expense.id" class="expense-item-modern" v-else>
                <div class="expense-info">
                  <div class="expense-title">{{ expense.title }}</div>
                  <div class="expense-meta">
                    <el-tag size="small" class="category-tag">{{ getCategoryText(expense.category) }}</el-tag>
                  </div>
                </div>
                <div class="expense-amount">¥{{ expense.amount }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 公告详情对话框 -->
    <el-dialog 
      v-model="showAnnouncementDialog" 
      title="公告详情" 
      width="700px" 
      v-if="currentAnnouncement"
      class="announcement-dialog-modern"
    >
      <template #header>
        <div class="dialog-header-modern">
          <div class="header-icon-wrapper">
            <el-icon class="header-icon"><Bell /></el-icon>
          </div>
          <span class="header-title">公告详情</span>
        </div>
      </template>
      <div class="announcement-detail-modern">
        <div class="announcement-title-modern">
          <h3>{{ currentAnnouncement.title }}</h3>
        </div>
        <div class="announcement-meta-modern">
          <div class="meta-item">
            <el-icon class="meta-icon"><Clock /></el-icon>
            <span>发布时间：{{ formatDate(currentAnnouncement.publishTime) }}</span>
          </div>
        </div>
        <div class="announcement-content-text-modern" v-html="currentAnnouncement.content"></div>
      </div>
    </el-dialog>

    <!-- 全部公告对话框 -->
    <el-dialog 
      v-model="showAllAnnouncements" 
      title="全部公告" 
      width="900px"
      class="announcements-dialog-modern"
    >
      <template #header>
        <div class="dialog-header-modern">
          <div class="header-icon-wrapper">
            <el-icon class="header-icon"><Document /></el-icon>
          </div>
          <span class="header-title">全部公告</span>
        </div>
      </template>
      <div class="all-announcements-modern">
        <div v-for="announcement in announcements" :key="announcement.id" class="announcement-item-full-modern">
          <div class="announcement-header-modern">
            <div class="announcement-title-wrapper">
              <div class="announcement-icon-mini">
                <el-icon><Bell /></el-icon>
              </div>
              <h4>{{ announcement.title }}</h4>
            </div>
            <span class="announcement-time-modern">
              <el-icon><Clock /></el-icon>
              {{ formatDate(announcement.publishTime) }}
            </span>
          </div>
          <div class="announcement-content-preview-modern">{{ announcement.content }}</div>
          <el-button text type="primary" @click="viewAnnouncement(announcement.id)" class="view-detail-btn">
            查看详情
            <el-icon><ArrowRight /></el-icon>
          </el-button>
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
    // 第一步：并行加载行程、账本、公告
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
    
    // 处理账本数据并准备账单查询
    let expensePromises: Promise<any>[] = []
    if (booksRes.code === 200 && booksRes.data) {
      accountBooks.value = Array.isArray(booksRes.data) ? booksRes.data : []
      
      // 准备所有账本的账单查询（保持100条记录）
      expensePromises = accountBooks.value.map((book: any) =>
        expenseApi.getRecords(book.id || book.bookId, 1, 100).catch(() => ({ code: 200, data: { items: [] } }))
      )
    }
    
    // 第二步：并行执行账单查询和社区查询
    const [expenseResults, communityRes] = await Promise.allSettled([
      Promise.all(expensePromises),
      communityApi.getFeed(1, 100).catch(() => ({ code: 200, data: { list: [] } }))
    ])
    
    // 处理账单数据
    if (expenseResults.status === 'fulfilled') {
      allExpenses.value = []
      expenseResults.value.forEach((res: any) => {
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
    
    // 处理社区数据
    if (communityRes.status === 'fulfilled' && communityRes.value.code === 200 && communityRes.value.data) {
      const myPosts = (communityRes.value.data.list || []).filter((post: any) => 
        post.author?.userId === userStore.user?.userId || post.author?.userId === userStore.user?.id
      )
      stats.value.sharedTrips = myPosts.length
    } else {
      stats.value.sharedTrips = 0
    }
    
    // 计算统计数据
    stats.value.totalTrips = allTrips.value.length
    stats.value.ongoingTrips = allTrips.value.filter(t => t.status === 'ongoing').length
    stats.value.totalExpenses = allExpenses.value
      .reduce((sum, e) => sum + e.amount, 0)
    
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
  max-width: 1400px;
  margin: 0 auto;
}

/* 统计卡片样式 */
.stats-row {
  margin-bottom: 32px;
}

.stat-card-wrapper {
  height: 100%;
}

.stat-card {
  height: 140px;
  border-radius: 16px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.2);
}

.stat-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 24px;
  position: relative;
  z-index: 1;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 28px;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
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

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1.2;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.stat-decoration {
  position: absolute;
  right: -20px;
  top: -20px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  opacity: 0.1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: all 0.4s;
}

.stat-card:hover .stat-decoration {
  transform: scale(1.2);
  opacity: 0.15;
}

/* 现代化卡片样式 */
.modern-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modern-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.modern-card :deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  background: transparent;
}

.modern-card :deep(.el-card__body) {
  padding: 24px;
}

.card-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

/* 快速操作样式 */
.quick-actions {
  margin-bottom: 32px;
}

.action-card {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
}

.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.action-button-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 24px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  gap: 12px;
  text-align: center;
}

.action-button-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.2);
}

.action-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s;
}

.action-button-item:hover .action-icon-wrapper {
  transform: scale(1.1);
}

.action-icon-wrapper.primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.action-icon-wrapper.success {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.action-icon-wrapper.info {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.action-text {
  width: 100%;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 6px;
}

.action-desc {
  font-size: 13px;
  color: #8c8c8c;
  line-height: 1.4;
}

.action-arrow {
  display: none;
}

/* 公告样式 */
.announcements-row {
  margin-bottom: 32px;
}

.announcements-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.announcement-item-modern {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.announcement-item-modern:hover {
  background: #f8f9fa;
  transform: translateX(4px);
  border-color: rgba(102, 126, 234, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.announcement-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.announcement-icon {
  font-size: 18px;
  color: #409eff;
}

.announcement-content {
  flex: 1;
}

.announcement-title {
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 6px;
  font-size: 15px;
}

.announcement-time {
  font-size: 12px;
  color: #8c8c8c;
}

.announcement-arrow {
  color: #8c8c8c;
  font-size: 16px;
  transition: transform 0.3s;
}

.announcement-item-modern:hover .announcement-arrow {
  transform: translateX(4px);
  color: #667eea;
}

/* 最近行程和账单样式 */
.recent-trips, .recent-expenses {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.trip-item-modern, .expense-item-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
  margin-bottom: 4px;
}

.trip-item-modern:last-child, .expense-item-modern:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.trip-item-modern:hover, .expense-item-modern:hover {
  background: #f8f9fa;
  transform: translateX(4px);
}

.trip-info {
  flex: 1;
}

.trip-title {
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 8px;
  font-size: 15px;
}

.trip-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8c8c8c;
}

.meta-icon {
  font-size: 14px;
  color: #667eea;
}

.status-tag {
  margin-left: 4px;
}

.item-arrow {
  color: #8c8c8c;
  font-size: 16px;
  transition: transform 0.3s;
}

.trip-item-modern:hover .item-arrow {
  transform: translateX(4px);
  color: #667eea;
}

.expense-info {
  flex: 1;
}

.expense-title {
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 8px;
  font-size: 15px;
}

.expense-meta {
  display: flex;
  align-items: center;
}

.category-tag {
  font-size: 12px;
}

.expense-amount {
  font-weight: 700;
  color: #f5576c;
  font-size: 18px;
  letter-spacing: -0.3px;
}

/* 公告对话框样式 */
.announcement-dialog-modern :deep(.el-dialog),
.announcements-dialog-modern :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.announcement-dialog-modern :deep(.el-dialog__header),
.announcements-dialog-modern :deep(.el-dialog__header) {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin: 0;
}

.announcement-dialog-modern :deep(.el-dialog__body),
.announcements-dialog-modern :deep(.el-dialog__body) {
  padding: 28px;
}

.announcement-dialog-modern :deep(.el-dialog__footer),
.announcements-dialog-modern :deep(.el-dialog__footer) {
  padding: 20px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
}

.dialog-header-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dialog-header-modern .header-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-header-modern .header-icon {
  font-size: 20px;
  color: #667eea;
}

.dialog-header-modern .header-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

/* 公告详情样式 */
.announcement-detail-modern {
  padding: 8px 0;
}

.announcement-title-modern {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
}

.announcement-title-modern h3 {
  margin: 0;
  color: #1a1d29;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  background: linear-gradient(135deg, #1a1d29 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.announcement-meta-modern {
  margin-bottom: 24px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 10px;
  border-left: 4px solid #667eea;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.meta-icon {
  font-size: 16px;
  color: #667eea;
}

.announcement-content-text-modern {
  line-height: 1.9;
  color: #4a4a4a;
  font-size: 15px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  min-height: 200px;
}

.announcement-content-text-modern :deep(p) {
  margin-bottom: 12px;
}

.announcement-content-text-modern :deep(p:last-child) {
  margin-bottom: 0;
}

/* 全部公告列表样式 */
.all-announcements-modern {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.all-announcements-modern::-webkit-scrollbar {
  width: 6px;
}

.all-announcements-modern::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.all-announcements-modern::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.all-announcements-modern::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.announcement-item-full-modern {
  padding: 24px;
  margin-bottom: 20px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.announcement-item-full-modern::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0;
  transition: opacity 0.3s;
}

.announcement-item-full-modern:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
  border-color: rgba(102, 126, 234, 0.2);
}

.announcement-item-full-modern:hover::before {
  opacity: 1;
}

.announcement-item-full-modern:last-child {
  margin-bottom: 0;
}

.announcement-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  gap: 16px;
}

.announcement-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.announcement-icon-mini {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.announcement-icon-mini .el-icon {
  font-size: 16px;
  color: #667eea;
}

.announcement-header-modern h4 {
  margin: 0;
  color: #1a1d29;
  font-weight: 600;
  font-size: 18px;
  line-height: 1.4;
  flex: 1;
}

.announcement-time-modern {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8c8c8c;
  white-space: nowrap;
  padding: 6px 12px;
  background: #ffffff;
  border-radius: 8px;
  font-weight: 500;
}

.announcement-time-modern .el-icon {
  font-size: 14px;
}

.announcement-content-preview-modern {
  color: #666;
  line-height: 1.8;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: 14px;
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
}

.view-detail-btn {
  font-weight: 500;
  transition: all 0.2s;
}

.view-detail-btn:hover {
  transform: translateX(4px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stat-card {
    height: 120px;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .action-buttons {
    gap: 8px;
  }
  
  .action-button-item {
    padding: 16px;
  }
}
</style>