<template>
  <Layout>
    <div class="community-list">
      <!-- 筛选和搜索 -->
      <el-card class="filter-card-modern" shadow="hover">
        <el-row :gutter="16">
          <el-col :span="10">
            <div class="filter-item">
              <label class="filter-label">搜索</label>
              <el-input
                v-model="filters.keyword"
                placeholder="搜索行程标题或目的地"
                clearable
                class="filter-input"
                @keyup.enter="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="filter-item">
              <label class="filter-label">排序</label>
              <el-select v-model="filters.sortBy" placeholder="排序方式" class="filter-select">
                <el-option label="最新发布" value="latest" />
                <el-option label="最多点赞" value="likes" />
                <el-option label="最多浏览" value="views" />
              </el-select>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="filter-item">
              <label class="filter-label">&nbsp;</label>
              <div class="filter-actions">
                <el-button type="primary" @click="handleSearch" class="action-btn">
                  <el-icon><Search /></el-icon>
                  搜索
                </el-button>
                <el-button @click="resetFilters" class="action-btn">
                  重置
                </el-button>
                <el-button type="primary" @click="handleShareButtonClick" class="share-btn">
                  <el-icon><Share /></el-icon>
                  分享行程
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 社区动态列表 -->
      <div class="posts-grid" v-loading="loading">
        <el-empty v-if="!loading && posts.length === 0" description="暂无社区动态" :image-size="120" />
        <el-row :gutter="24" v-else>
          <el-col :span="8" v-for="post in posts" :key="post.id">
            <div class="post-card-modern" @click="$router.push(`/community/${post.id}`)">
              <div class="post-cover-modern">
                <img v-if="post.trip.coverImage" :src="formatImageUrl(post.trip.coverImage)" alt="行程封面" class="cover-image" />
                <div v-else class="default-cover-modern">
                  <el-icon><Picture /></el-icon>
                  <span>暂无封面</span>
                </div>
                <div class="post-overlay">
                  <div class="post-stats-modern">
                    <span class="stat-item-modern">
                      <el-icon><View /></el-icon>
                      {{ post.views }}
                    </span>
                    <span class="stat-item-modern">
                      <el-icon><Heart /></el-icon>
                      {{ post.likes }}
                    </span>
                  </div>
                </div>
                <div class="post-gradient"></div>
              </div>
              
              <div class="post-content-modern">
                <h3 class="post-title-modern">{{ post.title }}</h3>
                <p class="post-description-modern">{{ post.description || '暂无描述' }}</p>
                
                <div class="trip-info-modern">
                  <div class="trip-info-item">
                    <el-icon class="info-icon"><MapLocation /></el-icon>
                    <span class="info-text">{{ post.trip.destination || '未设置目的地' }}</span>
                  </div>
                  <div class="trip-info-item">
                    <el-icon class="info-icon"><Calendar /></el-icon>
                    <span class="info-text">{{ getTripDuration(post.trip) }}天</span>
                  </div>
                </div>
              </div>
              
              <div class="post-footer-modern">
                <div class="author-info-modern">
                  <el-avatar :size="32" :src="formatAvatarUrl(post.author.avatarUrl || post.author.avatar)" class="author-avatar">
                    {{ (post.author.username || post.author.nickname || 'U').charAt(0) }}
                  </el-avatar>
                  <div class="author-details">
                    <div class="author-name-modern">{{ post.author.username || '未知用户' }}</div>
                    <div class="post-date-modern">{{ formatDate(post.createdAt) }}</div>
                  </div>
                </div>
              </div>
              
              <div class="post-actions-modern" @click.stop>
                <el-button 
                  text 
                  @click="toggleLike(post)" 
                  :class="{ 'liked-button-modern': isLiked(post) }"
                  class="action-btn-modern"
                >
                  <el-icon :class="{ 'liked-icon': isLiked(post) }"><Heart /></el-icon>
                  <span>喜欢</span>
                </el-button>
                <el-button text @click="collectPost(post)" class="action-btn-modern">
                  <el-icon><Star /></el-icon>
                  <span>收藏</span>
                </el-button>
                <el-button text @click="sharePost(post)" class="action-btn-modern">
                  <el-icon><Share /></el-icon>
                  <span>分享</span>
                </el-button>
                <el-button text @click="reportPost(post)" class="action-btn-modern report-btn">
                  <el-icon><Warning /></el-icon>
                  <span>举报</span>
                </el-button>
                <!-- 编辑按钮（仅作者可见） -->
                <el-button 
                  v-if="isPostAuthor(post)" 
                  text 
                  @click="editPost(post)" 
                  class="action-btn-modern edit-btn"
                >
                  <el-icon><Edit /></el-icon>
                  <span>编辑</span>
                </el-button>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 分享行程对话框 -->
    <el-dialog v-model="showShareDialog" title="分享我的行程" width="600px">
      <div class="share-form">
        <el-form :model="shareForm" label-width="100px">
          <el-form-item label="选择行程">
            <el-select v-model="shareForm.tripId" placeholder="选择要分享的行程" style="width: 100%">
              <el-option
                v-for="trip in myTrips"
                :key="trip.id"
                :label="trip.title"
                :value="trip.id"
              />
            </el-select>
            <div v-if="myTrips.length === 0" class="no-trips-hint">
              <el-text type="info" size="small">
                <span v-if="!isLoggedIn">
                  请先登录后再分享行程。
                </span>
                <span v-else>
                  暂无可分享的行程。只能分享您创建的且未分享过的行程。
                </span>
              </el-text>
            </div>
          </el-form-item>
          
          <el-form-item label="分享标题">
            <el-input v-model="shareForm.title" placeholder="给你的分享起个标题" />
          </el-form-item>
          
          <el-form-item label="分享描述">
            <el-input
              v-model="shareForm.description"
              type="textarea"
              :rows="4"
              placeholder="描述一下这次旅行的亮点"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="showShareDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleShare" 
          :loading="shareLoading"
          :disabled="!isLoggedIn || myTrips.length === 0"
        >
          分享行程
        </el-button>
      </template>
    </el-dialog>
    <!-- 编辑帖子对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑帖子" width="600px">
      <div class="edit-form">
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="帖子标题">
            <el-input v-model="editForm.title" placeholder="修改帖子标题" />
          </el-form-item>
          
          <el-form-item label="帖子描述">
            <el-input
              v-model="editForm.description"
              type="textarea"
              :rows="4"
              placeholder="修改帖子描述"
            />
          </el-form-item>
        </el-form>
      </div>
      
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleEditPost" 
          :loading="editLoading"
        >
          保存修改
        </el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { communityApi, tripApi, userApi } from '@/api'
import { useUserStore } from '@/stores/user'
import type { CommunityPost, Trip } from '@/types'
import { formatAvatarUrl, formatImageUrl } from '@/utils/image'
import dayjs from 'dayjs'

// 筛选条件
const filters = ref({
  keyword: '',
  sortBy: 'latest'
})

// 分页
const pagination = ref({
  page: 1,
  pageSize: 12,
  total: 0
})

// 分享对话框
const showShareDialog = ref(false)
const shareLoading = ref(false)
const shareForm = reactive({
  tripId: '',
  title: '',
  description: ''
})

// 编辑帖子对话框
const showEditDialog = ref(false)
const editLoading = ref(false)
const editForm = reactive({
  postId: '',
  title: '',
  description: ''
})
const currentEditPost = ref<CommunityPost | null>(null)

// 我的行程（用于分享）
const myTrips = ref<Trip[]>([])
// 已分享的行程ID列表
const sharedTripIds = ref<Set<string>>(new Set())

// 加载已分享的行程ID列表
const loadSharedTripIds = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('用户未登录，跳过加载已分享行程ID')
      return
    }
    
    console.log('开始加载已分享的行程ID...')
    const res = await communityApi.getMySharedTripIds()
    console.log('已分享行程ID API响应:', res)
    
    if (res.code === 200 && res.data) {
      sharedTripIds.value = new Set(res.data.map((id: number) => String(id)))
      console.log('已分享的行程ID:', Array.from(sharedTripIds.value))
    } else {
      console.log('获取已分享行程ID失败:', res)
    }
  } catch (error: any) {
    console.error('加载已分享行程ID失败:', error)
    // 如果是401错误，说明用户未登录，不显示错误消息
    if (error.response?.status !== 401) {
      ElMessage.error('加载已分享行程失败')
    }
  }
}

// 加载我的行程（只显示当前用户创建的、未被分享过的行程）
const loadMyTrips = async () => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('用户未登录，无法加载我的行程')
      myTrips.value = []
      return
    }
    
    console.log('开始加载我的行程...')
    
    // 先加载已分享的行程ID
    await loadSharedTripIds()
    
    console.log('调用 tripApi.getTrips()...')
    const res = await tripApi.getTrips()
    console.log('tripApi.getTrips() 响应:', res)
    
    if (res.code === 200 && res.data) {
      const tripsData = Array.isArray(res.data) ? res.data : []
      console.log('原始行程数据:', tripsData)
      
      // 获取当前用户ID（需要从用户store或其他地方获取）
      // 暂时从localStorage获取，或者调用用户API
      const currentUserId = await getCurrentUserId()
      console.log('当前用户ID:', currentUserId)
      
      // 只显示当前用户创建的行程（在members中找到当前用户且role=0）
      const myCreatedTrips = tripsData.filter((trip: any) => {
        console.log(`检查行程 ${trip.tripId || trip.id}:`, trip)
        
        if (!trip.members || !Array.isArray(trip.members)) {
          console.log(`行程 ${trip.tripId || trip.id} 没有members字段或不是数组`)
          return false
        }
        
        const currentUserMember = trip.members.find((member: any) => 
          String(member.userId) === String(currentUserId)
        )
        
        if (!currentUserMember) {
          console.log(`行程 ${trip.tripId || trip.id} 中未找到当前用户`)
          return false
        }
        
        console.log(`行程 ${trip.tripId || trip.id} 中当前用户的role:`, currentUserMember.role)
        return currentUserMember.role === 0 // 0表示创建者
      })
      console.log('我创建的行程:', myCreatedTrips)
      
      const mappedTrips = myCreatedTrips.map((trip: any) => {
        const startDate = trip.startDate || trip.start_date
        const endDate = trip.endDate || trip.end_date
        const now = dayjs()
        const start = dayjs(startDate)
        const end = dayjs(endDate)
        
        let status = 'planning'
        if (startDate && endDate) {
          if (now.isAfter(end)) {
            status = 'completed'
          } else if (now.isAfter(start) && now.isBefore(end)) {
            status = 'ongoing'
          }
        }
        
        const mappedTrip = {
          id: String(trip.tripId || trip.id || trip.trip_id || ''),
          title: trip.name || trip.title || trip.tripName || '',
          description: trip.description || '',
          destination: trip.region || trip.destination || '',
          startDate: startDate ? dayjs(startDate).format('YYYY-MM-DD') : '',
          endDate: endDate ? dayjs(endDate).format('YYYY-MM-DD') : '',
          status: trip.status || status,
          coverImage: trip.coverImage || trip.coverImageUrl || '',
          createdBy: String(trip.createdBy || trip.userId || ''),
          members: trip.members || trip.participants || [],
          itinerary: trip.itinerary || trip.places || [],
          createdAt: trip.createdTime ? dayjs(trip.createdTime).format('YYYY-MM-DD') : '',
          updatedAt: trip.updatedTime ? dayjs(trip.updatedTime).format('YYYY-MM-DD') : ''
        }
        
        console.log(`映射行程 ${mappedTrip.id}:`, mappedTrip)
        return mappedTrip
      })
      
      console.log('映射后的行程:', mappedTrips)
      console.log('已分享的行程ID集合:', Array.from(sharedTripIds.value))
      
      myTrips.value = mappedTrips.filter((trip: Trip) => {
        const isShared = sharedTripIds.value.has(trip.id)
        console.log(`行程 ${trip.id} (${trip.title}) 是否已分享:`, isShared)
        return !isShared
      })
      
      console.log('最终可分享的行程数量:', myTrips.value.length)
      console.log('最终可分享的行程:', myTrips.value.map(t => ({ id: t.id, title: t.title })))
    } else {
      console.log('tripApi.getTrips() 返回失败:', res)
    }
  } catch (error: any) {
    console.error('加载我的行程失败:', error)
    // 如果是401错误，说明用户未登录，不显示错误消息
    if (error.response?.status !== 401) {
      ElMessage.error('加载我的行程失败')
    }
    myTrips.value = []
  }
}

// 获取当前用户ID的辅助函数
const getCurrentUserId = async () => {
  // 首先尝试从用户store获取
  const userStore = useUserStore()
  if (userStore.user && (userStore.user.id || userStore.user.userId)) {
    return String(userStore.user.id || userStore.user.userId)
  }
  
  // 如果store中没有，尝试调用API获取
  try {
    const res = await userApi.getCurrentUser()
    if (res.code === 200 && res.data && res.data.id) {
      return String(res.data.id)
    }
  } catch (error) {
    console.error('获取当前用户ID失败:', error)
  }
  
  return null
}

// 社区动态
const posts = ref<CommunityPost[]>([])
const loading = ref(false)
const likedPosts = ref<Set<number>>(new Set())

// 检查用户是否已登录
const isLoggedIn = computed(() => !!localStorage.getItem('token'))

onMounted(() => {
  loadPosts()
  loadMyTrips()
})

// 监听分享对话框打开，重新加载可分享行程
watch(showShareDialog, (newVal) => {
  if (newVal) {
    loadMyTrips()
  }
})

const loadPosts = async () => {
  loading.value = true
  try {
    const res = await communityApi.getFeed(pagination.value.page, pagination.value.pageSize)
    if (res.code === 200 && res.data) {
      const feedData = res.data
      const list = feedData.list || feedData.items || []
      
      // 转换后端数据格式到前端格式
      posts.value = list.map((item: any) => {
        const author = item.author || {}
        const stats = item.stats || {}
        
        return {
          id: String(item.postId || item.id || ''),
          title: item.tripName || item.title || '',
          description: item.description || '',
          tripId: String(item.tripId || ''),
          authorId: String(author.userId || author.id || ''),
          author: {
            id: String(author.userId || author.id || ''),
            username: author.username || author.nickname || '',
            email: author.email || '',
            nickname: author.nickname || author.username || '',
            avatar: author.avatar || '',
            avatarUrl: author.avatarUrl || author.avatar || '',
            createdAt: author.createdAt || ''
          },
          trip: {
            id: String(item.tripId || ''),
            title: item.tripName || '',
            destination: item.region || '',
            startDate: item.startDate ? dayjs(item.startDate).format('YYYY-MM-DD') : '',
            endDate: item.endDate ? dayjs(item.endDate).format('YYYY-MM-DD') : '',
            status: 'completed',
            description: item.description || '',
            coverImage: item.coverImages?.[0] || '',
            createdBy: String(author.userId || ''),
            members: [],
            itinerary: [],
            createdAt: item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD') : '',
            updatedAt: item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD') : ''
          },
          likes: stats.likeCount || stats.likes || 0,
          views: stats.viewCount || stats.views || 0,
          tags: item.tags || [],
          isPublic: true,
          createdAt: item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD') : '',
          updatedAt: item.createTime ? dayjs(item.createTime).format('YYYY-MM-DD') : ''
        }
      })
      
      pagination.value.total = feedData.total || list.length
      
      // 加载用户的点赞状态
      await loadLikeStatuses()
    }
  } catch (error: any) {
    console.error('加载社区动态失败:', error)
    ElMessage.error(error.message || '加载社区动态失败')
  } finally {
    loading.value = false
  }
}

// 加载用户的点赞状态和统计数据
const loadLikeStatuses = async () => {
  // 如果用户未登录，跳过点赞状态加载
  if (!isLoggedIn.value) {
    console.log('用户未登录，跳过点赞状态加载')
    return
  }
  
  try {
    const likePromises = posts.value.map(async (post) => {
      try {
        // 获取点赞状态
        const likeStatusRes = await communityApi.checkLikeStatus(Number(post.id))
        if (likeStatusRes.code === 200 && likeStatusRes.data) {
          likedPosts.value.add(Number(post.id))
        }
        
        // 获取最新的点赞数和浏览数（从Redis）
        const [likeCountRes, viewCountRes] = await Promise.all([
          communityApi.getPostLikeCount(Number(post.id)),
          communityApi.getPostStats(Number(post.id))
        ])
        
        if (likeCountRes.code === 200 && likeCountRes.data !== undefined) {
          post.likes = Number(likeCountRes.data)
        }
        
        if (viewCountRes.code === 200 && viewCountRes.data?.viewCount !== undefined) {
          post.views = viewCountRes.data.viewCount
        }
        
      } catch (error) {
        // 忽略单个帖子的状态获取失败
        console.warn(`获取帖子 ${post.id} 状态失败:`, error)
      }
    })
    
    await Promise.all(likePromises)
    console.log('Redis缓存命中 - 点赞状态和统计数据加载完成')
  } catch (error) {
    console.error('加载点赞状态和统计数据失败:', error)
  }
}

const handleSearch = async () => {
  if (filters.value.keyword) {
    try {
      const res = await communityApi.searchPosts(filters.value.keyword)
      if (res.code === 200 && res.data) {
        const searchData = res.data
        const list = searchData.list || searchData.items || []
        posts.value = list.map((item: any) => ({
          id: String(item.postId || item.id || ''),
          title: item.tripName || item.title || '',
          description: item.description || '',
          tripId: String(item.tripId || ''),
          authorId: String(item.authorId || ''),
          author: item.author || {},
          trip: item.trip || {},
          likes: item.likes || 0,
          views: item.views || 0,
          tags: item.tags || [],
          isPublic: true,
          createdAt: item.createdAt || '',
          updatedAt: item.updatedAt || ''
        }))
      }
    } catch (error: any) {
      console.error('搜索失败:', error)
      ElMessage.error(error.message || '搜索失败')
    }
  } else {
    loadPosts()
  }
}

const resetFilters = () => {
  filters.value = {
    keyword: '',
    sortBy: 'latest'
  }
  loadPosts()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadPosts()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  loadPosts()
}

const formatDate = (date: string) => {
  return dayjs(date).format('MM-DD')
}

const getTripDuration = (trip: Trip) => {
  const start = dayjs(trip.startDate)
  const end = dayjs(trip.endDate)
  return end.diff(start, 'day') + 1
}

const isLiked = (post: CommunityPost) => {
  return likedPosts.value.has(Number(post.id))
}

const toggleLike = async (post: CommunityPost) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再点赞')
    return
  }
  
  const postId = Number(post.id)
  if (isNaN(postId)) return
  
  try {
    if (isLiked(post)) {
      const res = await communityApi.unlikePost(postId)
      if (res.code === 200 && res.data) {
        likedPosts.value.delete(postId)
        post.likes = res.data.likeCount || 0
        ElMessage.success('已取消点赞')
        console.log('Redis缓存更新 - 取消点赞成功')
      }
    } else {
      const res = await communityApi.likePost(postId)
      if (res.code === 200 && res.data) {
        likedPosts.value.add(postId)
        post.likes = res.data.likeCount || 0
        ElMessage.success('点赞成功')
        console.log('Redis缓存更新 - 点赞成功')
      }
    }
  } catch (error: any) {
    console.error('点赞操作失败:', error)
    if (error.response?.status === 401) {
      ElMessage.warning('请先登录后再点赞')
    } else {
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const sharePost = (post: CommunityPost) => {
  // 复制分享链接到剪贴板
  const shareUrl = `${window.location.origin}/community/${post.id}`
  navigator.clipboard.writeText(shareUrl).then(() => {
    ElMessage.success('分享链接已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败，请手动复制链接')
  })
}

const collectPost = async (post: CommunityPost) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再收藏')
    return
  }
  
  try {
    const res = await communityApi.collectPost(Number(post.id))
    if (res.code === 200) {
      ElMessage.success('已收藏到我的行程')
    } else {
      ElMessage.error(res.message || '收藏失败')
    }
  } catch (error: any) {
    console.error('收藏失败:', error)
    ElMessage.error(error.message || '收藏失败')
  }
}

const reportPost = async (post: CommunityPost) => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再举报')
    return
  }
  
  try {
    await ElMessageBox.prompt('请输入举报原因', '举报帖子', {
      confirmButtonText: '提交举报',
      cancelButtonText: '取消',
      inputPlaceholder: '请详细描述举报原因...',
      inputType: 'textarea',
      inputValidator: (value) => {
        if (!value || value.trim().length === 0) {
          return '请输入举报原因'
        }
        if (value.trim().length < 5) {
          return '举报原因至少需要5个字符'
        }
        return true
      }
    }).then(async ({ value }) => {
      const res = await communityApi.reportPost(Number(post.id), value.trim())
      if (res.code === 200) {
        ElMessage.success('举报已提交，我们会尽快处理')
      } else {
        ElMessage.error(res.message || '举报失败')
      }
    })
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('举报失败:', error)
      ElMessage.error(error.message || '举报失败')
    }
  }
}

// 检查是否为帖子作者
const isPostAuthor = (post: CommunityPost) => {
  const userStore = useUserStore()
  const currentUserId = userStore.user?.id || userStore.user?.userId
  return currentUserId && String(currentUserId) === String(post.authorId)
}

// 编辑帖子
const editPost = (post: CommunityPost) => {
  currentEditPost.value = post
  editForm.postId = post.id
  editForm.title = post.title
  editForm.description = post.description
  showEditDialog.value = true
}

// 处理编辑帖子
const handleEditPost = async () => {
  if (!editForm.title.trim()) {
    ElMessage.warning('请填写帖子标题')
    return
  }
  
  editLoading.value = true
  
  try {
    // 调用编辑帖子API
    const res = await communityApi.updatePost(Number(editForm.postId), {
      name: editForm.title,
      description: editForm.description
    })
    
    if (res.code === 200) {
      ElMessage.success('帖子修改成功!')
      showEditDialog.value = false
      
      // 更新本地数据
      if (currentEditPost.value) {
        currentEditPost.value.title = editForm.title
        currentEditPost.value.description = editForm.description
      }
      
      // 重新加载帖子列表
      await loadPosts()
    }
  } catch (error: any) {
    console.error('编辑帖子失败:', error)
    ElMessage.error(error.message || '编辑帖子失败')
  } finally {
    editLoading.value = false
  }
}

const handleShareButtonClick = () => {
  if (!isLoggedIn.value) {
    ElMessage.warning('请先登录后再分享行程')
    return
  }
  showShareDialog.value = true
}

const handleShare = async () => {
  if (!shareForm.tripId || !shareForm.title) {
    ElMessage.warning('请填写必要信息')
    return
  }
  
  shareLoading.value = true
  
  try {
    const res = await communityApi.createPost({
      tripId: Number(shareForm.tripId),
      name: shareForm.title,
      description: shareForm.description || ''
    })
    
    if (res.code === 200) {
      ElMessage.success('行程分享成功!')
      showShareDialog.value = false
      
      // 重置表单
      Object.assign(shareForm, {
        tripId: '',
        title: '',
        description: ''
      })
      
      // 刷新列表和可分享行程
      await Promise.all([
        loadPosts(),
        loadMyTrips() // 重新加载可分享行程，排除刚分享的行程
      ])
    }
  } catch (error) {
    console.error('分享失败:', error)
  } finally {
    shareLoading.value = false
  }
}
</script>

<style scoped>
.community-list {
  max-width: 1400px;
  margin: 0 auto;
}

/* 筛选器样式 */
.filter-card-modern {
  margin-bottom: 32px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 100%);
}

.filter-card-modern :deep(.el-card__body) {
  padding: 24px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
  letter-spacing: 0.3px;
}

.filter-select, .filter-input {
  width: 100%;
}

.filter-select :deep(.el-input__wrapper),
.filter-input :deep(.el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;
}

.filter-select :deep(.el-input__wrapper:hover),
.filter-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.action-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  font-weight: 500;
}

.share-btn {
  height: 40px;
  padding: 0 20px;
  border-radius: 10px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
  transition: all 0.3s;
}

.share-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

/* 帖子卡片样式 */
.posts-grid {
  margin-bottom: 32px;
}

.post-card-modern {
  background: #ffffff;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.post-card-modern:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: rgba(102, 126, 234, 0.3);
}

.post-cover-modern {
  position: relative;
  height: 220px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s;
}

.post-card-modern:hover .cover-image {
  transform: scale(1.1);
}

.default-cover-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.6);
  font-size: 48px;
  gap: 12px;
}

.default-cover-modern span {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.post-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.3) 100%);
  pointer-events: none;
}

.post-stats-modern {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 2;
}

.stat-item-modern {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  color: #1a1d29;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.post-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, transparent 100%);
  pointer-events: none;
}

.post-content-modern {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-title-modern {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.2px;
}

.post-description-modern {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trip-info-modern {
  display: flex;
  gap: 16px;
  margin-top: 4px;
}

.trip-info-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 13px;
}

.info-icon {
  font-size: 14px;
  color: #8c8c8c;
}

.info-text {
  color: #666;
}

.post-footer-modern {
  padding: 16px 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #f8f9fa;
}

.author-info-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 600;
}

.author-details {
  flex: 1;
}

.author-name-modern {
  font-size: 14px;
  font-weight: 600;
  color: #1a1d29;
  margin-bottom: 2px;
}

.post-date-modern {
  font-size: 12px;
  color: #8c8c8c;
}

.post-actions-modern {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  padding: 12px 20px;
  background: #ffffff;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.action-btn-modern {
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.action-btn-modern:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.liked-button-modern {
  color: #f5576c !important;
}

.liked-button-modern:hover {
  background: rgba(245, 87, 108, 0.1) !important;
}

.liked-icon {
  color: #f5576c;
  animation: heartBeat 0.3s;
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 40px;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.pagination :deep(.el-pagination) {
  justify-content: center;
}

/* 对话框样式 */
.share-form {
  padding: 16px 0;
}

.no-trips-hint {
  margin-top: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(102, 126, 234, 0.05) 100%);
  border-radius: 8px;
  border-left: 3px solid #409eff;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .post-card-modern {
    margin-bottom: 24px;
  }
}

@media (max-width: 768px) {
  .filter-actions {
    flex-direction: column;
  }
  
  .action-btn, .share-btn {
    width: 100%;
  }
  
  .post-cover-modern {
    height: 180px;
  }
}
</style>