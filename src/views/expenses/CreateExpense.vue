<template>
  <Layout>
    <div class="create-expense">
      <div class="page-header">
        <h2>添加账单</h2>
        <p>记录旅行支出并设置分摊方式</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="expense-form"
      >
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          
          <el-form-item label="关联行程" prop="tripId">
            <el-select v-model="form.tripId" placeholder="选择行程" style="width: 100%">
              <el-option
                v-for="trip in trips"
                :key="trip.id"
                :label="trip.title"
                :value="trip.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="账单标题" prop="title">
            <el-input
              v-model="form.title"
              placeholder="如：大阪城门票、午餐费用等"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="支出金额" prop="amount">
            <el-input-number
              v-model="form.amount"
              :min="0"
              :precision="2"
              placeholder="0.00"
              style="width: 200px"
            />
            <span style="margin-left: 8px;">元</span>
          </el-form-item>
          
          <el-form-item label="支出类别" prop="category">
            <el-select v-model="form.category" placeholder="选择类别">
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
              v-model="form.date"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          
          <el-form-item label="付款人" prop="paidBy">
            <el-select v-model="form.paidBy" placeholder="选择付款人">
              <el-option
                v-for="member in tripMembers"
                :key="member.userId"
                :label="member.username"
                :value="member.userId"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="账单描述">
            <el-input
              v-model="form.description"
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
              :on-success="handleUploadSuccess"
            >
              <img v-if="form.receipt" :src="form.receipt" class="receipt-image" />
              <div v-else class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <div class="upload-text">上传票据</div>
              </div>
            </el-upload>
          </el-form-item>
        </el-card>

        <el-card style="margin-top: 24px;">
          <template #header>
            <span>分摊设置</span>
          </template>
          
          <el-form-item label="参与人员" prop="participants">
            <el-checkbox-group v-model="form.participants">
              <el-checkbox
                v-for="member in tripMembers"
                :key="member.userId"
                :label="member.userId"
              >
                {{ member.username }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item label="分摊方式" prop="splitType">
            <el-radio-group v-model="form.splitType" @change="handleSplitTypeChange">
              <el-radio label="equal">平均分摊</el-radio>
              <el-radio label="custom">自定义金额</el-radio>
              <el-radio label="percentage">按比例分摊</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <!-- 分摊详情 -->
          <div v-if="form.participants.length > 0" class="split-details">
            <h4>分摊详情</h4>
            <div class="split-list">
              <div v-for="split in form.splits" :key="split.userId" class="split-item">
                <div class="split-user">
                  <el-avatar size="small">{{ getUserName(split.userId).charAt(0) }}</el-avatar>
                  <span>{{ getUserName(split.userId) }}</span>
                </div>
                
                <div class="split-amount" v-if="form.splitType === 'equal'">
                  <span>¥{{ (form.amount / form.participants.length).toFixed(2) }}</span>
                </div>
                
                <div class="split-amount" v-else-if="form.splitType === 'custom'">
                  <el-input-number
                    v-model="split.amount"
                    :min="0"
                    :max="form.amount"
                    :precision="2"
                    size="small"
                    @change="validateCustomSplit"
                  />
                </div>
                
                <div class="split-amount" v-else-if="form.splitType === 'percentage'">
                  <el-input-number
                    v-model="split.percentage"
                    :min="0"
                    :max="100"
                    size="small"
                    @change="updatePercentageAmount(split)"
                  />
                  <span style="margin-left: 4px;">%</span>
                  <span style="margin-left: 8px;">¥{{ split.amount.toFixed(2) }}</span>
                </div>
              </div>
            </div>
            
            <!-- 分摊汇总 -->
            <div class="split-summary">
              <div class="summary-item">
                <span>总金额：¥{{ form.amount }}</span>
              </div>
              <div class="summary-item">
                <span>已分摊：¥{{ totalSplitAmount.toFixed(2) }}</span>
              </div>
              <div class="summary-item" :class="{ 'error': remainingAmount !== 0 }">
                <span>剩余：¥{{ remainingAmount.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            保存账单
          </el-button>
        </div>
      </el-form>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { Trip, TripMember, ExpenseSplit } from '@/types'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)

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
    members: [
      { userId: 'user1', username: '张三', role: 'owner', joinedAt: '2024-03-01' },
      { userId: 'user2', username: '李四', role: 'member', joinedAt: '2024-03-02' },
      { userId: 'user3', username: '王五', role: 'member', joinedAt: '2024-03-03' }
    ],
    itinerary: [],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01'
  }
])

const tripMembers = computed(() => {
  const selectedTrip = trips.value.find(trip => trip.id === form.tripId)
  return selectedTrip?.members || []
})

// 表单数据
const form = reactive({
  tripId: '',
  title: '',
  amount: 0,
  category: '',
  date: '',
  paidBy: '',
  description: '',
  receipt: '',
  participants: [] as string[],
  splitType: 'equal' as 'equal' | 'custom' | 'percentage',
  splits: [] as ExpenseSplit[]
})

// 表单验证规则
const rules: FormRules = {
  tripId: [
    { required: true, message: '请选择关联行程', trigger: 'change' }
  ],
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
  ],
  participants: [
    { required: true, message: '请选择参与人员', trigger: 'change' },
    { type: 'array', min: 1, message: '至少选择一个参与人员', trigger: 'change' }
  ]
}

// 计算属性
const totalSplitAmount = computed(() => {
  return form.splits.reduce((sum, split) => sum + split.amount, 0)
})

const remainingAmount = computed(() => {
  return form.amount - totalSplitAmount.value
})

// 监听参与人员变化
watch(() => form.participants, (newParticipants) => {
  updateSplits(newParticipants)
}, { deep: true })

// 监听金额变化
watch(() => form.amount, () => {
  if (form.splitType === 'equal') {
    updateEqualSplits()
  }
})

const updateSplits = (participants: string[]) => {
  form.splits = participants.map(userId => {
    const existingSplit = form.splits.find(split => split.userId === userId)
    return {
      userId,
      amount: existingSplit?.amount || 0,
      percentage: existingSplit?.percentage || 0,
      settled: false
    }
  })
  
  if (form.splitType === 'equal') {
    updateEqualSplits()
  }
}

const updateEqualSplits = () => {
  const equalAmount = form.amount / form.participants.length
  form.splits.forEach(split => {
    split.amount = equalAmount
  })
}

const handleSplitTypeChange = () => {
  if (form.splitType === 'equal') {
    updateEqualSplits()
  } else if (form.splitType === 'percentage') {
    const equalPercentage = 100 / form.participants.length
    form.splits.forEach(split => {
      split.percentage = equalPercentage
      split.amount = (form.amount * equalPercentage) / 100
    })
  } else {
    // custom - 保持当前金额或重置为0
    form.splits.forEach(split => {
      if (!split.amount) {
        split.amount = 0
      }
    })
  }
}

const updatePercentageAmount = (split: ExpenseSplit) => {
  split.amount = (form.amount * (split.percentage || 0)) / 100
}

const validateCustomSplit = () => {
  // 验证自定义分摊金额
  if (totalSplitAmount.value > form.amount) {
    ElMessage.warning('分摊总金额不能超过账单金额')
  }
}

const getUserName = (userId: string) => {
  const member = tripMembers.value.find(m => m.userId === userId)
  return member?.username || userId
}

const beforeUpload = (file: File) => {
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
  return true
}

const handleUploadSuccess = (response: any) => {
  form.receipt = response.url
  ElMessage.success('票据上传成功')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // 验证分摊金额
    if (form.splitType !== 'equal' && Math.abs(remainingAmount.value) > 0.01) {
      ElMessage.error('分摊金额与账单金额不匹配')
      return
    }
    
    loading.value = true
    
    // 构建提交数据
    const expenseData = {
      tripId: form.tripId,
      title: form.title,
      amount: form.amount,
      category: form.category,
      date: form.date,
      paidBy: form.paidBy,
      description: form.description,
      receipt: form.receipt,
      participants: form.participants,
      splitType: form.splitType,
      splits: form.splits
    }
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success('账单添加成功!')
    router.push('/expenses')
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-expense {
  max-width: 800px;
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

.expense-form {
  margin-bottom: 24px;
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

.split-details {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.split-details h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.split-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.split-item:last-child {
  border-bottom: none;
}

.split-user {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.split-amount {
  display: flex;
  align-items: center;
  gap: 4px;
}

.split-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
}

.summary-item.error {
  color: #f56c6c;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}
</style>