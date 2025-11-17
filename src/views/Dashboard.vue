<template>
  <Layout>
    <div class="dashboard">
      <!-- 统计卡片 -->
      <el-row :gutter="24" class="stats-row">
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
      </el-row>

      <!-- 快速操作 -->
      <el-row :gutter="24" class="quick-actions">
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

      <!-- 最近行程和账单 -->
      <el-row :gutter="24">
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>最近行程</span>
                <el-button text @click="$router.push('/trips')">查看全部</el-button>
              </div>
            </template>
            <div class="recent-trips">
              <div v-for="trip in recentTrips" :key="trip.id" class="trip-item">
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
              <div v-for="expense in recentExpenses" :key="expense.id" class="expense-item">
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
  </Layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Layout from '@/components/Layout.vue'
import type { Trip, Expense } from '@/types'

// 统计数据
const stats = ref({
  totalTrips: 12,
  totalExpenses: 25680,
  ongoingTrips: 2,
  sharedTrips: 5
})

// 最近行程
const recentTrips = ref<Trip[]>([
  {
    id: '1',
    title: '日本关西之旅',
    destination: '大阪·京都·奈良',
    status: 'ongoing',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    description: '',
    coverImage: '',
    createdBy: 'user1',
    members: [],
    itinerary: [],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01'
  },
  {
    id: '2',
    title: '云南大理丽江',
    destination: '大理·丽江',
    status: 'planning',
    startDate: '2024-04-10',
    endDate: '2024-04-17',
    description: '',
    coverImage: '',
    createdBy: 'user1',
    members: [],
    itinerary: [],
    createdAt: '2024-02-20',
    updatedAt: '2024-02-20'
  }
])

// 最近账单
const recentExpenses = ref<Expense[]>([
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
  },
  {
    id: '2',
    tripId: '1',
    title: '京都怀石料理',
    amount: 1200,
    currency: 'CNY',
    category: 'food',
    paidBy: 'user2',
    participants: ['user1', 'user2'],
    splitType: 'equal',
    splits: [],
    date: '2024-03-17',
    createdAt: '2024-03-17'
  }
])

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
</style>