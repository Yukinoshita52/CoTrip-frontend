<template>
  <Layout>
    <div class="create-trip">
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        class="trip-form-modern"
      >
        <el-card class="form-card-modern" shadow="hover">
          <template #header>
            <div class="card-header-modern">
              <div class="header-icon-wrapper">
                <el-icon class="header-icon"><Document /></el-icon>
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
            <el-select
              v-model="form.destination"
              placeholder="请选择目的地"
              filterable
              allow-create
              class="form-select-modern"
            >
              <el-option-group label="热门城市">
                <el-option
                  v-for="city in popularCities"
                  :key="city"
                  :label="city"
                  :value="city"
                />
              </el-option-group>
              <el-option-group label="省份/地区">
                <el-option
                  v-for="region in regions"
                  :key="region"
                  :label="region"
                  :value="region"
                />
              </el-option-group>
            </el-select>
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

        <el-card class="form-card-modern" shadow="hover" style="margin-top: 24px;">
          <template #header>
            <div class="card-header-modern">
              <div class="header-icon-wrapper">
                <el-icon class="header-icon"><UserFilled /></el-icon>
              </div>
              <span class="header-title">成员管理</span>
            </div>
          </template>
          
          <div class="member-section-modern">
            <div class="add-member-modern">
              <el-input
                v-model="newMemberEmail"
                placeholder="输入邮箱邀请成员"
                class="member-input-modern"
              >
                <template #prefix>
                  <el-icon><Message /></el-icon>
                </template>
              </el-input>
              <el-button @click="addMember" type="primary" class="invite-btn-modern">
                <el-icon><Plus /></el-icon>
                邀请成员
              </el-button>
            </div>
            
            <div class="member-list-modern" v-if="form.members.length > 0">
              <div v-for="member in form.members" :key="member.userId" class="member-item-modern">
                <el-avatar :size="36" class="member-avatar-modern">
                  {{ member.username.charAt(0) }}
                </el-avatar>
                <span class="member-name-modern">{{ member.username }}</span>
                <el-tag size="small" :type="member.role === 'owner' ? 'success' : ''" class="role-tag-modern">
                  {{ getRoleText(member.role) }}
                </el-tag>
                <el-button
                  v-if="member.role !== 'owner'"
                  text
                  type="danger"
                  @click="removeMember(member.userId)"
                  class="remove-btn-modern"
                  size="small"
                >
                  <el-icon><Delete /></el-icon>
                  移除
                </el-button>
              </div>
            </div>
            <div v-else class="empty-members">
              <el-empty description="暂无成员" :image-size="80" />
            </div>
          </div>
        </el-card>

        <div class="form-actions-modern">
          <el-button @click="$router.back()" size="large" class="cancel-btn-modern">
            取消
          </el-button>
          <el-button type="primary" @click="handleSubmit" :loading="loading" size="large" class="submit-btn-modern">
            <el-icon v-if="!loading"><Check /></el-icon>
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
import { tripApi, imageApi, expenseApi } from '@/api'
import { formatImageUrl } from '@/utils/image'
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

// 热门城市列表
const popularCities = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '成都', 
  '重庆', '西安', '武汉', '天津', '青岛', '大连', '厦门', '三亚',
  '丽江', '桂林', '张家界', '黄山', '九寨沟', '稻城亚丁'
]

// 省份/地区列表
const regions = [
  '北京市', '天津市', '上海市', '重庆市',
  '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
  '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
  '河南省', '湖北省', '湖南省', '广东省', '海南省',
  '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省',
  '台湾省', '内蒙古自治区', '广西壮族自治区', '西藏自治区',
  '宁夏回族自治区', '新疆维吾尔自治区', '香港特别行政区', '澳门特别行政区'
]

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
      // 保存图片URL，稍后在创建行程时会关联到具体的行程ID
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
      description: form.description || '',
      coverImageUrl: form.coverImage || '' // 使用上传的图片URL
    }
    
    const res = await tripApi.createTrip(tripData)
    
    if (res.code === 200) {
      ElMessage.success('行程创建成功!')
      
      // 自动为行程创建账本
      try {
        const tripId = res.data?.tripId || res.data?.id
        if (tripId) {
          const bookName = `${form.title}账本`
          const bookRes = await expenseApi.createAccountBook({
            tripId: Number(tripId),
            name: bookName
          })
          
          if (bookRes.code === 200) {
            ElMessage.success('账本已自动创建')
          } else {
            console.warn('账本创建失败:', bookRes.message)
            // 不阻止用户操作，只是记录警告
          }
        }
      } catch (error: any) {
        console.warn('自动创建账本失败:', error)
        // 不阻止用户操作，账本可以后续手动创建
      }
      
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
.form-select-modern,
.form-date-picker-modern {
  width: 100%;
}

.form-input-modern :deep(.el-input__wrapper),
.form-select-modern :deep(.el-input__wrapper),
.form-date-picker-modern :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 16px;
}

.form-input-modern :deep(.el-input__wrapper:hover),
.form-select-modern :deep(.el-input__wrapper:hover),
.form-date-picker-modern :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.form-input-modern :deep(.el-input__wrapper.is-focus),
.form-select-modern :deep(.el-input__wrapper.is-focus),
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

/* 成员管理样式 */
.member-section-modern {
  margin-top: 8px;
}

.add-member-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.member-input-modern {
  flex: 1;
  max-width: 400px;
}

.member-input-modern :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.invite-btn-modern {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.invite-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.member-list-modern {
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 16px;
  background: #ffffff;
}

.member-item-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  transition: all 0.2s;
}

.member-item-modern:hover {
  background: #f8f9fa;
}

.member-item-modern:last-child {
  border-bottom: none;
}

.member-avatar-modern {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.member-name-modern {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: #1a1d29;
}

.role-tag-modern {
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
}

.remove-btn-modern {
  border-radius: 6px;
  padding: 6px 12px;
  transition: all 0.2s;
}

.remove-btn-modern:hover {
  background: rgba(245, 87, 108, 0.1);
}

.empty-members {
  padding: 40px 20px;
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
  .add-member-modern {
    flex-direction: column;
    align-items: stretch;
  }
  
  .member-input-modern {
    max-width: 100%;
  }
  
  .invite-btn-modern {
    width: 100%;
  }
  
  .form-actions-modern {
    flex-direction: column;
  }
  
  .cancel-btn-modern,
  .submit-btn-modern {
    width: 100%;
  }
}
</style>