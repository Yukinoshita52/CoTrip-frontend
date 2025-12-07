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

      <!-- 账本选择 -->
      <el-card class="book-selector" v-if="accountBooks.length > 0" style="margin-bottom: 16px;">
        <el-radio-group v-model="selectedBookId" @change="handleBookChange">
          <el-radio-button
            v-for="book in accountBooks"
            :key="book.bookId || book.id"
            :label="book.bookId || book.id"
          >
            {{ book.name }}
          </el-radio-button>
        </el-radio-group>
      </el-card>

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
      <el-card v-loading="loading">
        <el-empty v-if="!loading && expenses.length === 0" description="暂无账单数据" />
        <el-table :data="expenses" style="width: 100%" v-else>
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
import { expenseApi, tripApi } from '@/api'
import { useUserStore } from '@/stores/user'
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

const loading = ref(false)
const userStore = useUserStore()
const accountBooks = ref<any[]>([])
const trips = ref<Trip[]>([])
const expenses = ref<Expense[]>([])
const selectedBookId = ref<number | null>(null)

// 加载账本列表
const loadAccountBooks = async () => {
  try {
    const res = await expenseApi.getAllAccountBooks()
    if (res.code === 200 && res.data) {
      accountBooks.value = Array.isArray(res.data) ? res.data : []
      // 如果有账本，默认选择第一个
      if (accountBooks.value.length > 0 && !selectedBookId.value) {
        selectedBookId.value = accountBooks.value[0].bookId || accountBooks.value[0].id
        loadExpenses()
      }
    }
  } catch (error: any) {
    console.error('加载账本列表失败:', error)
  }
}

// 加载行程列表（用于筛选）
const loadTrips = async () => {
  try {
    const res = await tripApi.getTrips()
    if (res.code === 200 && res.data) {
      const tripsData = Array.isArray(res.data) ? res.data : []
      trips.value = tripsData.map((trip: any) => ({
        id: String(trip.tripId || trip.id || ''),
        title: trip.name || trip.title || '',
        destination: trip.region || trip.destination || '',
        startDate: trip.startDate ? dayjs(trip.startDate).format('YYYY-MM-DD') : '',
        endDate: trip.endDate ? dayjs(trip.endDate).format('YYYY-MM-DD') : '',
        status: trip.status || 'planning',
        description: trip.description || '',
        coverImage: trip.coverImage || '',
        createdBy: String(trip.createdBy || ''),
        members: trip.members || [],
        itinerary: trip.itinerary || [],
        createdAt: trip.createdTime ? dayjs(trip.createdTime).format('YYYY-MM-DD') : '',
        updatedAt: trip.updatedTime ? dayjs(trip.updatedTime).format('YYYY-MM-DD') : ''
      }))
    }
  } catch (error: any) {
    console.error('加载行程列表失败:', error)
  }
}

// 统计数据
const stats = computed(() => {
  const expenseRecords = expenses.value.filter(e => e.category !== 'income')
  const totalAmount = expenseRecords.reduce((sum, expense) => sum + expense.amount, 0)
  const totalCount = expenses.value.length
  
  // 计算我的支出和待结算金额（基于实际数据）
  const myAmount = expenseRecords
    .filter(e => e.paidBy === userStore.user?.userId || e.paidBy === userStore.user?.id)
    .reduce((sum, expense) => sum + expense.amount, 0)
  
  const pendingAmount = expenseRecords
    .filter(e => !isSettled(e))
    .reduce((sum, expense) => sum + expense.amount, 0)
  
  return { 
    totalAmount, 
    myAmount,
    pendingAmount,
    totalCount 
  }
})

onMounted(() => {
  loadAccountBooks()
  loadTrips()
})

const loadExpenses = async () => {
  if (!selectedBookId.value) {
    expenses.value = []
    return
  }
  
  loading.value = true
  try {
    const res = await expenseApi.getRecords(selectedBookId.value, pagination.value.page, pagination.value.pageSize)
    if (res.code === 200 && res.data) {
      const data = res.data
      const items = data.items || data.list || []
      
      expenses.value = items.map((record: any) => ({
        id: String(record.recordId || record.id || ''),
        tripId: String(record.bookId || ''),
        title: record.categoryName || record.note || '未命名',
        amount: Number(record.amount || 0),
        currency: 'CNY',
        category: record.type === 1 ? 'income' : (record.type === 2 ? 'expense' : 'other'),
        description: record.note || '',
        paidBy: record.user?.userId ? String(record.user.userId) : '',
        participants: [],
        splitType: 'equal',
        splits: [],
        receipt: record.receipt || '',
        date: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : '',
        createdAt: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : ''
      }))
      
      pagination.value.total = data.total || items.length
    }
  } catch (error: any) {
    console.error('加载账单列表失败:', error)
    ElMessage.error(error.message || '加载账单列表失败')
  } finally {
    loading.value = false
  }
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
  pagination.value.page = 1
  loadExpenses()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  loadExpenses()
}

// 账本选择变化
const handleBookChange = (bookId: number) => {
  selectedBookId.value = bookId
  pagination.value.page = 1
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
  // 从行程成员中查找用户名
  const selectedTrip = trips.value.find(trip => trip.id === filters.value.tripId)
  if (selectedTrip) {
    const member = selectedTrip.members.find(m => m.userId === userId)
    if (member) {
      return member.username
    }
  }
  return userId
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