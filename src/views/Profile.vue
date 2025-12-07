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

        <!-- 我的邀请 -->
        <el-tab-pane label="我的邀请" name="sent-invitations">
          <div class="invitations-section">
            <div class="section-header">
              <h3>我发出的邀请</h3>
            </div>
            
            <div class="invitations-list">
              <el-empty v-if="sentInvitations.length === 0" description="暂无发出的邀请" :image-size="80" />
              <div v-for="invitation in sentInvitations" :key="invitation.invitationId" class="invitation-item">
                <div class="invitation-info">
                  <div class="invitation-trip">
                    <el-icon><MapLocation /></el-icon>
                    <span>行程ID: {{ invitation.tripId }}</span>
                  </div>
                  <div class="invitation-invitee">
                    <el-icon><User /></el-icon>
                    <span>被邀请人: {{ invitation.invitee }}</span>
                  </div>
                  <div class="invitation-status">
                    <el-tag :type="getInvitationStatusType(invitation.status)" size="small">
                      {{ getInvitationStatusText(invitation.status) }}
                    </el-tag>
                  </div>
                  <div class="invitation-time">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatDate(invitation.sentTime) }}</span>
                  </div>
                </div>
                <div class="invitation-actions" v-if="invitation.status === 0">
                  <el-button text type="danger" @click="cancelInvitation(invitation.invitationId)">
                    撤销邀请
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 收到的邀请 -->
        <el-tab-pane label="收到的邀请" name="received-invitations">
          <div class="invitations-section">
            <div class="section-header">
              <h3>我收到的邀请</h3>
            </div>
            
            <div class="invitations-list">
              <el-empty v-if="receivedInvitations.length === 0" description="暂无收到的邀请" :image-size="80" />
              <div v-for="invitation in receivedInvitations" :key="invitation.invitationId" class="invitation-item">
                <div class="invitation-info">
                  <div class="invitation-inviter">
                    <el-avatar :size="40" :src="invitation.inviterAvatarUrl">
                      {{ invitation.inviterNickname?.charAt(0) || 'U' }}
                    </el-avatar>
                    <div class="inviter-details">
                      <div class="inviter-name">{{ invitation.inviterNickname || invitation.inviterPhone }}</div>
                      <div class="invitation-trip">
                        <el-icon><MapLocation /></el-icon>
                        <span>邀请加入行程ID: {{ invitation.tripId }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="invitation-time">
                    <el-icon><Clock /></el-icon>
                    <span>{{ formatDate(invitation.sentTime) }}</span>
                  </div>
                </div>
                <div class="invitation-actions">
                  <el-button type="success" @click="acceptInvitation(invitation.invitationId)">
                    接受
                  </el-button>
                  <el-button @click="rejectInvitation(invitation.invitationId)">
                    拒绝
                  </el-button>
                </div>
              </div>
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
import { userApi, tripApi, communityApi, invitationApi } from '@/api'
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
  totalTrips: 0,
  sharedTrips: 0,
  totalLikes: 0
})

// 我的行程
const myTrips = ref<Trip[]>([])
// 我的分享
const myShares = ref<CommunityPost[]>([])

// 收藏夹
const favorites = ref<CommunityPost[]>([])

// 邀请相关
const sentInvitations = ref<any[]>([])
const receivedInvitations = ref<any[]>([])

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

// 加载我发出的邀请
const loadSentInvitations = async () => {
  try {
    const res = await invitationApi.getSentInvitations()
    if (res.code === 200 && res.data) {
      sentInvitations.value = res.data.map((inv: any) => ({
        invitationId: inv.invitationId || inv.id,
        tripId: inv.tripId,
        invitee: inv.invitee,
        status: inv.status,
        sentTime: inv.sentTime
      }))
    }
  } catch (error: any) {
    console.error('加载发出的邀请失败:', error)
    ElMessage.error(error.message || '加载发出的邀请失败')
  }
}

// 加载我收到的邀请
const loadReceivedInvitations = async () => {
  try {
    const res = await invitationApi.getReceivedInvitations()
    if (res.code === 200 && res.data) {
      receivedInvitations.value = res.data.map((inv: any) => ({
        invitationId: inv.invitationId || inv.id,
        tripId: inv.tripId,
        inviterId: inv.inviterId,
        inviterNickname: inv.inviterNickname,
        inviterAvatarUrl: inv.inviterAvatarUrl,
        inviterPhone: inv.inviterPhone,
        status: inv.status,
        sentTime: inv.sentTime
      }))
    }
  } catch (error: any) {
    console.error('加载收到的邀请失败:', error)
    ElMessage.error(error.message || '加载收到的邀请失败')
  }
}

// 接受邀请
const acceptInvitation = async (invitationId: number) => {
  try {
    const res = await invitationApi.acceptInvitation(invitationId)
    if (res.code === 200) {
      ElMessage.success('已接受邀请')
      await loadReceivedInvitations()
    } else {
      ElMessage.error(res.message || '接受邀请失败')
    }
  } catch (error: any) {
    console.error('接受邀请失败:', error)
    ElMessage.error(error.message || '接受邀请失败')
  }
}

// 拒绝邀请
const rejectInvitation = async (invitationId: number) => {
  try {
    await ElMessageBox.confirm('确定要拒绝这个邀请吗？', '确认拒绝', {
      type: 'warning'
    })
    
    const res = await invitationApi.rejectInvitation(invitationId)
    if (res.code === 200) {
      ElMessage.success('已拒绝邀请')
      await loadReceivedInvitations()
    } else {
      ElMessage.error(res.message || '拒绝邀请失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('拒绝邀请失败:', error)
      ElMessage.error(error.message || '拒绝邀请失败')
    }
  }
}

// 撤销邀请
const cancelInvitation = async (invitationId: number) => {
  try {
    await ElMessageBox.confirm('确定要撤销这个邀请吗？', '确认撤销', {
      type: 'warning'
    })
    
    const res = await invitationApi.cancelInvitation(invitationId)
    if (res.code === 200) {
      ElMessage.success('已撤销邀请')
      await loadSentInvitations()
    } else {
      ElMessage.error(res.message || '撤销邀请失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('撤销邀请失败:', error)
      ElMessage.error(error.message || '撤销邀请失败')
    }
  }
}

// 获取邀请状态类型
const getInvitationStatusType = (status: number) => {
  const types: Record<number, string> = {
    0: 'warning', // 待接受
    1: 'success', // 已接受
    2: 'danger',  // 已拒绝
    3: 'info'      // 已过期
  }
  return types[status] || 'info'
}

// 获取邀请状态文本
const getInvitationStatusText = (status: number) => {
  const texts: Record<number, string> = {
    0: '待接受',
    1: '已接受',
    2: '已拒绝',
    3: '已过期'
  }
  return texts[status] || '未知'
}

// 加载用户信息
const loadUserInfo = async () => {
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
}

// 加载我的行程
const loadMyTrips = async () => {
  try {
    const res = await tripApi.getTrips()
    if (res.code === 200 && res.data) {
      myTrips.value = res.data.map((trip: any) => ({
        id: String(trip.tripId),
        title: trip.name,
        destination: trip.region,
        startDate: dayjs(trip.startDate).format('YYYY-MM-DD'),
        endDate: dayjs(trip.endDate).format('YYYY-MM-DD'),
        status: 'completed',
        description: trip.description || '',
        coverImage: '',
        createdBy: String(trip.createdBy || ''),
        members: [],
        itinerary: [],
        createdAt: dayjs(trip.createdTime).format('YYYY-MM-DD'),
        updatedAt: dayjs(trip.updatedTime).format('YYYY-MM-DD')
      }))
      userStats.value.totalTrips = myTrips.value.length
    }
  } catch (error: any) {
    console.error('加载我的行程失败:', error)
    ElMessage.error(error.message || '加载我的行程失败')
  }
}

// 加载我的分享
const loadMyShares = async () => {
  if (!userInfo.value.id) return
  try {
    const res = await communityApi.getUserProfile(Number(userInfo.value.id))
    if (res.code === 200 && res.data) {
      const posts = res.data.posts || []
      myShares.value = posts.map((post: any) => ({
        id: String(post.postId || post.id || ''),
        title: post.tripName || post.title || '',
        description: post.description || '',
        tripId: String(post.tripId || ''),
        authorId: String(post.author?.userId || post.authorId || ''),
        author: {
          id: String(post.author?.userId || post.authorId || ''),
          username: post.author?.username || '',
          email: post.author?.email || '',
          nickname: post.author?.nickname || post.author?.username || '',
          avatar: post.author?.avatarUrl || post.author?.avatar || '',
          createdAt: ''
        },
        trip: {
          id: String(post.tripId || ''),
          title: post.tripName || '',
          destination: post.region || '',
          startDate: post.startDate ? dayjs(post.startDate).format('YYYY-MM-DD') : '',
          endDate: post.endDate ? dayjs(post.endDate).format('YYYY-MM-DD') : '',
          status: 'completed',
          description: post.description || '',
          coverImage: post.coverImages?.[0] || '',
          createdBy: String(post.author?.userId || ''),
          members: [],
          itinerary: [],
          createdAt: post.createTime ? dayjs(post.createTime).format('YYYY-MM-DD') : '',
          updatedAt: post.createTime ? dayjs(post.createTime).format('YYYY-MM-DD') : ''
        },
        likes: post.stats?.likeCount || post.likes || 0,
        views: post.stats?.viewCount || post.views || 0,
        tags: post.tags || [],
        isPublic: true,
        createdAt: post.createTime ? dayjs(post.createTime).format('YYYY-MM-DD') : '',
        updatedAt: post.createTime ? dayjs(post.createTime).format('YYYY-MM-DD') : ''
      }))
      userStats.value.sharedTrips = myShares.value.length
      userStats.value.totalLikes = myShares.value.reduce((sum, share) => sum + share.likes, 0)
    }
  } catch (error: any) {
    console.error('加载我的分享失败:', error)
    ElMessage.error(error.message || '加载我的分享失败')
  }
}

onMounted(async () => {
  await loadUserInfo()
  await loadMyTrips()
  await loadMyShares()
  await loadSentInvitations()
  await loadReceivedInvitations()
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

.invitations-section {
  padding: 24px;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.invitation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  transition: all 0.3s;
}

.invitation-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.invitation-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
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
  font-size: 14px;
  color: #666;
}

.invitation-trip .el-icon,
.invitation-invitee .el-icon,
.invitation-time .el-icon {
  margin-right: 4px;
}

.invitation-status {
  margin-top: 4px;
}

.invitation-actions {
  display: flex;
  gap: 8px;
}
</style>