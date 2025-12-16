<template>
  <Layout>
    <div class="account-book-list">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h2>账本管理</h2>
          <p>管理你的旅行账本</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建账本
          </el-button>
        </div>
      </div>

      <!-- 账本列表 -->
      <el-row :gutter="24" v-loading="loading">
        <el-col :span="8" v-for="book in accountBooks" :key="book.bookId || book.id">
          <el-card class="book-card" :body-style="{ padding: '20px' }">
            <div class="book-header">
              <div class="book-info">
                <h3>{{ book.name }}</h3>
                <p class="book-trip">{{ getTripName(book.tripId) }}</p>
              </div>
              <el-dropdown @command="handleCommand">
                <el-button text>
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'view', book }">
                      查看详情
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'stats', book }">
                      统计信息
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', book }" divided>
                      删除账本
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="book-stats">
              <el-row :gutter="16">
                <el-col :span="12">
                  <div class="stat-item">
                    <div class="stat-value">{{ book.recordCount || 0 }}</div>
                    <div class="stat-label">记录数</div>
                  </div>
                </el-col>
                <el-col :span="12">
                  <div class="stat-item">
                    <div class="stat-value">¥{{ book.totalAmount || 0 }}</div>
                    <div class="stat-label">总支出</div>
                  </div>
                </el-col>
              </el-row>
            </div>

            <div class="book-actions">
              <el-button type="primary" @click="viewBook(book)">
                查看记录
              </el-button>
              <el-button @click="addRecord(book)">
                添加记录
              </el-button>
            </div>
          </el-card>
        </el-col>

        <!-- 空状态 -->
        <el-col :span="24" v-if="!loading && accountBooks.length === 0">
          <el-empty description="暂无账本">
            <el-button type="primary" @click="showCreateDialog = true">
              创建第一个账本
            </el-button>
          </el-empty>
        </el-col>
      </el-row>

      <!-- 创建账本对话框 -->
      <el-dialog v-model="showCreateDialog" title="创建账本" width="500px">
        <el-form :model="createForm" :rules="createRules" ref="createFormRef" label-width="80px">
          <el-form-item label="账本名称" prop="name">
            <el-input
              v-model="createForm.name"
              placeholder="如：日本旅行账本"
              maxlength="30"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="关联行程" prop="tripId">
            <el-select v-model="createForm.tripId" placeholder="选择行程" style="width: 100%">
              <el-option
                v-for="trip in trips"
                :key="trip.id"
                :label="trip.title"
                :value="Number(trip.id)"
              />
            </el-select>
          </el-form-item>
        </el-form>
        
        <template #footer>
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateBook" :loading="creating">
            创建
          </el-button>
        </template>
      </el-dialog>

      <!-- 统计信息对话框 -->
      <el-dialog v-model="showStatsDialog" title="账本统计" width="600px">
        <div v-if="currentBookStats" class="stats-content">
          <el-row :gutter="24">
            <el-col :span="8">
              <el-statistic title="总收入" :value="currentBookStats.totalIncome" prefix="¥" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="总支出" :value="currentBookStats.totalExpense" prefix="¥" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="净收支" :value="currentBookStats.netAmount" prefix="¥" />
            </el-col>
          </el-row>

          <div class="category-stats" style="margin-top: 24px;">
            <h4>支出分类统计</h4>
            <el-table :data="currentBookStats.categoryStats" style="width: 100%">
              <el-table-column prop="categoryName" label="类别" />
              <el-table-column prop="amount" label="金额" align="right">
                <template #default="{ row }">
                  ¥{{ row.amount }}
                </template>
              </el-table-column>
              <el-table-column prop="count" label="笔数" align="center" />
            </el-table>
          </div>
        </div>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { expenseApi, tripApi } from '@/api'
import type { Trip } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const creating = ref(false)
const showCreateDialog = ref(false)
const showStatsDialog = ref(false)
const createFormRef = ref<FormInstance>()

const accountBooks = ref<any[]>([])
const trips = ref<Trip[]>([])
const currentBookStats = ref<any>(null)

// 创建表单
const createForm = reactive({
  name: '',
  tripId: null as number | null
})

// 表单验证规则
const createRules: FormRules = {
  name: [
    { required: true, message: '请输入账本名称', trigger: 'blur' },
    { min: 2, max: 30, message: '名称长度在 2 到 30 个字符', trigger: 'blur' }
  ],
  tripId: [
    { required: true, message: '请选择关联行程', trigger: 'change' }
  ]
}

// 加载账本列表
const loadAccountBooks = async () => {
  loading.value = true
  try {
    console.log('AccountBookList: 开始加载账本列表...')
    const res = await expenseApi.getAllAccountBooks()
    console.log('AccountBookList: 账本API响应:', res)
    
    if (res.code === 200 && res.data) {
      accountBooks.value = Array.isArray(res.data) ? res.data : []
      console.log('AccountBookList: 解析后的账本列表:', accountBooks.value)
    } else {
      console.log('AccountBookList: 账本API返回错误:', res.message)
    }
  } catch (error: any) {
    console.error('加载账本列表失败:', error)
    ElMessage.error(error.message || '加载账本列表失败')
  } finally {
    loading.value = false
  }
}

// 加载行程列表
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
  loadAccountBooks()
  loadTrips()
})

// 获取行程名称
const getTripName = (tripId: number) => {
  const trip = trips.value.find(t => Number(t.id) === tripId)
  return trip?.title || '未关联行程'
}

// 创建账本
const handleCreateBook = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    
    creating.value = true
    const res = await expenseApi.createAccountBook({
      name: createForm.name,
      tripId: createForm.tripId!
    })
    
    if (res.code === 200) {
      ElMessage.success('账本创建成功')
      showCreateDialog.value = false
      
      // 重置表单
      createForm.name = ''
      createForm.tripId = null
      
      // 重新加载账本列表
      await loadAccountBooks()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch (error: any) {
    console.error('创建账本失败:', error)
    ElMessage.error(error.message || '创建失败，请稍后再试')
  } finally {
    creating.value = false
  }
}

// 处理下拉菜单命令
const handleCommand = async (command: { action: string; book: any }) => {
  const { action, book } = command
  
  switch (action) {
    case 'view':
      viewBook(book)
      break
    case 'stats':
      await loadBookStats(book)
      break
    case 'delete':
      await deleteBook(book)
      break
  }
}

// 查看账本
const viewBook = (book: any) => {
  router.push({
    path: '/expenses',
    query: { bookId: book.bookId || book.id }
  })
}

// 添加记录
const addRecord = (book: any) => {
  router.push({
    path: '/expenses/create',
    query: { bookId: book.bookId || book.id }
  })
}

// 加载账本统计
const loadBookStats = async (book: any) => {
  try {
    const bookId = book.bookId || book.id
    const res = await expenseApi.getBookStats(bookId)
    if (res.code === 200 && res.data) {
      currentBookStats.value = res.data
      showStatsDialog.value = true
    } else {
      ElMessage.error(res.message || '加载统计信息失败')
    }
  } catch (error: any) {
    console.error('加载统计信息失败:', error)
    ElMessage.error(error.message || '加载统计信息失败')
  }
}

// 删除账本
const deleteBook = async (book: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除账本"${book.name}"吗？删除后所有记录将无法恢复。`,
      '确认删除',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    )
    
    const bookId = book.bookId || book.id
    const res = await expenseApi.deleteAccountBook(bookId)
    if (res.code === 200) {
      ElMessage.success('账本已删除')
      await loadAccountBooks()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error.message !== 'cancel') {
      console.error('删除账本失败:', error)
      ElMessage.error(error.message || '删除失败，请稍后再试')
    }
  }
}
</script>

<style scoped>
.account-book-list {
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

.book-card {
  margin-bottom: 24px;
  transition: all 0.3s;
}

.book-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.book-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.book-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}

.book-trip {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.book-stats {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.book-actions {
  display: flex;
  gap: 8px;
}

.stats-content {
  padding: 16px 0;
}

.category-stats h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}
</style>