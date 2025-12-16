<template>
  <Layout>
    <div class="split-calculator">
      <div class="page-header">
        <h2>分摊计算器</h2>
        <p>计算账单分摊和结算情况</p>
      </div>

      <!-- 账本选择 -->
      <el-card class="book-selector">
        <el-form :inline="true">
          <el-form-item label="选择账本">
            <el-select v-model="selectedBookId" placeholder="选择账本" @change="loadSplitData">
              <el-option
                v-for="book in accountBooks"
                :key="book.bookId || book.id"
                :label="book.name"
                :value="book.bookId || book.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 分摊结果 -->
      <el-card v-if="splitData" class="split-result" v-loading="loading">
        <template #header>
          <span>分摊结果</span>
        </template>

        <!-- 总体统计 -->
        <div class="summary-stats">
          <el-row :gutter="24">
            <el-col :span="6">
              <el-statistic title="总支出" :value="splitData.totalExpense" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="总收入" :value="splitData.totalIncome" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="参与人数" :value="splitData.members?.length || 0" suffix="人" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="人均支出" :value="averageExpense" prefix="¥" />
            </el-col>
          </el-row>
        </div>

        <!-- 成员分摊详情 -->
        <div class="member-details">
          <h3>成员分摊详情</h3>
          <el-table :data="splitData.members" style="width: 100%">
            <el-table-column label="成员">
              <template #default="{ row }">
                <div class="member-info">
                  <el-avatar size="small">{{ row.username?.charAt(0) || 'U' }}</el-avatar>
                  <span>{{ row.username || row.userId }}</span>
                </div>
              </template>
            </el-table-column>
            
            <el-table-column label="已支付" align="right">
              <template #default="{ row }">
                <span class="paid-amount">¥{{ row.totalPaid || 0 }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="应支付" align="right">
              <template #default="{ row }">
                <span class="should-pay">¥{{ row.shouldPay || 0 }}</span>
              </template>
            </el-table-column>
            
            <el-table-column label="差额" align="right">
              <template #default="{ row }">
                <span :class="getDifferenceClass(row.difference)">
                  {{ formatDifference(row.difference) }}
                </span>
              </template>
            </el-table-column>
            
            <el-table-column label="状态" align="center">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.difference)">
                  {{ getStatusText(row.difference) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 结算建议 -->
        <div class="settlement-suggestions" v-if="settlementSuggestions.length > 0">
          <h3>结算建议</h3>
          <div class="suggestions-list">
            <div v-for="(suggestion, index) in settlementSuggestions" :key="index" class="suggestion-item">
              <el-card>
                <div class="suggestion-content">
                  <div class="suggestion-text">
                    <strong>{{ suggestion.from }}</strong> 
                    应向 
                    <strong>{{ suggestion.to }}</strong> 
                    转账 
                    <span class="amount">¥{{ suggestion.amount.toFixed(2) }}</span>
                  </div>
                  <el-button size="small" @click="markAsSettled(suggestion)">
                    标记已结算
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="actions">
          <el-button @click="exportSplitData">
            <el-icon><Download /></el-icon>
            导出分摊数据
          </el-button>
          <el-button type="primary" @click="settleAll">
            全部标记已结算
          </el-button>
        </div>
      </el-card>

      <!-- 空状态 -->
      <el-empty v-if="!splitData && !loading" description="请选择账本查看分摊情况" />
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { expenseApi } from '@/api'

const loading = ref(false)
const selectedBookId = ref<number | null>(null)
const accountBooks = ref<any[]>([])
const splitData = ref<any>(null)

// 加载账本列表
const loadAccountBooks = async () => {
  try {
    const res = await expenseApi.getAllAccountBooks()
    if (res.code === 200 && res.data) {
      accountBooks.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (error: any) {
    console.error('加载账本列表失败:', error)
  }
}

// 加载分摊数据
const loadSplitData = async () => {
  if (!selectedBookId.value) {
    splitData.value = null
    return
  }
  
  loading.value = true
  try {
    const res = await expenseApi.splitAmount(selectedBookId.value)
    if (res.code === 200 && res.data) {
      splitData.value = {
        totalExpense: 0,
        totalIncome: 0,
        members: res.data.members || []
      }
      
      // 计算总支出和总收入
      splitData.value.members.forEach((member: any) => {
        splitData.value.totalExpense += member.totalPaid || 0
        splitData.value.totalIncome += member.shouldPay || 0
      })
    }
  } catch (error: any) {
    console.error('加载分摊数据失败:', error)
    ElMessage.error(error.message || '加载分摊数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAccountBooks()
})

// 计算属性
const averageExpense = computed(() => {
  if (!splitData.value || !splitData.value.members.length) return 0
  return (splitData.value.totalExpense / splitData.value.members.length).toFixed(2)
})

const settlementSuggestions = computed(() => {
  if (!splitData.value || !splitData.value.members) return []
  
  const suggestions: any[] = []
  const members = splitData.value.members
  
  // 找出需要收钱的人（多付了）和需要付钱的人（少付了）
  const creditors = members.filter((m: any) => (m.difference || 0) > 0)
  const debtors = members.filter((m: any) => (m.difference || 0) < 0)
  
  // 生成结算建议
  creditors.forEach((creditor: any) => {
    let remainingCredit = creditor.difference || 0
    
    debtors.forEach((debtor: any) => {
      if (remainingCredit <= 0) return
      
      const debtAmount = Math.abs(debtor.difference || 0)
      const transferAmount = Math.min(remainingCredit, debtAmount)
      
      if (transferAmount > 0.01) { // 忽略小于1分的金额
        suggestions.push({
          from: debtor.username || debtor.userId,
          to: creditor.username || creditor.userId,
          amount: transferAmount
        })
        
        remainingCredit -= transferAmount
        debtor.difference = (debtor.difference || 0) + transferAmount
      }
    })
  })
  
  return suggestions
})

// 工具函数
const getDifferenceClass = (difference: number) => {
  if (difference > 0) return 'positive-difference'
  if (difference < 0) return 'negative-difference'
  return 'zero-difference'
}

const formatDifference = (difference: number) => {
  if (difference > 0) return `+¥${difference.toFixed(2)}`
  if (difference < 0) return `-¥${Math.abs(difference).toFixed(2)}`
  return '¥0.00'
}

const getStatusType = (difference: number) => {
  if (Math.abs(difference) < 0.01) return 'success'
  if (difference > 0) return 'warning'
  return 'danger'
}

const getStatusText = (difference: number) => {
  if (Math.abs(difference) < 0.01) return '已结清'
  if (difference > 0) return '应收款'
  return '应付款'
}

// 事件处理
const markAsSettled = (suggestion: any) => {
  ElMessage.success(`已标记 ${suggestion.from} → ${suggestion.to} 的转账为已结算`)
  // 这里可以调用API更新结算状态
}

const settleAll = () => {
  ElMessage.success('已将所有分摊标记为已结算')
  // 这里可以调用API批量更新结算状态
}

const exportSplitData = () => {
  if (!splitData.value) return
  
  // 生成CSV数据
  const csvContent = [
    ['成员', '已支付', '应支付', '差额', '状态'],
    ...splitData.value.members.map((member: any) => [
      member.username || member.userId,
      member.totalPaid || 0,
      member.shouldPay || 0,
      formatDifference(member.difference || 0),
      getStatusText(member.difference || 0)
    ])
  ].map(row => row.join(',')).join('\n')
  
  // 下载文件
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `分摊数据_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  
  ElMessage.success('分摊数据已导出')
}
</script>

<style scoped>
.split-calculator {
  max-width: 1000px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.book-selector {
  margin-bottom: 24px;
}

.split-result {
  margin-bottom: 24px;
}

.summary-stats {
  margin-bottom: 32px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.member-details {
  margin-bottom: 32px;
}

.member-details h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.paid-amount {
  color: #67c23a;
  font-weight: bold;
}

.should-pay {
  color: #409eff;
  font-weight: bold;
}

.positive-difference {
  color: #67c23a;
  font-weight: bold;
}

.negative-difference {
  color: #f56c6c;
  font-weight: bold;
}

.zero-difference {
  color: #909399;
}

.settlement-suggestions h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #333;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  margin-bottom: 8px;
}

.suggestion-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suggestion-text {
  flex: 1;
}

.amount {
  color: #f56c6c;
  font-weight: bold;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
</style>