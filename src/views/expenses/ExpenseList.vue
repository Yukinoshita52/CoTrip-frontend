<template>
  <Layout>
    <div class="expense-list">
      <!-- 统计卡片 -->
      <el-row :gutter="24" class="stats-row">
        <el-col :span="6">
          <div class="stat-card-modern total">
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总支出</div>
              <div class="stat-value">¥{{ stats.totalAmount.toFixed(2) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card-modern my-expense">
            <div class="stat-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">我的支出</div>
              <div class="stat-value">¥{{ stats.myAmount.toFixed(2) }}</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card-modern total-count">
            <div class="stat-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总账单数</div>
              <div class="stat-value">{{ stats.totalCount }}<span class="stat-unit">笔</span></div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card-modern my-count">
            <div class="stat-icon">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">我的账单数</div>
              <div class="stat-value">{{ stats.myCount }}<span class="stat-unit">笔</span></div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 账本选择区域 -->
      <div class="books-selection-area" v-if="!loading && accountBooks.length > 0">
        <div class="section-header">
          <h2 class="section-title">选择账本</h2>
          <div class="section-hint" v-if="accountBooks.length > 3">
            <el-icon><ArrowRight /></el-icon>
            <span>可左右滑动查看更多</span>
          </div>
        </div>
        <div class="books-grid">
          <div 
            v-for="book in accountBooks" 
            :key="book.bookId || book.id"
            class="book-card-modern"
            :class="{ 'selected': selectedBookId === (book.bookId || book.id) }"
            @click="handleBookSelect(book.bookId || book.id)"
          >
            <div class="book-card-header">
              <el-icon class="book-icon"><Notebook /></el-icon>
              <div class="book-info">
                <div class="book-name">{{ book.name }}</div>
                <div class="book-trip">{{ getTripName(book.tripId) }}</div>
              </div>
            </div>
            <div class="book-stats" v-if="bookStats[book.bookId || book.id]">
              <div class="stat-item">
                <span class="stat-label">总支出</span>
                <span class="stat-value">¥{{ bookStats[book.bookId || book.id].totalAmount.toFixed(2) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">账单数</span>
                <span class="stat-value">{{ bookStats[book.bookId || book.id].count }}笔</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作和筛选区域 -->
      <el-card class="actions-filter-card" v-if="selectedBookId">
        <div class="actions-filter-content">
          <!-- 左侧操作按钮 -->
          <div class="action-buttons-section">
            <el-button type="primary" @click="handleAddExpenseClick" class="primary-action-btn">
              <el-icon><Plus /></el-icon>
              添加账单
            </el-button>
            <el-button @click="handleSplitCalculation" class="secondary-action-btn">
              <el-icon><Calculator /></el-icon>
              分摊计算
            </el-button>
          </div>
          
          <!-- 右侧筛选和排序 -->
          <div class="filter-sort-section">
            <div class="filter-item">
              <label class="filter-label">类别筛选</label>
              <el-select v-model="filters.category" placeholder="全部类别" clearable @change="applyFilters">
                <el-option label="全部类别" value="" />
                <el-option label="交通" value="transport" />
                <el-option label="住宿" value="accommodation" />
                <el-option label="餐饮" value="food" />
                <el-option label="活动" value="activity" />
                <el-option label="购物" value="shopping" />
                <el-option label="其他" value="other" />
              </el-select>
            </div>
            
            <div class="filter-item">
              <label class="filter-label">排序方式</label>
              <el-select v-model="sortBy" placeholder="选择排序" @change="applySorting">
                <el-option label="按时间排列" value="date" />
                <el-option label="按金额逆序" value="amount" />
              </el-select>
            </div>
          </div>
        </div>
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
      <el-card v-loading="loading" v-if="selectedBookId">
        <!-- 无账单数据 -->
        <el-empty v-if="!loading && filteredExpenses.length === 0 && expenses.length === 0" description="暂无账单数据">
          <el-button type="primary" @click="showAddExpenseDialog = true">
            添加第一笔账单
          </el-button>
        </el-empty>
        
        <!-- 筛选后无数据 -->
        <el-empty v-else-if="!loading && filteredExpenses.length === 0 && expenses.length > 0" description="没有符合条件的账单">
          <el-button @click="resetFilters">
            清除筛选条件
          </el-button>
        </el-empty>
        
        <!-- 账单表格 -->
        <el-table 
          :data="filteredExpenses" 
          style="width: 100%" 
          v-else-if="filteredExpenses.length > 0"
          class="expense-table-modern"
          stripe
        >
          <el-table-column prop="category" label="类别" width="140" align="center">
            <template #default="{ row }">
              <el-tag size="small" :type="getCategoryColor(row.category)" class="category-tag-modern">
                {{ getCategoryText(row.category) }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column prop="amount" label="金额" width="150" align="right">
            <template #default="{ row }">
              <span class="expense-amount-modern">¥{{ Number(row.amount).toFixed(2) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="paidBy" label="付款人" width="140" align="center">
            <template #default="{ row }">
              <div class="payer-info-modern">
                <el-avatar :size="24" :src="getUserAvatar(row.paidBy)" class="payer-avatar">
                  {{ getUserName(row.paidBy).charAt(0) }}
                </el-avatar>
                <span class="payer-name">{{ getUserName(row.paidBy) }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="title" label="账单描述" min-width="200">
            <template #default="{ row }">
              <div class="expense-title-modern">
                <span class="title-text" v-if="row.title && row.title.trim()">{{ row.title }}</span>
                <span v-else class="no-description">-</span>
                <el-tag v-if="row.receipt" size="small" type="success" class="receipt-tag">
                  <el-icon><Picture /></el-icon>
                  票据
                </el-tag>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="date" label="日期" width="120" align="center">
            <template #default="{ row }">
              <span class="expense-date">{{ formatDate(row.date) }}</span>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="action-buttons-modern">
                <el-button text @click="viewExpense(row)" size="small" class="action-btn-item">
                  <el-icon><View /></el-icon>
                </el-button>
                <template v-if="isCurrentUserExpense(row)">
                  <el-button text @click="editExpense(row)" size="small" class="action-btn-item">
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button text @click="deleteExpense(row)" type="danger" size="small" class="action-btn-item">
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </template>
              </div>
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
    <el-dialog 
      v-model="showAddExpenseDialog" 
      title="添加账单" 
      width="600px" 
      class="expense-dialog"
      :close-on-click-modal="false"
      @close="resetExpenseForm"
    >
      <template #header="{ titleId, titleClass }">
        <div class="expense-dialog-header">
          <div class="expense-dialog-icon-wrapper">
            <el-icon class="expense-dialog-icon"><Money /></el-icon>
          </div>
          <span :id="titleId" :class="titleClass">添加账单</span>
        </div>
      </template>
      
      <el-form
        ref="expenseFormRef"
        :model="expenseForm"
        :rules="expenseRules"
        label-position="top"
        class="expense-form"
      >
        <el-form-item prop="amount" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><Money /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>支出金额</span>
            </div>
          </template>
          <div class="amount-input-wrapper">
            <el-input-number
              v-model="expenseForm.amount"
              :min="0"
              :precision="2"
              placeholder="0.00"
              size="large"
              class="expense-amount-input"
              controls-position="right"
            />
            <span class="amount-unit">元</span>
          </div>
        </el-form-item>
        
        <el-form-item prop="category" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><List /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>支出类别</span>
            </div>
          </template>
          <el-select 
            v-model="expenseForm.category" 
            placeholder="请选择支出类别" 
            size="large"
            class="expense-select"
          >
            <el-option label="交通" value="transport" />
            <el-option label="住宿" value="accommodation" />
            <el-option label="餐饮" value="food" />
            <el-option label="活动" value="activity" />
            <el-option label="购物" value="shopping" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item prop="date" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><Calendar /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>支出日期</span>
            </div>
          </template>
          <el-date-picker
            v-model="expenseForm.date"
            type="date"
            placeholder="请选择支出日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="large"
            class="expense-date-picker"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="账单描述" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><Document /></el-icon>
              <span class="label-text">账单描述</span>
            </div>
          </template>
          <el-input
            v-model="expenseForm.description"
            type="textarea"
            :rows="4"
            placeholder="详细描述这笔支出（选填）"
            maxlength="200"
            show-word-limit
            class="expense-textarea"
          />
        </el-form-item>
        
        <el-form-item label="票据上传" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><Picture /></el-icon>
              <span class="label-text">票据上传</span>
            </div>
          </template>
          <el-upload
            class="receipt-uploader-modern"
            :show-file-list="false"
            :before-upload="beforeUpload"
            :auto-upload="false"
          >
            <img v-if="expenseForm.receipt" :src="expenseForm.receipt" class="receipt-image-modern" />
            <div v-else class="upload-placeholder-modern">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text-modern">点击上传票据</div>
              <div class="upload-hint">支持 JPG、PNG 格式，大小不超过 2MB</div>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="expense-dialog-footer">
          <el-button 
            @click="showAddExpenseDialog = false" 
            size="large"
            class="expense-cancel-button"
          >
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="handleAddExpense" 
            :loading="addingExpense"
            size="large"
            class="expense-submit-button"
          >
            <span v-if="!addingExpense">
              <el-icon><Check /></el-icon>
              保存账单
            </span>
            <span v-else>保存中...</span>
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看账单对话框 -->
    <el-dialog v-model="showViewExpenseDialog" title="查看账单" width="600px">
      <div v-if="currentExpense" class="expense-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="账单描述" v-if="currentExpense.title && currentExpense.title.trim()">{{ currentExpense.title }}</el-descriptions-item>
          <el-descriptions-item label="支出金额">¥{{ currentExpense.amount }}</el-descriptions-item>
          <el-descriptions-item label="支出类别">
            <el-tag :type="getCategoryColor(currentExpense.category)">
              {{ getCategoryText(currentExpense.category) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支出日期">{{ currentExpense.date }}</el-descriptions-item>
          <el-descriptions-item label="付款人">
            <div class="payer-info-dialog">
              <el-avatar :size="32" :src="getUserAvatar(currentExpense.paidBy)" class="payer-avatar-dialog">
                {{ getUserName(currentExpense.paidBy).charAt(0) }}
              </el-avatar>
              <span class="payer-name-dialog">{{ getUserName(currentExpense.paidBy) }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ currentExpense.createdAt }}</el-descriptions-item>
          <el-descriptions-item label="票据" :span="2" v-if="currentExpense.receipt">
            <img :src="currentExpense.receipt" class="receipt-preview" />
          </el-descriptions-item>
        </el-descriptions>
      </div>
      
      <template #footer>
        <el-button @click="showViewExpenseDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 编辑账单对话框 -->
    <el-dialog 
      v-model="showEditExpenseDialog" 
      title="编辑账单" 
      width="600px" 
      class="expense-dialog"
      :close-on-click-modal="false"
      @close="resetEditForm"
    >
      <template #header="{ titleId, titleClass }">
        <div class="expense-dialog-header">
          <div class="expense-dialog-icon-wrapper">
            <el-icon class="expense-dialog-icon"><Edit /></el-icon>
          </div>
          <span :id="titleId" :class="titleClass">编辑账单</span>
        </div>
      </template>
      
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-position="top"
        class="expense-form"
      >
        <el-form-item prop="amount" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><Money /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>支出金额</span>
            </div>
          </template>
          <div class="amount-input-wrapper">
            <el-input-number
              v-model="editForm.amount"
              :min="0"
              :precision="2"
              placeholder="0.00"
              size="large"
              class="expense-amount-input"
              controls-position="right"
            />
            <span class="amount-unit">元</span>
          </div>
        </el-form-item>
        
        <el-form-item prop="category" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><List /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>支出类别</span>
            </div>
          </template>
          <el-select 
            v-model="editForm.category" 
            placeholder="请选择支出类别" 
            size="large"
            class="expense-select"
          >
            <el-option label="交通" value="transport" />
            <el-option label="住宿" value="accommodation" />
            <el-option label="餐饮" value="food" />
            <el-option label="活动" value="activity" />
            <el-option label="购物" value="shopping" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item prop="date" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><Calendar /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>支出日期</span>
            </div>
          </template>
          <el-date-picker
            v-model="editForm.date"
            type="date"
            placeholder="请选择支出日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            size="large"
            class="expense-date-picker"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="账单描述" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><Document /></el-icon>
              <span class="label-text">账单描述</span>
            </div>
          </template>
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="4"
            placeholder="详细描述这笔支出（选填）"
            maxlength="200"
            show-word-limit
            class="expense-textarea"
          />
        </el-form-item>
        
        <el-form-item label="票据上传" class="expense-form-item">
          <template #label>
            <div class="expense-form-label">
              <el-icon><Picture /></el-icon>
              <span class="label-text">票据上传</span>
            </div>
          </template>
          <el-upload
            class="receipt-uploader-modern"
            :show-file-list="false"
            :before-upload="beforeEditUpload"
            :auto-upload="false"
          >
            <img v-if="editForm.receipt" :src="editForm.receipt" class="receipt-image-modern" />
            <div v-else class="upload-placeholder-modern">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text-modern">点击上传票据</div>
              <div class="upload-hint">支持 JPG、PNG 格式，大小不超过 2MB</div>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="expense-dialog-footer">
          <el-button 
            @click="showEditExpenseDialog = false" 
            size="large"
            class="expense-cancel-button"
          >
            取消
          </el-button>
          <el-button 
            type="primary" 
            @click="handleEditExpense" 
            :loading="editingExpense"
            size="large"
            class="expense-submit-button"
          >
            <span v-if="!editingExpense">
              <el-icon><Check /></el-icon>
              保存修改
            </span>
            <span v-else>保存中...</span>
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分摊计算对话框 -->
    <el-dialog v-model="showSplitDialog" title="分摊计算" width="600px">
      <div v-if="splitResults.length === 0" class="no-split-data">
        <el-empty description="暂无分摊数据">
          <template #description>
            <p>请先添加一些账单记录</p>
          </template>
        </el-empty>
      </div>
      
      <div v-else class="split-results">
        <h4 style="margin-bottom: 16px; color: #333;">成员分摊详细</h4>
        
        <div class="split-summary" style="margin-bottom: 20px; padding: 16px; background: #f5f7fa; border-radius: 8px;">
          <div class="summary-item">
            <span class="label">行程总支出：</span>
            <span class="value">¥{{ stats.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">我的支出：</span>
            <span class="value">¥{{ stats.myAmount.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">成员总人数：</span>
            <span class="value">{{ splitData?.totalMembers || 0 }}人</span>
          </div>
          <div class="summary-item">
            <span class="label">人均花费：</span>
            <span class="value">¥{{ (splitData?.totalMembers || 0) > 0 ? (stats.totalAmount / (splitData?.totalMembers || 1)).toFixed(2) : '0.00' }}</span>
          </div>
        </div>
        
        <div class="split-list">
          <div 
            v-for="result in splitResults" 
            :key="result.userId"
            class="split-item"
            :class="{
              'split-pay': result.type === 'pay',
              'split-receive': result.type === 'receive',
              'split-none': result.type === 'none'
            }"
          >
            <div class="split-icon">
              <el-icon v-if="result.type === 'pay'" color="#f56c6c"><ArrowRight /></el-icon>
              <el-icon v-else-if="result.type === 'receive'" color="#67c23a"><ArrowLeft /></el-icon>
              <el-icon v-else color="#909399"><Minus /></el-icon>
            </div>
            <div class="split-content">
              <div class="split-description">{{ result.description }}</div>
              <div v-if="result.amount > 0" class="split-amount" :class="{
                'amount-pay': result.type === 'pay',
                'amount-receive': result.type === 'receive'
              }">
                ¥{{ result.amount.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showSplitDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, ArrowLeft, Minus, Money, List, Calendar, Document, Picture, Edit, Check } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { expenseApi, tripApi, imageApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { Expense, Trip } from '@/types'
import { formatAvatarUrl } from '@/utils/image'
import dayjs from 'dayjs'

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
const bookStats = ref<Record<number, any>>({}) // 存储每个账本的统计信息
const splitData = ref<any>(null) // 存储分摊计算结果
const myExpenseStats = ref<any>(null) // 存储我的支出统计

// 筛选和排序
const filters = ref({
  category: ''
})
const sortBy = ref('date') // 'date' | 'amount'

// 添加账单对话框相关
const showAddExpenseDialog = ref(false)
const showViewExpenseDialog = ref(false)
const showEditExpenseDialog = ref(false)
const showSplitDialog = ref(false) // 分摊计算对话框
const addingExpense = ref(false)
const editingExpense = ref(false)
const currentExpense = ref<Expense | null>(null)
const expenseFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()
const expenseForm = ref({
  title: '',
  amount: 0,
  category: '',
  date: '',
  paidBy: '',
  description: '',
  receipt: ''
})
const editForm = ref({
  title: '',
  amount: 0,
  category: '',
  date: '',
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
      
      // 加载每个账本的统计信息
      await loadBookStats()
      
      console.log('账本加载完成，等待用户选择')
    } else {
      console.log('账本API返回错误:', res.message)
    }
  } catch (error: any) {
    console.error('加载账本列表失败:', error)
  }
}

// 加载所有账本的统计信息
const loadBookStats = async () => {
  try {
    console.log('开始加载账本统计信息...')
    const statsPromises = accountBooks.value.map(async (book) => {
      const bookId = book.bookId || book.id
      try {
        // 获取账本的账单列表来计算统计信息
        const res = await expenseApi.getRecords(bookId, 1, 1000) // 获取所有记录
        if (res.code === 200 && res.data) {
          const records = res.data.lists || res.data.items || res.data.list || []
          const totalAmount = records.reduce((sum: number, record: any) => sum + (Number(record.amount) || 0), 0)
          const count = records.length
          
          return {
            bookId,
            totalAmount,
            count
          }
        }
      } catch (error) {
        console.error(`加载账本 ${bookId} 统计失败:`, error)
        return {
          bookId,
          totalAmount: 0,
          count: 0
        }
      }
    })
    
    const statsResults = await Promise.all(statsPromises)
    
    // 将统计结果存储到 bookStats
    bookStats.value = {}
    statsResults.forEach(stat => {
      if (stat) {
        bookStats.value[stat.bookId] = {
          totalAmount: stat.totalAmount,
          count: stat.count
        }
      }
    })
    
    console.log('账本统计信息加载完成:', bookStats.value)
  } catch (error: any) {
    console.error('加载账本统计信息失败:', error)
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
  // 总支出：这个账本所有的金额之和
  const totalAmount = expenses.value.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0)
  const totalCount = expenses.value.length
  
  // 我的支出和我的账单数：从API获取的准确数据
  const myAmount = myExpenseStats.value?.myExpenseAmount || 0
  const myCount = myExpenseStats.value?.myExpenseCount || 0
  
  return { 
    totalAmount, 
    myAmount,
    totalCount,
    myCount
  }
})

// 筛选和排序后的账单数据
const filteredExpenses = computed(() => {
  let result = [...expenses.value]
  
  // 按类别筛选
  if (filters.value.category) {
    result = result.filter(expense => expense.category === filters.value.category)
  }
  
  // 排序
  if (sortBy.value === 'amount') {
    // 按金额逆序（从大到小）
    result.sort((a, b) => Number(b.amount) - Number(a.amount))
  } else if (sortBy.value === 'date') {
    // 按时间排列（最新的在前）
    result.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
  }
  
  return result
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
    console.log('没有选择账本，清空账单列表')
    expenses.value = []
    splitData.value = null
    myExpenseStats.value = null
    return
  }
  
  loading.value = true
  try {
    console.log('开始加载账单，bookId:', selectedBookId.value)
    const res = await expenseApi.getRecords(selectedBookId.value, pagination.value.page, pagination.value.pageSize)
    console.log('账单API响应:', res)
    
    if (res.code === 200 && res.data) {
      const data = res.data
      const items = data.lists || data.items || data.list || []
      console.log('解析到的账单数据:', items)
      console.log('账单数据类型:', typeof items, '是否为数组:', Array.isArray(items))
      
      if (!Array.isArray(items)) {
        console.error('账单数据不是数组格式:', items)
        console.error('完整的data对象:', data)
        expenses.value = []
        splitData.value = null
        myExpenseStats.value = null
        return
      }
      
      expenses.value = items.map((record: any): Expense => {
        console.log('处理账单记录:', record)
        const mappedRecord: Expense = {
          id: String(record.recordId || record.id || ''),
          tripId: String(selectedBookId.value || ''),
          title: String(record.note || ''), // 保持title字段用于显示
          amount: Number(record.amount || 0),
          currency: 'CNY',
          category: getCategoryFromType(record.type, record.categoryName),
          description: String(record.note || ''), // description也映射到note
          paidBy: String(record.user?.userId || ''),
          participants: [String(record.user?.userId || '')],
          splitType: 'equal',
          splits: [],
          receipt: String(record.receipt || ''),
          date: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : '',
          createdAt: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : ''
        }
        // 添加用户信息，参考TripList.vue的做法
        ;(mappedRecord as any).user = {
          userId: String(record.user?.userId || ''),
          username: record.user?.nickname || record.user?.username || '未知用户',
          avatar: record.user?.avatar || ''  // 使用avatar字段，与其他地方保持一致
        }
        
        // 调试：打印用户数据
        console.log('Expense user data:', {
          originalUser: record.user,
          avatar: record.user?.avatar,
          mappedUser: (mappedRecord as any).user
        })
        
        console.log('转换后的记录:', mappedRecord)
        return mappedRecord
      })
      
      console.log('转换后的账单数据:', expenses.value)
      console.log('账单数据长度:', expenses.value.length)
      pagination.value.total = data.total || items.length
      
      // 加载分摊计算数据和我的支出统计
      await Promise.all([
        loadSplitData(),
        loadMyExpenseStats()
      ])
      
      if (expenses.value.length === 0) {
        console.log('账单列表为空')
      } else {
        console.log(`成功加载 ${expenses.value.length} 条账单`)
        // 输出第一条记录的详细信息用于调试
        if (expenses.value.length > 0) {
          console.log('第一条账单详情:', expenses.value[0])
        }
      }
    } else {
      console.log('账单API返回错误:', res.message)
      expenses.value = []
      splitData.value = null
      myExpenseStats.value = null
      ElMessage.error(res.message || '加载账单失败')
    }
  } catch (error: any) {
    console.error('加载账单列表失败:', error)
    expenses.value = []
    splitData.value = null
    myExpenseStats.value = null
    ElMessage.error(error.message || '加载账单列表失败')
  } finally {
    loading.value = false
  }
}

// 加载分摊计算数据
const loadSplitData = async () => {
  if (!selectedBookId.value) return
  
  try {
    console.log('开始加载分摊计算数据，bookId:', selectedBookId.value)
    const res = await expenseApi.splitAmount(selectedBookId.value)
    console.log('分摊计算API响应:', res)
    
    if (res.code === 200 && res.data) {
      splitData.value = res.data
      console.log('分摊计算数据:', splitData.value)
    } else {
      console.log('分摊计算API返回错误:', res.message)
      splitData.value = null
    }
  } catch (error: any) {
    console.error('加载分摊计算数据失败:', error)
    splitData.value = null
  }
}

// 加载我的支出统计数据
const loadMyExpenseStats = async () => {
  if (!selectedBookId.value) return
  
  try {
    console.log('开始加载我的支出统计，bookId:', selectedBookId.value)
    const res = await expenseApi.getMyExpenseStats(selectedBookId.value)
    console.log('我的支出统计API响应:', res)
    
    if (res.code === 200 && res.data) {
      myExpenseStats.value = res.data
      console.log('我的支出统计数据:', myExpenseStats.value)
    } else {
      console.log('我的支出统计API返回错误:', res.message)
      myExpenseStats.value = null
    }
  } catch (error: any) {
    console.error('加载我的支出统计失败:', error)
    myExpenseStats.value = null
  }
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

// 筛选和排序函数
const applyFilters = () => {
  // 筛选逻辑已在 computed 中处理，这里可以添加额外逻辑
  console.log('应用筛选:', filters.value)
}

const applySorting = () => {
  // 排序逻辑已在 computed 中处理，这里可以添加额外逻辑
  console.log('应用排序:', sortBy.value)
}

const resetFilters = () => {
  filters.value.category = ''
  sortBy.value = 'date'
}

// 账本选择
const handleBookSelect = (bookId: number) => {
  selectedBookId.value = bookId
  pagination.value.page = 1
  loadExpenses()
}

// 处理添加账单按钮点击
const handleAddExpenseClick = () => {
  if (!selectedBookId.value) {
    ElMessage.warning('请先选择一个账本')
    return
  }
  showAddExpenseDialog.value = true
}

// 处理分摊计算按钮点击
const handleSplitCalculation = () => {
  if (!selectedBookId.value) {
    ElMessage.warning('请先选择一个账本')
    return
  }
  showSplitDialog.value = true
}

// 分摊计算结果
const splitResults = computed(() => {
  if (!splitData.value || !splitData.value.members) {
    return []
  }
  
  const results: Array<{
    userId: string
    nickname: string
    amount: number
    type: 'pay' | 'receive' | 'none' // 我应支付 | 我应被支付 | 无需支付
    description: string
  }> = []
  
  for (const member of splitData.value.members) {
    const memberUserId = String(member.userId)
    const amount = Number(member.shouldPay || 0)
    
    if (Math.abs(amount) < 0.01) {
      // 金额小于0.01元，视为无需支付
      results.push({
        userId: memberUserId,
        nickname: member.nickname,
        amount: 0,
        type: 'none',
        description: `我和${member.nickname}互相不用支付`
      })
    } else if (amount > 0) {
      // 正数表示该成员应该付给当前用户
      results.push({
        userId: memberUserId,
        nickname: member.nickname,
        amount: Math.abs(amount),
        type: 'receive',
        description: `${member.nickname}应支付我${Math.abs(amount).toFixed(2)}元`
      })
    } else {
      // 负数表示当前用户应该付给该成员
      results.push({
        userId: memberUserId,
        nickname: member.nickname,
        amount: Math.abs(amount),
        type: 'pay',
        description: `我应支付${member.nickname}${Math.abs(amount).toFixed(2)}元`
      })
    }
  }
  
  return results
})

// 获取行程名称
const getTripName = (tripId: number) => {
  const trip = trips.value.find(t => Number(t.id) === tripId)
  return trip?.title || '未知行程'
}

// 当前选中的账本
const currentBook = computed(() => {
  return accountBooks.value.find(book => (book.bookId || book.id) === selectedBookId.value)
})

// 添加账单表单验证规则
const expenseRules: FormRules = {
  amount: [
    { required: true, message: '请输入支出金额', trigger: 'blur' },
    { type: 'number', min: 0.01, message: '金额必须大于0', trigger: 'blur' }
  ],
  category: [
    { required: true, message: '请选择支出类别', trigger: 'change' }
  ],
  date: [
    { required: true, message: '请选择支出日期', trigger: 'change' }
  ]
}

// 编辑账单表单验证规则（与添加相同）
const editRules: FormRules = expenseRules

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
}

const getCategoryFromType = (_recordType: number, categoryName: string): 'transport' | 'accommodation' | 'food' | 'activity' | 'shopping' | 'other' => {
  // 根据categoryName映射到前端的category类型
  const categoryMap: Record<string, 'transport' | 'accommodation' | 'food' | 'activity' | 'shopping' | 'other'> = {
    '交通': 'transport',
    '住宿': 'accommodation', 
    '餐饮': 'food',
    '活动': 'activity',
    '购物': 'shopping'
  }
  
  return categoryMap[categoryName] || 'other'
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

const getUserName = (userId: string | number) => {
  const userIdStr = String(userId)
  
  // 首先尝试从账单数据中获取用户名
  const expense = expenses.value.find(e => String(e.paidBy) === userIdStr)
  if (expense && (expense as any).user && (expense as any).user.username) {
    return (expense as any).user.username
  }
  
  // 如果账单数据中没有用户名，尝试从行程成员数据中获取
  if (currentBook.value && currentBook.value.tripId) {
    const selectedTrip = trips.value.find(trip => Number(trip.id) === currentBook.value.tripId)
    if (selectedTrip) {
      const member = selectedTrip.members.find(m => String(m.userId) === userIdStr)
      if (member && member.username) {
        return member.username
      }
    }
  }
  
  return '未知用户'
}

// 获取用户头像
const getUserAvatar = (userId: string | number) => {
  const userIdStr = String(userId)
  
  // 从账单数据中获取用户头像
  const expense = expenses.value.find(e => String(e.paidBy) === userIdStr)
  
  console.log('getUserAvatar - 查找用户头像:', {
    userId: userIdStr,
    expense: expense,
    user: expense ? (expense as any).user : null,
    avatar: expense && (expense as any).user ? (expense as any).user.avatar : null
  })
  
  if (expense && (expense as any).user && (expense as any).user.avatar) {
    const avatarUrl = formatAvatarUrl((expense as any).user.avatar)
    console.log('getUserAvatar - 返回头像URL:', avatarUrl)
    return avatarUrl
  }
  
  // 如果找不到头像，返回空字符串让el-avatar显示默认头像
  console.log('getUserAvatar - 未找到头像，返回空字符串')
  return ''
}

// 判断是否是当前用户的账单
const isCurrentUserExpense = (expense: Expense) => {
  const currentUserId = String(userStore.user?.userId || userStore.user?.id || '')
  const expensePaidBy = String(expense.paidBy || '')
  return currentUserId === expensePaidBy
}

// 事件处理
const viewExpense = (expense: Expense) => {
  currentExpense.value = expense
  showViewExpenseDialog.value = true
}

const editExpense = (expense: Expense) => {
  currentExpense.value = expense
  // 填充编辑表单
  editForm.value = {
    title: '', // 不再使用title字段
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    description: expense.description || '',
    receipt: expense.receipt || ''
  }
  showEditExpenseDialog.value = true
}

const deleteExpense = async (expense: Expense) => {
  try {
    await ElMessageBox.confirm('确定要删除这个账单吗？', '确认删除', {
      type: 'warning'
    })
    
    const res = await expenseApi.deleteRecord(Number(expense.id))
    if (res.code === 200) {
      ElMessage.success('账单已删除')
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

// 重置编辑账单表单
const resetEditForm = () => {
  editForm.value = {
    title: '',
    amount: 0,
    category: '',
    date: '',
    description: '',
    receipt: ''
  }
  currentExpense.value = null
  if (editFormRef.value) {
    editFormRef.value.clearValidate()
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

// 编辑时的票据上传处理
const beforeEditUpload = async (file: File) => {
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
    const res = await imageApi.uploadImage(file, 4, 0)
    if (res.code === 200 && res.data) {
      editForm.value.receipt = res.data.url
      ElMessage.success('票据上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error('上传失败，请稍后再试')
  }
  
  return false
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
      type: 1, // 1表示支出，2表示收入
      amount: expenseForm.value.amount,
      categoryId: categoryMapping[expenseForm.value.category] || 1,
      categoryName: getCategoryText(expenseForm.value.category),
      note: expenseForm.value.description?.trim() || '',
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

// 处理编辑账单
const handleEditExpense = async () => {
  if (!editFormRef.value || !currentExpense.value) return
  
  try {
    await editFormRef.value.validate()
    
    editingExpense.value = true
    
    // 构建提交数据
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
      type: 1, // 1表示支出，2表示收入
      amount: editForm.value.amount,
      categoryId: categoryMapping[editForm.value.category] || 1,
      categoryName: getCategoryText(editForm.value.category),
      note: editForm.value.description?.trim() || '',
      recordTime: editForm.value.date ? new Date(editForm.value.date) : new Date()
    }
    
    const res = await expenseApi.updateRecord(Number(currentExpense.value.id), recordData)
    
    if (res.code === 200) {
      ElMessage.success('账单更新成功!')
      showEditExpenseDialog.value = false
      resetEditForm()
      loadExpenses()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error: any) {
    console.error('更新失败:', error)
    ElMessage.error(error.message || '更新失败，请稍后再试')
  } finally {
    editingExpense.value = false
  }
}
</script>

<style scoped>
.expense-list {
  max-width: 1400px;
  margin: 0 auto;
}

/* 账本选择区域样式 */
.books-selection-area {
  margin-bottom: 32px;
  position: relative;
}

.books-selection-area::after {
  content: '';
  position: absolute;
  top: 60px;
  right: 0;
  width: 30px;
  height: calc(100% - 60px);
  background: linear-gradient(to left, rgba(255, 255, 255, 0.8) 0%, transparent 100%);
  pointer-events: none;
  z-index: 1;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 20px;
  padding-left: 4px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #8c8c8c;
  font-weight: 500;
}

.section-hint .el-icon {
  font-size: 14px;
}

.books-grid {
  display: flex;
  gap: 20px;
  margin-bottom: 24px;
  overflow-x: auto;
  padding-bottom: 8px;
  scroll-behavior: smooth;
}

.books-grid::-webkit-scrollbar {
  height: 6px;
}

.books-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.books-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.books-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.book-card-modern {
  background: #ffffff;
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 16px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  min-width: 300px;
  flex-shrink: 0;
}

.book-card-modern:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}

.book-card-modern.selected {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
}

.book-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.book-card-modern .book-icon {
  font-size: 24px;
  color: #667eea;
  margin-top: 2px;
}

.book-card-modern .book-info {
  flex: 1;
}

.book-card-modern .book-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 4px;
  line-height: 1.4;
}

.book-card-modern .book-trip {
  font-size: 13px;
  color: #8c8c8c;
  line-height: 1.3;
}

.book-stats {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  padding: 12px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 8px;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 4px;
  font-weight: 500;
}

.stat-item .stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
}

.actions-filter-card {
  margin-bottom: 24px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.actions-filter-card :deep(.el-card__body) {
  padding: 24px;
}

.actions-filter-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.action-buttons-section {
  display: flex;
  gap: 12px;
}

.filter-sort-section {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  letter-spacing: 0.3px;
}

.filter-item .el-select {
  width: 100%;
}

.filter-item .el-select :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
}

.filter-item .el-select :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .actions-filter-content {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .action-buttons-section {
    justify-content: center;
  }
  
  .filter-sort-section {
    justify-content: space-between;
  }
  
  .filter-item {
    min-width: 120px;
  }
  
  .book-card-modern {
    min-width: 280px;
  }
  
  .books-grid {
    gap: 16px;
  }
  
  .section-hint span {
    display: none;
  }
}

.no-books-card {
  text-align: center;
  padding: 60px 20px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.no-books-card :deep(.el-card__body) {
  padding: 40px;
}

/* 统计卡片样式 */
.stats-row {
  margin-bottom: 32px;
}

.stat-card-modern {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-card-modern:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card-modern.total {
  border-left: 4px solid #f5576c;
}

.stat-card-modern.my-expense {
  border-left: 4px solid #667eea;
}

.stat-card-modern.total-count {
  border-left: 4px solid #43e97b;
}

.stat-card-modern.my-count {
  border-left: 4px solid #4facfe;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  flex-shrink: 0;
}

.stat-card-modern.total .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card-modern.my-expense .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card-modern.total-count .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-card-modern.my-count .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-weight: 500;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.stat-unit {
  font-size: 16px;
  font-weight: 500;
  margin-left: 4px;
  color: #8c8c8c;
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

.filter-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  height: 40px;
  border-radius: 10px;
  font-weight: 500;
}

.current-book-info-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.book-icon {
  font-size: 24px;
  color: #667eea;
}

.book-info {
  flex: 1;
}

.book-name {
  font-size: 16px;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 4px;
}

.book-trip {
  font-size: 13px;
  color: #8c8c8c;
}

.action-buttons-row {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.primary-action-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 10px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.primary-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.secondary-action-btn {
  height: 40px;
  padding: 0 24px;
  border-radius: 10px;
  font-weight: 500;
}

/* 表格样式 */
.expense-table-modern {
  border-radius: 12px;
  overflow: hidden;
}

.expense-table-modern :deep(.el-table__header) {
  background: #f8f9fa;
}

.expense-table-modern :deep(.el-table__header th) {
  background: #f8f9fa;
  color: #1a1d29;
  font-weight: 600;
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

.expense-table-modern :deep(.el-table__row) {
  transition: all 0.2s;
}

.expense-table-modern :deep(.el-table__row:hover) {
  background: #f8f9fa;
}

.category-tag-modern {
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
}

.expense-amount-modern {
  font-weight: 700;
  font-size: 16px;
  color: #f5576c;
  letter-spacing: -0.3px;
}

.payer-info-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.payer-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.payer-name {
  font-size: 14px;
  color: #1a1d29;
  font-weight: 500;
}

.payer-info-dialog {
  display: flex;
  align-items: center;
  gap: 12px;
}

.payer-avatar-dialog {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.payer-name-dialog {
  font-size: 16px;
  color: #1a1d29;
  font-weight: 500;
}

.expense-title-modern {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1a1d29;
  font-size: 14px;
}

.receipt-tag {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.expense-date {
  color: #666;
  font-size: 14px;
}

.action-buttons-modern {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.action-btn-item {
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn-item:hover {
  background: rgba(102, 126, 234, 0.1);
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
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

.expense-detail {
  margin: 16px 0;
}

.receipt-preview {
  max-width: 200px;
  max-height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.no-split-data {
  text-align: center;
  padding: 40px 20px;
}

.split-results {
  max-height: 500px;
  overflow-y: auto;
}

.split-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item .label {
  color: #666;
  font-size: 14px;
}

.summary-item .value {
  font-weight: bold;
  color: #333;
}

.split-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.split-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  transition: all 0.3s;
}

.split-item.split-pay {
  background: #fef0f0;
  border-color: #fbc4c4;
}

.split-item.split-receive {
  background: #f0f9ff;
  border-color: #b3d8ff;
}

.split-item.split-none {
  background: #f5f7fa;
  border-color: #dcdfe6;
}

.split-icon {
  margin-right: 12px;
  font-size: 18px;
}

.split-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.split-description {
  font-size: 14px;
  color: #333;
}

.split-amount {
  font-weight: bold;
  font-size: 16px;
}

.amount-pay {
  color: #f56c6c;
}

.amount-receive {
  color: #67c23a;
}

.no-description {
  color: #c0c4cc;
  font-style: italic;
}

/* 账单对话框样式 */
:deep(.expense-dialog .el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

:deep(.expense-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.expense-dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.expense-dialog-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.expense-dialog-icon {
  font-size: 20px;
  color: white;
}

:deep(.expense-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

:deep(.expense-dialog .el-dialog__headerbtn) {
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s;
}

:deep(.expense-dialog .el-dialog__headerbtn:hover) {
  background: rgba(0, 0, 0, 0.05);
}

:deep(.expense-dialog .el-dialog__body) {
  padding: 28px;
}

/* 账单表单样式 */
.expense-form {
  margin-top: 8px;
}

.expense-form-item {
  margin-bottom: 24px;
}

.expense-form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.expense-form-label .el-icon {
  color: #667eea;
  font-size: 16px;
}

.label-text {
  display: inline-flex;
  align-items: center;
}

.required-mark {
  color: #f56c6c;
  margin-right: 4px;
  font-weight: 600;
}

/* 隐藏 Element Plus 默认的必填标记 */
:deep(.expense-form-item.is-required .el-form-item__label::before) {
  display: none;
}

/* 金额输入框 */
.amount-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

:deep(.expense-amount-input .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px 16px;
}

:deep(.expense-amount-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset;
  background: rgba(255, 255, 255, 1);
}

:deep(.expense-amount-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset, 0 4px 12px rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 1);
}

.amount-unit {
  font-size: 15px;
  color: #6b7280;
  font-weight: 500;
}

/* 选择器样式 */
:deep(.expense-select .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px 16px;
}

:deep(.expense-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset;
  background: rgba(255, 255, 255, 1);
}

:deep(.expense-select .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset, 0 4px 12px rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 1);
}

/* 日期选择器样式 */
:deep(.expense-date-picker .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px 16px;
}

:deep(.expense-date-picker .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset;
  background: rgba(255, 255, 255, 1);
}

:deep(.expense-date-picker .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset, 0 4px 12px rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 1);
}

/* 文本域样式 */
:deep(.expense-textarea .el-textarea__inner) {
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.3s ease;
}

:deep(.expense-textarea .el-textarea__inner:hover) {
  border-color: rgba(102, 126, 234, 0.3);
}

:deep(.expense-textarea .el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* 票据上传样式 */
.receipt-uploader-modern {
  display: inline-block;
}

.receipt-image-modern {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.receipt-image-modern:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: scale(1.02);
}

.upload-placeholder-modern {
  width: 200px;
  height: 150px;
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(102, 126, 234, 0.02);
}

.upload-placeholder-modern:hover {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-2px);
}

.upload-icon {
  font-size: 32px;
  color: #667eea;
  margin-bottom: 8px;
}

.upload-text-modern {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #9ca3af;
}

/* 对话框底部 */
.expense-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
}

.expense-cancel-button {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  color: #374151;
  transition: all 0.2s ease;
}

.expense-cancel-button:hover {
  background: #f9fafb;
  border-color: rgba(0, 0, 0, 0.15);
}

.expense-submit-button {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.expense-submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.expense-submit-button:active:not(:disabled) {
  transform: translateY(0);
}

/* 表单验证错误样式 */
:deep(.expense-form-item.is-error .el-input__wrapper),
:deep(.expense-form-item.is-error .el-textarea__inner),
:deep(.expense-form-item.is-error .el-input-number__wrapper) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}

:deep(.expense-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 8px;
  padding-left: 4px;
}
</style>