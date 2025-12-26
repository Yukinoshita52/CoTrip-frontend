<template>
  <Layout>
    <div class="profile">
      <!-- 个人信息卡片 -->
      <el-card class="profile-card-modern" shadow="hover">
        <div class="profile-header-modern">
          <div class="avatar-section-modern">
            <div class="avatar-wrapper-modern">
              <el-avatar :size="120" :src="formatAvatarUrl(userInfo.avatarUrl)" class="user-avatar-modern">
                {{ userInfo.username?.charAt(0) || 'U' }}
              </el-avatar>
              <div class="avatar-overlay-modern" @click="handleAvatarUpload">
                <el-icon class="camera-icon"><Camera /></el-icon>
                <span class="overlay-text">更换头像</span>
              </div>
            </div>
            <el-button class="upload-btn-modern" @click="handleAvatarUpload" type="primary">
              <el-icon><Camera /></el-icon>
              更换头像
            </el-button>
          </div>
          <div class="user-info-modern">
            <h1 class="user-name-modern">{{ userInfo.nickname || userInfo.username }}</h1>
            <p class="username-modern">@{{ userInfo.username }}</p>
            <div class="user-contact-modern">
              <div class="contact-item" v-if="userInfo.email">
                <el-icon class="contact-icon"><Message /></el-icon>
                <span>{{ userInfo.email }}</span>
              </div>
              <div class="contact-item" v-if="userInfo.phone">
                <el-icon class="contact-icon"><Phone /></el-icon>
                <span>{{ userInfo.phone }}</span>
              </div>
              <div class="contact-item no-contact" v-if="!userInfo.email && !userInfo.phone">
                <el-icon class="contact-icon"><InfoFilled /></el-icon>
                <span>未设置联系方式</span>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 主要内容区域 -->
      <div class="profile-content">
        <el-row :gutter="24">
          <!-- 账户设置 -->
          <el-col :span="24">
            <el-card class="settings-card-modern" shadow="hover">
              <template #header>
                <div class="card-header-modern">
                  <div class="header-icon-wrapper">
                    <el-icon class="header-icon"><Setting /></el-icon>
                  </div>
                  <span class="header-title">账户设置</span>
                </div>
              </template>

              <!-- 基本设置 -->
              <div class="settings-section-modern">
                <div class="section-header-modern">
                  <el-icon class="section-icon"><User /></el-icon>
                  <h4 class="section-title">基本信息</h4>
                </div>
                <el-form :model="settingsForm" label-width="120px" class="settings-form-modern">
                  <el-form-item label="用户名">
                    <el-input v-model="settingsForm.username" placeholder="请输入用户名" disabled class="form-input-modern" />
                  </el-form-item>

                  <el-form-item label="昵称">
                    <el-input v-model="settingsForm.nickname" placeholder="请输入昵称" class="form-input-modern" />
                  </el-form-item>

                  <el-form-item label="邮箱">
                    <el-input v-model="settingsForm.email" placeholder="请输入邮箱" class="form-input-modern" />
                  </el-form-item>

                  <el-form-item label="手机号">
                    <el-input v-model="settingsForm.phone" placeholder="请输入手机号" class="form-input-modern" />
                  </el-form-item>

                  <el-form-item label="个人简介">
                    <el-input v-model="settingsForm.bio" type="textarea" :rows="4" placeholder="介绍一下自己" class="form-textarea-modern" />
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="saveSettings" class="save-btn-modern" size="large">
                      <el-icon><Check /></el-icon>
                      保存基本信息
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <!-- 安全设置 -->
              <div class="settings-section-modern">
                <div class="section-header-modern">
                  <el-icon class="section-icon"><Lock /></el-icon>
                  <h4 class="section-title">安全设置</h4>
                </div>
                <el-form label-width="120px" class="settings-form-modern">
                  <el-form-item label="修改密码">
                    <el-button @click="showChangePassword = true" class="action-btn-modern">
                      <el-icon><Key /></el-icon>
                      修改密码
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>

              <!-- 隐私设置 -->
              <div class="settings-section-modern">
                <div class="section-header-modern">
                  <el-icon class="section-icon"><Hide /></el-icon>
                  <h4 class="section-title">隐私设置</h4>
                </div>
                <el-form label-width="120px" class="settings-form-modern">
                  <el-form-item label="允许邀请">
                    <div class="switch-item-modern">
                      <el-switch v-model="privacySettings.allowInvite" />
                      <span class="switch-desc">允许其他用户邀请你加入行程</span>
                    </div>
                  </el-form-item>

                  <el-form-item label="邮件通知">
                    <div class="switch-item-modern">
                      <el-switch v-model="privacySettings.emailNotification" />
                      <span class="switch-desc">接收行程更新和邀请邮件</span>
                    </div>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="savePrivacySettings" class="save-btn-modern" size="large">
                      <el-icon><Check /></el-icon>
                      保存隐私设置
                    </el-button>
                  </el-form-item>
                </el-form>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 修改密码对话框 -->
    <el-dialog 
      v-model="showChangePassword" 
      title="修改密码" 
      width="500px"
      class="change-password-dialog-modern"
    >
      <template #header>
        <div class="dialog-header-modern">
          <div class="header-icon-wrapper">
            <el-icon class="header-icon"><Key /></el-icon>
          </div>
          <span class="header-title">修改密码</span>
        </div>
      </template>
      <el-form :model="passwordForm" label-width="100px" class="password-form-modern">
        <el-form-item label="当前密码">
          <el-input 
            v-model="passwordForm.currentPassword" 
            type="password" 
            placeholder="请输入当前密码"
            show-password
            class="password-input-modern"
          >
            <template #prefix>
              <el-icon class="input-icon"><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input 
            v-model="passwordForm.newPassword" 
            type="password" 
            placeholder="请输入新密码（至少6位）"
            show-password
            class="password-input-modern"
          >
            <template #prefix>
              <el-icon class="input-icon"><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input 
            v-model="passwordForm.confirmPassword" 
            type="password" 
            placeholder="请再次输入新密码"
            show-password
            class="password-input-modern"
          >
            <template #prefix>
              <el-icon class="input-icon"><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <div class="password-tip-modern">
          <el-icon class="tip-icon"><InfoFilled /></el-icon>
          <span>密码长度至少6位，建议包含字母和数字</span>
        </div>
      </el-form>
      <template #footer>
        <div class="dialog-footer-modern">
          <el-button @click="showChangePassword = false" class="cancel-btn-modern">取消</el-button>
          <el-button type="primary" @click="changePassword" class="submit-btn-modern">
            <el-icon><Check /></el-icon>
            确认修改
          </el-button>
        </div>
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
  max-width: 1400px;
  margin: 0 auto;
}

/* 个人信息卡片样式 */
.profile-card-modern {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

.profile-card-modern :deep(.el-card__body) {
  padding: 40px;
}

.profile-header-modern {
  display: flex;
  align-items: flex-start;
  gap: 40px;
}

.avatar-section-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar-wrapper-modern {
  position: relative;
  cursor: pointer;
  transition: transform 0.3s;
}

.avatar-wrapper-modern:hover {
  transform: scale(1.05);
}

.user-avatar-modern {
  border: 4px solid #fff;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 700;
  font-size: 48px;
}

.avatar-overlay-modern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
}

.avatar-wrapper-modern:hover .avatar-overlay-modern {
  opacity: 1;
}

.camera-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.overlay-text {
  font-size: 12px;
  font-weight: 500;
}

.upload-btn-modern {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.upload-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.user-info-modern {
  flex: 1;
}

.user-name-modern {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1d29;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1a1d29 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.username-modern {
  margin: 0 0 20px 0;
  color: #8c8c8c;
  font-size: 16px;
  font-weight: 500;
}

.user-contact-modern {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.contact-item.no-contact {
  color: #8c8c8c;
  background: #f8f9fa;
}

.contact-icon {
  font-size: 16px;
  color: #667eea;
}

.contact-item.no-contact .contact-icon {
  color: #8c8c8c;
}

/* 设置卡片样式 */
.profile-content {
  margin-top: 0;
}

.settings-card-modern {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.settings-card-modern :deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  background: transparent;
}

.settings-card-modern :deep(.el-card__body) {
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

.settings-section-modern {
  margin-bottom: 40px;
  padding-bottom: 32px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.settings-section-modern:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-header-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.section-icon {
  font-size: 20px;
  color: #667eea;
}

.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

.settings-form-modern {
  padding-left: 32px;
}

.form-input-modern :deep(.el-input__wrapper),
.form-textarea-modern :deep(.el-textarea__inner) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.form-input-modern :deep(.el-input__wrapper:hover),
.form-textarea-modern :deep(.el-textarea__inner:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
}

.form-input-modern :deep(.el-input__wrapper.is-focus),
.form-textarea-modern :deep(.el-textarea__inner:focus) {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.save-btn-modern {
  border-radius: 10px;
  padding: 12px 32px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.save-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.action-btn-modern {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn-modern:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.switch-item-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch-desc {
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .profile-header-modern {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .settings-form-modern {
    padding-left: 0;
  }
}

/* 修改密码对话框样式 */
.change-password-dialog-modern :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}

.change-password-dialog-modern :deep(.el-dialog__header) {
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  margin: 0;
}

.change-password-dialog-modern :deep(.el-dialog__body) {
  padding: 28px;
}

.change-password-dialog-modern :deep(.el-dialog__footer) {
  padding: 20px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
}

.change-password-dialog-modern .dialog-header-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.change-password-dialog-modern .header-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.change-password-dialog-modern .header-icon {
  font-size: 20px;
  color: #667eea;
}

.change-password-dialog-modern .header-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

/* 密码表单样式 */
.password-form-modern :deep(.el-form-item__label) {
  font-weight: 600;
  color: #1a1d29;
  font-size: 14px;
}

.password-input-modern :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s;
  padding: 10px 12px 10px 40px;
}

.password-input-modern :deep(.el-input__wrapper):hover {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset;
}

.password-input-modern :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset;
}

.password-input-modern .input-icon {
  color: #667eea;
  font-size: 16px;
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 1;
}

.password-tip-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 8px;
  border-left: 3px solid #667eea;
  font-size: 13px;
  color: #666;
}

.password-tip-modern .tip-icon {
  color: #667eea;
  font-size: 16px;
  flex-shrink: 0;
}

/* 对话框底部按钮 */
.change-password-dialog-modern .dialog-footer-modern {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.change-password-dialog-modern .cancel-btn-modern,
.change-password-dialog-modern .submit-btn-modern {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  transition: all 0.3s;
  min-width: 100px;
}

.change-password-dialog-modern .cancel-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.change-password-dialog-modern .submit-btn-modern {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.change-password-dialog-modern .submit-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}
</style>