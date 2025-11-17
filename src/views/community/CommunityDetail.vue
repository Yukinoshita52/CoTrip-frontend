<template>
  <Layout>
    <div class="community-detail" v-if="post">
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
                <el-avatar :src="post.author.avatar">
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
                  <el-icon><Star /></el-icon>
                  {{ post.likes }} 点赞
                </span>
              </div>
            </div>
            <div class="post-tags">
              <el-tag v-for="tag in post.tags" :key="tag" class="tag-item">
                {{ tag }}
              </el-tag>
            </div>
          </div>
          <div class="post-actions">
            <el-button @click="toggleLike" :type="isLiked ? 'primary' : 'default'">
              <el-icon><Star /></el-icon>
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
            <div class="info-item">
              <label>参与人数：</label>
              <span>{{ post.trip.members.length }} 人</span>
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
      <el-card class="use-trip">
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
            <el-button @click="handleContact">
              <el-icon><ChatDotSquare /></el-icon>
              联系作者
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 相关推荐 -->
      <el-card class="related-posts">
        <template #header>
          <span>相关推荐</span>
        </template>
        <div class="related-list">
          <div v-for="relatedPost in relatedPosts" :key="relatedPost.id" class="related-item">
            <div class="related-cover">
              <img v-if="relatedPost.trip.coverImage" :src="relatedPost.trip.coverImage" alt="封面" />
              <div v-else class="default-cover">
                <el-icon><Picture /></el-icon>
              </div>
            </div>
            <div class="related-content">
              <h4 class="related-title">{{ relatedPost.title }}</h4>
              <p class="related-destination">{{ relatedPost.trip.destination }}</p>
              <div class="related-stats">
                <span><el-icon><View /></el-icon> {{ relatedPost.views }}</span>
                <span><el-icon><Star /></el-icon> {{ relatedPost.likes }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { CommunityPost, ItineraryItem, Expense } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const isLiked = ref(false)

// 模拟数据
const post = ref<CommunityPost>({
  id: '1',
  title: '春日京都赏樱之旅 - 7天深度体验古都文化',
  description: '在樱花盛开的季节，我们深入京都的大街小巷，从清水寺到金阁寺，从祇园到岚山，感受千年古都的独特魅力。这次旅行不仅欣赏了美丽的樱花，还体验了传统的茶道、品尝了地道的怀石料理，是一次难忘的文化之旅。',
  tripId: '1',
  authorId: 'user2',
  author: {
    id: 'user2',
    username: '旅行达人小李',
    email: 'user2@example.com',
    nickname: '小李',
    avatar: '',
    createdAt: '2024-01-01'
  },
  trip: {
    id: '1',
    title: '京都赏樱7日游',
    destination: '京都·大阪',
    startDate: '2024-04-01',
    endDate: '2024-04-07',
    status: 'completed',
    description: '',
    coverImage: '',
    createdBy: 'user2',
    members: [
      { userId: 'user2', username: '小李', role: 'owner', joinedAt: '2024-03-01' },
      { userId: 'user4', username: '小张', role: 'member', joinedAt: '2024-03-02' }
    ],
    itinerary: [
      {
        id: '1',
        tripId: '1',
        title: '抵达关西机场',
        description: '从上海浦东机场出发，抵达大阪关西机场',
        location: '关西国际机场',
        startTime: '2024-04-01T14:00:00',
        endTime: '2024-04-01T15:00:00',
        type: 'transport',
        cost: 0,
        createdBy: 'user2',
        createdAt: '2024-03-01'
      },
      {
        id: '2',
        tripId: '1',
        title: '清水寺赏樱',
        description: '参观著名的清水寺，欣赏樱花美景',
        location: '清水寺',
        startTime: '2024-04-02T09:00:00',
        endTime: '2024-04-02T12:00:00',
        type: 'activity',
        cost: 400,
        createdBy: 'user2',
        createdAt: '2024-03-01'
      }
    ],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01'
  },
  likes: 128,
  views: 1520,
  tags: ['日本', '樱花', '文化', '美食', '京都'],
  isPublic: true,
  createdAt: '2024-04-10',
  updatedAt: '2024-04-10'
})

const relatedExpenses = ref<Expense[]>([
  {
    id: '1',
    tripId: '1',
    title: '往返机票',
    amount: 2800,
    currency: 'CNY',
    category: 'transport',
    paidBy: 'user2',
    participants: ['user2', 'user4'],
    splitType: 'equal',
    splits: [],
    date: '2024-04-01',
    createdAt: '2024-04-01'
  },
  {
    id: '2',
    tripId: '1',
    title: '京都酒店住宿',
    amount: 1600,
    currency: 'CNY',
    category: 'accommodation',
    paidBy: 'user2',
    participants: ['user2', 'user4'],
    splitType: 'equal',
    splits: [],
    date: '2024-04-01',
    createdAt: '2024-04-01'
  }
])

const relatedPosts = ref<CommunityPost[]>([
  {
    id: '2',
    title: '大阪美食探索之旅',
    description: '品尝大阪地道美食',
    tripId: '2',
    authorId: 'user3',
    author: {
      id: 'user3',
      username: '美食家小王',
      email: 'user3@example.com',
      nickname: '小王',
      createdAt: '2024-01-01'
    },
    trip: {
      id: '2',
      title: '大阪美食3日游',
      destination: '大阪',
      startDate: '2024-03-15',
      endDate: '2024-03-17',
      status: 'completed',
      description: '',
      coverImage: '',
      createdBy: 'user3',
      members: [],
      itinerary: [],
      createdAt: '2024-03-01',
      updatedAt: '2024-03-01'
    },
    likes: 89,
    views: 756,
    tags: ['日本', '美食', '大阪'],
    isPublic: true,
    createdAt: '2024-03-20',
    updatedAt: '2024-03-20'
  }
])

// 计算属性
const groupedItinerary = computed(() => {
  const groups: Record<string, ItineraryItem[]> = {}
  post.value?.trip.itinerary.forEach(item => {
    const date = dayjs(item.startTime).format('YYYY-MM-DD')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(item)
  })
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
  const postId = route.params.id
  console.log('加载社区详情:', postId)
  // 增加浏览量
  if (post.value) {
    post.value.views++
  }
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
const toggleLike = () => {
  if (!post.value) return
  
  isLiked.value = !isLiked.value
  if (isLiked.value) {
    post.value.likes++
    ElMessage.success('点赞成功')
  } else {
    post.value.likes--
    ElMessage.success('已取消点赞')
  }
}

const handleShare = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const handleCollect = () => {
  ElMessage.success('已收藏到我的行程')
}

const handleCopyTrip = () => {
  ElMessage.success('行程已复制到你的账户，可以在"我的行程"中查看和编辑')
}

const handleContact = () => {
  ElMessage.info('联系功能待开发')
}
</script>

<style scoped>
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

.trip-overview, .itinerary-detail, .expense-detail, .use-trip, .related-posts {
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

.use-trip-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.use-trip-info h3 {
  margin: 0 0 8px 0;
  color: #333;
}

.use-trip-info p {
  margin: 0;
  color: #666;
}

.use-trip-actions {
  display: flex;
  gap: 12px;
}

.related-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.related-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.related-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.related-cover {
  width: 80px;
  height: 60px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.related-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ccc;
  font-size: 24px;
}

.related-content {
  flex: 1;
}

.related-title {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.related-destination {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.related-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.related-stats span {
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>