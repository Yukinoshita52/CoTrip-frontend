<template>
  <Layout>
    <div class="trip-detail" v-loading="loading">
      <el-empty v-if="!loading && !trip" description="行程不存在或已删除" />
      <template v-if="trip">
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
      </template>
    </div>

    <!-- 添加行程安排对话框 -->
    <el-dialog v-model="showAddItinerary" title="添加行程安排" width="600px">
      <!-- 这里可以添加表单内容 -->
      <p>添加行程安排表单（待实现）</p>
    </el-dialog>

    <!-- 邀请成员对话框 -->
    <el-dialog v-model="showInviteMember" title="邀请成员" width="400px">
      <el-form :model="inviteForm" :rules="inviteRules" ref="inviteFormRef" label-width="100px">
        <el-form-item label="被邀请人" prop="invitee">
          <el-input 
            v-model="inviteForm.invitee" 
            placeholder="请输入被邀请人的手机号"
            :maxlength="11"
          />
          <div class="form-tip">请输入被邀请人的手机号码</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInviteMember = false">取消</el-button>
        <el-button type="primary" @click="handleInviteMember" :loading="inviteLoading">
          发送邀请
        </el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { tripApi, expenseApi } from '@/api'
import type { Trip, ItineraryItem, Expense, TripMember } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const activeTab = ref('itinerary')
const showAddItinerary = ref(false)
const showInviteMember = ref(false)

const loading = ref(false)
const trip = ref<Trip | null>(null)
const relatedExpenses = ref<Expense[]>([])

// 邀请成员表单
const inviteFormRef = ref<FormInstance>()
const inviteLoading = ref(false)
const inviteForm = ref({
  invitee: ''
})

// 邀请表单验证规则
const inviteRules: FormRules = {
  invitee: [
    { required: true, message: '请输入被邀请人的手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ]
}

// 加载行程详情
const loadTripDetail = async () => {
  const tripId = route.params.id as string
  if (!tripId) {
    ElMessage.error('行程ID无效')
    router.push('/trips')
    return
  }
  
  loading.value = true
  try {
    const res = await tripApi.getTripById(Number(tripId))
    if (res.code === 200 && res.data) {
      const data = res.data
      const places = data.places || []
      
      // 转换地点数据为itinerary格式
      const itinerary: any[] = []
      places.forEach((dayPlaces: any) => {
        const day = dayPlaces.day || 1
        const placesList = dayPlaces.places || []
        placesList.forEach((place: any, index: number) => {
          itinerary.push({
            id: String(place.placeId || place.id || `${day}-${index}`),
            tripId: String(data.tripId || tripId),
            title: place.name || '',
            description: place.address || '',
            location: place.name || '',
            startTime: `${data.startDate}T09:00:00`,
            endTime: `${data.startDate}T18:00:00`,
            type: 'activity',
            cost: 0,
            createdBy: String(data.createdBy || ''),
            createdAt: data.createdTime || ''
          })
        })
      })
      
      // 处理成员数据
      const members: TripMember[] = []
      if (data.members && Array.isArray(data.members)) {
        data.members.forEach((m: any) => {
          members.push({
            userId: String(m.userId || m.id || ''),
            username: m.username || m.nickname || '',
            role: m.role === 0 ? 'owner' : (m.role === 1 ? 'admin' : 'member'),
            joinedAt: m.joinedAt || m.createTime || ''
          })
        })
      }
      
      trip.value = {
        id: String(data.tripId || tripId),
        title: data.name || '',
        description: data.description || '',
        destination: data.region || '',
        startDate: data.startDate ? dayjs(data.startDate).format('YYYY-MM-DD') : '',
        endDate: data.endDate ? dayjs(data.endDate).format('YYYY-MM-DD') : '',
        status: 'planning',
        coverImage: '',
        createdBy: String(data.createdBy || ''),
        members: members,
        itinerary: itinerary,
        createdAt: data.createdTime ? dayjs(data.createdTime).format('YYYY-MM-DD') : '',
        updatedAt: data.updatedTime ? dayjs(data.updatedTime).format('YYYY-MM-DD') : ''
      }
      
      // 加载相关账单
      await loadRelatedExpenses(Number(tripId))
    } else {
      ElMessage.error(res.message || '加载行程详情失败')
      router.push('/trips')
    }
  } catch (error: any) {
    console.error('加载行程详情失败:', error)
    ElMessage.error(error.message || '加载行程详情失败')
    router.push('/trips')
  } finally {
    loading.value = false
  }
}

// 加载相关账单
const loadRelatedExpenses = async (tripId: number) => {
  try {
    const booksRes = await expenseApi.getAllAccountBooks()
    if (booksRes.code === 200 && booksRes.data) {
      const books = Array.isArray(booksRes.data) ? booksRes.data : []
      const book = books.find((b: any) => b.tripId === tripId)
      
      if (book) {
        const recordsRes = await expenseApi.getRecords(book.bookId || book.id, 1, 10)
        if (recordsRes.code === 200 && recordsRes.data) {
          const items = recordsRes.data.items || recordsRes.data.list || []
          relatedExpenses.value = items
            .filter((record: any) => record.type === 2) // 只处理支出类型
            .map((record: any) => {
              // 根据 categoryName 映射到前端类别
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
              
              return {
                id: String(record.recordId || record.id || ''),
                tripId: String(tripId),
                title: record.categoryName || record.note || '未命名',
                amount: Number(record.amount || 0),
                currency: 'CNY',
                category: category,
                paidBy: record.user?.userId ? String(record.user.userId) : '',
                participants: [],
                splitType: 'equal' as const,
                splits: [],
                date: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : '',
                createdAt: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : ''
              }
            })
        }
      }
    }
  } catch (error: any) {
    console.error('加载相关账单失败:', error)
  }
}

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
  const average = trip.value && trip.value.members.length > 0 
    ? Math.round(total / trip.value.members.length) 
    : 0
  return { total, count, average }
})

onMounted(() => {
  loadTripDetail()
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

// 邀请成员
const handleInviteMember = async () => {
  if (!inviteFormRef.value) return
  
  try {
    await inviteFormRef.value.validate()
  } catch (error) {
    console.log('表单验证失败:', error)
    return
  }
  
  if (!trip.value) {
    ElMessage.error('行程信息不存在')
    return
  }
  
  inviteLoading.value = true
  try {
    const res = await tripApi.createInvitation(Number(trip.value.id), inviteForm.value.invitee)
    if (res.code === 200) {
      ElMessage.success('邀请已发送')
      showInviteMember.value = false
      // 重置表单
      inviteForm.value.invitee = ''
      // 刷新行程详情以更新成员列表
      await loadTripDetail()
    } else {
      ElMessage.error(res.message || '发送邀请失败')
    }
  } catch (error: any) {
    console.error('发送邀请失败:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '发送邀请失败，请稍后再试'
    ElMessage.error(errorMessage)
  } finally {
    inviteLoading.value = false
  }
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

.form-tip {
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