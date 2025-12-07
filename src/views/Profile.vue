<template>
  <Layout>
    <div class="profile">
      <!-- 个人信息卡片 -->
      <el-card class="profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <el-avatar :size="80" :src="formatAvatarUrl(userInfo.avatarUrl)">
              {{ userInfo.username.charAt(0) }}
            </el-avatar>
            <el-button class="upload-btn" @click="handleAvatarUpload">
              <el-icon>
                <Camera />
              </el-icon>
              更换头像
            </el-button>
          </div>
          <div class="user-info">
            <h2>{{ userInfo.nickname }}</h2>
            <p class="username">@{{ userInfo.username }}</p>
            <p class="user-contact">{{ userInfo.email || userInfo.phone || '未设置联系方式' }}</p>
          </div>
        </div>
      </el-card>

      <!-- 主要内容区域 -->
      <div class="profile-content">
        <el-row :gutter="24">
          <!-- 账户设置 -->
          <el-col :span="24">
            <el-card class="settings-card">
              <template #header>
                <div class="card-header">
                  <el-icon>
                    <Setting />
                  </el-icon>
                  <span>账户设置</span>
                </div>
              </template>

              <!-- 基本设置 -->
              <div class="settings-section">
                <h4>基本信息</h4>
                <el-form :model="settingsForm" label-width="100px">
                  <el-form-item label="用户名">
                    <el-input v-model="settingsForm.username" placeholder="请输入用户名" disabled />
                  </el-form-item>

                  <el-form-item label="昵称">
                    <el-input v-model="settingsForm.nickname" placeholder="请输入昵称" />
                  </el-form-item>

                  <el-form-item label="邮箱">
                    <el-input v-model="settingsForm.email" placeholder="请输入邮箱" />
                  </el-form-item>

                  <el-form-item label="手机号">
                    <el-input v-model="settingsForm.phone" placeholder="请输入手机号" />
                  </el-form-item>

                  <el-form-item label="个人简介">
                    <el-input v-model="settingsForm.bio" type="textarea" :rows="3" placeholder="介绍一下自己" />
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="saveSettings">保存基本信息</el-button>
                  </el-form-item>
                </el-form>
              </div>

              <!-- 安全设置 -->
              <div class="settings-section" style="margin-top: 32px;">
                <h4>安全设置</h4>
                <el-form label-width="100px">
                  <el-form-item label="修改密码">
                    <el-button @click="showChangePassword = true">修改密码</el-button>
                  </el-form-item>
                </el-form>
              </div>

              <!-- 隐私设置 -->
              <div class="settings-section" style="margin-top: 32px;">
                <h4>隐私设置</h4>
                <el-form label-width="100px">
                  <el-form-item label="允许邀请">
                    <el-switch v-model="privacySettings.allowInvite" />
                    <span style="margin-left: 8px; color: #666;">允许其他用户邀请你加入行程</span>
                  </el-form-item>

                  <el-form-item label="邮件通知">
                    <el-switch v-model="privacySettings.emailNotification" />
                    <span style="margin-left: 8px; color: #666;">接收行程更新和邀请邮件</span>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="savePrivacySettings">保存隐私设置</el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="showChangePassword" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="当前密码">
          <el-input v-model="passwordForm.currentPassword" type="password" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showChangePassword = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { useUserStore } from '@/stores/user'
import { userApi } from '@/api'
import { formatAvatarUrl } from '@/utils/image'

const userStore = useUserStore()
const showChangePassword = ref(false)

// 用户信息
const userInfo = ref({
  id: '',
  username: '',
  nickname: '',
  email: '',
  phone: '',
  avatarUrl: '',
  bio: '',
  createdAt: ''
})

// 表单数据
const settingsForm = reactive({
  username: '',
  nickname: '',
  email: '',
  phone: '',
  bio: ''
})

const privacySettings = reactive({
  allowInvite: true,
  emailNotification: true
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 工具函数 - 移除了formatDate，因为不再需要处理邀请时间

// 事件处理
const handleAvatarUpload = () => {
  // 创建文件输入元素
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.style.display = 'none'

  input.onchange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]

    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      ElMessage.error('请选择图片文件')
      return
    }

    // 验证文件大小 (限制为5MB)
    if (file.size > 5 * 1024 * 1024) {
      ElMessage.error('图片大小不能超过5MB')
      return
    }

    try {
      ElMessage.info('正在上传头像...')

      // 调用上传头像API
      const res = await userApi.uploadAvatar(file)

      if (res.code === 200) {
        // 更新用户头像 - 后端返回的是 ImageUrlVO，字段名为 url
        let newAvatarUrl = res.data?.url

        if (newAvatarUrl) {
          // 如果返回的是相对路径，需要拼接完整的MinIO服务器地址
          if (typeof newAvatarUrl === 'string' && !newAvatarUrl.startsWith('http')) {
            // 移除开头的斜杠（如果有的话）
            const cleanPath = newAvatarUrl.startsWith('/') ? newAvatarUrl.substring(1) : newAvatarUrl
            newAvatarUrl = `http://121.40.23.40:9000/cotrip/${cleanPath}`
          }

          userInfo.value.avatarUrl = newAvatarUrl

          // 更新用户store中的头像
          if (userStore.user) {
            userStore.setUser({
              ...userStore.user,
              avatarUrl: newAvatarUrl
            })
          }

          ElMessage.success('头像上传成功')
        } else {
          console.error('未找到头像URL字段:', res.data)
          ElMessage.error('头像上传成功，但无法获取头像地址')
        }
      } else {
        ElMessage.error(res.message || '头像上传失败')
      }
    } catch (error: any) {
      console.error('头像上传失败:', error)
      ElMessage.error(error.message || '头像上传失败')
    }
  }

  // 触发文件选择
  document.body.appendChild(input)
  input.click()
  document.body.removeChild(input)
}

const saveSettings = async () => {
  try {
    // 检查是否有需要更新的字段
    let hasChanges = false

    // 检查昵称是否有变化
    if (settingsForm.nickname !== userInfo.value.nickname) {
      await userApi.updateNickname(settingsForm.nickname)
      hasChanges = true
    }

    // 检查手机号是否有变化
    if (settingsForm.phone !== userInfo.value.phone) {
      await userApi.updatePhone(settingsForm.phone)
      hasChanges = true
    }

    if (hasChanges) {
      // 更新本地用户信息
      Object.assign(userInfo.value, settingsForm)

      // 更新用户store中的信息
      if (userStore.user) {
        userStore.setUser({
          ...userStore.user,
          nickname: settingsForm.nickname,
          phone: settingsForm.phone
        })
      }

      ElMessage.success('基本信息已保存')
    } else {
      ElMessage.info('没有需要保存的更改')
    }
  } catch (error: any) {
    console.error('保存设置失败:', error)
    ElMessage.error(error.message || '保存设置失败')
  }
}

const savePrivacySettings = () => {
  ElMessage.success('隐私设置已保存')
}



// 加载用户信息
const loadUserInfo = async () => {
  if (userStore.user) {
    // 处理头像URL，确保是完整地址
    let avatarUrl = userStore.user.avatarUrl || ''
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      const cleanPath = avatarUrl.startsWith('/') ? avatarUrl.substring(1) : avatarUrl
      avatarUrl = `http://121.40.23.40:9000/cotrip/${cleanPath}`
    }

    userInfo.value = {
      id: String(userStore.user.id || userStore.user.userId || ''),
      username: userStore.user.username || '',
      nickname: userStore.user.nickname || userStore.user.username || '',
      email: userStore.user.email || '',
      phone: userStore.user.phone || '',
      avatarUrl: avatarUrl,
      bio: '',
      createdAt: ''
    }
  } else {
    // 尝试从后端获取
    const user = await userStore.fetchCurrentUser()
    if (user) {
      userInfo.value = {
        id: String(user.id || user.userId || ''),
        username: user.username || '',
        nickname: user.nickname || user.username || '',
        email: user.email || '',
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
        bio: '',
        createdAt: ''
      }
    }
  }

  // 同步表单数据
  settingsForm.username = userInfo.value.username
  settingsForm.nickname = userInfo.value.nickname
  settingsForm.email = userInfo.value.email
  settingsForm.phone = userInfo.value.phone
  settingsForm.bio = userInfo.value.bio
}

// 修改密码
const changePassword = async () => {
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.error('两次输入的密码不一致')
    return
  }

  try {
    await userApi.updatePassword(passwordForm.currentPassword, passwordForm.newPassword)
    showChangePassword.value = false
    ElMessage.success('密码修改成功')

    // 重置表单
    Object.assign(passwordForm, {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
  } catch (error: any) {
    ElMessage.error(error.message || '密码修改失败')
  }
}

onMounted(async () => {
  await loadUserInfo()
})
</script>

<style scoped>
.profile {
  max-width: 1200px;
}

.profile-card {
  margin-bottom: 24px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.upload-btn {
  font-size: 12px;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.username {
  margin: 0 0 8px 0;
  color: #409eff;
  font-size: 16px;
  font-weight: 500;
}

.user-contact {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.profile-content {
  margin-top: 24px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.invitation-card,
.settings-card {
  height: fit-content;
}

.invitation-section h4,
.settings-section h4 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.invitation-item {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.invitation-info {
  margin-bottom: 12px;
}

.invitation-inviter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.inviter-details {
  flex: 1;
}

.inviter-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.invitation-trip,
.invitation-invitee,
.invitation-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.invitation-status {
  margin-bottom: 4px;
}

.invitation-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section:last-child {
  margin-bottom: 0;
}
</style>