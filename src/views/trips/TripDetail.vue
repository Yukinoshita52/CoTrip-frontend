<template>
  <Layout>
    <div class="trip-detail" v-if="trip">
      <!-- 行程头部 -->
      <div class="trip-header">
        <div class="header-content">
          <div class="trip-info">
            <h1>{{ trip.title }}</h1>
            <div class="trip-meta">
              <span class="destination">
                <el-icon><MapLocation /></el-icon>
                {{ trip.destination }}
              </span>
              <span class="date-range">
                <el-icon><Calendar /></el-icon>
                {{ formatDateRange(trip.startDate, trip.endDate) }}
              </span>
              <el-tag :type="getTripStatusType(trip.status)">
                {{ getTripStatusText(trip.status) }}
              </el-tag>
            </div>
            <p class="trip-description">{{ trip.description }}</p>
          </div>
          <div class="trip-actions">
            <el-button @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑行程
            </el-button>
            <el-button @click="handleShare">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </div>
        </div>
      </div>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="trip-tabs">
        <!-- 行程安排 -->
        <el-tab-pane label="行程安排" name="itinerary">
          <div class="itinerary-section">
            <div class="section-header">
              <h3>行程安排</h3>
              <el-button @click="showAddItinerary = true">
                <el-icon><Plus /></el-icon>
                添加安排
              </el-button>
            </div>
            
            <div class="itinerary-timeline">
              <div v-for="(dayItems, date) in groupedItinerary" :key="date" class="day-group">
                <div class="day-header">
                  <h4>{{ formatDate(date) }}</h4>
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
                    <div class="item-actions">
                      <el-button text @click="editItineraryItem(item)">
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button text type="danger" @click="deleteItineraryItem(item.id)">
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 成员管理 -->
        <el-tab-pane label="成员管理" name="members">
          <div class="members-section">
            <div class="section-header">
              <h3>成员管理</h3>
              <el-button @click="showInviteMember = true">
                <el-icon><UserFilled /></el-icon>
                邀请成员
              </el-button>
            </div>
            
            <div class="members-grid">
              <div v-for="member in trip.members" :key="member.userId" class="member-card">
                <el-avatar :size="60">{{ member.username.charAt(0) }}</el-avatar>
                <div class="member-info">
                  <div class="member-name">{{ member.username }}</div>
                  <el-tag size="small" :type="member.role === 'owner' ? 'success' : ''">
                    {{ getRoleText(member.role) }}
                  </el-tag>
                  <div class="member-joined">
                    加入时间：{{ formatDate(member.joinedAt) }}
                  </div>
                </div>
                <div class="member-actions" v-if="member.role !== 'owner'">
                  <el-dropdown>
                    <el-button text>
                      <el-icon><More /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="changeRole(member)">
                          更改角色
                        </el-dropdown-item>
                        <el-dropdown-item @click="removeMember(member)" divided>
                          移除成员
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 相关账单 -->
        <el-tab-pane label="相关账单" name="expenses">
          <div class="expenses-section">
            <div class="section-header">
              <h3>相关账单</h3>
              <el-button @click="$router.push('/expenses/create')">
                <el-icon><Money /></el-icon>
                添加账单
              </el-button>
            </div>
            
            <div class="expense-summary">
              <el-row :gutter="16">
                <el-col :span="8">
                  <el-statistic title="总支出" :value="expenseSummary.total" prefix="¥" />
                </el-col>
                <el-col :span="8">
                  <el-statistic title="人均支出" :value="expenseSummary.average" prefix="¥" />
                </el-col>
                <el-col :span="8">
                  <el-statistic title="账单数量" :value="expenseSummary.count" suffix="笔" />
                </el-col>
              </el-row>
            </div>
            
            <div class="expense-list">
              <div v-for="expense in relatedExpenses" :key="expense.id" class="expense-item">
                <div class="expense-info">
                  <div class="expense-title">{{ expense.title }}</div>
                  <div class="expense-meta">
                    <el-tag size="small">{{ getCategoryText(expense.category) }}</el-tag>
                    <span class="expense-date">{{ formatDate(expense.date) }}</span>
                  </div>
                </div>
                <div class="expense-amount">¥{{ expense.amount }}</div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 添加行程安排对话框 -->
    <el-dialog v-model="showAddItinerary" title="添加行程安排" width="600px">
      <!-- 这里可以添加表单内容 -->
      <p>添加行程安排表单（待实现）</p>
    </el-dialog>

    <!-- 邀请成员对话框 -->
    <el-dialog v-model="showInviteMember" title="邀请成员" width="400px">
      <!-- 这里可以添加邀请表单 -->
      <p>邀请成员表单（待实现）</p>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { Trip, ItineraryItem, Expense, TripMember } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const activeTab = ref('itinerary')
const showAddItinerary = ref(false)
const showInviteMember = ref(false)

// 模拟数据
const trip = ref<Trip>({
  id: '1',
  title: '日本关西之旅',
  description: '探索古都京都的文化魅力，品尝大阪美食，感受奈良的自然风光',
  destination: '大阪·京都·奈良',
  startDate: '2024-03-15',
  endDate: '2024-03-22',
  status: 'ongoing',
  coverImage: '',
  createdBy: 'user1',
  members: [
    { userId: 'user1', username: '张三', role: 'owner', joinedAt: '2024-03-01' },
    { userId: 'user2', username: '李四', role: 'member', joinedAt: '2024-03-02' },
    { userId: 'user3', username: '王五', role: 'member', joinedAt: '2024-03-03' }
  ],
  itinerary: [
    {
      id: '1',
      tripId: '1',
      title: '抵达关西机场',
      description: '乘坐航班抵达大阪关西机场',
      location: '关西国际机场',
      startTime: '2024-03-15T14:00:00',
      endTime: '2024-03-15T15:00:00',
      type: 'transport',
      cost: 0,
      createdBy: 'user1',
      createdAt: '2024-03-01'
    },
    {
      id: '2',
      tripId: '1',
      title: '入住酒店',
      description: '前往心斋桥附近的酒店办理入住',
      location: '大阪心斋桥酒店',
      startTime: '2024-03-15T16:00:00',
      endTime: '2024-03-15T17:00:00',
      type: 'accommodation',
      cost: 800,
      createdBy: 'user1',
      createdAt: '2024-03-01'
    }
  ],
  createdAt: '2024-03-01',
  updatedAt: '2024-03-01'
})

const relatedExpenses = ref<Expense[]>([
  {
    id: '1',
    tripId: '1',
    title: '大阪城门票',
    amount: 600,
    currency: 'CNY',
    category: 'activity',
    paidBy: 'user1',
    participants: ['user1', 'user2'],
    splitType: 'equal',
    splits: [],
    date: '2024-03-16',
    createdAt: '2024-03-16'
  }
])

// 计算属性
const groupedItinerary = computed(() => {
  const groups: Record<string, ItineraryItem[]> = {}
  trip.value?.itinerary.forEach(item => {
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
  const count = relatedExpenses.value.length
  const average = trip.value ? Math.round(total / trip.value.members.length) : 0
  return { total, count, average }
})

onMounted(() => {
  // 根据路由参数加载行程详情
  const tripId = route.params.id
  console.log('加载行程详情:', tripId)
})

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format('MM月DD日')
}

const formatTime = (time: string) => {
  return dayjs(time).format('HH:mm')
}

const formatDateRange = (startDate: string, endDate: string) => {
  const start = dayjs(startDate).format('MM-DD')
  const end = dayjs(endDate).format('MM-DD')
  return `${start} ~ ${end}`
}

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

const getRoleText = (role: string) => {
  const texts: Record<string, string> = {
    owner: '创建者',
    admin: '管理员',
    member: '成员'
  }
  return texts[role] || role
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
const handleEdit = () => {
  ElMessage.info('编辑功能待实现')
}

const handleShare = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const editItineraryItem = (item: ItineraryItem) => {
  console.log('编辑行程项:', item.id)
}

const deleteItineraryItem = (itemId: string) => {
  console.log('删除行程项:', itemId)
}

const changeRole = (member: TripMember) => {
  console.log('更改角色:', member.userId)
}

const removeMember = (member: TripMember) => {
  console.log('移除成员:', member.userId)
}
</script>

<style scoped>
.trip-detail {
  max-width: 1200px;
}

.trip-header {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.trip-info h1 {
  margin: 0 0 12px 0;
  font-size: 28px;
  color: #333;
}

.trip-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.trip-meta .el-icon {
  margin-right: 4px;
}

.trip-description {
  margin: 0;
  color: #666;
  line-height: 1.6;
}

.trip-actions {
  display: flex;
  gap: 12px;
}

.trip-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
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

.day-header h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.day-count {
  font-size: 12px;
  color: #999;
}

.itinerary-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 12px;
  transition: all 0.3s;
}

.itinerary-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.member-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.member-joined {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.expense-summary {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.expense-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.expense-item:last-child {
  border-bottom: none;
}

.expense-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.expense-date {
  font-size: 12px;
  color: #999;
}

.expense-amount {
  font-weight: bold;
  color: #f56c6c;
}
</style>