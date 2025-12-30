import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '仪表盘', requiresAuth: true }
  },
  {
    path: '/trips',
    name: 'Trips',
    component: () => import('@/views/trips/TripList.vue'),
    meta: { title: '我的行程', requiresAuth: true }
  },
  {
    path: '/trips/create',
    name: 'CreateTrip',
    component: () => import('@/views/trips/CreateTrip.vue'),
    meta: { title: '创建行程', requiresAuth: true }
  },
  {
    path: '/trips/:id',
    name: 'TripDetail',
    component: () => import('@/views/trips/TripDetail.vue'),
    meta: { title: '行程详情', requiresAuth: true }
  },
  {
    path: '/trips/:id/edit',
    name: 'EditTrip',
    component: () => import('@/views/trips/EditTrip.vue'),
    meta: { title: '编辑行程', requiresAuth: true }
  },
  {
    path: '/expenses',
    name: 'Expenses',
    component: () => import('@/views/expenses/ExpenseList.vue'),
    meta: { title: '记账管理', requiresAuth: true }
  },
  {
    path: '/expenses/books',
    name: 'AccountBooks',
    component: () => import('@/views/expenses/AccountBookList.vue'),
    meta: { title: '账本管理', requiresAuth: true }
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/views/community/CommunityList.vue'),
    meta: { title: '旅行社区', requiresAuth: false }
  },
  {
    path: '/community/:id',
    name: 'CommunityDetail',
    component: () => import('@/views/community/CommunityDetail.vue'),
    meta: { title: '帖子详细', requiresAuth: false }
  },
  {
    path: '/invitations',
    name: 'Invitations',
    component: () => import('@/views/Invitations.vue'),
    meta: { title: '邀请信息', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/admin/announcements',
    name: 'AnnouncementManage',
    component: () => import('@/views/admin/AnnouncementManage.vue'),
    meta: { title: '公告管理', requiresAuth: true, requiresAdmin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  const requiresAuth = to.meta.requiresAuth !== false
  
  if (requiresAuth && !token) {
    // 需要登录但未登录，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && token) {
    // 已登录访问登录页，跳转到首页
    next('/dashboard')
  } else {
    next()
  }
})

export default router