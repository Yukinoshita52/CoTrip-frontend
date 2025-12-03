<template>
  <Layout>
    <div class="profile">
      <!-- 个人信息卡片 -->
      <el-card class="profile-card">
        <div class="profile-header">
          <div class="avatar-section">
            <el-avatar :size="80" :src="userInfo.avatar">
              {{ userInfo.username.charAt(0) }}
            </el-avatar>
            <el-button class="upload-btn" @click="handleAvatarUpload">
              <el-icon><Camera /></el-icon>
              更换头像
            </el-button>
          </div>
          <div class="user-info">
            <h2>{{ userInfo.username }}</h2>
            <p class="user-email">{{ userInfo.email }}</p>
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-number">{{ userStats.totalTrips }}</span>
                <span class="stat-label">总行程</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ userStats.sharedTrips }}</span>
                <span class="stat-label">已分享</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ userStats.totalLikes }}</span>
                <span class="stat-label">获得点赞</span>
              </div>
            </div>
          </div>
          <div class="profile-actions">
            <el-button @click="showEditProfile = true">
              <el-icon><Edit /></el-icon>
              编辑资料
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 标签页 -->
      <el-tabs v-model="activeTab" class="profile-tabs">
        <!-- 我的行程 -->
        <el-tab-pane label="我的行程" name="trips">
          <div class="trips-section">
            <div class="section-header">
              <h3>我的行程</h3>
              <el-button type="primary" @click="$router.push('/trips/create')">
                <el-icon><Plus /></el-icon>
                创建新行程
              </el-button>
            </div>
            
            <div class="trips-grid">
              <el-row :gutter="16">
                <el-col :span="8" v-for="trip in myTrips" :key="trip.id">
                  <el-card class="trip-card" @click="$router.push(`/trips/${trip.id}`)">
                    <div class="trip-cover">
                      <img v-if="trip.coverImage" :src="trip.coverImage" alt="行程封面" />
                      <div v-else class="default-cover">
                        <el-icon><Picture /></el-icon>
                      </div>
                      <div class="trip-status">
                        <el-tag :type="getTripStatusType(trip.status)" size="small">
                          {{ getTripStatusText(trip.status) }}
                        </el-tag>
                      </div>
                    </div>
                    <div class="trip-info">
                      <h4>{{ trip.title }}</h4>
                      <p class="trip-destination">{{ trip.destination }}</p>
                      <p class="trip-date">{{ formatDateRange(trip.startDate, trip.endDate) }}</p>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>

        <!-- 我的分享 -->
        <el-tab-pane label="我的分享" name="shares">
          <div class="shares-section">
            <div class="section-header">
              <h3>我的分享</h3>
              <el-button @click="showShareDialog = true">
                <el-icon><Share /></el-icon>
                分享新行程
              </el-button>
            </div>
            
            <div class="shares-list">
              <div v-for="share in myShares" :key="share.id" class="share-item">
                <div class="share-cover">
                  <img v-if="share.trip.coverImage" :src="share.trip.coverImage" alt="封面" />
                  <div v-else class="default-cover">
                    <el-icon><Picture /></el-icon>
                  </div>
                </div>
                <div class="share-content">
                  <h4>{{ share.title }}</h4>
                  <p class="share-description">{{ share.description }}</p>
                  <div class="share-stats">
                    <span><el-icon><View /></el-icon> {{ share.views }}</span>
                    <span><el-icon><Star /></el-icon> {{ share.likes }}</span>
                    <span class="share-date">{{ formatDate(share.createdAt) }}</span>
                  </div>
                </div>
                <div class="share-actions">
                  <el-button text @click="$router.push(`/community/${share.id}`)">
                    查看详情
                  </el-button>
                  <el-dropdown>
                    <el-button text>
                      <el-icon><More /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item @click="editShare(share)">
                          编辑分享
                        </el-dropdown-item>
                        <el-dropdown-item @click="toggleShareVisibility(share)">
                          {{ share.isPublic ? '设为私密' : '设为公开' }}
                        </el-dropdown-item>
                        <el-dropdown-item @click="deleteShare(share)" divided>
                          删除分享
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 收藏夹 -->
        <el-tab-pane label="收藏夹" name="favorites">
          <div class="favorites-section">
            <div class="section-header">
              <h3>我的收藏</h3>
              <span class="collection-count">共 {{ favorites.length }} 个收藏</span>
            </div>
            
            <div class="favorites-grid">
              <el-row :gutter="16">
                <el-col :span="8" v-for="favorite in favorites" :key="favorite.id">
                  <el-card class="favorite-card" @click="$router.push(`/community/${favorite.id}`)">
                    <div class="favorite-cover">
                      <img v-if="favorite.trip.coverImage" :src="favorite.trip.coverImage" alt="封面" />
                      <div v-else class="default-cover">
                        <el-icon><Picture /></el-icon>
                      </div>
                    </div>
                    <div class="favorite-info">
                      <h4>{{ favorite.title }}</h4>
                      <p class="favorite-author">by {{ favorite.author.username }}</p>
                      <div class="favorite-stats">
                        <span><el-icon><View /></el-icon> {{ favorite.views }}</span>
                        <span><el-icon><Star /></el-icon> {{ favorite.likes }}</span>
                      </div>
                    </div>
                    <div class="favorite-actions" @click.stop>
                      <el-button text type="danger" @click="removeFavorite(favorite)">
                        <el-icon><Delete /></el-icon>
                        取消收藏
                      </el-button>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>

        <!-- 账户设置 -->
        <el-tab-pane label="账户设置" name="settings">
          <div class="settings-section">
            <el-card>
              <template #header>
                <span>基本设置</span>
              </template>
              
              <el-form :model="settingsForm" label-width="120px">
                <el-form-item label="用户名">
                  <el-input v-model="settingsForm.username" placeholder="请输入用户名" />
                </el-form-item>
                
                <el-form-item label="昵称">
                  <el-input v-model="settingsForm.nickname" placeholder="请输入昵称" />
                </el-form-item>
                
                <el-form-item label="邮箱">
                  <el-input v-model="settingsForm.email" placeholder="请输入邮箱" />
                </el-form-item>
                
                <el-form-item label="个人简介">
                  <el-input
                    v-model="settingsForm.bio"
                    type="textarea"
                    :rows="4"
                    placeholder="介绍一下自己"
                  />
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="saveSettings">保存设置</el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <el-card style="margin-top: 24px;">
              <template #header>
                <span>隐私设置</span>
              </template>
              
              <el-form label-width="120px">
                <el-form-item label="行程可见性">
                  <el-radio-group v-model="privacySettings.tripVisibility">
                    <el-radio label="public">公开 - 所有人可见</el-radio>
                    <el-radio label="friends">好友 - 仅好友可见</el-radio>
                    <el-radio label="private">私密 - 仅自己可见</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="允许邀请">
                  <el-switch v-model="privacySettings.allowInvite" />
                  <span style="margin-left: 8px; color: #666;">允许其他用户邀请你加入行程</span>
                </el-form-item>
                
                <el-form-item label="邮件通知">
                  <el-switch v-model="privacySettings.emailNotification" />
                  <span style="margin-left: 8px; color: #666;">接收行程更新和邀请邮件</span>
                </el-form-item>
                
                <el-form-item>
                  <el-button type="primary" @click="savePrivacySettings">保存设置</el-button>
                </el-form-item>
              </el-form>
            </el-card>

            <el-card style="margin-top: 24px;">
              <template #header>
                <span>安全设置</span>
              </template>
              
              <el-form label-width="120px">
                <el-form-item label="修改密码">
                  <el-button @click="showChangePassword = true">修改密码</el-button>
                </el-form-item>
                
                <el-form-item label="两步验证">
                  <el-switch v-model="securitySettings.twoFactorAuth" />
                  <span style="margin-left: 8px; color: #666;">启用两步验证提高账户安全性</span>
                </el-form-item>
                
                <el-form-item label="登录设备">
                  <el-button @click="showLoginDevices = true">管理登录设备</el-button>
                </el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 编辑资料对话框 -->
    <el-dialog v-model="showEditProfile" title="编辑个人资料" width="500px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="editForm.username" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditProfile = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

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
import type { Trip, CommunityPost } from '@/types'
import dayjs from 'dayjs'

const userStore = useUserStore()
const activeTab = ref('trips')
const showEditProfile = ref(false)
const showShareDialog = ref(false)
const showChangePassword = ref(false)
const showLoginDevices = ref(false)

// 用户信息
const userInfo = ref({
  id: '',
  username: '',
  nickname: '',
  email: '',
  avatar: '',
  bio: '',
  createdAt: ''
})

// 用户统计
const userStats = ref({
  totalTrips: 12,
  sharedTrips: 5,
  totalLikes: 89
})

// 我的行程
const myTrips = ref<Trip[]>([
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
    members: [],
    itinerary: [],
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01'
  },
  {
    id: '2',
    title: '云南大理丽江',
    destination: '大理·丽江',
    startDate: '2024-04-10',
    endDate: '2024-04-17',
    status: 'planning',
    description: '',
    coverImage: '',
    createdBy: 'user1',
    members: [],
    itinerary: [],
    createdAt: '2024-02-20',
    updatedAt: '2024-02-20'
  }
])

// 我的分享
const myShares = ref<CommunityPost[]>([
  {
    id: '1',
    title: '春日京都赏樱之旅',
    description: '在樱花盛开的季节，漫步京都古街，感受千年古都的魅力',
    tripId: '1',
    authorId: 'user1',
    author: userInfo.value,
    trip: myTrips.value[0],
    likes: 128,
    views: 1520,
    tags: ['日本', '樱花', '文化'],
    isPublic: true,
    createdAt: '2024-04-10',
    updatedAt: '2024-04-10'
  }
])

// 收藏夹
const favorites = ref<CommunityPost[]>([
  {
    id: '2',
    title: '云南大理洱海环游',
    description: '骑行洱海，住民宿，品白族美食',
    tripId: '2',
    authorId: 'user3',
    author: {
      id: 'user3',
      username: '背包客小王',
      email: 'user3@example.com',
      nickname: '小王',
      createdAt: '2024-01-01'
    },
    trip: {
      id: '2',
      title: '大理丽江5日游',
      destination: '大理·丽江',
      startDate: '2024-03-20',
      endDate: '2024-03-24',
      status: 'completed',
      description: '',
      coverImage: '',
      createdBy: 'user3',
      members: [],
      itinerary: [],
      createdAt: '2024-03-01',
      updatedAt: '2024-03-01'
    },
    likes: 89,
    views: 756,
    tags: ['云南', '自然风光'],
    isPublic: true,
    createdAt: '2024-03-25',
    updatedAt: '2024-03-25'
  }
])

// 表单数据
const editForm = reactive({
  username: userInfo.value.username,
  nickname: userInfo.value.nickname,
  email: userInfo.value.email
})

const settingsForm = reactive({
  username: userInfo.value.username,
  nickname: userInfo.value.nickname,
  email: userInfo.value.email,
  bio: userInfo.value.bio
})

const privacySettings = reactive({
  tripVisibility: 'public',
  allowInvite: true,
  emailNotification: true
})

const securitySettings = reactive({
  twoFactorAuth: false
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
}

const formatDateRange = (startDate: string, endDate: string) => {
  const start = dayjs(startDate).format('MM-DD')
  const end = dayjs(endDate).format('MM-DD')
  return `${start} ~ ${end}`
}

const getTripStatusType = (status: string) => {
  const types: Record<string, string> = {
    planning: '',
    ongoing: 'success',
    completed: 'info'
  }
  return types[status] || ''
}

const getTripStatusText = (status: string) => {
  const texts: Record<string, string> = {
    planning: '计划中',
    ongoing: '进行中',
    completed: '已完成'
  }
  return texts[status] || status
}

// 事件处理
const handleAvatarUpload = () => {
  ElMessage.info('头像上传功能待实现')
}

const saveSettings = () => {
  Object.assign(userInfo.value, settingsForm)
  ElMessage.success('设置已保存')
}

const savePrivacySettings = () => {
  ElMessage.success('隐私设置已保存')
}

const editShare = (_share: CommunityPost) => {
  ElMessage.info('编辑分享功能待实现')
}

const toggleShareVisibility = (share: CommunityPost) => {
  share.isPublic = !share.isPublic
  ElMessage.success(`已设为${share.isPublic ? '公开' : '私密'}`)
}

const deleteShare = async (share: CommunityPost) => {
  try {
    await ElMessageBox.confirm('确定要删除这个分享吗？', '确认删除', {
      type: 'warning'
    })
    
    const index = myShares.value.findIndex(s => s.id === share.id)
    if (index > -1) {
      myShares.value.splice(index, 1)
      ElMessage.success('分享已删除')
    }
  } catch {
    // 用户取消
  }
}

const removeFavorite = (favorite: CommunityPost) => {
  const index = favorites.value.findIndex(f => f.id === favorite.id)
  if (index > -1) {
    favorites.value.splice(index, 1)
    ElMessage.success('已取消收藏')
  }
}

// 加载用户信息
onMounted(async () => {
  if (userStore.user) {
    userInfo.value = {
      id: String(userStore.user.id || userStore.user.userId || ''),
      username: userStore.user.username || '',
      nickname: userStore.user.nickname || userStore.user.username || '',
      email: userStore.user.email || '',
      avatar: userStore.user.avatar || '',
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
        avatar: user.avatar || '',
        bio: '',
        createdAt: ''
      }
    }
  }
  
  // 同步表单数据
  editForm.username = userInfo.value.username
  editForm.nickname = userInfo.value.nickname
  editForm.email = userInfo.value.email
  settingsForm.username = userInfo.value.username
  settingsForm.nickname = userInfo.value.nickname
  settingsForm.email = userInfo.value.email
})

// 保存资料
const saveProfile = async () => {
  try {
    if (editForm.nickname !== userInfo.value.nickname) {
      await userApi.updateNickname(editForm.nickname)
    }
    Object.assign(userInfo.value, editForm)
    userStore.setUser({
      ...userStore.user!,
      nickname: editForm.nickname,
      username: editForm.username,
      email: editForm.email
    })
    showEditProfile.value = false
    ElMessage.success('个人资料已更新')
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
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
  align-items: flex-start;
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

.user-info {
  flex: 1;
}

.user-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.user-email {
  margin: 0 0 16px 0;
  color: #666;
}

.user-stats {
  display: flex;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-number {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 4px;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.profile-tabs {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.collection-count {
  font-size: 14px;
  color: #666;
}

.trips-grid, .favorites-grid {
  margin-bottom: 24px;
}

.trip-card, .favorite-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
}

.trip-card:hover, .favorite-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.trip-cover, .favorite-cover {
  position: relative;
  height: 120px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.trip-cover img, .favorite-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #ccc;
  font-size: 32px;
}

.trip-status {
  position: absolute;
  top: 8px;
  right: 8px;
}

.trip-info h4, .favorite-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.trip-destination, .trip-date, .favorite-author {
  margin: 2px 0;
  font-size: 12px;
  color: #666;
}

.favorite-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

.favorite-stats span {
  display: flex;
  align-items: center;
  gap: 2px;
}

.favorite-actions {
  margin-top: 8px;
}

.shares-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.share-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s;
}

.share-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.share-cover {
  width: 120px;
  height: 80px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.share-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.share-content {
  flex: 1;
}

.share-content h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #333;
}

.share-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
}

.share-stats {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #999;
}

.share-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.share-date {
  margin-left: auto;
}

.share-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
}

.settings-section .el-card {
  margin-bottom: 24px;
}

.settings-section .el-card:last-child {
  margin-bottom: 0;
}
</style>