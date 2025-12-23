<template>
  <Layout>
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    <div class="community-detail" v-else-if="post">
      <!-- 返回按钮 -->
      <div class="back-button">
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回社区
        </el-button>
      </div>

      <!-- 文章头部 -->
      <el-card class="post-header">
        <div class="header-content">
          <div class="post-info">
            <h1>{{ post.title }}</h1>
            <div class="post-meta">
              <div class="author-info">
                <el-avatar :src="formatAvatarUrl(post.author.avatar)">
                  {{ post.author.username.charAt(0) }}
                </el-avatar>
                <div class="author-details">
                  <div class="author-name">{{ post.author.username }}</div>
                  <div class="post-date">{{ formatDate(post.createdAt) }} 发布</div>
                </div>
              </div>
              <div class="post-stats">
                <span class="stat-item">
                  <el-icon><View /></el-icon>
                  {{ post.views }} 浏览
                </span>
                <span class="stat-item">
                  <el-icon><Heart /></el-icon>
                  {{ post.likes }} 点赞
                </span>
              </div>
            </div>
          </div>
          <div class="post-actions">
            <el-button @click="toggleLike" :type="isLiked ? 'primary' : 'default'" :class="{ 'liked-button': isLiked }">
              <el-icon :class="{ 'liked': isLiked }"><Heart /></el-icon>
              {{ isLiked ? '已点赞' : '点赞' }} ({{ post.likes }})
            </el-button>
            <el-button @click="handleShare">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
            <el-button @click="handleCollect">
              <el-icon><Collection /></el-icon>
              收藏
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 行程概览 -->
      <el-card class="trip-overview">
        <template #header>
          <span>行程概览</span>
        </template>
        <div class="overview-content">
          <div class="trip-basic-info">
            <div class="info-item">
              <label>目的地：</label>
              <span>{{ post.trip.destination }}</span>
            </div>
            <div class="info-item">
              <label>行程时间：</label>
              <span>{{ formatDateRange(post.trip.startDate, post.trip.endDate) }}</span>
            </div>
            <div class="info-item">
              <label>行程天数：</label>
              <span>{{ getTripDuration(post.trip) }} 天</span>
            </div>
          </div>
          <div class="trip-description">
            <h4>行程描述</h4>
            <p>{{ post.description }}</p>
          </div>
        </div>
      </el-card>

      <!-- 详细行程 -->
      <el-card class="itinerary-detail">
        <template #header>
          <span>详细行程安排</span>
        </template>
        <div class="itinerary-timeline">
          <div v-for="(dayItems, date) in groupedItinerary" :key="date" class="day-group">
            <div class="day-header">
              <h3>{{ formatDayTitle(date) }}</h3>
              <span class="day-count">{{ dayItems.length }} 项安排</span>
            </div>
            
            <div class="day-items">
              <div v-for="item in dayItems" :key="item.id" class="itinerary-item">
                <div class="item-time">{{ formatTime(item.startTime) }}</div>
                <div class="item-content">
                  <div class="item-header">
                    <span class="item-title">{{ item.title }}</span>
                    <el-tag size="small" :type="getItemTypeColor(item.type)">
                      {{ getItemTypeText(item.type) }}
                    </el-tag>
                  </div>
                  <div class="item-location">
                    <el-icon><Location /></el-icon>
                    {{ item.location }}
                  </div>
                  <div v-if="item.description" class="item-description">
                    {{ item.description }}
                  </div>
                  <div v-if="item.cost" class="item-cost">
                    预算：¥{{ item.cost }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 费用明细 -->
      <el-card class="expense-detail" v-if="relatedExpenses.length > 0">
        <template #header>
          <span>费用参考</span>
        </template>
        <div class="expense-summary">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-statistic title="总费用" :value="expenseSummary.total" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="人均费用" :value="expenseSummary.average" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="交通费用" :value="expenseSummary.transport" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="住宿费用" :value="expenseSummary.accommodation" prefix="¥" />
            </el-col>
          </el-row>
        </div>
        
        <div class="expense-breakdown">
          <h4>费用明细</h4>
          <el-table :data="relatedExpenses" style="width: 100%">
            <el-table-column prop="title" label="项目" />
            <el-table-column prop="category" label="类别" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getCategoryText(row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.amount }}
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="100">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

      <!-- 使用此行程 -->
      <el-card class="use-trip" v-if="!isCurrentUserPost">
        <div class="use-trip-content">
          <div class="use-trip-info">
            <h3>喜欢这个行程？</h3>
            <p>你可以复制这个行程到你的账户，并根据需要进行修改</p>
          </div>
          <div class="use-trip-actions">
            <el-button type="primary" @click="handleCopyTrip">
              <el-icon><DocumentCopy /></el-icon>
              复制行程
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 编辑帖子 -->
      <el-card class="edit-post" v-if="isCurrentUserPost">
        <div class="edit-post-content">
          <div class="edit-post-info">
            <h3>这是你发布的行程</h3>
            <p>你可以编辑或删除这个帖子</p>
          </div>
          <div class="edit-post-actions">
            <el-button type="primary" @click="handleEditPost">
              <el-icon><Edit /></el-icon>
              编辑帖子
            </el-button>
            <el-button type="danger" @click="handleDeletePost">
              <el-icon><Delete /></el-icon>
              删除帖子
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { CommunityPost, ItineraryItem, Expense } from '@/types'
import { formatAvatarUrl, formatImageUrl } from '@/utils/image'
import dayjs from 'dayjs'
import { communityApi, tripApi, expenseApi } from '@/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isLiked = ref(false)
const loading = ref(false)

// 帖子数据
const post = ref<CommunityPost | null>(null)
const relatedExpenses = ref<Expense[]>([])

// 计算属性
const isCurrentUserPost = computed(() => {
  if (!post.value || !userStore.user) return false
  return String(post.value.authorId) === String(userStore.user.id)
})

// 加载帖子详情
const loadPostDetail = async () => {
  const postId = Number(route.params.id)
  if (!postId) {
    ElMessage.error('帖子ID无效')
    router.push('/community')
    return
  }

  loading.value = true
  try {
    const res = await communityApi.getPostDetail(postId)
    if (res.code === 200 && res.data) {
      const data = res.data
      post.value = {
        id: String(data.postId || data.id || postId),
        title: data.tripName || data.title || '',
        description: data.description || '',
        tripId: String(data.tripId || ''),
        authorId: String(data.author?.userId || data.authorId || ''),
        author: {
          id: String(data.author?.userId || data.authorId || ''),
          username: data.author?.username || '',
          email: data.author?.email || '',
          nickname: data.author?.nickname || data.author?.username || '',
          avatar: data.author?.avatarUrl || data.author?.avatar || '',
          createdAt: ''
        },
        trip: {
          id: String(data.tripId || ''),
          title: data.tripName || '',
          destination: data.region || '',
          startDate: data.startDate ? dayjs(data.startDate).format('YYYY-MM-DD') : '',
          endDate: data.endDate ? dayjs(data.endDate).format('YYYY-MM-DD') : '',
          status: 'completed',
          description: data.description || '',
          coverImage: data.coverImages?.[0] || '',
          createdBy: String(data.author?.userId || ''),
          members: [],
          itinerary: [],
          createdAt: data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : '',
          updatedAt: data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : ''
        },
        likes: data.stats?.likeCount || data.likes || 0,
        views: data.stats?.viewCount || data.views || 0,
        tags: data.tags || [],
        isPublic: true,
        createdAt: data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : '',
        updatedAt: data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : ''
      }

      // 加载行程详情以获取 itinerary
      if (data.tripId) {
        await loadTripDetail(data.tripId)
      }

      // 加载相关费用
      await loadRelatedExpenses(data.tripId)
      
      // 加载点赞状态
      await loadLikeStatus(postId)
    } else {
      ElMessage.error(res.message || '加载帖子详情失败')
      router.push('/community')
    }
  } catch (error: any) {
    console.error('加载帖子详情失败:', error)
    ElMessage.error(error.message || '加载帖子详情失败')
    router.push('/community')
  } finally {
    loading.value = false
  }
}

// 加载点赞状态
const loadLikeStatus = async (postId: number) => {
  try {
    const res = await communityApi.checkLikeStatus(postId)
    if (res.code === 200) {
      isLiked.value = res.data || false
    }
  } catch (error) {
    console.error('加载点赞状态失败:', error)
    isLiked.value = false
  }
}

// 加载行程详情
const loadTripDetail = async (tripId: number) => {
  try {
    const res = await tripApi.getTripById(tripId)
    if (res.code === 200 && res.data && post.value) {
      const tripData = res.data
      post.value.trip.itinerary = tripData.places?.flatMap((day: any) => 
        day.places.map((place: any) => ({
          id: String(place.id || place.placeId || ''),
          tripId: String(tripId),
          title: place.name || '',
          description: place.description || '',
          location: place.address || '',
          startTime: day.date ? dayjs(day.date).format('YYYY-MM-DD') + 'T09:00:00' : '',
          endTime: day.date ? dayjs(day.date).format('YYYY-MM-DD') + 'T17:00:00' : '',
          type: 'activity',
          cost: 0,
          createdBy: '',
          createdAt: ''
        })) || []
      ) || []
      post.value.trip.members = tripData.members?.map((m: any) => ({
        userId: String(m.userId || m.id || ''),
        username: m.username || '',
        role: m.role === 0 ? 'owner' : 'member',
        joinedAt: m.joinedAt || ''
      })) || []
    }
  } catch (error: any) {
    console.error('加载行程详情失败:', error)
  }
}

// 加载相关费用
const loadRelatedExpenses = async (tripId: number) => {
  try {
    const booksRes = await expenseApi.getAllAccountBooks()
    if (booksRes.code === 200 && booksRes.data) {
      const books = Array.isArray(booksRes.data) ? booksRes.data : []
      const book = books.find((b: any) => String(b.tripId) === String(tripId))

      if (book) {
        const recordsRes = await expenseApi.getRecords(book.bookId, 1, 50)
        if (recordsRes.code === 200 && recordsRes.data) {
          const items = recordsRes.data.items || recordsRes.data.list || []
          relatedExpenses.value = items.map((record: any) => ({
            id: String(record.recordId || record.id || ''),
            tripId: String(tripId),
            title: record.categoryName || record.note || '未命名',
            amount: Number(record.amount || 0),
            currency: 'CNY',
            category: record.type === 1 ? 'income' : (record.type === 2 ? 'expense' : 'other'),
            paidBy: record.user?.userId ? String(record.user.userId) : '',
            participants: [],
            splitType: 'equal',
            splits: [],
            receipt: '',
            date: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : '',
            createdAt: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : ''
          }))
        }
      }
    }
  } catch (error: any) {
    console.error('加载相关费用失败:', error)
  }
}

// 计算属性
const groupedItinerary = computed(() => {
  const groups: Record<string, ItineraryItem[]> = {}
  if (post.value?.trip.itinerary) {
    post.value.trip.itinerary.forEach(item => {
      const date = dayjs(item.startTime).format('YYYY-MM-DD')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(item)
    })
  }
  return groups
})

const expenseSummary = computed(() => {
  const total = relatedExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  const memberCount = post.value?.trip.members.length || 1
  const average = Math.round(total / memberCount)
  const transport = relatedExpenses.value
    .filter(e => e.category === 'transport')
    .reduce((sum, e) => sum + e.amount, 0)
  const accommodation = relatedExpenses.value
    .filter(e => e.category === 'accommodation')
    .reduce((sum, e) => sum + e.amount, 0)
  
  return { total, average, transport, accommodation }
})

onMounted(() => {
  loadPostDetail()
})

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY年MM月DD日')
}

const formatDateRange = (startDate: string, endDate: string) => {
  const start = dayjs(startDate).format('MM月DD日')
  const end = dayjs(endDate).format('MM月DD日')
  return `${start} - ${end}`
}

const formatDayTitle = (date: string) => {
  return dayjs(date).format('MM月DD日 dddd')
}

const formatTime = (time: string) => {
  return dayjs(time).format('HH:mm')
}

const getTripDuration = (trip: any) => {
  if (!trip.startDate || !trip.endDate) return 0
  const start = dayjs(trip.startDate)
  const end = dayjs(trip.endDate)
  return end.diff(start, 'day') + 1
}

const getItemTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    transport: 'primary',
    accommodation: 'success',
    activity: 'warning',
    dining: 'danger',
    other: 'info'
  }
  return colors[type] || 'info'
}

const getItemTypeText = (type: string) => {
  const texts: Record<string, string> = {
    transport: '交通',
    accommodation: '住宿',
    activity: '活动',
    dining: '餐饮',
    other: '其他'
  }
  return texts[type] || type
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

// 事件处理
const toggleLike = async () => {
  if (!post.value) return
  
  try {
    if (isLiked.value) {
      const res = await communityApi.unlikePost(Number(post.value.id))
      if (res.code === 200) {
        post.value.likes--
        isLiked.value = false
        ElMessage.success('已取消点赞')
      }
    } else {
      const res = await communityApi.likePost(Number(post.value.id))
      if (res.code === 200) {
        post.value.likes++
        isLiked.value = true
        ElMessage.success('点赞成功')
      }
    }
  } catch (error: any) {
    console.error('点赞操作失败:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

const handleShare = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const handleCollect = () => {
  ElMessage.success('已收藏到我的行程')
}

const handleCopyTrip = async () => {
  if (!post.value) return
  try {
    const tripData = {
      name: post.value.trip.title,
      region: post.value.trip.destination,
      startDate: post.value.trip.startDate,
      endDate: post.value.trip.endDate,
      description: post.value.trip.description
    }
    const res = await tripApi.createTrip(tripData)
    if (res.code === 200) {
      ElMessage.success('行程已复制到你的账户，可以在"我的行程"中查看和编辑')
      router.push('/trips')
    } else {
      ElMessage.error(res.message || '复制失败')
    }
  } catch (error: any) {
    console.error('复制行程失败:', error)
    ElMessage.error(error.message || '复制失败')
  }
}

const handleEditPost = () => {
  ElMessage.info('编辑帖子功能待开发')
}

const handleDeletePost = async () => {
  if (!post.value) return
  
  try {
    await ElMessageBox.confirm('确定要删除这个帖子吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    
    const res = await communityApi.deletePost(Number(post.value.id))
    if (res.code === 200) {
      ElMessage.success('帖子已删除')
      router.push('/community')
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除帖子失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.loading-container {
  max-width: 1000px;
  padding: 24px;
}

.community-detail {
  max-width: 1000px;
}

.back-button {
  margin-bottom: 16px;
}

.post-header {
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.post-info h1 {
  margin: 0 0 16px 0;
  font-size: 28px;
  color: #333;
  line-height: 1.3;
}

.post-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-name {
  font-weight: 500;
  color: #333;
}

.post-date {
  font-size: 14px;
  color: #666;
}

.post-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
}

.post-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.tag-item {
  font-size: 14px;
}

.post-actions {
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.trip-overview, .itinerary-detail, .expense-detail, .use-trip, .edit-post {
  margin-bottom: 24px;
}

.overview-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

.info-item {
  display: flex;
  margin-bottom: 8px;
}

.info-item label {
  width: 80px;
  color: #666;
  flex-shrink: 0;
}

.trip-description h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.trip-description p {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.day-group {
  margin-bottom: 32px;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f0f0;
}

.day-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.day-count {
  font-size: 14px;
  color: #999;
}

.itinerary-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
}

.item-time {
  width: 60px;
  font-weight: bold;
  color: #409eff;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.item-title {
  font-weight: 500;
  color: #333;
}

.item-location, .item-description, .item-cost {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.item-location .el-icon {
  margin-right: 4px;
}

.expense-summary {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.expense-breakdown h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.use-trip-content, .edit-post-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.use-trip-info h3, .edit-post-info h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.use-trip-info p, .edit-post-info p {
  margin: 0;
  color: #666;
}

.use-trip-actions, .edit-post-actions {
  display: flex;
  gap: 12px;
}

.liked {
  color: #f56c6c;
}

.liked-button {
  color: #f56c6c !important;
}

.liked-button:hover {
  color: #f78989 !important;
}
</style>