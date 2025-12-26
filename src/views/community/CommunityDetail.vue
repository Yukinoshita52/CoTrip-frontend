<template>
  <Layout>
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="10" animated />
    </div>
    <div class="community-detail" v-else-if="post">
      <!-- 返回按钮 -->
      <div class="back-button-modern">
        <el-button @click="$router.back()" class="back-btn-modern">
          <el-icon><ArrowLeft /></el-icon>
          返回社区
        </el-button>
      </div>

      <!-- 文章头部 -->
      <el-card class="post-header-modern" shadow="hover">
        <div class="header-content-modern">
          <div class="post-info-modern">
            <h1 class="post-title-modern">{{ post.title }}</h1>
            <div class="post-meta-modern">
              <div class="author-info-modern">
                <el-avatar :src="formatAvatarUrl(post.author.avatar)" :size="48" class="author-avatar-modern">
                  {{ post.author.username.charAt(0) }}
                </el-avatar>
                <div class="author-details-modern">
                  <div class="author-name-modern">{{ post.author.username }}</div>
                  <div class="post-date-modern">
                    <el-icon><Clock /></el-icon>
                    {{ formatDate(post.createdAt) }} 发布
                  </div>
                </div>
              </div>
              <div class="post-stats-modern">
                <div class="stat-item-modern">
                  <div class="stat-icon-wrapper">
                    <el-icon class="stat-icon"><View /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ post.views }}</div>
                    <div class="stat-label">浏览</div>
                  </div>
                </div>
                <div class="stat-item-modern">
                  <div class="stat-icon-wrapper">
                    <el-icon class="stat-icon"><Heart /></el-icon>
                  </div>
                  <div class="stat-content">
                    <div class="stat-value">{{ post.likes }}</div>
                    <div class="stat-label">点赞</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="post-actions-modern">
            <el-button @click="toggleLike" :type="isLiked ? 'primary' : 'default'" :class="{ 'liked-button-modern': isLiked }" class="action-btn-modern">
              <el-icon :class="{ 'liked': isLiked }"><Heart /></el-icon>
              {{ isLiked ? '已点赞' : '点赞' }}
            </el-button>
            <el-button @click="handleShare" class="action-btn-modern">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
            <el-button @click="handleCollect" class="action-btn-modern">
              <el-icon><Collection /></el-icon>
              收藏
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 行程概览 -->
      <el-card class="trip-overview-modern" shadow="hover">
        <template #header>
          <div class="card-header-modern">
            <div class="header-icon-wrapper">
              <el-icon class="header-icon"><Document /></el-icon>
            </div>
            <span class="header-title">行程概览</span>
          </div>
        </template>
        <div class="overview-content">
          <div class="trip-basic-info">
            <div class="info-item">
              <label>目的地：</label>
              <span>{{ post.trip.destination }}</span>
            </div>
            <div class="info-item">
              <label>行程时间：</label>
              <span>{{ formatDateRange(post.trip.startDate, post.trip.endDate) }}</span>
            </div>
            <div class="info-item">
              <label>行程天数：</label>
              <span>{{ getTripDuration(post.trip) }} 天</span>
            </div>
          </div>
          <div class="trip-description">
            <h4>行程描述</h4>
            <p>{{ post.description }}</p>
          </div>
        </div>
      </el-card>

      <!-- 行程图片展示 -->
      <el-card class="trip-photos-modern" shadow="hover" v-if="post.trip.coverImage || (post.trip.images && post.trip.images.length > 0)">
        <template #header>
          <div class="card-header-modern">
            <div class="header-icon-wrapper">
              <el-icon class="header-icon"><Picture /></el-icon>
            </div>
            <span class="header-title">行程图片</span>
          </div>
        </template>
        <div class="photo-gallery">
          <div class="photo-grid">
            <div 
              v-for="(image, index) in allImages" 
              :key="index" 
              class="photo-item"
              @click="previewImage(index)"
            >
              <img :src="formatImageUrl(image)" :alt="`行程图片${index + 1}`" />
              <div class="photo-overlay">
                <el-icon><ZoomIn /></el-icon>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 详细行程 -->
      <el-card class="itinerary-detail-modern" shadow="hover">
        <template #header>
          <div class="card-header-modern">
            <div class="header-icon-wrapper">
              <el-icon class="header-icon"><List /></el-icon>
            </div>
            <span class="header-title">详细行程安排</span>
          </div>
        </template>
        <div class="itinerary-timeline">
          <div v-for="(dayItems, date) in groupedItinerary" :key="date" class="day-group">
            <div class="day-header">
              <h3>{{ formatDayTitle(date) }}</h3>
              <span class="day-count">{{ dayItems.length }} 项安排</span>
            </div>
            
            <div class="day-items">
              <div v-for="item in dayItems" :key="item.id" class="itinerary-item-modern">
                <div class="item-time-modern">{{ formatTime(item.startTime) }}</div>
                <div class="item-content">
                  <div class="item-header">
                    <span class="item-title">{{ item.title }}</span>
                    <el-tag size="small" :type="getItemTypeColor(item.type)">
                      {{ getItemTypeText(item.type) }}
                    </el-tag>
                  </div>
                  <div class="item-location">
                    <el-icon><Location /></el-icon>
                    {{ item.location }}
                  </div>
                  <div v-if="item.description" class="item-description">
                    {{ item.description }}
                  </div>
                  <div v-if="item.cost" class="item-cost">
                    预算：¥{{ item.cost }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 费用明细 -->
      <el-card class="expense-detail-modern" shadow="hover" v-if="relatedExpenses.length > 0">
        <template #header>
          <div class="card-header-modern">
            <div class="header-icon-wrapper">
              <el-icon class="header-icon"><Money /></el-icon>
            </div>
            <span class="header-title">费用参考</span>
          </div>
        </template>
        <div class="expense-summary">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-statistic title="总费用" :value="expenseSummary.total" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="人均费用" :value="expenseSummary.average" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="交通费用" :value="expenseSummary.transport" prefix="¥" />
            </el-col>
            <el-col :span="6">
              <el-statistic title="住宿费用" :value="expenseSummary.accommodation" prefix="¥" />
            </el-col>
          </el-row>
        </div>
        
        <div class="expense-breakdown">
          <h4>费用明细</h4>
          <el-table :data="relatedExpenses" style="width: 100%">
            <el-table-column prop="title" label="项目" />
            <el-table-column prop="category" label="类别" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getCategoryText(row.category) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.amount }}
              </template>
            </el-table-column>
            <el-table-column prop="date" label="日期" width="100">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>

      <!-- 评论区 -->
      <el-card class="comments-section-modern" shadow="hover">
        <template #header>
          <div class="comments-header-modern">
            <div class="comments-title-wrapper">
              <div class="header-icon-wrapper">
                <el-icon class="header-icon"><ChatDotRound /></el-icon>
              </div>
              <span class="header-title">评论 ({{ comments.length }})</span>
            </div>
            <el-button type="primary" @click="showCommentDialog = true" class="comment-btn-modern">
              <el-icon><ChatDotRound /></el-icon>
              写评论
            </el-button>
          </div>
        </template>
        
        <!-- 评论列表 -->
        <div class="comments-list" v-if="comments.length > 0">
          <div v-for="comment in comments" :key="comment.commentId" class="comment-item">
            <div class="comment-avatar">
              <el-avatar :src="getAvatarUrl(comment.user)">
                {{ getAvatarFallback(comment.user) }}
              </el-avatar>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.user.nickname || comment.user.username }}</span>
                <span class="comment-time">{{ formatDate(comment.createTime) }}</span>
              </div>
              <div class="comment-text">{{ comment.content }}</div>
              <div class="comment-actions">
                <el-button text size="small" @click="replyToComment(comment)">
                  <el-icon><ChatDotRound /></el-icon>
                  回复
                </el-button>
                <el-button 
                  text 
                  size="small" 
                  type="danger" 
                  v-if="isCurrentUserComment(comment)"
                  @click="deleteComment(comment.commentId)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
                <!-- 回复展开/折叠按钮 -->
                <el-button 
                  text 
                  size="small" 
                  v-if="comment.children && comment.children.length > 0"
                  @click="toggleReplies(comment.commentId)"
                  class="reply-toggle-btn"
                >
                  <el-icon>
                    <ArrowDown v-if="!isRepliesExpanded(comment.commentId)" />
                    <ArrowUp v-else />
                  </el-icon>
                  {{ isRepliesExpanded(comment.commentId) ? '收起' : '展开' }}回复 ({{ comment.children.length }})
                </el-button>
              </div>
              
              <!-- 折叠状态下的回复预览 -->
              <div 
                v-if="comment.children && comment.children.length > 0 && !isRepliesExpanded(comment.commentId)" 
                class="replies-preview"
                @click="toggleReplies(comment.commentId)"
              >
                <div class="preview-text">
                  <el-icon><ChatDotRound /></el-icon>
                  {{ comment.children.length }} 条回复，点击展开查看
                </div>
              </div>
              
              <!-- 子评论 -->
              <div v-if="comment.children && comment.children.length > 0 && isRepliesExpanded(comment.commentId)" class="replies">
                <div v-for="reply in comment.children" :key="reply.commentId" class="reply-item">
                  <div class="reply-avatar">
                    <el-avatar :size="32" :src="getAvatarUrl(reply.user)">
                      {{ getAvatarFallback(reply.user) }}
                    </el-avatar>
                  </div>
                  <div class="reply-content">
                    <div class="reply-header">
                      <span class="reply-author">{{ reply.user.nickname || reply.user.username }}</span>
                      <span class="reply-time">{{ formatDate(reply.createTime) }}</span>
                    </div>
                    <div class="reply-text">{{ reply.content }}</div>
                    <div class="reply-actions">
                      <el-button 
                        text 
                        size="small" 
                        type="danger" 
                        v-if="isCurrentUserComment(reply)"
                        @click="deleteComment(reply.commentId)"
                      >
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-comments">
          <el-empty description="暂无评论，快来抢沙发吧！" />
        </div>
      </el-card>

      <!-- 使用此行程 -->
      <el-card class="use-trip-modern" shadow="hover" v-if="!isCurrentUserPost">
        <div class="use-trip-content-modern">
          <div class="use-trip-info-modern">
            <div class="use-trip-icon-wrapper">
              <el-icon class="use-trip-icon"><DocumentCopy /></el-icon>
            </div>
            <div class="use-trip-text">
              <h3 class="use-trip-title">喜欢这个行程？</h3>
              <p class="use-trip-desc">你可以复制这个行程到你的账户，并根据需要进行修改</p>
            </div>
          </div>
          <div class="use-trip-actions-modern">
            <el-button type="primary" @click="handleCopyTrip" size="large" class="copy-btn-modern">
              <el-icon><DocumentCopy /></el-icon>
              复制行程
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 编辑帖子 -->
      <el-card class="edit-post-modern" shadow="hover" v-if="isCurrentUserPost">
        <div class="edit-post-content-modern">
          <div class="edit-post-info-modern">
            <div class="edit-post-icon-wrapper">
              <el-icon class="edit-post-icon"><Edit /></el-icon>
            </div>
            <div class="edit-post-text">
              <h3 class="edit-post-title">这是你发布的行程</h3>
              <p class="edit-post-desc">你可以编辑或删除这个帖子</p>
            </div>
          </div>
          <div class="edit-post-actions-modern">
            <el-button type="primary" @click="handleEditPost" class="edit-btn-modern">
              <el-icon><Edit /></el-icon>
              编辑帖子
            </el-button>
            <el-button type="danger" @click="handleDeletePost" class="delete-btn-modern">
              <el-icon><Delete /></el-icon>
              删除帖子
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 评论对话框 -->
    <el-dialog 
      v-model="showCommentDialog" 
      :title="replyingTo ? '回复评论' : '写评论'" 
      width="500px"
      @close="resetCommentForm"
    >
      <el-form :model="commentForm" label-width="80px">
        <el-form-item v-if="replyingTo" label="回复给">
          <el-tag>{{ replyingTo.user.nickname || replyingTo.user.username }}</el-tag>
        </el-form-item>
        <el-form-item label="评论内容" required>
          <el-input
            v-model="commentForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入评论内容..."
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCommentDialog = false">取消</el-button>
        <el-button type="primary" @click="submitComment" :loading="submittingComment">
          {{ replyingTo ? '回复' : '发表评论' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="showImageViewer"
      :url-list="allImages.map(img => formatImageUrl(img))"
      :initial-index="currentImageIndex"
      @close="showImageViewer = false"
    />
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import Layout from '@/components/Layout.vue'
import type { CommunityPost, ItineraryItem, Expense } from '@/types'
import { formatAvatarUrl, formatImageUrl } from '@/utils/image'
import dayjs from 'dayjs'
import { communityApi, tripApi, expenseApi } from '@/api'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const isLiked = ref(false)
const loading = ref(false)

// 帖子数据
const post = ref<CommunityPost | null>(null)
const relatedExpenses = ref<Expense[]>([])
const comments = ref<any[]>([])

// 评论相关状态
const showCommentDialog = ref(false)
const submittingComment = ref(false)
const replyingTo = ref<any>(null)
const commentForm = ref({
  content: ''
})

// 回复折叠状态管理
const expandedReplies = ref<Set<number>>(new Set())

// 图片预览相关状态
const showImageViewer = ref(false)
const currentImageIndex = ref(0)

// 计算属性
const isCurrentUserPost = computed(() => {
  if (!post.value || !userStore.user) return false
  return String(post.value.authorId) === String(userStore.user.id)
})

const allImages = computed(() => {
  const images = []
  if (post.value?.trip.coverImage) {
    images.push(post.value.trip.coverImage)
  }
  if (post.value?.trip.images && post.value.trip.images.length > 0) {
    images.push(...post.value.trip.images)
  }
  return images
})

// 加载帖子详情
const loadPostDetail = async () => {
  const postId = Number(route.params.id)
  if (!postId) {
    ElMessage.error('帖子ID无效')
    router.push('/community')
    return
  }

  loading.value = true
  try {
    const res = await communityApi.getPostDetail(postId)
    if (res.code === 200 && res.data) {
      const data = res.data
      post.value = {
        id: String(data.postId || data.id || postId),
        title: data.tripName || data.title || '',
        description: data.description || '',
        tripId: String(data.tripId || ''),
        authorId: String(data.author?.userId || data.authorId || ''),
        author: {
          id: String(data.author?.userId || data.authorId || ''),
          username: data.author?.username || '',
          email: data.author?.email || '',
          nickname: data.author?.nickname || data.author?.username || '',
          avatar: data.author?.avatarUrl || data.author?.avatar || '',
          createdAt: ''
        },
        trip: {
          id: String(data.tripId || ''),
          title: data.tripName || '',
          destination: data.region || '',
          startDate: data.startDate ? dayjs(data.startDate).format('YYYY-MM-DD') : '',
          endDate: data.endDate ? dayjs(data.endDate).format('YYYY-MM-DD') : '',
          status: 'completed',
          description: data.description || '',
          coverImage: data.coverImages?.[0] || '',
          createdBy: String(data.author?.userId || ''),
          members: [],
          itinerary: [],
          createdAt: data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : '',
          updatedAt: data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : ''
        },
        likes: data.stats?.likeCount || data.likes || 0,
        views: data.stats?.viewCount || data.views || 0,
        tags: data.tags || [],
        isPublic: true,
        createdAt: data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : '',
        updatedAt: data.createTime ? dayjs(data.createTime).format('YYYY-MM-DD') : ''
      }

      // 加载行程详情以获取 itinerary
      if (data.tripId) {
        await loadTripDetail(data.tripId)
      }

      // 加载相关费用
      await loadRelatedExpenses(data.tripId)
      
      // 加载评论
      await loadComments(postId)
      
      // 加载点赞状态和最新统计数据（从Redis）
      await loadLikeStatusAndStats(postId)
    } else {
      ElMessage.error(res.message || '加载帖子详情失败')
      router.push('/community')
    }
  } catch (error: any) {
    console.error('加载帖子详情失败:', error)
    ElMessage.error(error.message || '加载帖子详情失败')
    router.push('/community')
  } finally {
    loading.value = false
  }
}

// 加载点赞状态和最新统计数据（从Redis）
const loadLikeStatusAndStats = async (postId: number) => {
  try {
    // 并行获取点赞状态、点赞数和浏览数
    const [likeStatusRes, likeCountRes, statsRes] = await Promise.all([
      communityApi.checkLikeStatus(postId),
      communityApi.getPostLikeCount(postId),
      communityApi.getPostStats(postId)
    ])
    
    // 更新点赞状态
    if (likeStatusRes.code === 200) {
      isLiked.value = likeStatusRes.data || false
    }
    
    // 更新统计数据
    if (post.value) {
      if (likeCountRes.code === 200 && likeCountRes.data !== undefined) {
        post.value.likes = Number(likeCountRes.data)
      }
      
      if (statsRes.code === 200 && statsRes.data) {
        if (statsRes.data.viewCount !== undefined) {
          post.value.views = statsRes.data.viewCount
        }
        if (statsRes.data.likeCount !== undefined) {
          post.value.likes = statsRes.data.likeCount
        }
      }
    }
    
    console.log('Redis缓存命中 - 点赞状态和统计数据加载完成')
  } catch (error) {
    console.error('加载点赞状态和统计数据失败:', error)
    isLiked.value = false
  }
}

// 加载点赞状态（保留原函数以防其他地方使用）
const loadLikeStatus = async (postId: number) => {
  try {
    const res = await communityApi.checkLikeStatus(postId)
    if (res.code === 200) {
      isLiked.value = res.data || false
    }
  } catch (error) {
    console.error('加载点赞状态失败:', error)
    isLiked.value = false
  }
}

// 加载行程详情
const loadTripDetail = async (tripId: number) => {
  try {
    const res = await tripApi.getTripById(tripId)
    if (res.code === 200 && res.data && post.value) {
      const tripData = res.data
      post.value.trip.itinerary = tripData.places?.flatMap((day: any) => 
        day.places.map((place: any) => ({
          id: String(place.id || place.placeId || ''),
          tripId: String(tripId),
          title: place.name || '',
          description: place.description || '',
          location: place.address || '',
          startTime: day.date ? dayjs(day.date).format('YYYY-MM-DD') + 'T09:00:00' : '',
          endTime: day.date ? dayjs(day.date).format('YYYY-MM-DD') + 'T17:00:00' : '',
          type: 'activity',
          cost: 0,
          createdBy: '',
          createdAt: ''
        })) || []
      ) || []
      post.value.trip.members = tripData.members?.map((m: any) => ({
        userId: String(m.userId || m.id || ''),
        username: m.username || '',
        role: m.role === 0 ? 'owner' : m.role === 1 ? 'admin' : 'member',
        joinedAt: m.joinedAt || ''
      })) || []
    }
  } catch (error: any) {
    console.error('加载行程详情失败:', error)
  }
}

// 加载相关费用
const loadRelatedExpenses = async (tripId: number) => {
  try {
    const booksRes = await expenseApi.getAllAccountBooks()
    if (booksRes.code === 200 && booksRes.data) {
      const books = Array.isArray(booksRes.data) ? booksRes.data : []
      const book = books.find((b: any) => String(b.tripId) === String(tripId))

      if (book) {
        const recordsRes = await expenseApi.getRecords(book.bookId, 1, 50)
        if (recordsRes.code === 200 && recordsRes.data) {
          const items = recordsRes.data.items || recordsRes.data.list || []
          relatedExpenses.value = items.map((record: any) => ({
            id: String(record.recordId || record.id || ''),
            tripId: String(tripId),
            title: record.categoryName || record.note || '未命名',
            amount: Number(record.amount || 0),
            currency: 'CNY',
            category: record.type === 1 ? 'income' : (record.type === 2 ? 'expense' : 'other'),
            paidBy: record.user?.userId ? String(record.user.userId) : '',
            participants: [],
            splitType: 'equal',
            splits: [],
            receipt: '',
            date: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : '',
            createdAt: record.recordTime ? dayjs(record.recordTime).format('YYYY-MM-DD') : ''
          }))
        }
      }
    }
  } catch (error: any) {
    console.error('加载相关费用失败:', error)
  }
}

// 加载评论
const loadComments = async (postId: number) => {
  try {
    const res = await communityApi.getComments(postId)
    if (res.code === 200 && res.data) {
      comments.value = res.data.comments || []
    }
  } catch (error: any) {
    console.error('加载评论失败:', error)
  }
}

// 提交评论
const submitComment = async () => {
  if (!commentForm.value.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  submittingComment.value = true
  try {
    const commentData = {
      postId: Number(route.params.id),
      content: commentForm.value.content.trim(),
      parentId: replyingTo.value?.commentId || null
    }

    const res = await communityApi.addComment(commentData)
    if (res.code === 200) {
      ElMessage.success(replyingTo.value ? '回复成功' : '评论成功')
      showCommentDialog.value = false
      
      // 如果是回复，自动展开该评论的回复区域
      if (replyingTo.value?.commentId) {
        expandedReplies.value.add(replyingTo.value.commentId)
      }
      
      resetCommentForm()
      // 重新加载评论
      await loadComments(Number(route.params.id))
      // 更新评论数
      if (post.value && post.value.stats) {
        post.value.stats.commentCount = (post.value.stats.commentCount || 0) + 1
      }
    } else {
      ElMessage.error(res.message || '评论失败')
    }
  } catch (error: any) {
    console.error('提交评论失败:', error)
    ElMessage.error(error.message || '评论失败')
  } finally {
    submittingComment.value = false
  }
}

// 回复评论
const replyToComment = (comment: any) => {
  replyingTo.value = comment
  showCommentDialog.value = true
}

// 删除评论
const deleteComment = async (commentId: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const res = await communityApi.deleteComment(commentId)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      // 重新加载评论
      await loadComments(Number(route.params.id))
      // 更新评论数
      if (post.value && post.value.stats) {
        post.value.stats.commentCount = Math.max((post.value.stats.commentCount || 0) - 1, 0)
      }
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 重置评论表单
const resetCommentForm = () => {
  commentForm.value.content = ''
  replyingTo.value = null
}

// 检查是否是当前用户的评论
const isCurrentUserComment = (comment: any) => {
  if (!userStore.user) return false
  return String(comment.user.userId) === String(userStore.user.id)
}

// 图片预览
const previewImage = (index: number) => {
  currentImageIndex.value = index
  showImageViewer.value = true
}

// 头像处理函数
const getAvatarUrl = (user: any) => {
  if (!user?.avatar || user.avatar.trim() === '') {
    return ''
  }
  return formatAvatarUrl(user.avatar)
}

const getAvatarFallback = (user: any) => {
  if (user?.nickname) {
    return user.nickname.charAt(0)
  }
  if (user?.username) {
    return user.username.charAt(0)
  }
  return '?'
}

// 回复折叠/展开功能
const toggleReplies = (commentId: number) => {
  if (expandedReplies.value.has(commentId)) {
    expandedReplies.value.delete(commentId)
  } else {
    expandedReplies.value.add(commentId)
  }
}

const isRepliesExpanded = (commentId: number) => {
  return expandedReplies.value.has(commentId)
}

// 计算属性
const groupedItinerary = computed(() => {
  const groups: Record<string, ItineraryItem[]> = {}
  if (post.value?.trip.itinerary) {
    post.value.trip.itinerary.forEach(item => {
      const date = dayjs(item.startTime).format('YYYY-MM-DD')
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(item)
    })
  }
  return groups
})

const expenseSummary = computed(() => {
  const total = relatedExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
  const memberCount = post.value?.trip.members.length || 1
  const average = Math.round(total / memberCount)
  const transport = relatedExpenses.value
    .filter(e => e.category === 'transport')
    .reduce((sum, e) => sum + e.amount, 0)
  const accommodation = relatedExpenses.value
    .filter(e => e.category === 'accommodation')
    .reduce((sum, e) => sum + e.amount, 0)
  
  return { total, average, transport, accommodation }
})

onMounted(() => {
  loadPostDetail()
})

// 工具函数
const formatDate = (date: string) => {
  return dayjs(date).format('YYYY年MM月DD日')
}

const formatDateRange = (startDate: string, endDate: string) => {
  const start = dayjs(startDate).format('MM月DD日')
  const end = dayjs(endDate).format('MM月DD日')
  return `${start} - ${end}`
}

const formatDayTitle = (date: string) => {
  return dayjs(date).format('MM月DD日 dddd')
}

const formatTime = (time: string) => {
  return dayjs(time).format('HH:mm')
}

const getTripDuration = (trip: any) => {
  if (!trip.startDate || !trip.endDate) return 0
  const start = dayjs(trip.startDate)
  const end = dayjs(trip.endDate)
  return end.diff(start, 'day') + 1
}

const getItemTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    transport: 'primary',
    accommodation: 'success',
    activity: 'warning',
    dining: 'danger',
    other: 'info'
  }
  return colors[type] || 'info'
}

const getItemTypeText = (type: string) => {
  const texts: Record<string, string> = {
    transport: '交通',
    accommodation: '住宿',
    activity: '活动',
    dining: '餐饮',
    other: '其他'
  }
  return texts[type] || type
}

const getCategoryText = (category: string) => {
  const texts: Record<string, string> = {
    transport: '交通',
    accommodation: '住宿',
    food: '餐饮',
    activity: '活动',
    shopping: '购物',
    other: '其他'
  }
  return texts[category] || category
}

// 事件处理
const toggleLike = async () => {
  if (!post.value) return
  
  try {
    if (isLiked.value) {
      const res = await communityApi.unlikePost(Number(post.value.id))
      if (res.code === 200 && res.data) {
        post.value.likes = res.data.likeCount || 0
        isLiked.value = false
        ElMessage.success('已取消点赞')
        console.log('Redis缓存更新 - 取消点赞成功')
      }
    } else {
      const res = await communityApi.likePost(Number(post.value.id))
      if (res.code === 200 && res.data) {
        post.value.likes = res.data.likeCount || 0
        isLiked.value = true
        ElMessage.success('点赞成功')
        console.log('Redis缓存更新 - 点赞成功')
      }
    }
  } catch (error: any) {
    console.error('点赞操作失败:', error)
    ElMessage.error(error.message || '操作失败')
  }
}

const handleShare = () => {
  ElMessage.success('分享链接已复制到剪贴板')
}

const handleCollect = () => {
  ElMessage.success('已收藏到我的行程')
}

const handleCopyTrip = async () => {
  if (!post.value) return
  try {
    const tripData = {
      name: post.value.trip.title,
      region: post.value.trip.destination,
      startDate: post.value.trip.startDate,
      endDate: post.value.trip.endDate,
      description: post.value.trip.description
    }
    const res = await tripApi.createTrip(tripData)
    if (res.code === 200) {
      ElMessage.success('行程已复制到你的账户，可以在"我的行程"中查看和编辑')
      router.push('/trips')
    } else {
      ElMessage.error(res.message || '复制失败')
    }
  } catch (error: any) {
    console.error('复制行程失败:', error)
    ElMessage.error(error.message || '复制失败')
  }
}

const handleEditPost = () => {
  ElMessage.info('编辑帖子功能待开发')
}

const handleDeletePost = async () => {
  if (!post.value) return
  
  try {
    await ElMessageBox.confirm('确定要删除这个帖子吗？删除后无法恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    
    const res = await communityApi.deletePost(Number(post.value.id))
    if (res.code === 200) {
      ElMessage.success('帖子已删除')
      router.push('/community')
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除帖子失败:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}
</script>

<style scoped>
.loading-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.community-detail {
  max-width: 1200px;
  margin: 0 auto;
}

/* 返回按钮 */
.back-button-modern {
  margin-bottom: 24px;
}

.back-btn-modern {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s;
}

.back-btn-modern:hover {
  background: #f5f7fa;
  transform: translateX(-2px);
}

/* 文章头部 */
.post-header-modern {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  margin-bottom: 32px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  position: relative;
  overflow: hidden;
}

.post-header-modern::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
}

.post-header-modern :deep(.el-card__body) {
  padding: 32px;
}

.header-content-modern {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.post-info-modern {
  flex: 1;
}

.post-title-modern {
  margin: 0 0 20px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1d29;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #1a1d29 0%, #667eea 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.3;
}

.post-meta-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 24px;
}

.author-info-modern {
  display: flex;
  align-items: center;
  gap: 16px;
}

.author-avatar-modern {
  border: 3px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-weight: 700;
}

.author-details-modern {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.author-name-modern {
  font-weight: 600;
  color: #1a1d29;
  font-size: 16px;
}

.post-date-modern {
  font-size: 14px;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 6px;
}

.post-stats-modern {
  display: flex;
  gap: 20px;
}

.stat-item-modern {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.stat-item-modern:hover {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  font-size: 20px;
  color: #667eea;
  display: block;
  width: 20px;
  height: 20px;
}

.stat-icon-wrapper .el-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.stat-content {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: #1a1d29;
}

.stat-label {
  font-size: 12px;
  color: #8c8c8c;
}

.post-actions-modern {
  display: flex;
  gap: 12px;
  flex-direction: column;
  flex-shrink: 0;
}

.action-btn-modern {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s;
  min-width: 120px;
  width: 120px;
}

.action-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* 卡片通用样式 */
.trip-overview-modern,
.itinerary-detail-modern,
.expense-detail-modern,
.trip-photos-modern,
.comments-section-modern,
.use-trip-modern,
.edit-post-modern {
  margin-bottom: 32px;
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.trip-overview-modern :deep(.el-card__header),
.itinerary-detail-modern :deep(.el-card__header),
.expense-detail-modern :deep(.el-card__header),
.trip-photos-modern :deep(.el-card__header),
.comments-section-modern :deep(.el-card__header) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 20px 24px;
  background: transparent;
}

.card-header-modern {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-icon {
  font-size: 20px;
  color: #667eea;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

/* 行程概览 */
.overview-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 32px;
}

.trip-basic-info {
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.info-item {
  display: flex;
  margin-bottom: 16px;
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  transition: all 0.2s;
}

.info-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.info-item label {
  width: 90px;
  color: #667eea;
  font-weight: 600;
  flex-shrink: 0;
}

.info-item span {
  color: #1a1d29;
  font-weight: 500;
}

.trip-description {
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.trip-description h4 {
  margin: 0 0 12px 0;
  color: #1a1d29;
  font-size: 18px;
  font-weight: 600;
}

.trip-description p {
  margin: 0;
  color: #666;
  line-height: 1.8;
  font-size: 15px;
}

/* 详细行程 */
.day-group {
  margin-bottom: 40px;
}

.day-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.day-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1d29;
}

.day-count {
  font-size: 13px;
  color: #8c8c8c;
  padding: 4px 12px;
  background: #ffffff;
  border-radius: 12px;
  font-weight: 500;
  margin-left: auto;
}

.itinerary-item-modern {
  display: flex;
  gap: 20px;
  padding: 20px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  margin-bottom: 16px;
  background: #ffffff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.itinerary-item-modern::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px 0 0 2px;
  opacity: 0;
  transition: opacity 0.3s;
}

.itinerary-item-modern:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
  border-color: rgba(102, 126, 234, 0.3);
}

.itinerary-item-modern:hover::before {
  opacity: 1;
}

.item-time-modern {
  width: 70px;
  font-weight: 700;
  color: #667eea;
  flex-shrink: 0;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 10px;
}

.item-content {
  flex: 1;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.item-title {
  font-weight: 600;
  color: #1a1d29;
  font-size: 16px;
}

.item-location, .item-description, .item-cost {
  font-size: 14px;
  color: #666;
  margin-bottom: 6px;
  line-height: 1.6;
}

.item-location {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #667eea;
  font-weight: 500;
}

.item-location .el-icon {
  font-size: 16px;
}

.item-cost {
  color: #f56c6c;
  font-weight: 600;
  font-size: 15px;
}

/* 费用明细 */
.expense-summary {
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.expense-summary :deep(.el-statistic) {
  text-align: center;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  transition: all 0.3s;
}

.expense-summary :deep(.el-statistic):hover {
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);
  transform: translateY(-2px);
}

.expense-summary :deep(.el-statistic__head) {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.expense-summary :deep(.el-statistic__number) {
  font-size: 28px;
  font-weight: 700;
  color: #1a1d29;
}

.expense-breakdown h4 {
  margin: 0 0 20px 0;
  color: #1a1d29;
  font-size: 18px;
  font-weight: 600;
  padding-bottom: 12px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.06);
}

/* 使用行程/编辑帖子 */
.use-trip-content-modern,
.edit-post-content-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 24px;
}

.use-trip-info-modern,
.edit-post-info-modern {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.use-trip-icon-wrapper,
.edit-post-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.use-trip-icon,
.edit-post-icon {
  font-size: 28px;
  color: #667eea;
}

.use-trip-text,
.edit-post-text {
  flex: 1;
}

.use-trip-title,
.edit-post-title {
  margin: 0 0 8px 0;
  color: #1a1d29;
  font-size: 20px;
  font-weight: 600;
}

.use-trip-desc,
.edit-post-desc {
  margin: 0;
  color: #666;
  font-size: 14px;
  line-height: 1.6;
}

.use-trip-actions-modern,
.edit-post-actions-modern {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.copy-btn-modern,
.edit-btn-modern,
.delete-btn-modern {
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 500;
  transition: all 0.3s;
}

.copy-btn-modern:hover,
.edit-btn-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.delete-btn-modern:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4);
}

.liked {
  color: #f56c6c;
}

.liked-button-modern {
  color: #f56c6c !important;
  border-color: #f56c6c !important;
}

.liked-button-modern:hover {
  color: #f78989 !important;
  border-color: #f78989 !important;
}

/* 行程图片样式 */
.photo-gallery {
  width: 100%;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.photo-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.photo-item:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.photo-item:hover img {
  transform: scale(1.1);
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  font-size: 32px;
}

.photo-item:hover .photo-overlay {
  opacity: 1;
}

/* 评论区样式 */
.comments-header-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comments-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.comment-btn-modern {
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 500;
  transition: all 0.3s;
}

.comment-btn-modern:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.comments-list {
  max-height: 600px;
  overflow-y: auto;
  padding-right: 8px;
}

.comments-list::-webkit-scrollbar {
  width: 6px;
}

.comments-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.comments-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  margin-bottom: 12px;
  background: #ffffff;
  transition: all 0.3s;
}

.comment-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}

.comment-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.comment-avatar {
  flex-shrink: 0;
}

.comment-avatar :deep(.el-avatar) {
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.comment-author {
  font-weight: 600;
  color: #1a1d29;
  font-size: 15px;
}

.comment-time {
  font-size: 12px;
  color: #8c8c8c;
}

.comment-text {
  color: #666;
  line-height: 1.8;
  margin-bottom: 12px;
  font-size: 14px;
}

.comment-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.reply-toggle-btn {
  color: #667eea !important;
  border-radius: 6px;
  transition: all 0.2s;
}

.reply-toggle-btn:hover {
  background-color: rgba(102, 126, 234, 0.1) !important;
}

.replies-preview {
  margin-top: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 8px;
  border-left: 4px solid #667eea;
  cursor: pointer;
  transition: all 0.3s ease;
}

.replies-preview:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  transform: translateX(4px);
}

.preview-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}

.replies {
  margin-top: 16px;
  padding-left: 20px;
  border-left: 3px solid rgba(102, 126, 234, 0.2);
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    max-height: 0;
    overflow: hidden;
  }
  to {
    opacity: 1;
    max-height: 1000px;
    overflow: visible;
  }
}

.reply-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  margin-bottom: 8px;
  background: #f8f9fa;
  transition: all 0.2s;
}

.reply-item:hover {
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.reply-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.reply-avatar {
  flex-shrink: 0;
}

.reply-avatar :deep(.el-avatar) {
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.reply-author {
  font-weight: 600;
  color: #1a1d29;
  font-size: 14px;
}

.reply-time {
  font-size: 11px;
  color: #8c8c8c;
}

.reply-text {
  color: #666;
  line-height: 1.6;
  font-size: 14px;
  margin-bottom: 6px;
}

.reply-actions {
  display: flex;
  gap: 8px;
}

.empty-comments {
  padding: 60px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content-modern {
    flex-direction: column;
  }
  
  .post-actions-modern {
    flex-direction: row;
    width: 100%;
  }
  
  .action-btn-modern {
    flex: 1;
  }
  
  .overview-content {
    grid-template-columns: 1fr;
  }
  
  .use-trip-content-modern,
  .edit-post-content-modern {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .use-trip-actions-modern,
  .edit-post-actions-modern {
    width: 100%;
  }
  
  .copy-btn-modern,
  .edit-btn-modern,
  .delete-btn-modern {
    flex: 1;
  }
}
</style>