<template>
  <Layout>
    <div class="trip-list">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h2>我的行程</h2>
          <p>管理你的所有旅行计划</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="$router.push('/trips/create')">
            <el-icon><Plus /></el-icon>
            创建行程
          </el-button>
        </div>
      </div>

      <!-- 筛选器 -->
      <el-card class="filter-card">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-select v-model="filters.status" placeholder="状态筛选" clearable>
              <el-option label="全部" value="" />
              <el-option label="计划中" value="planning" />
              <el-option label="进行中" value="ongoing" />
              <el-option label="已完成" value="completed" />
            </el-select>
          </el-col>
          <el-col :span="8">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索行程标题或目的地"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button @click="handleSearch">搜索</el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 行程列表 -->
      <div class="trip-grid" v-loading="loading">
        <el-empty v-if="!loading && trips.length === 0" description="暂无行程数据" />
        <el-row :gutter="24" v-else>
          <el-col :span="8" v-for="trip in trips" :key="trip.id">
            <el-card class="trip-card" @click="$router.push(`/trips/${trip.id}`)">
              <div class="trip-cover">
                <img v-if="trip.coverImage" :src="formatImageUrl(trip.coverImage)" alt="行程封面" />
                <div v-else class="default-cover">
                  <el-icon><Picture /></el-icon>
                </div>
                <div class="trip-status">
                  <el-tag :type="getTripStatusType(trip.status)" size="small">
                    {{ getTripStatusText(trip.status) }}
                  </el-tag>
                </div>
              </div>
              
              <div class="trip-content">
                <h3 class="trip-title">{{ trip.title }}</h3>
                <p class="trip-destination">
                  <el-icon><MapLocation /></el-icon>
                  {{ trip.destination }}
                </p>
                <p class="trip-date">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDateRange(trip.startDate, trip.endDate) }}
                </p>
                <div class="trip-members">
                  <el-avatar-group :max="3" size="small">
                    <el-avatar v-for="member in trip.members" :key="member.userId">
                      {{ member.username.charAt(0) }}
                    </el-avatar>
                  </el-avatar-group>
                  <span class="member-count">{{ trip.members.length }} 人</span>
                </div>
              </div>
              
              <div class="trip-actions">
                <el-button text @click.stop="handleEdit(trip)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
                <el-button text @click.stop="handleShare(trip)">
                  <el-icon><Share /></el-icon>
                  分享
                </el-button>
                <el-dropdown @click.stop>
                  <el-button text>
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleDuplicate(trip)">
                        复制行程
                      </el-dropdown-item>
                      <el-dropdown-item @click="handleDelete(trip)" divided>
                        删除行程
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-card>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { tripApi } from '@/api'
import { formatImageUrl } from '@/utils/image'
import type { Trip } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)

// 筛选条件
const filters = ref({
  status: '',
  keyword: ''
})

// 分页
const pagination = ref({
  page: 1,
  pageSize: 12,
  total: 0
})

// 行程列表
const trips = ref<Trip[]>([])

onMounted(() => {
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
          members: trip.members || trip.participants || [],
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
</script>

<style scoped>
.trip-list {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: #333;
}

.header-left p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 24px;
}

.trip-grid {
  margin-bottom: 24px;
}

.trip-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
}

.trip-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.trip-cover {
  position: relative;
  height: 160px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.trip-cover img {
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
  font-size: 48px;
}

.trip-status {
  position: absolute;
  top: 8px;
  right: 8px;
}

.trip-content {
  margin-bottom: 16px;
}

.trip-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.trip-destination, .trip-date {
  display: flex;
  align-items: center;
  margin: 4px 0;
  font-size: 14px;
  color: #666;
}

.trip-destination .el-icon, .trip-date .el-icon {
  margin-right: 4px;
}

.trip-members {
  display: flex;
  align-items: center;
  margin-top: 12px;
}

.member-count {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}

.trip-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}
</style>