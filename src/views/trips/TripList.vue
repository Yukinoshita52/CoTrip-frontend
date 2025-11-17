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
      <div class="trip-grid">
        <el-row :gutter="24">
          <el-col :span="8" v-for="trip in trips" :key="trip.id">
            <el-card class="trip-card" @click="$router.push(`/trips/${trip.id}`)">
              <div class="trip-cover">
                <img v-if="trip.coverImage" :src="trip.coverImage" alt="行程封面" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { Trip } from '@/types'
import dayjs from 'dayjs'

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
const trips = ref<Trip[]>([
  {
    id: '1',
    title: '日本关西之旅',
    description: '探索古都京都的文化魅力',
    destination: '大阪·京都·奈良',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    status: 'ongoing',
    coverImage: '',
    createdBy: 'user1',
    members: [
      { userId: 'user1', username: '张三', role: 'owner', joinedAt: '2024-03-01' },
      { userId: 'user2', username: '李四', role: 'member', joinedAt: '2024-03-02' }
    ],
    itinerary: [],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01'
  },
  {
    id: '2',
    title: '云南大理丽江',
    description: '感受彩云之南的自然风光',
    destination: '大理·丽江',
    startDate: '2024-04-10',
    endDate: '2024-04-17',
    status: 'planning',
    coverImage: '',
    createdBy: 'user1',
    members: [
      { userId: 'user1', username: '张三', role: 'owner', joinedAt: '2024-02-20' }
    ],
    itinerary: [],
    createdAt: '2024-02-20',
    updatedAt: '2024-02-20'
  }
])

onMounted(() => {
  loadTrips()
})

const loadTrips = () => {
  // 加载行程列表
  pagination.value.total = trips.value.length
}

const handleSearch = () => {
  // 搜索逻辑
  loadTrips()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
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
  // 编辑行程
  console.log('编辑行程:', trip.id)
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
    // 删除逻辑
    ElMessage.success('行程已删除')
  } catch {
    // 用户取消
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