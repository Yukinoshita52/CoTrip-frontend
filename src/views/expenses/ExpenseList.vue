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
          <el-button @click="$router.push('/expenses/books')">
            <el-icon><Folder /></el-icon>
            账本管理
          </el-button>
          <el-button @click="$router.push('/expenses/split')">
            <el-icon><Calculator /></el-icon>
            分摊计算
          </el-button>
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
      <el-card class="book-selector" v-if="accountBooks.length > 1" style="margin-bottom: 16px;">
        <template #header>
          <div class="book-selector-header">
            <span>选择行程账本</span>
            <el-tooltip content="每个行程对应一个账本" placement="top">
              <el-icon><QuestionFilled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <el-select v-model="selectedBookId" @change="handleBookChange" placeholder="选择行程账本" style="width: 100%;">
          <el-option
            v-for="book in accountBooks"
            :key="book.bookId || book.id"
            :label="`${getTripName(book.tripId)} - ${book.name}`"
            :value="book.bookId || book.id"
          />
        </el-select>
      </el-card>
      
      <!-- 当前账本信息 -->
      <el-card v-if="currentBook" class="current-book-info" style="margin-bottom: 16px;">
        <div class="book-info">
          <h3>{{ currentBook.name }}</h3>
          <p>关联行程：{{ getTripName(currentBook.tripId) }}</p>
        </div>
      </el-card>

      <!-- 筛选器 -->
      <el-card class="filter-card">
        <el-row :gutter="16">
          <el-col :span="5">
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
          <el-col :span="7">
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
          <el-col :span="7">
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
          <el-col :span="5">
            <el-button @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 无账本提示 -->
      <el-card v-if="!loading && accountBooks.length === 0" class="no-books-card">
        <el-empty description="还没有账本">
          <template #description>
            <p>账本是管理行程支出的基础</p>
            <p>每个行程可以创建一个账本来记录相关的收支</p>
          </template>
          <el-button type="primary" @click="$router.push('/expenses/books')">
            创建第一个账本
          </el-button>
        </el-empty>
      </el-card>

      <!-- 账单列表 -->
      <el-card v-loading="loading" v-if="accountBooks.length > 0">
        <el-empty v-if="!loading && expenses.length === 0" description="暂无账单数据">
          <el-button type="primary" @click="showAddExpenseDialog = true">
            添加第一笔账单
          </el-button>
        </el-empty>
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

    <!-- 添加账单对话框 -->
    <el-dialog v-model="showAddExpenseDialog" title="添加账单" width="600px" @close="resetExpenseForm">
      <el-form
        ref="expenseFormRef"
        :model="expenseForm"
        :rules="expenseRules"
        label-width="100px"
      >
        <el-form-item label="账单标题" prop="title">
          <el-input
            v-model="expenseForm.title"
            placeholder="如：大阪城门票、午餐费用等"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="支出金额" prop="amount">
          <el-input-number
            v-model="expenseForm.amount"
            :min="0"
            :precision="2"
            placeholder="0.00"
            style="width: 200px"
          />
          <span style="margin-left: 8px;">元</span>
        </el-form-item>
        
        <el-form-item label="支出类别" prop="category">
          <el-select v-model="expenseForm.category" placeholder="选择类别" style="width: 100%">
            <el-option label="交通" value="transport" />
            <el-option label="住宿" value="accommodation" />
            <el-option label="餐饮" value="food" />
            <el-option label="活动" value="activity" />
            <el-option label="购物" value="shopping" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="支出日期" prop="date">
          <el-date-picker
            v-model="expenseForm.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="付款人" prop="paidBy">
          <el-select v-model="expenseForm.paidBy" placeholder="选择付款人" style="width: 100%">
            <el-option
              v-for="member in currentTripMembers"
              :key="member.userId"
              :label="member.username"
              :value="member.userId"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="账单描述">
          <el-input
            v-model="expenseForm.description"
            type="textarea"
            :rows="3"
            placeholder="详细描述这笔支出"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        
        <el-form-item label="票据上传">
          <el-upload
            class="receipt-uploader"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :auto-upload="false"
          >
            <img v-if="expenseForm.receipt" :src="expenseForm.receipt" class="receipt-image" />
            <div v-else class="upload-placeholder">
              <el-icon><Plus /></el-icon>
              <div class="upload-text">上传票据</div>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddExpenseDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddExpense" :loading="addingExpense">
          保存账单
        </el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { expenseApi, tripApi, imageApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Expense, Trip } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()

// 筛选条件
const filters = ref({
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

// 添加账单对话框相关
const showAddExpenseDialog = ref(false)
const addingExpense = ref(false)
const expenseFormRef = ref<FormInstance>()
const expenseForm = ref({
  title: '',
  amount: 0,
  category: '',
  date: '',
  paidBy: '',
  description: '',
  receipt: ''
})

// 加载账本列表
const loadAccountBooks = async () => {
  try {
    console.log('开始加载账本列表...')
    const res = await expenseApi.getAllAccountBooks()
    console.log('账本API响应:', res)
    
    if (res.code === 200 && res.data) {
      accountBooks.value = Array.isArray(res.data) ? res.data : []
      console.log('解析后的账本列表:', accountBooks.value)
      
      // 如果有账本，默认选择第一个
      if (accountBooks.value.length > 0 && !selectedBookId.value) {
        selectedBookId.value = accountBooks.value[0].bookId || accountBooks.value[0].id
        console.log('默认选择账本ID:', selectedBookId.value)
        loadExpenses()
      }
    } else {
      console.log('账本API返回错误:', res.message)
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

onMounted(async () => {
  console.log('ExpenseList mounted')
  console.log('当前用户:', userStore.user)
  console.log('Token:', localStorage.getItem('token'))
  
  // 确保用户已登录
  if (!userStore.user) {
    console.log('用户未登录，尝试获取用户信息...')
    await userStore.fetchCurrentUser()
    console.log('获取用户信息后:', userStore.user)
  }
  
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

// 获取行程名称
const getTripName = (tripId: number) => {
  const trip = trips.value.find(t => Number(t.id) === tripId)
  return trip?.title || '未知行程'
}

// 当前选中的账本
const currentBook = computed(() => {
  return accountBooks.value.find(book => (book.bookId || book.id) === selectedBookId.value)
})

// 当前行程的成员列表
const currentTripMembers = computed(() => {
  if (!currentBook.value) return []
  const trip = trips.value.find(t => Number(t.id) === currentBook.value.tripId)
  return trip?.members || []
})

// 添加账单表单验证规则
const expenseRules: FormRules = {
  title: [
    { required: true, message: '请输入账单标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  amount: [
    { required: true, message: '请输入支出金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择支出类别', trigger: 'change' }
  ],
  date: [
    { required: true, message: '请选择支出日期', trigger: 'change' }
  ],
  paidBy: [
    { required: true, message: '请选择付款人', trigger: 'change' }
  ]
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
  // 从当前账本关联的行程中查找用户名
  if (currentBook.value && currentBook.value.tripId) {
    const selectedTrip = trips.value.find(trip => Number(trip.id) === currentBook.value.tripId)
    if (selectedTrip) {
      const member = selectedTrip.members.find(m => m.userId === userId)
      if (member) {
        return member.username
      }
    }
  }
  
  // 如果找不到，返回用户ID或默认名称
  return userId || '未知用户'
}

const isSettled = (expense: Expense) => {
  return expense.splits.every(split => split.settled)
}

// 事件处理
const viewExpense = (expense: Expense) => {
  router.push(`/expenses/${expense.id}`)
}

const editExpense = (expense: Expense) => {
  router.push(`/expenses/${expense.id}/edit`)
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
    
    const res = await expenseApi.deleteRecord(Number(expense.id))
    if (res.code === 200) {
      ElMessage.success('账单已删除')
      // 重新加载账单列表
      loadExpenses()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error.message !== 'cancel') {
      console.error('删除账单失败:', error)
      ElMessage.error(error.message || '删除失败，请稍后再试')
    }
  }
}

// 重置添加账单表单
const resetExpenseForm = () => {
  expenseForm.value = {
    title: '',
    amount: 0,
    category: '',
    date: '',
    paidBy: '',
    description: '',
    receipt: ''
  }
  if (expenseFormRef.value) {
    expenseFormRef.value.clearValidate()
  }
}

// 票据上传处理
const beforeUpload = async (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
    return false
  }
  
  try {
    const res = await imageApi.uploadImage(file, 4, 0) // itemType=4表示其他类型
    if (res.code === 200 && res.data) {
      expenseForm.value.receipt = res.data.url
      ElMessage.success('票据上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败，请稍后再试')
  }
  
  return false // 阻止默认上传行为
}

// 处理添加账单
const handleAddExpense = async () => {
  if (!expenseFormRef.value) return
  
  try {
    await expenseFormRef.value.validate()
    
    if (!selectedBookId.value) {
      ElMessage.error('请先选择账本')
      return
    }
    
    addingExpense.value = true
    
    // 构建提交数据（匹配后端RecordDTO格式）
    const categoryMapping: Record<string, number> = {
      'transport': 1,
      'accommodation': 2,
      'food': 3,
      'activity': 4,
      'shopping': 5,
      'other': 6
    }
    
    const recordData = {
      bookId: selectedBookId.value,
      type: 2, // 2表示支出，1表示收入
      amount: expenseForm.value.amount,
      categoryId: categoryMapping[expenseForm.value.category] || 1,
      categoryName: expenseForm.value.category || '',
      note: expenseForm.value.description || expenseForm.value.title,
      recordTime: expenseForm.value.date ? new Date(expenseForm.value.date) : new Date()
    }
    
    const res = await expenseApi.createRecord(recordData)
    
    if (res.code === 200) {
      ElMessage.success('账单添加成功!')
      showAddExpenseDialog.value = false
      resetExpenseForm()
      // 重新加载账单列表
      loadExpenses()
    } else {
      ElMessage.error(res.message || '添加失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败，请稍后再试')
  } finally {
    addingExpense.value = false
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

.receipt-uploader {
  display: inline-block;
}

.receipt-image {
  width: 150px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.upload-placeholder {
  width: 150px;
  height: 100px;
  border: 2px dashed #dcdfe6;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-placeholder:hover {
  border-color: #409eff;
}

.upload-text {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}
</style>