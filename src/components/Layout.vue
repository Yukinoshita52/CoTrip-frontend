<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside width="260px" class="sidebar">
      <div class="logo">
        <div class="logo-icon">
          <img src="/logo.png" alt="协同旅行" class="logo-img" />
        </div>
        <span class="logo-text">多人协同旅行系统</span>
      </div>
      
      <el-menu
        :default-active="$route.path"
        router
        class="sidebar-menu"
        background-color="transparent"
        text-color="rgba(255, 255, 255, 0.85)"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>仪表盘</span>
        </el-menu-item>
        
        <!-- 普通用户菜单 -->
        <template v-if="!isAdmin">
          <el-menu-item index="/trips">
            <el-icon><MapLocation /></el-icon>
            <span>我的行程</span>
          </el-menu-item>
          
          <el-menu-item index="/expenses">
            <el-icon><Money /></el-icon>
            <span>记账管理</span>
          </el-menu-item>
          
          <el-menu-item index="/community">
            <el-icon><ChatDotSquare /></el-icon>
            <span>旅行社区</span>
          </el-menu-item>
          
          <el-menu-item index="/invitations">
            <el-icon><Message /></el-icon>
            <span>邀请信息</span>
          </el-menu-item>
        </template>
        
        <!-- 管理员菜单 -->
        <template v-if="isAdmin">
          <el-menu-item index="/admin/announcements">
            <el-icon><Document /></el-icon>
            <span>公告管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/settings">
            <el-icon><Setting /></el-icon>
            <span>管理员设置</span>
          </el-menu-item>
        </template>
        
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <h2 class="page-title">{{ currentPageTitle }}</h2>
        </div>
        
        <div class="header-right">
          <el-dropdown trigger="click" placement="bottom-end">
            <div class="user-info">
              <el-avatar :size="36" :src="userAvatar" class="user-avatar">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-details">
                <span class="username">{{ username }}</span>
                <el-icon class="dropdown-icon"><ArrowDown /></el-icon>
              </div>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="user-dropdown">
                <el-dropdown-item @click="$router.push('/profile')">
                  <el-icon><UserFilled /></el-icon>
                  <span>个人设置</span>
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="main-content">
        <slot />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { 
  Odometer, 
  MapLocation, 
  Money, 
  ChatDotSquare, 
  Message, 
  Document, 
  User,
  UserFilled,
  SwitchButton,
  ArrowDown,
  Setting
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { formatAvatarUrl } from '@/utils/image'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const currentPageTitle = computed(() => {
  return route.meta?.title as string || '协同旅行'
})

const username = computed(() => {
  return userStore.user?.nickname || userStore.user?.username || '未登录'
})

const userAvatar = computed(() => {
  return formatAvatarUrl(userStore.user?.avatarUrl)
})

// 直接从userStore中的role字段判断是否是管理员
const isAdmin = computed(() => {
  return userStore.user?.role === 1
})

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning'
    })
    userStore.logout()
    router.push('/login')
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  // 如果已登录但没有用户信息，尝试获取
  if (localStorage.getItem('token') && !userStore.user) {
    userStore.fetchCurrentUser()
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
  background: #f5f7fa;
}

/* 侧边栏样式 */
.sidebar {
  background: linear-gradient(180deg, #1a1d29 0%, #161922 100%);
  overflow: hidden;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.08);
  position: relative;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%);
  pointer-events: none;
}

.logo {
  display: flex;
  align-items: center;
  padding: 24px 20px;
  color: #fff;
  position: relative;
  z-index: 1;
}

.logo-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  margin-right: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: rgba(255, 255, 255, 0.1);
}

.logo-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255, 255, 255, 0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-menu {
  border: none;
  padding: 8px 12px;
  margin-top: 8px;
}

.sidebar-menu :deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin-bottom: 4px;
  border-radius: 10px;
  padding-left: 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.sidebar-menu :deep(.el-menu-item:hover) {
  background-color: rgba(255, 255, 255, 0.08) !important;
  transform: translateX(2px);
}

.sidebar-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%) !important;
  color: #ffffff !important;
  font-weight: 500;
}

.sidebar-menu :deep(.el-menu-item.is-active::before) {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 24px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 0 2px 2px 0;
}

.sidebar-menu :deep(.el-menu-item .el-icon) {
  margin-right: 12px;
  font-size: 18px;
  width: 20px;
}

.sidebar-menu :deep(.el-menu-item span) {
  font-size: 14px;
  letter-spacing: 0.3px;
}

/* 顶部栏样式 */
.header {
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  height: 72px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 6px 12px 6px 6px;
  border-radius: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: transparent;
  gap: 10px;
}

.user-info:hover {
  background: #f5f7fa;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-avatar {
  border: 2px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #1a1d29;
  letter-spacing: 0.2px;
}

.dropdown-icon {
  font-size: 12px;
  color: #8c8c8c;
  transition: transform 0.3s;
}

.user-info:hover .dropdown-icon {
  transform: translateY(2px);
}

.user-dropdown {
  margin-top: 8px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 8px;
}

.user-dropdown :deep(.el-dropdown-menu__item) {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.2s;
}

.user-dropdown :deep(.el-dropdown-menu__item:hover) {
  background: #f5f7fa;
  transform: translateX(2px);
}

.user-dropdown :deep(.el-dropdown-menu__item .el-icon) {
  font-size: 16px;
  color: #667eea;
}

.main-content {
  background: #f5f7fa;
  padding: 32px;
  overflow-y: auto;
}

/* 滚动条样式 */
.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>