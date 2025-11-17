<template>
  <Layout>
    <div class="expense-list">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h2>记账管理</h2>
          <p>管理你的旅行支出和账单分摊</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="$router.push('/expenses/create')">
            <el-icon><Plus /></el-icon>
            添加账单
          </el-button>
        </div>
      </div>

      <!-- 统计卡片 -->
      <el-row :gutter="24" class="stats-row">
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="总支出" :value="stats.totalAmount" prefix="¥" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="我的支出" :value="stats.myAmount" prefix="¥" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="待结算" :value="stats.pendingAmount" prefix="¥" />
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <el-statistic title="账单数量" :value="stats.totalCount" suffix="笔" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 筛选器 -->
      <el-card class="filter-card">
        <el-row :gutter="16">
          <el-col :span="4">
            <el-select v-model="filters.tripId" placeholder="选择行程" clearable>
              <el-option label="全部行程" value="" />
              <el-option
                v-for="trip in trips"
                :key="trip.id"
                :label="trip.title"
                :value="trip.id"
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="filters.category" placeholder="支出类别" clearable>
              <el-option label="全部类别" value="" />
              <el-option label="交通" value="transport" />
              <el-option label="住宿" value="accommodation" />
              <el-option label="餐饮" value="food" />
              <el-option label="活动" value="activity" />
              <el-option label="购物" value="shopping" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-date-picker
              v-model="filters.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-col>
          <el-col :span="6">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索账单标题"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-button @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 账单列表 -->
      <el-card>
        <el-table :data="expenses" style="width: 100%">
          <el-table-column prop="title" label="账单标题" min-width="150">
            <template #default="{ row }">
              <div class="expense-title">
                <span>{{ row.title }}</span>
                <el-tag v-if="row.receipt" size="small" type="success">有票据</el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="amount" label="金额" width="120" align="right">
            <template #default="{ row }">
              <span class="expense-amount">¥{{ row.amount }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="category" label="类别" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getCategoryColor(row.category)">
                {{ getCategoryText(row.category) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="paidBy" label="付款人" width="120">
            <template #default="{ row }">
              <div class="payer-info">
                <el-avatar size="small">{{ getUserName(row.paidBy).charAt(0) }}</el-avatar>
                <span>{{ getUserName(row.paidBy) }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="participants" label="参与人" width="150">
            <template #default="{ row }">
              <el-avatar-group :max="3" size="small">
                <el-avatar v-for="userId in row.participants" :key="userId">
                  {{ getUserName(userId).charAt(0) }}
                </el-avatar>
              </el-avatar-group>
              <span class="participant-count">{{ row.participants.length }}人</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="splitType" label="分摊方式" width="100">
            <template #default="{ row }">
              <span>{{ getSplitTypeText(row.splitType) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="date" label="日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.date) }}
            </template>
          </el-table-column>
          
          <el-table-column prop="settled" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="isSettled(row) ? 'success' : 'warning'" size="small">
                {{ isSettled(row) ? '已结算' : '待结算' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button text @click="viewExpense(row)">
                <el-icon><View /></el-icon>
                查看
              </el-button>
              <el-button text @click="editExpense(row)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-dropdown>
                <el-button text>
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="settleExpense(row)">
                      结算账单
                    </el-dropdown-item>
                    <el-dropdown-item @click="duplicateExpense(row)">
                      复制账单
                    </el-dropdown-item>
                    <el-dropdown-item @click="deleteExpense(row)" divided>
                      删除账单
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { Expense, Trip } from '@/types'
import dayjs from 'dayjs'

// 筛选条件
const filters = ref({
  tripId: '',
  category: '',
  dateRange: [] as string[],
  keyword: ''
})

// 分页
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 模拟数据
const trips = ref<Trip[]>([
  {
    id: '1',
    title: '日本关西之旅',
    destination: '大阪·京都·奈良',
    startDate: '2024-03-15',
    endDate: '2024-03-22',
    status: 'ongoing',
    description: '',
    coverImage: '',
    createdBy: 'user1',
    members: [],
    itinerary: [],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01'
  }
])

const expenses = ref<Expense[]>([
  {
    id: '1',
    tripId: '1',
    title: '大阪城门票',
    amount: 600,
    currency: 'CNY',
    category: 'activity',
    description: '大阪城公园门票费用',
    paidBy: 'user1',
    participants: ['user1', 'user2'],
    splitType: 'equal',
    splits: [
      { userId: 'user1', amount: 300, settled: true },
      { userId: 'user2', amount: 300, settled: false }
    ],
    receipt: 'receipt1.jpg',
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
    description: '京都传统怀石料理晚餐',
    paidBy: 'user2',
    participants: ['user1', 'user2'],
    splitType: 'equal',
    splits: [
      { userId: 'user1', amount: 600, settled: false },
      { userId: 'user2', amount: 600, settled: true }
    ],
    date: '2024-03-17',
    createdAt: '2024-03-17'
  }
])

// 统计数据
const stats = computed(() => {
  const totalAmount = expenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  const myAmount = expenses.value
    .filter(expense => expense.paidBy === 'user1')
    .reduce((sum, expense) => sum + expense.amount, 0)
  const pendingAmount = expenses.value
    .reduce((sum, expense) => {
      const pendingSplits = expense.splits.filter(split => !split.settled)
      return sum + pendingSplits.reduce((splitSum, split) => splitSum + split.amount, 0)
    }, 0)
  const totalCount = expenses.value.length
  
  return { totalAmount, myAmount, pendingAmount, totalCount }
})

onMounted(() => {
  loadExpenses()
})

const loadExpenses = () => {
  // 加载账单列表
  pagination.value.total = expenses.value.length
}

const handleSearch = () => {
  // 搜索逻辑
  loadExpenses()
}

const resetFilters = () => {
  filters.value = {
    tripId: '',
    category: '',
    dateRange: [],
    keyword: ''
  }
  loadExpenses()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  loadExpenses()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  loadExpenses()
}

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    transport: 'primary',
    accommodation: 'success',
    food: 'warning',
    activity: 'danger',
    shopping: 'info',
    other: ''
  }
  return colors[category] || ''
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

const getSplitTypeText = (splitType: string) => {
  const texts: Record<string, string> = {
    equal: '平均分摊',
    custom: '自定义',
    percentage: '按比例'
  }
  return texts[splitType] || splitType
}

const getUserName = (userId: string) => {
  const users: Record<string, string> = {
    user1: '张三',
    user2: '李四',
    user3: '王五'
  }
  return users[userId] || userId
}

const isSettled = (expense: Expense) => {
  return expense.splits.every(split => split.settled)
}

// 事件处理
const viewExpense = (expense: Expense) => {
  console.log('查看账单:', expense.id)
}

const editExpense = (expense: Expense) => {
  console.log('编辑账单:', expense.id)
}

const settleExpense = (expense: Expense) => {
  ElMessage.success('账单已结算')
}

const duplicateExpense = (expense: Expense) => {
  ElMessage.success('账单已复制')
}

const deleteExpense = async (expense: Expense) => {
  try {
    await ElMessageBox.confirm('确定要删除这个账单吗？', '确认删除', {
      type: 'warning'
    })
    ElMessage.success('账单已删除')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.expense-list {
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

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  text-align: center;
}

.filter-card {
  margin-bottom: 24px;
}

.expense-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expense-amount {
  font-weight: bold;
  color: #f56c6c;
}

.payer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.participant-count {
  margin-left: 8px;
  font-size: 12px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>