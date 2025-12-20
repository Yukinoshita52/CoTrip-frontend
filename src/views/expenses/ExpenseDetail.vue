<template>
  <Layout>
    <div class="expense-detail" v-loading="loading">
      <el-empty v-if="!loading && !expense" description="账单不存在或已删除" />
      
      <template v-if="expense">
        <!-- 页面头部 -->
        <div class="page-header">
          <div class="header-left">
            <h2>{{ expense.title }}</h2>
            <div class="expense-meta">
              <el-tag :type="getCategoryColor(expense.category)" size="large">
                {{ getCategoryText(expense.category) }}
              </el-tag>
              <span class="expense-amount">¥{{ expense.amount }}</span>
              <span class="expense-date">{{ formatDate(expense.date) }}</span>
            </div>
          </div>
          <div class="header-right">
            <el-button @click="editExpense">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button type="danger" @click="deleteExpense">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>

        <!-- 基本信息 -->
        <el-card class="info-card">
          <template #header>
            <span>基本信息</span>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="账单标题">
              {{ expense.title }}
            </el-descriptions-item>
            <el-descriptions-item label="支出金额">
              <span class="amount-text">¥{{ expense.amount }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="支出类别">
              <el-tag :type="getCategoryColor(expense.category)">
                {{ getCategoryText(expense.category) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支出日期">
              {{ formatFullDate(expense.date) }}
            </el-descriptions-item>
            <el-descriptions-item label="付款人">
              <div class="payer-info">
                <el-avatar size="small">{{ getUserName(expense.paidBy).charAt(0) }}</el-avatar>
                <span>{{ getUserName(expense.paidBy) }}</span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatFullDate(expense.createdAt) }}
            </el-descriptions-item>
            <el-descriptions-item label="账单描述" :span="2">
              {{ expense.description || '无' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <!-- 票据信息 -->
        <el-card v-if="expense.receipt" class="receipt-card">
          <template #header>
            <span>票据信息</span>
          </template>
          <div class="receipt-container">
            <img :src="expense.receipt" class="receipt-image" @click="previewReceipt" />
            <div class="receipt-actions">
              <el-button text @click="previewReceipt">
                <el-icon><View /></el-icon>
                查看大图
              </el-button>
              <el-button text @click="downloadReceipt">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
            </div>
          </div>
        </el-card>

        <!-- 分摊信息 -->
        <el-card class="split-card">
          <template #header>
            <div class="split-header">
              <span>分摊信息</span>
              <el-tag :type="isSettled ? 'success' : 'warning'">
                {{ isSettled ? '已结算' : '待结算' }}
              </el-tag>
            </div>
          </template>
          
          <div class="split-summary">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-statistic title="总金额" :value="expense.amount" prefix="¥" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="参与人数" :value="expense.participants.length" suffix="人" />
              </el-col>
              <el-col :span="8">
                <el-statistic title="分摊方式" :value="getSplitTypeText(expense.splitType)" />
              </el-col>
            </el-row>
          </div>

          <div class="split-details">
            <h4>分摊明细</h4>
            <el-table :data="expense.splits" style="width: 100%">
              <el-table-column label="参与人">
                <template #default="{ row }">
                  <div class="participant-info">
                    <el-avatar size="small">{{ getUserName(row.userId).charAt(0) }}</el-avatar>
                    <span>{{ getUserName(row.userId) }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="应付金额" align="right">
                <template #default="{ row }">
                  <span class="split-amount">¥{{ row.amount.toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="比例" align="center" v-if="expense.splitType === 'percentage'">
                <template #default="{ row }">
                  {{ row.percentage }}%
                </template>
              </el-table-column>
              <el-table-column label="状态" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.settled ? 'success' : 'warning'" size="small">
                    {{ row.settled ? '已结算' : '待结算' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center">
                <template #default="{ row }">
                  <el-button 
                    v-if="!row.settled" 
                    text 
                    type="primary" 
                    @click="settleSplit(row)"
                  >
                    标记已结算
                  </el-button>
                  <span v-else class="settled-text">已结算</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </template>

      <!-- 图片预览对话框 -->
      <el-dialog v-model="showPreview" title="票据预览" width="60%">
        <div class="preview-container">
          <img :src="expense?.receipt" class="preview-image" />
        </div>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { expenseApi, tripApi } from '@/api'
import type { Expense, Trip } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const showPreview = ref(false)
const expense = ref<Expense | null>(null)
const trips = ref<Trip[]>([])

// 加载账单详情
const loadExpenseDetail = async () => {
  const expenseId = route.params.id as string
  if (!expenseId) {
    ElMessage.error('账单ID无效')
    router.push('/expenses')
    return
  }
  
  loading.value = true
  try {
    const res = await expenseApi.getRecord(Number(expenseId))
    if (res.code === 200 && res.data) {
      const data = res.data
      expense.value = {
        id: String(data.recordId || expenseId),
        tripId: String(data.bookId || ''),
        title: data.categoryName || '未命名',
        amount: Number(data.amount || 0),
        currency: 'CNY',
        category: data.type === 1 ? 'income' : 'expense',
        description: data.note || '',
        paidBy: data.user?.userId ? String(data.user.userId) : '',
        participants: [], // 需要从其他地方获取
        splitType: 'equal',
        splits: [], // 需要从其他地方获取
        receipt: '', // 需要从图片信息获取
        date: data.recordTime ? dayjs(data.recordTime).format('YYYY-MM-DD') : '',
        createdAt: data.recordTime ? dayjs(data.recordTime).format('YYYY-MM-DD') : ''
      }
    } else {
      ElMessage.error(res.message || '加载账单详情失败')
      router.push('/expenses')
    }
  } catch (error: any) {
    console.error('加载账单详情失败:', error)
    ElMessage.error(error.message || '加载账单详情失败')
    router.push('/expenses')
  } finally {
    loading.value = false
  }
}

// 加载行程列表（用于获取成员信息）
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

onMounted(() => {
  loadExpenseDetail()
  loadTrips()
})

// 计算属性
const isSettled = computed(() => {
  return expense.value?.splits.every(split => split.settled) || false
})

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
}

const formatFullDate = (date: string) => {
  return dayjs(date).format('YYYY年MM月DD日')
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
    other: '其他',
    income: '收入',
    expense: '支出'
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
  const selectedTrip = trips.value.find(trip => trip.id === expense.value?.tripId)
  if (selectedTrip) {
    const member = selectedTrip.members.find(m => m.userId === userId)
    if (member) {
      return member.username
    }
  }
  return userId || '未知用户'
}

// 事件处理
const editExpense = () => {
  router.push(`/expenses/${expense.value?.id}/edit`)
}

const deleteExpense = async () => {
  try {
    await ElMessageBox.confirm('确定要删除这个账单吗？', '确认删除', {
      type: 'warning'
    })
    
    if (expense.value) {
      const res = await expenseApi.deleteRecord(Number(expense.value.id))
      if (res.code === 200) {
        ElMessage.success('账单已删除')
        router.push('/expenses')
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    }
  } catch (error: any) {
    if (error.message !== 'cancel') {
      console.error('删除账单失败:', error)
      ElMessage.error(error.message || '删除失败，请稍后再试')
    }
  }
}

const previewReceipt = () => {
  showPreview.value = true
}

const downloadReceipt = () => {
  if (expense.value?.receipt) {
    const link = document.createElement('a')
    link.href = expense.value.receipt
    link.download = `receipt_${expense.value.id}.jpg`
    link.click()
  }
}

const settleSplit = (split: any) => {
  split.settled = true
  ElMessage.success('已标记为结算')
}
</script>

<style scoped>
.expense-detail {
  max-width: 1000px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.expense-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.expense-amount {
  font-size: 18px;
  font-weight: bold;
  color: #f56c6c;
}

.expense-date {
  color: #666;
}

.header-right {
  display: flex;
  gap: 12px;
}

.info-card, .receipt-card, .split-card {
  margin-bottom: 24px;
}

.amount-text {
  font-size: 16px;
  font-weight: bold;
  color: #f56c6c;
}

.payer-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.receipt-container {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.receipt-image {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s;
}

.receipt-image:hover {
  transform: scale(1.05);
}

.receipt-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.split-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.split-summary {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.split-details h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.participant-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.split-amount {
  font-weight: bold;
  color: #f56c6c;
}

.settled-text {
  color: #67c23a;
  font-size: 12px;
}

.preview-container {
  text-align: center;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
</style>