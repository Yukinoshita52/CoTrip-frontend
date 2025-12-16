<template>
  <Layout>
    <div class="invitations">
      <div class="page-header">
        <h1>邀请信息</h1>
        <p>管理你收到和发出的行程邀请</p>
      </div>

      <el-row :gutter="24">
        <!-- 收到的邀请 -->
        <el-col :span="12">
          <el-card class="invitation-card">
            <template #header>
              <div class="card-header">
                <el-icon><Download /></el-icon>
                <span>收到的邀请</span>
                <el-badge :value="pendingReceivedCount" :hidden="pendingReceivedCount === 0" />
              </div>
            </template>
            
            <div class="invitations-list">
              <el-empty v-if="receivedInvitations.length === 0" description="暂无收到的邀请" :image-size="80" />
              <div v-for="invitation in receivedInvitations" :key="invitation.invitationId" class="invitation-item">
                <div class="invitation-header">
                  <div class="inviter-info">
                    <el-avatar :size="40" :src="formatAvatarUrl(invitation.inviterAvatarUrl)">
                      {{ invitation.inviterNickname?.charAt(0) || 'U' }}
                    </el-avatar>
                    <div class="inviter-details">
                      <div class="inviter-name">{{ invitation.inviterNickname || invitation.inviterPhone }}</div>
                      <div class="invitation-time">
                        <el-icon><Clock /></el-icon>
                        <span>{{ formatDate(invitation.sentTime) }}</span>
                      </div>
                    </div>
                  </div>
                  <el-tag :type="getInvitationStatusType(invitation.status)" size="small">
                    {{ getInvitationStatusText(invitation.status) }}
                  </el-tag>
                </div>
                
                <div class="invitation-content">
                  <div class="trip-info">
                    <el-icon><MapLocation /></el-icon>
                    <span>邀请你加入行程: {{ invitation.tripName || `ID: ${invitation.tripId}` }}</span>
                  </div>
                </div>
                
                <div class="invitation-actions">
                  <template v-if="invitation.status === 0">
                    <el-button type="success" @click="acceptInvitation(invitation.invitationId)">
                      <el-icon><Check /></el-icon>
                      接受邀请
                    </el-button>
                    <el-button @click="rejectInvitation(invitation.invitationId)">
                      <el-icon><Close /></el-icon>
                      拒绝邀请
                    </el-button>
                  </template>
                  <el-button text type="danger" @click="deleteReceivedInvitation(invitation.invitationId)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 发出的邀请 -->
        <el-col :span="12">
          <el-card class="invitation-card">
            <template #header>
              <div class="card-header">
                <el-icon><Upload /></el-icon>
                <span>发出的邀请</span>
              </div>
            </template>
            
            <div class="invitations-list">
              <el-empty v-if="sentInvitations.length === 0" description="暂无发出的邀请" :image-size="80" />
              <div v-for="invitation in sentInvitations" :key="invitation.invitationId" class="invitation-item">
                <div class="invitation-header">
                  <div class="invitee-info">
                    <el-avatar :size="40" :src="formatAvatarUrl(invitation.inviteeAvatarUrl)">
                      {{ invitation.inviteeNickname?.charAt(0) || invitation.invitee?.charAt(0) || 'U' }}
                    </el-avatar>
                    <div class="invitee-details">
                      <div class="invitee-name">{{ invitation.inviteeNickname || invitation.invitee }}</div>
                      <div class="invitation-time">
                        <el-icon><Clock /></el-icon>
                        <span>{{ formatDate(invitation.sentTime) }}</span>
                      </div>
                    </div>
                  </div>
                  <el-tag :type="getInvitationStatusType(invitation.status)" size="small">
                    {{ getInvitationStatusText(invitation.status) }}
                  </el-tag>
                </div>
                
                <div class="invitation-content">
                  <div class="trip-info">
                    <el-icon><MapLocation /></el-icon>
                    <span>邀请加入行程: {{ invitation.tripName || `ID: ${invitation.tripId}` }}</span>
                  </div>
                </div>
                
                <div class="invitation-actions">
                  <el-button text type="danger" @click="cancelInvitation(invitation.invitationId)">
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 统计信息 -->
      <el-row :gutter="24" style="margin-top: 24px;">
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <el-icon><DataAnalysis /></el-icon>
                <span>邀请统计</span>
              </div>
            </template>
            
            <el-row :gutter="24">
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-number">{{ receivedInvitations.length }}</div>
                  <div class="stat-label">收到邀请</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-number">{{ sentInvitations.length }}</div>
                  <div class="stat-label">发出邀请</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-number">{{ pendingReceivedCount }}</div>
                  <div class="stat-label">待处理</div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item">
                  <div class="stat-number">{{ acceptedCount }}</div>
                  <div class="stat-label">已同意</div>
                </div>
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { invitationApi } from '@/api'
import { formatAvatarUrl } from '@/utils/image'
import type { InvitationVO } from '@/types/api'
import dayjs from 'dayjs'

// 邀请数据
const sentInvitations = ref<InvitationVO[]>([])
const receivedInvitations = ref<InvitationVO[]>([])

// 统计数据
const pendingReceivedCount = computed(() => {
  return receivedInvitations.value.filter(inv => inv.status === 0).length
})

const acceptedCount = computed(() => {
  return [...receivedInvitations.value, ...sentInvitations.value].filter(inv => inv.status === 1).length
})

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD HH:mm')
}

// 获取邀请状态类型
const getInvitationStatusType = (status: number) => {
  const types: Record<number, string> = {
    0: 'warning', // 待接受
    1: 'success', // 已接受
    2: 'danger',  // 已拒绝
    3: 'info'     // 已过期
  }
  return types[status] || 'info'
}

// 获取邀请状态文本
const getInvitationStatusText = (status: number) => {
  const texts: Record<number, string> = {
    0: '待处理',
    1: '已同意',
    2: '已拒绝',
    3: '已过期'
  }
  return texts[status] || '未知'
}

// 加载我发出的邀请
const loadSentInvitations = async () => {
  try {
    const res = await invitationApi.getSentInvitations()
    if (res.code === 200 && res.data) {
      sentInvitations.value = res.data
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
      receivedInvitations.value = res.data
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

// 撤销邀请（发出的邀请）
const cancelInvitation = async (invitationId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个邀请吗？删除后将无法恢复。', '确认删除', {
      type: 'warning'
    })
    
    const res = await invitationApi.cancelInvitation(invitationId)
    if (res.code === 200) {
      ElMessage.success('已删除邀请')
      await loadSentInvitations()
    } else {
      ElMessage.error(res.message || '删除邀请失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除邀请失败:', error)
      ElMessage.error(error.message || '删除邀请失败')
    }
  }
}

// 删除收到的邀请
const deleteReceivedInvitation = async (invitationId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个邀请吗？删除后将无法恢复。', '确认删除', {
      type: 'warning'
    })
    
    const res = await invitationApi.deleteReceivedInvitation(invitationId)
    if (res.code === 200) {
      ElMessage.success('已删除邀请')
      await loadReceivedInvitations()
    } else {
      ElMessage.error(res.message || '删除邀请失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除邀请失败:', error)
      ElMessage.error(error.message || '删除邀请失败')
    }
  }
}

onMounted(async () => {
  await Promise.all([
    loadSentInvitations(),
    loadReceivedInvitations()
  ])
})
</script>

<style scoped>
.invitations {
  max-width: 1200px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.invitation-card {
  height: fit-content;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.invitation-item {
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

.invitation-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.invitation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.inviter-info,
.invitee-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.inviter-details,
.invitee-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inviter-name,
.invitee-name {
  font-weight: 500;
  color: #333;
}

.invitation-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.invitation-content {
  margin-bottom: 12px;
}

.trip-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.invitation-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.stat-item {
  text-align: center;
  padding: 16px;
}

.stat-number {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}
</style>