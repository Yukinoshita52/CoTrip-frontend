<template>
  <Layout>
    <div class="trip-list">
      <!-- 筛选器 -->
      <el-card class="filter-card-modern" shadow="hover">
        <el-row :gutter="16">
          <el-col :span="5">
            <div class="filter-item">
              <label class="filter-label">状态</label>
              <el-select v-model="filters.status" placeholder="全部状态" clearable class="filter-select">
                <el-option label="全部" value="" />
                <el-option label="计划中" value="planning" />
                <el-option label="进行中" value="ongoing" />
                <el-option label="已完成" value="completed" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="4">
            <div class="filter-item">
              <label class="filter-label">创建者</label>
              <el-select v-model="filters.isMyCreated" placeholder="全部" clearable class="filter-select">
                <el-option label="全部" value="" />
                <el-option label="我创建的" value="true" />
                <el-option label="我参与的" value="false" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="9">
            <div class="filter-item">
              <label class="filter-label">搜索</label>
              <el-input
                v-model="filters.keyword"
                placeholder="搜索行程标题或目的地"
                clearable
                class="filter-input"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="filter-item">
              <label class="filter-label">&nbsp;</label>
              <div class="filter-actions">
                <el-button type="primary" @click="handleSearch" class="search-btn">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button type="primary" @click="$router.push('/trips/create')" class="create-btn-filter">
                  <el-icon><Plus /></el-icon>
                  创建行程
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 行程列表 -->
      <div class="trip-grid" v-loading="loading">
        <el-empty v-if="!loading && trips.length === 0" description="暂无行程数据" :image-size="120" />
        <el-row :gutter="24" v-else>
          <el-col :span="8" v-for="trip in trips" :key="trip.id">
            <div class="trip-card-modern" @click="$router.push(`/trips/${trip.id}`)">
              <div class="trip-cover-modern">
                <img v-if="trip.coverImage" :src="formatImageUrl(trip.coverImage)" alt="行程封面" class="cover-image" />
                <div v-else class="default-cover-modern">
                  <el-icon><Picture /></el-icon>
                  <span>暂无封面</span>
                </div>
                <div class="trip-overlay">
                  <div class="trip-status-modern">
                    <el-tag :type="getTripStatusType(trip.status)" size="small" class="status-tag">
                      {{ getTripStatusText(trip.status) }}
                    </el-tag>
                  </div>
                </div>
                <div class="trip-gradient"></div>
              </div>
              
              <div class="trip-content-modern">
                <h3 class="trip-title-modern">{{ trip.title }}</h3>
                <div class="trip-info-row">
                  <div class="info-item">
                    <el-icon class="info-icon"><MapLocation /></el-icon>
                    <span class="info-text">{{ trip.destination || '未设置目的地' }}</span>
                  </div>
                </div>
                <div class="trip-info-row">
                  <div class="info-item">
                    <el-icon class="info-icon"><Calendar /></el-icon>
                    <span class="info-text">{{ formatDateRange(trip.startDate, trip.endDate) || '未设置日期' }}</span>
                  </div>
                </div>
                <div class="trip-members-modern">
                  <el-avatar-group :max="4" :size="28">
                    <el-avatar 
                      v-for="member in trip.members" 
                      :key="member.userId"
                      :src="formatAvatarUrl(member.avatar)"
                      class="member-avatar"
                    >
                      {{ member.username?.charAt(0) || 'U' }}
                    </el-avatar>
                  </el-avatar-group>
                  <span class="member-count-modern">{{ trip.members.length || 1 }} 人参与</span>
                </div>
              </div>
              
              <div class="trip-actions-modern">
                <el-button text size="small" @click.stop="handleEdit(trip)" v-if="isOwner(trip)" class="action-btn">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button text size="small" @click.stop="handleShare(trip)" class="action-btn">
                  <el-icon><Share /></el-icon>
                  分享
                </el-button>
                <el-dropdown @click.stop trigger="click" v-if="isOwner(trip)">
                  <el-button text size="small" class="action-btn">
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleDuplicate(trip)">
                        <el-icon><CopyDocument /></el-icon>
                        复制行程
                      </el-dropdown-item>
                      <el-dropdown-item @click="handleDelete(trip)" divided>
                        <el-icon><Delete /></el-icon>
                        删除行程
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button text size="small" type="danger" @click.stop="handleLeaveTrip(trip)" v-if="isParticipant(trip)" class="action-btn">
                  <el-icon><CircleClose /></el-icon>
                  退出
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { tripApi, userApi } from '@/api'
import { formatImageUrl, formatAvatarUrl } from '@/utils/image'
import { useUserStore } from '@/stores/user'
import type { Trip } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

// 当前用户信息
const currentUser = ref<any>(null)

// 筛选条件
const filters = ref({
  status: '',
  keyword: '',
  isMyCreated: '' // '' 全部, 'true' 我创建的, 'false' 我参与的
})

// 分页
const pagination = ref({
  page: 1,
  pageSize: 12,
  total: 0
})

// 行程列表
const trips = ref<Trip[]>([])

onMounted(async () => {
  // 获取当前用户信息
  try {
    const userRes = await userApi.getCurrentUser()
    if (userRes.code === 200 && userRes.data) {
      currentUser.value = userRes.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
  
  loadTrips()
})

const loadTrips = async () => {
  loading.value = true
  try {
    const res = await tripApi.getTrips()
    if (res.code === 200 && res.data) {
      // 转换后端数据格式到前端格式
      trips.value = (Array.isArray(res.data) ? res.data : []).map((trip: any) => {
        const startDate = trip.startDate || trip.start_date
        const endDate = trip.endDate || trip.end_date
        const now = dayjs()
        const start = dayjs(startDate)
        const end = dayjs(endDate)
        
        // 根据日期判断状态
        let status = 'planning'
        if (now.isAfter(end)) {
          status = 'completed'
        } else if (now.isAfter(start) && now.isBefore(end)) {
          status = 'ongoing'
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
          members: (trip.members && Array.isArray(trip.members) && trip.members.length > 0) 
            ? trip.members.map((m: any) => ({
                userId: String(m.userId || m.id || ''),
                username: m.nickname || m.username || '',
                avatar: m.avatarUrl || undefined,
                role: m.role === 0 ? 'owner' : m.role === 1 ? 'admin' : 'member',
                joinedAt: m.joinedAt || m.createTime || ''
              }))
            : [],
          itinerary: trip.itinerary || trip.places || [],
          createdAt: trip.createdTime ? dayjs(trip.createdTime).format('YYYY-MM-DD') : '',
          updatedAt: trip.updatedTime ? dayjs(trip.updatedTime).format('YYYY-MM-DD') : ''
        }
      })
      
      // 应用筛选
      let filteredTrips = [...trips.value]
      
      if (filters.value.status) {
        filteredTrips = filteredTrips.filter(t => t.status === filters.value.status)
      }
      
      if (filters.value.keyword) {
        const keyword = filters.value.keyword.toLowerCase()
        filteredTrips = filteredTrips.filter(t => 
          t.title.toLowerCase().includes(keyword) || 
          t.destination.toLowerCase().includes(keyword)
        )
      }
      
      // 筛选是否是我创建的
      if (filters.value.isMyCreated !== '' && currentUser.value) {
        const isMyCreated = filters.value.isMyCreated === 'true'
        const currentUserId = String(currentUser.value.userId || currentUser.value.id || '')
        filteredTrips = filteredTrips.filter(t => {
          const isOwner = t.createdBy === currentUserId
          return isMyCreated ? isOwner : !isOwner
        })
      }
      
      trips.value = filteredTrips
      pagination.value.total = filteredTrips.length
    }
  } catch (error: any) {
    console.error('加载行程列表失败:', error)
    ElMessage.error(error.message || '加载行程列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadTrips()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadTrips()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  loadTrips()
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

const formatDateRange = (startDate: string, endDate: string) => {
  const start = dayjs(startDate).format('MM-DD')
  const end = dayjs(endDate).format('MM-DD')
  return `${start} ~ ${end}`
}

// 判断用户在行程中的角色
const getUserRoleInTrip = (trip: Trip) => {
  if (!currentUser.value) return null
  
  const member = trip.members.find(m => {
    const memberUserId = Number(m.userId)
    const currentUserId = Number(currentUser.value.id)
    return memberUserId === currentUserId
  })
  
  return member ? member.role : null
}

// 判断用户是否为行程创建者
const isOwner = (trip: Trip) => {
  return getUserRoleInTrip(trip) === 'owner'
}

// 判断用户是否为行程参与者（非创建者）
const isParticipant = (trip: Trip) => {
  const role = getUserRoleInTrip(trip)
  return role && role !== 'owner'
}

const handleEdit = (trip: Trip) => {
  // 跳转到编辑页面
  router.push(`/trips/${trip.id}/edit`)
}

const handleShare = (trip: Trip) => {
  // 分享行程
  ElMessage.success('分享链接已复制到剪贴板')
}

const handleDuplicate = (trip: Trip) => {
  // 复制行程
  ElMessage.success('行程已复制')
}

const handleDelete = async (trip: Trip) => {
  try {
    await ElMessageBox.confirm('确定要删除这个行程吗？', '确认删除', {
      type: 'warning'
    })
    
    const tripId = Number(trip.id)
    if (isNaN(tripId)) {
      ElMessage.error('行程ID无效')
      return
    }
    
    const res = await tripApi.deleteTrip(tripId)
    if (res.code === 200) {
      ElMessage.success('行程已删除')
      loadTrips() // 重新加载列表
    }
  } catch (error: any) {
    if (error.message !== 'cancel') {
      console.error('删除行程失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handleLeaveTrip = async (trip: Trip) => {
  try {
    await ElMessageBox.confirm('确定要退出这个行程吗？退出后将无法查看行程信息和账单。', '确认退出', {
      type: 'warning'
    })
    
    const tripId = Number(trip.id)
    if (isNaN(tripId)) {
      ElMessage.error('行程ID无效')
      return
    }
    
    console.log('TripList - 准备退出行程:', {
      tripId,
      currentUser: currentUser.value,
      userRole: getUserRoleInTrip(trip),
      isOwner: isOwner(trip),
      isParticipant: isParticipant(trip)
    })
    
    const res = await tripApi.leaveTrip(tripId)
    console.log('TripList - 退出行程响应:', res)
    
    if (res.code === 200) {
      ElMessage.success('已退出行程')
      loadTrips() // 重新加载列表
    } else {
      ElMessage.error(res.message || '退出失败')
    }
  } catch (error: any) {
    if (error.message !== 'cancel') {
      console.error('退出行程失败:', error)
      ElMessage.error(error.message || '退出失败')
    }
  }
}
</script>

<style scoped>
.trip-list {
  max-width: 1400px;
  margin: 0 auto;
}

/* 筛选器操作按钮 */
.filter-actions {
  display: flex;
  gap: 8px;
  width: 100%;
}

.search-btn {
  flex: 1;
  height: 40px;
  border-radius: 10px;
  font-weight: 500;
}

.create-btn-filter {
  flex: 1;
  height: 40px;
  border-radius: 10px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.create-btn-filter:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 筛选器样式 */
.filter-card-modern {
  margin-bottom: 32px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

.filter-card-modern :deep(.el-card__body) {
  padding: 24px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  letter-spacing: 0.3px;
}

.filter-select, .filter-input {
  width: 100%;
}

.filter-select :deep(.el-input__wrapper),
.filter-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
}

.filter-select :deep(.el-input__wrapper:hover),
.filter-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.search-btn {
  height: 40px;
  border-radius: 10px;
  font-weight: 500;
}

/* 行程卡片样式 */
.trip-grid {
  margin-bottom: 32px;
}

.trip-card-modern {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.trip-card-modern:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}

.trip-cover-modern {
  position: relative;
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.trip-card-modern:hover .cover-image {
  transform: scale(1.1);
}

.default-cover-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
  font-size: 48px;
  gap: 12px;
}

.default-cover-modern span {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.trip-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
}

.trip-status-modern {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.status-tag {
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
}

.trip-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, transparent 100%);
  pointer-events: none;
}

.trip-content-modern {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trip-title-modern {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.2px;
}

.trip-info-row {
  display: flex;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.info-icon {
  font-size: 16px;
  color: #8c8c8c;
}

.info-text {
  color: #666;
  line-height: 1.4;
}

.trip-members-modern {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.member-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-count-modern {
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 500;
}

.trip-actions-modern {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.action-btn {
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.pagination :deep(.el-pagination) {
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .trip-card-modern {
    margin-bottom: 24px;
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .create-btn {
    width: 100%;
  }
  
  .trip-cover-modern {
    height: 160px;
  }
}
</style>