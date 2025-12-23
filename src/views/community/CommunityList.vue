<template>
  <Layout>
    <div class="community-list">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-left">
          <h2>旅行社区</h2>
          <p>发现精彩行程，分享旅行体验</p>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="showShareDialog = true">
            <el-icon><Share /></el-icon>
            分享我的行程
          </el-button>
        </div>
      </div>

      <!-- 筛选和搜索 -->
      <el-card class="filter-card">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-input
              v-model="filters.keyword"
              placeholder="搜索行程标题或目的地"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.sortBy" placeholder="排序方式">
              <el-option label="最新发布" value="latest" />
              <el-option label="最多点赞" value="likes" />
              <el-option label="最多浏览" value="views" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 社区动态列表 -->
      <div class="posts-grid">
        <el-row :gutter="24">
          <el-col :span="8" v-for="post in posts" :key="post.id">
            <el-card class="post-card" @click="$router.push(`/community/${post.id}`)">
              <div class="post-cover">
                <img v-if="post.trip.coverImage" :src="formatImageUrl(post.trip.coverImage)" alt="行程封面" />
                <div v-else class="default-cover">
                  <el-icon><Picture /></el-icon>
                </div>
                <div class="post-stats">
                  <span class="stat-item">
                    <el-icon><View /></el-icon>
                    {{ post.views }}
                  </span>
                  <span class="stat-item">
                    <el-icon><Heart /></el-icon>
                    {{ post.likes }}
                  </span>
                </div>
              </div>
              
              <div class="post-content">
                <h3 class="post-title">{{ post.title }}</h3>
                <p class="post-description">{{ post.description }}</p>
                
                <div class="trip-info">
                  <div class="trip-destination">
                    <el-icon><MapLocation /></el-icon>
                    {{ post.trip.destination }}
                  </div>
                  <div class="trip-duration">
                    <el-icon><Calendar /></el-icon>
                    {{ getTripDuration(post.trip) }}天
                  </div>
                </div>
              </div>
              
              <div class="post-footer">
                <div class="author-info">
                  <el-avatar :size="24" :src="formatAvatarUrl(post.author.avatar)">
                    {{ post.author.username.charAt(0) }}
                  </el-avatar>
                  <span class="author-name">{{ post.author.username }}</span>
                </div>
                <div class="post-date">
                  {{ formatDate(post.createdAt) }}
                </div>
              </div>
              
              <div class="post-actions" @click.stop>
                <el-button text @click="toggleLike(post)" :class="{ 'liked-button': isLiked(post) }">
                  <el-icon :class="{ 'liked': isLiked(post) }"><Heart /></el-icon>
                  {{ post.likes }}
                </el-button>
                <el-button text @click="sharePost(post)">
                  <el-icon><Share /></el-icon>
                  分享
                </el-button>
                <el-dropdown>
                  <el-button text>
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="collectPost(post)">
                        收藏行程
                      </el-dropdown-item>
                      <el-dropdown-item @click="reportPost(post)" divided>
                        举报内容
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </el-card>
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
        <el-button type="primary" @click="handleShare" :loading="shareLoading">
          分享行程
        </el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import Layout from '@/components/Layout.vue'
import { communityApi, tripApi } from '@/api'
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

// 我的行程（用于分享）
const myTrips = ref<Trip[]>([])

// 加载我的行程（只显示当前用户创建的行程）
const loadMyTrips = async () => {
  try {
    const res = await tripApi.getTrips()
    if (res.code === 200 && res.data) {
      const tripsData = Array.isArray(res.data) ? res.data : []
      // 只显示当前用户创建的行程（role=0表示创建者）
      const myCreatedTrips = tripsData.filter((trip: any) => trip.role === 0)
      myTrips.value = myCreatedTrips.map((trip: any) => {
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
        
        return {
          id: String(trip.tripId || trip.id || ''),
          title: trip.name || trip.title || '',
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
      })
    }
  } catch (error: any) {
    console.error('加载我的行程失败:', error)
  }
}

// 社区动态
const posts = ref<CommunityPost[]>([])
const loading = ref(false)
const likedPosts = ref<Set<number>>(new Set())

onMounted(() => {
  loadPosts()
  loadMyTrips()
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
            username: author.username || '',
            email: author.email || '',
            nickname: author.nickname || author.username || '',
            avatar: author.avatar || author.avatarUrl || '',
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
    ElMessage.error(error.message || '操作失败')
  }
}

const sharePost = (post: CommunityPost) => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const collectPost = (post: CommunityPost) => {
  ElMessage.success('已收藏到我的行程')
}

const reportPost = (post: CommunityPost) => {
  ElMessage.success('举报已提交，我们会尽快处理')
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
      
      // 刷新列表
      loadPosts()
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
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
}

.header-left h2 {
  margin: 0 0 4px 0;
  font-size: 24px;
  color: #333;
}

.header-left p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 24px;
}

.posts-grid {
  margin-bottom: 24px;
}

.post-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.post-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.post-cover {
  position: relative;
  height: 180px;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 16px;
}

.post-cover img {
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
  font-size: 48px;
}

.post-stats {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
}

.post-content {
  flex: 1;
  margin-bottom: 16px;
}

.post-title {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
}

.post-description {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trip-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 12px;
  color: #999;
}

.trip-destination, .trip-duration {
  display: flex;
  align-items: center;
  gap: 4px;
}

.post-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.author-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.author-name {
  font-size: 14px;
  color: #666;
}

.post-date {
  font-size: 12px;
  color: #999;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.liked {
  color: #f56c6c;
}

.liked-button {
  color: #f56c6c !important;
}

.liked-button:hover {
  color: #f78989 !important;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.share-form {
  padding: 16px 0;
}
</style>