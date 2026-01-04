<template>
  <Layout>
    <div class="admin-settings">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon-wrapper">
            <el-icon class="header-icon"><UserFilled /></el-icon>
          </div>
          <div class="header-text">
            <h2 class="page-title">管理员设置</h2>
            <p class="page-subtitle">管理系统管理员，提升或取消用户的管理员权限</p>
          </div>
        </div>
      </div>

      <!-- 搜索区域 -->
      <el-card class="search-card" shadow="never">
        <div class="search-section">
          <div class="search-input-wrapper">
            <el-input
              v-model="searchKeyword"
              placeholder="输入用户名或手机号搜索用户"
              clearable
              @keyup.enter="handleSearch"
              size="large"
              class="search-input"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button 
              type="primary" 
              @click="handleSearch"
              size="large"
              :loading="searching"
              class="search-button"
            >
              <el-icon><Search /></el-icon>
              <span>搜索</span>
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 搜索结果 -->
      <el-card v-if="searchResults.length > 0" class="results-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">搜索结果</span>
            <span class="result-count">找到 {{ searchResults.length }} 个用户</span>
          </div>
        </template>
        <el-table :data="searchResults" v-loading="searching" class="user-table">
          <el-table-column prop="username" label="用户名" width="180">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :src="row.avatarUrl" :size="32" class="user-avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="username">{{ row.username }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="nickname" label="昵称" width="150" />
          
          <el-table-column prop="phone" label="手机号" width="150" />
          
          <el-table-column label="角色" width="120">
            <template #default="{ row }">
              <el-tag :type="row.role === 1 ? 'success' : 'info'" size="small">
                {{ row.role === 1 ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  v-if="row.role !== 1"
                  type="primary" 
                  size="small"
                  @click="handlePromote(row)"
                  :loading="promotingId === row.id"
                  class="action-btn"
                >
                  <el-icon><Promotion /></el-icon>
                  <span>设为管理员</span>
                </el-button>
                <el-button 
                  v-else
                  type="danger" 
                  size="small"
                  @click="handleDemote(row)"
                  :loading="demotingId === row.id"
                  class="action-btn"
                >
                  <el-icon><Remove /></el-icon>
                  <span>取消管理员</span>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 管理员列表 -->
      <el-card class="admins-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">当前管理员列表</span>
            <el-button 
              type="text" 
              @click="loadAdmins"
              :loading="loadingAdmins"
              class="refresh-btn"
            >
              <el-icon><Refresh /></el-icon>
              <span>刷新</span>
            </el-button>
          </div>
        </template>
        <el-table :data="adminList" v-loading="loadingAdmins" class="admin-table">
          <el-table-column prop="username" label="用户名" width="180">
            <template #default="{ row }">
              <div class="user-cell">
                <el-avatar :src="row.avatarUrl" :size="32" class="user-avatar">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <span class="username">{{ row.username }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="nickname" label="昵称" width="150" />
          
          <el-table-column prop="phone" label="手机号" width="150" />
          
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  type="danger" 
                  size="small"
                  @click="handleDemote(row)"
                  :loading="demotingId === row.id"
                  :disabled="isCurrentUser(row.id)"
                  class="action-btn"
                >
                  <el-icon><Remove /></el-icon>
                  <span>取消管理员</span>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!loadingAdmins && adminList.length === 0" description="暂无管理员" />
      </el-card>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  UserFilled, Search, Promotion, Remove, Refresh, User 
} from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { adminApi } from '@/api'
import type { UserVO } from '@/types/api'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 搜索相关
const searchKeyword = ref('')
const searchResults = ref<UserVO[]>([])
const searching = ref(false)

// 管理员列表
const adminList = ref<UserVO[]>([])
const loadingAdmins = ref(false)

// 操作状态
const promotingId = ref<number | null>(null)
const demotingId = ref<number | null>(null)

// 搜索用户
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    ElMessage.warning('请输入用户名或手机号')
    return
  }

  searching.value = true
  try {
    const res = await adminApi.searchUsers(searchKeyword.value.trim())
    if (res.code === 200 && res.data) {
      searchResults.value = res.data
      if (res.data.length === 0) {
        ElMessage.info('未找到匹配的用户')
      }
    } else {
      ElMessage.error(res.message || '搜索失败')
      searchResults.value = []
    }
  } catch (error: any) {
    console.error('搜索用户失败:', error)
    ElMessage.error(error.message || '搜索失败')
    searchResults.value = []
  } finally {
    searching.value = false
  }
}

// 提升为管理员
const handlePromote = async (user: UserVO) => {
  try {
    await ElMessageBox.confirm(
      `确定要将用户 "${user.username}" 提升为管理员吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    promotingId.value = user.id
    const identifier = user.username || user.phone || ''
    
    const res = await adminApi.promoteToAdmin(identifier)
    if (res.code === 200) {
      ElMessage.success('已成功设置为管理员')
      // 更新搜索结果中的角色
      const foundUser = searchResults.value.find(u => u.id === user.id)
      if (foundUser) {
        foundUser.role = 1
      }
      // 刷新管理员列表
      await loadAdmins()
    } else {
      ElMessage.error(res.message || '设置失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提升管理员失败:', error)
      ElMessage.error(error.message || '设置失败')
    }
  } finally {
    promotingId.value = null
  }
}

// 取消管理员权限
const handleDemote = async (user: UserVO) => {
  // 检查是否是当前用户
  if (isCurrentUser(user.id)) {
    ElMessage.warning('不能取消自己的管理员权限')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要取消用户 "${user.username}" 的管理员权限吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    demotingId.value = user.id
    const identifier = user.username || user.phone || ''
    
    const res = await adminApi.demoteFromAdmin(identifier)
    if (res.code === 200) {
      ElMessage.success('已成功取消管理员权限')
      // 更新搜索结果中的角色
      const foundUser = searchResults.value.find(u => u.id === user.id)
      if (foundUser) {
        foundUser.role = 0
      }
      // 刷新管理员列表
      await loadAdmins()
    } else {
      ElMessage.error(res.message || '取消失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('取消管理员失败:', error)
      ElMessage.error(error.message || '取消失败')
    }
  } finally {
    demotingId.value = null
  }
}

// 加载管理员列表
const loadAdmins = async () => {
  loadingAdmins.value = true
  try {
    const res = await adminApi.getAllAdmins()
    if (res.code === 200 && res.data) {
      adminList.value = res.data
    } else {
      ElMessage.error(res.message || '加载失败')
      adminList.value = []
    }
  } catch (error: any) {
    console.error('加载管理员列表失败:', error)
    ElMessage.error(error.message || '加载失败')
    adminList.value = []
  } finally {
    loadingAdmins.value = false
  }
}

// 检查是否是当前用户
const isCurrentUser = (userId: number) => {
  return userStore.user?.id === userId
}

// 初始化
onMounted(() => {
  loadAdmins()
})
</script>

<style scoped>
.admin-settings {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 0 4px;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.header-icon-wrapper {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
}

.header-icon {
  font-size: 28px;
  color: white;
}

.header-text {
  flex: 1;
}

.page-title {
  margin: 0 0 6px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a1d29;
  letter-spacing: -0.5px;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 400;
}

.search-card,
.results-card,
.admins-card {
  margin-bottom: 24px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  overflow: hidden;
}

.search-card:hover,
.results-card:hover,
.admins-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.result-count {
  font-size: 14px;
  color: #6b7280;
}

.refresh-btn {
  padding: 4px 8px;
}

.search-input-wrapper {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.search-button {
  min-width: 100px;
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-avatar {
  flex-shrink: 0;
}

.username {
  font-weight: 500;
  color: #1f2937;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 8px 16px;
}

/* 表格样式优化 */
:deep(.user-table .el-table__header) {
  background: #fafbfc;
}

:deep(.user-table .el-table__header th) {
  background: #fafbfc;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  padding: 16px 20px;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.user-table .el-table__body tr) {
  transition: all 0.2s ease;
}

:deep(.user-table .el-table__body tr:hover) {
  background: #f9fafb;
  transform: scale(1.001);
}

:deep(.user-table .el-table__body td) {
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.admin-table .el-table__header) {
  background: #fafbfc;
}

:deep(.admin-table .el-table__header th) {
  background: #fafbfc;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  padding: 16px 20px;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.admin-table .el-table__body tr) {
  transition: all 0.2s ease;
}

:deep(.admin-table .el-table__body tr:hover) {
  background: #f9fafb;
  transform: scale(1.001);
}

:deep(.admin-table .el-table__body td) {
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
}
</style>

