import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '仪表盘' }
  },
  {
    path: '/trips',
    name: 'Trips',
    component: () => import('@/views/trips/TripList.vue'),
    meta: { title: '我的行程' }
  },
  {
    path: '/trips/create',
    name: 'CreateTrip',
    component: () => import('@/views/trips/CreateTrip.vue'),
    meta: { title: '创建行程' }
  },
  {
    path: '/trips/:id',
    name: 'TripDetail',
    component: () => import('@/views/trips/TripDetail.vue'),
    meta: { title: '行程详情' }
  },
  {
    path: '/expenses',
    name: 'Expenses',
    component: () => import('@/views/expenses/ExpenseList.vue'),
    meta: { title: '记账管理' }
  },
  {
    path: '/expenses/create',
    name: 'CreateExpense',
    component: () => import('@/views/expenses/CreateExpense.vue'),
    meta: { title: '添加账单' }
  },
  {
    path: '/community',
    name: 'Community',
    component: () => import('@/views/community/CommunityList.vue'),
    meta: { title: '旅行社区' }
  },
  {
    path: '/community/:id',
    name: 'CommunityDetail',
    component: () => import('@/views/community/CommunityDetail.vue'),
    meta: { title: '行程分享详情' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile.vue'),
    meta: { title: '个人中心' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router