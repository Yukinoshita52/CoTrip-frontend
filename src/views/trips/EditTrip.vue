<template>
  <Layout>
    <div class="edit-trip" v-loading="loading">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="trip-form-modern"
        v-if="!loading"
      >
        <el-card class="form-card-modern" shadow="hover">
          <template #header>
            <div class="card-header-modern">
              <div class="header-icon-wrapper">
                <el-icon class="header-icon"><EditPen /></el-icon>
              </div>
              <span class="header-title">基本信息</span>
            </div>
          </template>
          
          <el-form-item label="行程标题" prop="title" class="form-item-modern">
            <el-input
              v-model="form.title"
              placeholder="给你的行程起个名字"
              maxlength="50"
              show-word-limit
              class="form-input-modern"
            >
              <template #prefix>
                <el-icon><EditPen /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="目的地" prop="destination" class="form-item-modern">
            <el-input
              v-model="form.destination"
              placeholder="如：北京·上海·杭州"
              maxlength="100"
              class="form-input-modern"
            >
              <template #prefix>
                <el-icon><MapLocation /></el-icon>
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="行程时间" prop="dateRange" class="form-item-modern">
            <el-date-picker
              v-model="form.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              class="form-date-picker-modern"
            />
          </el-form-item>
          
          <el-form-item label="行程描述" class="form-item-modern">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="5"
              placeholder="描述一下这次旅行的主题和亮点"
              maxlength="500"
              show-word-limit
              class="form-textarea-modern"
            />
          </el-form-item>
          
          <el-form-item label="封面图片" class="form-item-modern">
            <div class="cover-upload-section">
              <el-upload
                class="cover-uploader-modern"
                :show-file-list="false"
                :before-upload="beforeUpload"
                :http-request="handleUpload"
              >
                <img v-if="form.coverImage" :src="formatImageUrl(form.coverImage)" class="cover-image-modern" />
                <div v-else class="upload-placeholder-modern">
                  <el-icon class="upload-icon"><Plus /></el-icon>
                  <div class="upload-text-modern">上传封面图片</div>
                  <div class="upload-hint">支持 JPG、PNG 格式，最大 5MB</div>
                </div>
              </el-upload>
              <div v-if="form.coverImage" class="upload-actions-modern">
                <el-button size="small" @click="removeCover" type="danger" text>
                  <el-icon><Delete /></el-icon>
                  移除封面
                </el-button>
              </div>
            </div>
          </el-form-item>
        </el-card>

        <div class="form-actions-modern">
          <el-button @click="$router.back()" size="large" class="cancel-btn-modern">
            取消
          </el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting" size="large" class="submit-btn-modern">
            <el-icon v-if="!submitting"><Check /></el-icon>
            保存修改
          </el-button>
        </div>
      </el-form>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { tripApi, imageApi } from '@/api'
import { formatImageUrl } from '@/utils/image'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const formRef = ref<FormInstance>()
const loading = ref(true)
const submitting = ref(false)

const tripId = route.params.id as string

// 表单数据
const form = reactive({
  title: '',
  destination: '',
  dateRange: [] as string[],
  description: '',
  coverImage: ''
})

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入行程标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  destination: [
    { required: true, message: '请输入目的地', trigger: 'blur' }
  ],
  dateRange: [
    { required: true, message: '请选择行程时间', trigger: 'change' }
  ]
}

// 加载行程数据
const loadTripData = async () => {
  try {
    loading.value = true
    const res = await tripApi.getTripById(Number(tripId))
    
    if (res.code === 200 && res.data) {
      const trip = res.data
      form.title = trip.name || ''
      form.destination = trip.region || ''
      form.description = trip.description || ''
      form.coverImage = trip.coverImageUrl || ''
      
      // 设置日期范围
      if (trip.startDate && trip.endDate) {
        form.dateRange = [
          dayjs(trip.startDate).format('YYYY-MM-DD'),
          dayjs(trip.endDate).format('YYYY-MM-DD')
        ]
      }
    } else {
      ElMessage.error(res.message || '加载行程数据失败')
      router.back()
    }
  } catch (error: any) {
    console.error('加载行程数据失败:', error)
    ElMessage.error(error.message || '加载行程数据失败')
    router.back()
  } finally {
    loading.value = false
  }
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB!')
    return false
  }
  return true
}

const handleUpload = async (options: any) => {
  const { file } = options
  
  try {
    ElMessage.info('正在上传封面图片...')
    
    // 先上传图片，获取URL
    const res = await imageApi.uploadImage(file, 2, 0)
    
    if (res.code === 200 && res.data?.url) {
      // 保存图片URL
      form.coverImage = res.data.url
      ElMessage.success('封面上传成功')
    } else {
      ElMessage.error(res.message || '封面上传失败')
    }
  } catch (error: any) {
    console.error('封面上传失败:', error)
    ElMessage.error(error.message || '封面上传失败')
  }
}

const removeCover = () => {
  form.coverImage = ''
  ElMessage.success('封面已移除')
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    // 构建更新数据
    const updateData = {
      name: form.title,
      region: form.destination,
      startDate: form.dateRange[0],
      endDate: form.dateRange[1],
      description: form.description || '',
      coverImageUrl: form.coverImage || ''
    }
    
    const res = await tripApi.updateTrip(Number(tripId), updateData)
    
    if (res.code === 200) {
      ElMessage.success('行程修改成功!')
      router.push('/trips')
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error: any) {
    console.error('修改失败:', error)
    ElMessage.error(error.message || '修改失败，请稍后再试')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadTripData()
})
</script>

<style scoped>
.edit-trip {
  max-width: 900px;
  margin: 0 auto;
}

/* 表单样式 */
.trip-form-modern {
  margin-bottom: 32px;
}

.form-card-modern {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

.form-card-modern :deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  background: transparent;
}

.form-card-modern :deep(.el-card__body) {
  padding: 32px;
}

.card-header-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon {
  font-size: 20px;
  color: #667eea;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

/* 表单项样式 */
.form-item-modern {
  margin-bottom: 24px;
}

.form-input-modern,
.form-date-picker-modern {
  width: 100%;
}

.form-input-modern :deep(.el-input__wrapper),
.form-date-picker-modern :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 16px;
}

.form-input-modern :deep(.el-input__wrapper:hover),
.form-date-picker-modern :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.form-input-modern :deep(.el-input__wrapper.is-focus),
.form-date-picker-modern :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.form-textarea-modern :deep(.el-textarea__inner) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 16px;
}

.form-textarea-modern :deep(.el-textarea__inner:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.form-textarea-modern :deep(.el-textarea__inner:focus) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

/* 封面图片上传样式 */
.cover-upload-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cover-uploader-modern {
  display: inline-block;
}

.cover-image-modern {
  width: 100%;
  max-width: 400px;
  height: 240px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.cover-image-modern:hover {
  transform: scale(1.02);
}

.upload-placeholder-modern {
  width: 100%;
  max-width: 400px;
  height: 240px;
  border: 2px dashed rgba(102, 126, 234, 0.3);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

.upload-placeholder-modern:hover {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.upload-icon {
  font-size: 48px;
  color: #667eea;
  margin-bottom: 12px;
}

.upload-text-modern {
  font-size: 16px;
  font-weight: 500;
  color: #1a1d29;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #8c8c8c;
}

.upload-actions-modern {
  margin-top: 8px;
}

/* 表单操作按钮 */
.form-actions-modern {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 40px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.cancel-btn-modern {
  border-radius: 10px;
  padding: 12px 32px;
  font-weight: 500;
  transition: all 0.3s;
}

.cancel-btn-modern:hover {
  background: #f5f7fa;
}

.submit-btn-modern {
  border-radius: 10px;
  padding: 12px 32px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.submit-btn-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .form-actions-modern {
    flex-direction: column;
  }
  
  .cancel-btn-modern,
  .submit-btn-modern {
    width: 100%;
  }
}
</style>