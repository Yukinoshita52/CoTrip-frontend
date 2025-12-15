<template>
  <Layout>
    <div class="edit-trip" v-loading="loading">
      <div class="page-header">
        <h2>编辑行程</h2>
        <p>修改你的旅行计划</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="trip-form"
        v-if="!loading"
      >
        <el-card>
          <template #header>
            <span>基本信息</span>
          </template>
          
          <el-form-item label="行程标题" prop="title">
            <el-input
              v-model="form.title"
              placeholder="给你的行程起个名字"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="目的地" prop="destination">
            <el-input
              v-model="form.destination"
              placeholder="如：北京·上海·杭州"
              maxlength="100"
            />
          </el-form-item>
          
          <el-form-item label="行程时间" prop="dateRange">
            <el-date-picker
              v-model="form.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          
          <el-form-item label="行程描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="描述一下这次旅行的主题和亮点"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="封面图片">
            <el-upload
              class="cover-uploader"
              :show-file-list="false"
              :before-upload="beforeUpload"
              :http-request="handleUpload"
            >
              <img v-if="form.coverImage" :src="formatImageUrl(form.coverImage)" class="cover-image" />
              <div v-else class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <div class="upload-text">上传封面</div>
              </div>
            </el-upload>
            <div v-if="form.coverImage" class="upload-actions">
              <el-button size="small" @click="removeCover">移除封面</el-button>
            </div>
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

.trip-form {
  margin-bottom: 24px;
}

.cover-uploader {
  display: inline-block;
}

.cover-image {
  width: 200px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.upload-placeholder {
  width: 200px;
  height: 120px;
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

.upload-actions {
  margin-top: 8px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}
</style>