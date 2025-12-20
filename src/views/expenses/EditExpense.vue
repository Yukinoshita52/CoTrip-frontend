<template>
  <Layout>
    <div class="edit-expense" v-loading="loading">
      <div class="page-header">
        <h2>编辑账单</h2>
        <p>修改账单信息和分摊方式</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="expense-form"
        v-if="!loading"
      >
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          
          <el-form-item label="关联行程" prop="tripId">
            <el-select v-model="form.tripId" placeholder="选择行程" style="width: 100%" disabled>
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
              :auto-upload="false"
            >
              <img v-if="form.receipt" :src="form.receipt" class="receipt-image" />
              <div v-else class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <div class="upload-text">上传票据</div>
              </div>
            </el-upload>
            <el-button v-if="form.receipt" text type="danger" @click="removeReceipt">
              删除票据
            </el-button>
          </el-form-item>
        </el-card>

        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            保存修改
          </el-button>
        </div>
      </el-form>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { expenseApi, tripApi, imageApi } from '@/api'
import type { Trip, TripMember } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const submitting = ref(false)

const trips = ref<Trip[]>([])

// 表单数据
const form = reactive({
  bookId: null as number | null,
  tripId: '',
  title: '',
  amount: 0,
  category: '',
  categoryId: null as number | null,
  date: '',
  paidBy: '',
  description: '',
  receipt: ''
})

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
      form.bookId = data.bookId
      form.title = data.categoryName || ''
      form.amount = Number(data.amount || 0)
      form.category = data.type === 1 ? 'income' : 'expense'
      form.date = data.recordTime ? dayjs(data.recordTime).format('YYYY-MM-DD') : ''
      form.paidBy = data.user?.userId ? String(data.user.userId) : ''
      form.description = data.note || ''
      form.categoryId = data.categoryId
      // 票据信息需要从图片服务获取
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
      
      // 根据bookId找到对应的行程
      if (form.bookId) {
        // 这里需要通过账本ID找到对应的行程ID
        // 暂时使用第一个行程
        if (trips.value.length > 0) {
          form.tripId = trips.value[0].id
        }
      }
    }
  } catch (error: any) {
    console.error('加载行程列表失败:', error)
  }
}

onMounted(() => {
  loadExpenseDetail()
  loadTrips()
})

const tripMembers = computed(() => {
  const selectedTrip = trips.value.find(trip => trip.id === form.tripId)
  return selectedTrip?.members || []
})

// 表单验证规则
const rules: FormRules = {
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
    const res = await imageApi.uploadImage(file, 4, 0)
    if (res.code === 200 && res.data) {
      form.receipt = res.data.url
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

const removeReceipt = () => {
  form.receipt = ''
  ElMessage.success('票据已删除')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    if (!form.bookId) {
      ElMessage.error('无法获取账本信息')
      return
    }
    
    submitting.value = true
    
    // 构建更新数据
    // 根据类别名称映射到categoryId
    const categoryMapping: Record<string, number> = {
      'transport': 1,
      'accommodation': 2,
      'food': 3,
      'activity': 4,
      'shopping': 5,
      'other': 6,
      'income': 7,
      'expense': 1
    }
    
    const recordData = {
      bookId: form.bookId,
      type: form.category === 'income' ? 1 : 2,
      amount: form.amount,
      categoryId: categoryMapping[form.category] || 1, // 默认为1
      categoryName: form.category || '',
      note: form.description || form.title,
      recordTime: form.date ? new Date(form.date) : new Date()
    }
    
    const expenseId = route.params.id as string
    const res = await expenseApi.updateRecord(Number(expenseId), recordData)
    
    if (res.code === 200) {
      ElMessage.success('账单修改成功!')
      router.push(`/expenses/${expenseId}`)
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error: any) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.edit-expense {
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

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}
</style>