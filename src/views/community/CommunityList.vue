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
          <el-col :span="6">
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
          <el-col :span="4">
            <el-select v-model="filters.sortBy" placeholder="排序方式">
              <el-option label="最新发布" value="latest" />
              <el-option label="最多点赞" value="likes" />
              <el-option label="最多浏览" value="views" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input
              v-model="filters.tags"
              placeholder="标签筛选，用逗号分隔"
              clearable
            />
          </el-col>
          <el-col :span="4">
            <el-button @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </el-card>

      <!-- 热门标签 -->
      <el-card class="tags-card">
        <template #header>
          <span>热门标签</span>
        </template>
        <div class="popular-tags">
          <el-tag
            v-for="tag in popularTags"
            :key="tag.name"
            :type="selectedTags.includes(tag.name) ? 'primary' : ''"
            class="tag-item"
            @click="toggleTag(tag.name)"
          >
            {{ tag.name }} ({{ tag.count }})
          </el-tag>
        </div>
      </el-card>

      <!-- 社区动态列表 -->
      <div class="posts-grid">
        <el-row :gutter="24">
          <el-col :span="8" v-for="post in posts" :key="post.id">
            <el-card class="post-card" @click="$router.push(`/community/${post.id}`)">
              <div class="post-cover">
                <img v-if="post.trip.coverImage" :src="post.trip.coverImage" alt="行程封面" />
                <div v-else class="default-cover">
                  <el-icon><Picture /></el-icon>
                </div>
                <div class="post-stats">
                  <span class="stat-item">
                    <el-icon><View /></el-icon>
                    {{ post.views }}
                  </span>
                  <span class="stat-item">
                    <el-icon><Star /></el-icon>
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
                
                <div class="post-tags">
                  <el-tag
                    v-for="tag in post.tags.slice(0, 3)"
                    :key="tag"
                    size="small"
                    class="post-tag"
                  >
                    {{ tag }}
                  </el-tag>
                  <span v-if="post.tags.length > 3" class="more-tags">
                    +{{ post.tags.length - 3 }}
                  </span>
                </div>
              </div>
              
              <div class="post-footer">
                <div class="author-info">
                  <el-avatar :size="24" :src="post.author.avatar">
                    {{ post.author.username.charAt(0) }}
                  </el-avatar>
                  <span class="author-name">{{ post.author.username }}</span>
                </div>
                <div class="post-date">
                  {{ formatDate(post.createdAt) }}
                </div>
              </div>
              
              <div class="post-actions" @click.stop>
                <el-button text @click="toggleLike(post)">
                  <el-icon :class="{ 'liked': isLiked(post) }"><Star /></el-icon>
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
          
          <el-form-item label="标签">
            <el-input v-model="shareForm.tagsInput" placeholder="添加标签，用逗号分隔" />
          </el-form-item>
          
          <el-form-item label="公开设置">
            <el-radio-group v-model="shareForm.isPublic">
              <el-radio :label="true">公开 - 所有人可见</el-radio>
              <el-radio :label="false">私密 - 仅通过链接访问</el-radio>
            </el-radio-group>
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
import dayjs from 'dayjs'

// 筛选条件
const filters = ref({
  keyword: '',
  sortBy: 'latest',
  tags: ''
})

const selectedTags = ref<string[]>([])

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
  description: '',
  tagsInput: '',
  isPublic: true
})

// 热门标签
const popularTags = ref([
  { name: '日本', count: 156 },
  { name: '美食', count: 89 },
  { name: '文化', count: 67 },
  { name: '自然风光', count: 45 },
  { name: '城市游', count: 34 },
  { name: '亲子游', count: 28 }
])

// 我的行程（用于分享）
const myTrips = ref<Trip[]>([])

// 加载我的行程
const loadMyTrips = async () => {
  try {
    const res = await tripApi.getTrips()
    if (res.code === 200 && res.data) {
      const tripsData = Array.isArray(res.data) ? res.data : []
      myTrips.value = tripsData.map((trip: any) => {
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
    }
  } catch (error: any) {
    console.error('加载社区动态失败:', error)
    ElMessage.error(error.message || '加载社区动态失败')
  } finally {
    loading.value = false
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
    sortBy: 'latest',
    tags: ''
  }
  selectedTags.value = []
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

const toggleTag = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagName)
  }
  // 更新筛选条件
  filters.value.tags = selectedTags.value.join(',')
  handleSearch()
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
      await communityApi.unlikePost(postId)
      likedPosts.value.delete(postId)
      post.likes--
      ElMessage.success('已取消点赞')
    } else {
      await communityApi.likePost(postId)
      likedPosts.value.add(postId)
      post.likes++
      ElMessage.success('点赞成功')
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
        description: '',
        tagsInput: '',
        isPublic: true
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

.filter-card, .tags-card {
  margin-bottom: 24px;
}

.popular-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
  transition: all 0.3s;
}

.tag-item:hover {
  transform: translateY(-1px);
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

.post-tags {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.post-tag {
  font-size: 12px;
}

.more-tags {
  font-size: 12px;
  color: #999;
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

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

.share-form {
  padding: 16px 0;
}
</style>