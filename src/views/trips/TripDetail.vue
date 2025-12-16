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
                      <el-button text type="danger" @click="deleteItineraryItem(item)">
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
              <!-- 正式成员 -->
              <div v-for="member in trip.members" :key="member.userId" class="member-card">
                <el-avatar :size="60" :src="formatAvatarUrl(member.avatar)">
                  {{ member.username.charAt(0) }}
                </el-avatar>
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
              
              <!-- 待接受邀请的成员 -->
              <div v-for="invitation in pendingInvitations" :key="invitation.invitationId" class="member-card pending-invitation">
                <el-avatar :size="60">{{ invitation.invitee?.charAt(0) || 'U' }}</el-avatar>
                <div class="member-info">
                  <div class="member-name">{{ invitation.invitee }}</div>
                  <el-tag size="small" type="warning">待接受邀请</el-tag>
                  <div class="member-joined">
                    邀请时间：{{ formatDate(invitation.sentTime) }}
                  </div>
                </div>
                <div class="member-actions">
                  <el-button text type="danger" @click="cancelInvitation(invitation.invitationId)">
                    <el-icon><Delete /></el-icon>
                    撤销
                  </el-button>
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
      <el-form :model="itineraryForm" :rules="itineraryRules" ref="itineraryFormRef" label-width="80px">
        <el-form-item label="选择天数" prop="day">
          <el-select v-model="itineraryForm.day" placeholder="请选择第几天" style="width: 100%">
            <el-option 
              v-for="day in availableDays" 
              :key="day" 
              :label="`第${day}天 (${formatDayDate(day)})`" 
              :value="day"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="搜索地点" prop="placeName">
          <el-autocomplete
            v-model="itineraryForm.placeName"
            :fetch-suggestions="fetchPlaceSuggestions"
            placeholder="输入地点名称搜索"
            style="width: 100%"
            @select="handlePlaceSelect"
            clearable
          >
            <template #default="{ item }">
              <div class="suggestion-item">
                <span class="suggestion-name">{{ item.name }}</span>
              </div>
            </template>
          </el-autocomplete>
        </el-form-item>
        
        <el-form-item label="地点类型" prop="placeType" v-if="selectedPlace">
          <el-select v-model="itineraryForm.placeType" placeholder="请选择地点类型" style="width: 100%">
            <el-option
              v-for="type in placeTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
        
        <div v-if="selectedPlace" class="selected-place">
          <h4>已选择地点：</h4>
          <div class="place-info">
            <p><strong>名称：</strong>{{ selectedPlace.name }}</p>
            <p><strong>类型：</strong>{{ getSelectedTypeName() }}</p>
            <p v-if="selectedPlace.address"><strong>地址：</strong>{{ selectedPlace.address }}</p>
          </div>
        </div>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddItinerary = false">取消</el-button>
        <el-button type="primary" @click="handleAddItinerary" :loading="addingItinerary">
          添加到行程
        </el-button>
      </template>
    </el-dialog>

    <!-- 编辑行程安排对话框 -->
    <el-dialog v-model="showEditItinerary" title="编辑行程安排" width="500px">
      <el-form :model="editItineraryForm" :rules="editItineraryRules" ref="editItineraryFormRef" label-width="80px">
        <el-form-item label="地点名称">
          <el-input :value="currentEditItem?.title" disabled />
        </el-form-item>
        
        <el-form-item label="选择天数" prop="day">
          <el-select v-model="editItineraryForm.day" placeholder="请选择第几天" style="width: 100%">
            <el-option 
              v-for="day in availableDays" 
              :key="day" 
              :label="`第${day}天 (${formatDayDate(day)})`" 
              :value="day"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="地点类型" prop="placeType">
          <el-select v-model="editItineraryForm.placeType" placeholder="请选择地点类型" style="width: 100%">
            <el-option
              v-for="type in placeTypes"
              :key="type.id"
              :label="type.name"
              :value="type.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEditItinerary = false">取消</el-button>
        <el-button type="primary" @click="handleEditItinerary" :loading="editingItinerary">
          保存修改
        </el-button>
      </template>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { tripApi, expenseApi, placeTypeApi, invitationApi } from '@/api'
import type { Trip, ItineraryItem, Expense, TripMember } from '@/types'
import { formatAvatarUrl } from '@/utils/image'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const activeTab = ref('itinerary')
const showAddItinerary = ref(false)
const showEditItinerary = ref(false)
const showInviteMember = ref(false)

const loading = ref(false)
const trip = ref<Trip | null>(null)
const relatedExpenses = ref<Expense[]>([])
const pendingInvitations = ref<any[]>([])

// 添加行程安排表单
const itineraryFormRef = ref<FormInstance>()
const addingItinerary = ref(false)
const selectedPlace = ref<any>(null)
const placeTypes = ref<any[]>([])
const itineraryForm = ref({
  day: 1,
  placeName: '',
  placeUid: '',
  placeType: null as number | null
})

// 编辑行程安排表单
const editItineraryFormRef = ref<FormInstance>()
const editingItinerary = ref(false)
const currentEditItem = ref<any>(null)
const editItineraryForm = ref({
  day: 1,
  placeType: null as number | null
})

// 邀请成员表单
const inviteFormRef = ref<FormInstance>()
const inviteLoading = ref(false)
const inviteForm = ref({
  invitee: ''
})

// 行程安排表单验证规则
const itineraryRules: FormRules = {
  day: [
    { required: true, message: '请选择天数', trigger: 'change' }
  ],
  placeName: [
    { required: true, message: '请选择地点', trigger: 'blur' }
  ],
  placeType: [
    { required: true, message: '请选择地点类型', trigger: 'change' }
  ]
}

// 编辑行程安排表单验证规则
const editItineraryRules: FormRules = {
  day: [
    { required: true, message: '请选择天数', trigger: 'change' }
  ],
  placeType: [
    { required: true, message: '请选择地点类型', trigger: 'change' }
  ]
}

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
      if (Array.isArray(places)) {
        places.forEach((dayPlaces: any) => {
          const day = dayPlaces.day || 1
          const placesList = dayPlaces.places || []
          
          if (Array.isArray(placesList)) {
            placesList.forEach((place: any, index: number) => {
              // 后端返回的是 id 字段，不是 placeId
              const placeId = place.id
              
              itinerary.push({
                id: String(placeId || `${day}-${index}`),
                placeId: placeId, // 添加真实的placeId
                day: day, // 添加天数信息
                tripId: String(data.tripId || tripId),
                title: place.name || '',
                description: place.address || '',
                location: place.name || '',
                startTime: `${data.startDate}T09:00:00`,
                endTime: `${data.startDate}T18:00:00`,
                type: place.type || 'activity',
                typeId: place.typeId, // 添加类型ID
                cost: 0,
                createdBy: String(data.createdBy || ''),
                createdAt: data.createdTime || ''
              })
            })
          }
        })
      }
      
      // 处理成员数据
      const members: TripMember[] = []
      if (data.members && Array.isArray(data.members)) {
        data.members.forEach((m: any) => {
          members.push({
            userId: String(m.userId || m.id || ''),
            username: m.nickname || m.username || '',
            avatar: m.avatarUrl || undefined,
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
      
      // 加载待接受邀请的成员
      await loadPendingInvitations(Number(tripId))
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

// 加载地点类型
const loadPlaceTypes = async () => {
  try {
    const res = await placeTypeApi.getAllPlaceTypes()
    if (res.code === 200 && res.data) {
      placeTypes.value = res.data
    }
  } catch (error: any) {
    console.error('加载地点类型失败:', error)
  }
}

// 加载待接受邀请的成员
const loadPendingInvitations = async (tripId: number) => {
  try {
    const res = await tripApi.getTripInvitations(tripId)
    if (res.code === 200 && res.data) {
      // 只显示待接受邀请（status === 0）的成员
      pendingInvitations.value = res.data.filter((inv: any) => inv.status === 0)
    }
  } catch (error: any) {
    console.error('加载待接受邀请失败:', error)
  }
}

// 计算属性
const availableDays = computed(() => {
  if (!trip.value?.startDate || !trip.value?.endDate) return [1]
  
  const start = dayjs(trip.value.startDate)
  const end = dayjs(trip.value.endDate)
  const days = end.diff(start, 'day') + 1
  
  return Array.from({ length: days }, (_, i) => i + 1)
})

const groupedItinerary = computed(() => {
  const groups: Record<string, ItineraryItem[]> = {}
  
  if (trip.value?.itinerary) {
    trip.value.itinerary.forEach(item => {
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
  const count = relatedExpenses.value.length
  const average = trip.value && trip.value.members.length > 0 
    ? Math.round(total / trip.value.members.length) 
    : 0
  return { total, count, average }
})

onMounted(() => {
  loadTripDetail()
  loadPlaceTypes()
})

// 工具函数
const formatDate = (date: string | Date) => {
  if (!date) return ''
  const d = dayjs(date)
  return d.isValid() ? d.format('MM月DD日') : ''
}

const formatTime = (time: string | Date) => {
  if (!time) return ''
  const t = dayjs(time)
  return t.isValid() ? t.format('HH:mm') : ''
}

const formatDateRange = (startDate: string | Date, endDate: string | Date) => {
  if (!startDate || !endDate) return ''
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  if (!start.isValid() || !end.isValid()) return ''
  return `${start.format('MM-DD')} ~ ${end.format('MM-DD')}`
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
  // 跳转到编辑页面
  router.push(`/trips/${route.params.id}/edit`)
}

const handleShare = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

// 格式化天数对应的日期
const formatDayDate = (day: number) => {
  if (!trip.value?.startDate) return ''
  const startDate = dayjs(trip.value.startDate)
  if (!startDate.isValid()) return ''
  const date = startDate.add(day - 1, 'day')
  return date.format('MM-DD')
}

// 获取地点建议
const fetchPlaceSuggestions = async (queryString: string, cb: (suggestions: any[]) => void) => {
  if (!queryString.trim()) {
    cb([])
    return
  }
  
  try {
    const tripId = Number(route.params.id)
    const res = await tripApi.getPlaceSuggestions(tripId, queryString.trim())
    
    if (res.code === 200 && res.data) {
      const suggestions = res.data.map((item: any) => ({
        value: item.name,
        name: item.name,
        uid: item.uid
      }))
      cb(suggestions)
    } else {
      cb([])
    }
  } catch (error) {
    console.error('获取地点建议失败:', error)
    cb([])
  }
}

// 选择地点
const handlePlaceSelect = (item: any) => {
  itineraryForm.value.placeUid = item.uid
  // 设置默认地点类型（如果有的话）
  if (placeTypes.value.length > 0) {
    itineraryForm.value.placeType = placeTypes.value[0].id
  }
  selectedPlace.value = {
    name: item.name,
    uid: item.uid,
    type: '地点',
    address: ''
  }
}

// 获取选中的地点类型名称
const getSelectedTypeName = () => {
  if (!itineraryForm.value.placeType) return '未选择'
  const type = placeTypes.value.find(t => t.id === itineraryForm.value.placeType)
  return type ? type.name : '未知类型'
}

// 添加行程安排
const handleAddItinerary = async () => {
  if (!itineraryFormRef.value) return
  
  try {
    await itineraryFormRef.value.validate()
    
    if (!itineraryForm.value.placeUid) {
      ElMessage.error('请选择一个地点')
      return
    }
    
    addingItinerary.value = true
    const tripId = Number(route.params.id)
    
    const res = await tripApi.addPlaceToTrip(tripId, {
      uid: itineraryForm.value.placeUid,
      day: itineraryForm.value.day,
      typeId: itineraryForm.value.placeType ?? undefined
    })
    
    if (res.code === 200) {
      ElMessage.success('行程安排添加成功')
      showAddItinerary.value = false
      
      // 重置表单
      itineraryForm.value = {
        day: 1,
        placeName: '',
        placeUid: '',
        placeType: null
      }
      selectedPlace.value = null
      
      // 重新加载行程详情
      await loadTripDetail()
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (error: any) {
    console.error('添加行程安排失败:', error)
    ElMessage.error(error.message || '添加失败，请稍后再试')
  } finally {
    addingItinerary.value = false
  }
}

const editItineraryItem = (item: any) => {
  currentEditItem.value = item
  editItineraryForm.value = {
    day: item.day || 1,
    placeType: item.typeId || null
  }
  showEditItinerary.value = true
}

const deleteItineraryItem = async (item: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个行程安排吗？', '确认删除', {
      type: 'warning'
    })
    
    const tripId = Number(route.params.id)
    const placeId = item.placeId
    
    if (!placeId) {
      ElMessage.error('无法获取地点ID')
      return
    }
    
    const res = await tripApi.deletePlace(tripId, Number(placeId))
    
    if (res.code === 200) {
      ElMessage.success('行程安排已删除')
      // 重新加载行程详情
      await loadTripDetail()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel' && error.message !== 'cancel') {
      console.error('删除行程安排失败:', error)
      ElMessage.error(error.message || '删除失败，请稍后再试')
    }
  }
}

const changeRole = (member: TripMember) => {
  console.log('更改角色:', member.userId)
}

const removeMember = (member: TripMember) => {
  console.log('移除成员:', member.userId)
}

// 处理编辑行程安排
const handleEditItinerary = async () => {
  if (!editItineraryFormRef.value || !currentEditItem.value) return
  
  try {
    await editItineraryFormRef.value.validate()
    
    editingItinerary.value = true
    const tripId = Number(route.params.id)
    const placeId = currentEditItem.value.placeId
    
    if (!placeId) {
      ElMessage.error('无法获取地点ID')
      return
    }
    
    const res = await tripApi.updatePlace(tripId, Number(placeId), {
      day: editItineraryForm.value.day,
      typeId: editItineraryForm.value.placeType ?? undefined
    })
    
    if (res.code === 200) {
      ElMessage.success('行程安排已更新')
      showEditItinerary.value = false
      
      // 重置表单
      editItineraryForm.value = {
        day: 1,
        placeType: null
      }
      currentEditItem.value = null
      
      // 重新加载行程详情
      await loadTripDetail()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error: any) {
    console.error('更新行程安排失败:', error)
    ElMessage.error(error.message || '更新失败，请稍后再试')
  } finally {
    editingItinerary.value = false
  }
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
      // 重新加载待接受邀请
      await loadPendingInvitations(Number(trip.value.id))
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

// 撤销邀请
const cancelInvitation = async (invitationId: number) => {
  try {
    await ElMessageBox.confirm('确定要撤销这个邀请吗？', '确认撤销', {
      type: 'warning'
    })
    
    const res = await invitationApi.cancelInvitation(invitationId)
    if (res.code === 200) {
      ElMessage.success('已撤销邀请')
      // 重新加载待接受邀请
      if (trip.value) {
        await loadPendingInvitations(Number(trip.value.id))
      }
    } else {
      ElMessage.error(res.message || '撤销邀请失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('撤销邀请失败:', error)
      ElMessage.error(error.message || '撤销邀请失败')
    }
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

.pending-invitation {
  opacity: 0.8;
  border-color: #e6a23c;
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

/* 添加行程安排对话框样式 */
.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.suggestion-name {
  font-weight: 500;
  color: #333;
}

.selected-place {
  margin-top: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.selected-place h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 14px;
}

.place-info p {
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.place-info strong {
  color: #333;
}
</style>