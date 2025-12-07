<template>
  <Layout>
    <div class="create-trip">
      <div class="page-header">
        <h2>创建新行程</h2>
        <p>开始规划你的下一次旅行</p>
      </div>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="trip-form"
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
              :on-success="handleUploadSuccess"
            >
              <img v-if="form.coverImage" :src="form.coverImage" class="cover-image" />
              <div v-else class="upload-placeholder">
                <el-icon><Plus /></el-icon>
                <div class="upload-text">上传封面</div>
              </div>
            </el-upload>
          </el-form-item>
        </el-card>

        <el-card style="margin-top: 24px;">
          <template #header>
            <span>成员管理</span>
          </template>
          
          <div class="member-section">
            <div class="add-member">
              <el-input
                v-model="newMemberEmail"
                placeholder="输入邮箱邀请成员"
                style="width: 300px; margin-right: 12px;"
              />
              <el-button @click="addMember">邀请成员</el-button>
            </div>
            
            <div class="member-list" v-if="form.members.length > 0">
              <div v-for="member in form.members" :key="member.userId" class="member-item">
                <el-avatar size="small">{{ member.username.charAt(0) }}</el-avatar>
                <span class="member-name">{{ member.username }}</span>
                <el-tag size="small" :type="member.role === 'owner' ? 'success' : ''">
                  {{ getRoleText(member.role) }}
                </el-tag>
                <el-button
                  v-if="member.role !== 'owner'"
                  text
                  type="danger"
                  @click="removeMember(member.userId)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </div>
        </el-card>

        <div class="form-actions">
          <el-button @click="$router.back()">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading">
            创建行程
          </el-button>
        </div>
      </el-form>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { tripApi } from '@/api'
import type { TripMember } from '@/types'

const router = useRouter()
const formRef = ref<FormInstance>()
const loading = ref(false)
const newMemberEmail = ref('')

// 表单数据
const form = reactive({
  title: '',
  destination: '',
  dateRange: [] as string[],
  description: '',
  coverImage: '',
  members: [] as TripMember[]
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
  form.coverImage = response.url
  ElMessage.success('封面上传成功')
}

const addMember = () => {
  if (!newMemberEmail.value) {
    ElMessage.warning('请输入邮箱地址')
    return
  }
  
  // 实际应该调用邀请API，这里暂时提示功能待实现
  ElMessage.info('邀请功能待实现，请在行程创建后通过行程详情页面邀请成员')
  newMemberEmail.value = ''
}

const removeMember = (userId: string) => {
  const index = form.members.findIndex(m => m.userId === userId)
  if (index > -1) {
    form.members.splice(index, 1)
    ElMessage.success('成员已移除')
  }
}

const getRoleText = (role: string) => {
  const texts: Record<string, string> = {
    owner: '创建者',
    admin: '管理员',
    member: '成员'
  }
  return texts[role] || role
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 构建提交数据（匹配后端DTO格式）
    const tripData = {
      name: form.title,
      region: form.destination,
      startDate: form.dateRange[0],
      endDate: form.dateRange[1],
      description: form.description || ''
    }
    
    const res = await tripApi.createTrip(tripData)
    
    if (res.code === 200) {
      ElMessage.success('行程创建成功!')
      router.push('/trips')
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch (error: any) {
    console.error('创建失败:', error)
    ElMessage.error(error.message || '创建失败，请稍后再试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.create-trip {
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

.member-section {
  margin-top: 16px;
}

.add-member {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.member-list {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.member-item:last-child {
  border-bottom: none;
}

.member-name {
  flex: 1;
  font-size: 14px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
}
</style>