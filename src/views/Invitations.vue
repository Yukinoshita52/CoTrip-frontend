<template>
  <Layout>
    <div class="invitations">
      <el-row :gutter="24">
        <!-- 收到的邀请 -->
        <el-col :span="12">
          <el-card class="invitation-card-modern" shadow="hover">
            <template #header>
              <div class="card-header-modern received">
                <div class="header-icon-wrapper">
                  <el-icon class="header-icon"><Download /></el-icon>
                </div>
                <div class="header-content">
                  <span class="header-title">收到的邀请</span>
                  <el-badge :value="pendingReceivedCount" :hidden="pendingReceivedCount === 0" class="header-badge" />
                </div>
              </div>
            </template>
            
            <div class="invitations-list received-list">
              <el-empty v-if="receivedInvitations.length === 0" description="暂无收到的邀请" :image-size="100" />
              <div v-for="invitation in receivedInvitations" :key="invitation.invitationId" class="invitation-item-modern">
                <div class="invitation-header-modern">
                  <div class="user-info-modern">
                    <el-avatar :size="48" :src="formatAvatarUrl(invitation.inviterAvatarUrl)" class="user-avatar">
                      {{ invitation.inviterNickname?.charAt(0) || 'U' }}
                    </el-avatar>
                    <div class="user-details-modern">
                      <div class="user-name-modern">{{ invitation.inviterNickname || invitation.inviterPhone }}</div>
                      <div class="invitation-time-modern">
                        <el-icon class="time-icon"><Clock /></el-icon>
                        <span>{{ formatDate(invitation.sentTime) }}</span>
                      </div>
                    </div>
                  </div>
                  <el-tag :type="getInvitationStatusType(invitation.status)" size="small" class="status-tag-modern">
                    {{ getInvitationStatusText(invitation.status) }}
                  </el-tag>
                </div>
                
                <div class="invitation-content-modern">
                  <div class="trip-info-modern">
                    <el-icon class="trip-icon"><MapLocation /></el-icon>
                    <span class="trip-text">邀请你加入行程: {{ invitation.tripName || `ID: ${invitation.tripId}` }}</span>
                  </div>
                </div>
                
                <div class="invitation-actions-modern">
                  <template v-if="invitation.status === 0">
                    <el-button type="success" @click="acceptInvitation(invitation.invitationId)" class="action-btn-success">
                      <el-icon><Check /></el-icon>
                      接受邀请
                    </el-button>
                    <el-button @click="rejectInvitation(invitation.invitationId)" class="action-btn-default">
                      <el-icon><Close /></el-icon>
                      拒绝邀请
                    </el-button>
                  </template>
                  <el-button text type="danger" @click="deleteReceivedInvitation(invitation.invitationId)" class="action-btn-delete">
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
          <el-card class="invitation-card-modern" shadow="hover">
            <template #header>
              <div class="card-header-modern sent">
                <div class="header-icon-wrapper">
                  <el-icon class="header-icon"><Upload /></el-icon>
                </div>
                <div class="header-content">
                  <span class="header-title">发出的邀请</span>
                </div>
              </div>
            </template>
            
            <div class="invitations-list sent-list">
              <el-empty v-if="sentInvitations.length === 0" description="暂无发出的邀请" :image-size="100" />
              <div v-for="invitation in sentInvitations" :key="invitation.invitationId" class="invitation-item-modern">
                <div class="invitation-header-modern">
                  <div class="user-info-modern">
                    <el-avatar :size="48" :src="formatAvatarUrl(invitation.inviteeAvatarUrl)" class="user-avatar">
                      {{ invitation.inviteeNickname?.charAt(0) || invitation.invitee?.charAt(0) || 'U' }}
                    </el-avatar>
                    <div class="user-details-modern">
                      <div class="user-name-modern">{{ invitation.inviteeNickname || invitation.invitee }}</div>
                      <div class="invitation-time-modern">
                        <el-icon class="time-icon"><Clock /></el-icon>
                        <span>{{ formatDate(invitation.sentTime) }}</span>
                      </div>
                    </div>
                  </div>
                  <el-tag :type="getInvitationStatusType(invitation.status)" size="small" class="status-tag-modern">
                    {{ getInvitationStatusText(invitation.status) }}
                  </el-tag>
                </div>
                
                <div class="invitation-content-modern">
                  <div class="trip-info-modern">
                    <el-icon class="trip-icon"><MapLocation /></el-icon>
                    <span class="trip-text">邀请加入行程: {{ invitation.tripName || `ID: ${invitation.tripId}` }}</span>
                  </div>
                </div>
                
                <div class="invitation-actions-modern">
                  <el-button text type="danger" @click="cancelInvitation(invitation.invitationId)" class="action-btn-delete">
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
      <el-row :gutter="24" style="margin-top: 32px;">
        <el-col :span="24">
          <el-card class="stats-card-modern" shadow="hover">
            <template #header>
              <div class="card-header-modern stats">
                <div class="header-icon-wrapper">
                  <el-icon class="header-icon"><DataAnalysis /></el-icon>
                </div>
                <div class="header-content">
                  <span class="header-title">邀请统计</span>
                </div>
              </div>
            </template>
            
            <el-row :gutter="24">
              <el-col :span="6">
                <div class="stat-item-modern received-stat">
                  <div class="stat-icon-modern">
                    <el-icon><Download /></el-icon>
                  </div>
                  <div class="stat-content-modern">
                    <div class="stat-number-modern">{{ receivedInvitations.length }}</div>
                    <div class="stat-label-modern">收到邀请</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item-modern sent-stat">
                  <div class="stat-icon-modern">
                    <el-icon><Upload /></el-icon>
                  </div>
                  <div class="stat-content-modern">
                    <div class="stat-number-modern">{{ sentInvitations.length }}</div>
                    <div class="stat-label-modern">发出邀请</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item-modern pending-stat">
                  <div class="stat-icon-modern">
                    <el-icon><Clock /></el-icon>
                  </div>
                  <div class="stat-content-modern">
                    <div class="stat-number-modern">{{ pendingReceivedCount }}</div>
                    <div class="stat-label-modern">待处理</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-item-modern accepted-stat">
                  <div class="stat-icon-modern">
                    <el-icon><Check /></el-icon>
                  </div>
                  <div class="stat-content-modern">
                    <div class="stat-number-modern">{{ acceptedCount }}</div>
                    <div class="stat-label-modern">已同意</div>
                  </div>
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
  max-width: 1400px;
  margin: 0 auto;
}

/* 卡片头部样式 */
.card-header-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-header-modern.received .header-icon-wrapper {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(102, 126, 234, 0.1) 100%);
}

.card-header-modern.sent .header-icon-wrapper {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(67, 233, 123, 0.1) 100%);
}

.card-header-modern.stats .header-icon-wrapper {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.header-icon {
  font-size: 20px;
  color: #667eea;
}

.card-header-modern.received .header-icon {
  color: #409eff;
}

.card-header-modern.sent .header-icon {
  color: #67c23a;
}

.header-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

.header-badge {
  margin-left: 4px;
}

/* 邀请卡片样式 */
.invitation-card-modern {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.invitation-card-modern :deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  background: transparent;
}

.invitation-card-modern :deep(.el-card__body) {
  padding: 24px;
}

.invitations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

/* 自定义滚动条样式 */
.invitations-list::-webkit-scrollbar {
  width: 6px;
}

.invitations-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.invitations-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background 0.3s;
}

.invitations-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.invitation-item-modern {
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.invitation-item-modern:hover {
  border-color: rgba(102, 126, 234, 0.3);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.invitation-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-info-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.user-avatar {
  border: 2px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.user-details-modern {
  flex: 1;
}

.user-name-modern {
  font-weight: 600;
  color: #1a1d29;
  font-size: 15px;
  margin-bottom: 6px;
}

.invitation-time-modern {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #8c8c8c;
}

.time-icon {
  font-size: 14px;
}

.status-tag-modern {
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 12px;
}

.invitation-content-modern {
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.trip-info-modern {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.trip-icon {
  font-size: 16px;
  color: #667eea;
}

.trip-text {
  color: #1a1d29;
  line-height: 1.5;
}

.invitation-actions-modern {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.action-btn-success {
  border-radius: 8px;
  font-weight: 500;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(103, 194, 58, 0.3);
  transition: all 0.3s;
}

.action-btn-success:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(103, 194, 58, 0.4);
}

.action-btn-default {
  border-radius: 8px;
  font-weight: 500;
  padding: 8px 16px;
}

.action-btn-delete {
  border-radius: 8px;
  padding: 6px 12px;
  transition: all 0.2s;
}

.action-btn-delete:hover {
  background: rgba(245, 87, 108, 0.1);
}

/* 统计卡片样式 */
.stats-card-modern {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

.stats-card-modern :deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  background: transparent;
}

.stats-card-modern :deep(.el-card__body) {
  padding: 24px;
}

.stat-item-modern {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.stat-item-modern:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}

.stat-icon-modern {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}

.received-stat .stat-icon-modern {
  background: linear-gradient(135deg, #409eff 0%, #667eea 100%);
}

.sent-stat .stat-icon-modern {
  background: linear-gradient(135deg, #67c23a 0%, #43e97b 100%);
}

.pending-stat .stat-icon-modern {
  background: linear-gradient(135deg, #e6a23c 0%, #f5a623 100%);
}

.accepted-stat .stat-icon-modern {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content-modern {
  flex: 1;
}

.stat-number-modern {
  font-size: 28px;
  font-weight: 700;
  color: #1a1d29;
  line-height: 1.2;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.stat-label-modern {
  font-size: 14px;
  color: #8c8c8c;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .invitation-item-modern {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .invitation-header-modern {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .invitation-actions-modern {
    flex-direction: column;
  }
  
  .action-btn-success,
  .action-btn-default {
    width: 100%;
  }
}
</style>