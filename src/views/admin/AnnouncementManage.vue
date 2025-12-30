<template>
  <Layout>
    <div class="announcement-manage">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon-wrapper">
            <el-icon class="header-icon"><Document /></el-icon>
          </div>
          <div class="header-text">
            <h2 class="page-title">公告管理</h2>
            <p class="page-subtitle">管理系统公告，向用户发布重要信息</p>
          </div>
        </div>
        <el-button 
          type="primary" 
          @click="showCreateDialog = true"
          class="create-button"
          size="large"
        >
          <el-icon><Plus /></el-icon>
          <span>发布公告</span>
        </el-button>
      </div>

      <!-- 公告列表卡片 -->
      <el-card class="announcement-card" shadow="never">
        <el-table 
          :data="announcements" 
          v-loading="loading" 
          class="announcement-table"
          :empty-text="emptyText"
        >
          <el-table-column prop="title" label="标题" min-width="250">
            <template #default="{ row }">
              <div class="title-cell">
                <el-icon class="title-icon"><Document /></el-icon>
                <span class="title-text">{{ row.title }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="content" label="内容" min-width="300" show-overflow-tooltip>
            <template #default="{ row }">
              <div class="content-cell">
                {{ row.content }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="publishTime" label="发布时间" width="200">
            <template #default="{ row }">
              <div class="time-cell">
                <el-icon class="time-icon"><Clock /></el-icon>
                <span>{{ formatDate(row) }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button 
                  size="small" 
                  @click="editAnnouncement(row)"
                  class="action-btn edit-btn"
                  :icon="Edit"
                >
                  编辑
                </el-button>
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="deleteAnnouncement(row.id)"
                  class="action-btn delete-btn"
                  :icon="Delete"
                >
                  删除
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 创建/编辑对话框 -->
      <el-dialog
        v-model="showCreateDialog"
        :title="editingId ? '编辑公告' : '发布公告'"
        width="700px"
        class="announcement-dialog"
        :close-on-click-modal="false"
      >
        <template #header="{ titleId, titleClass }">
          <div class="dialog-header">
            <div class="dialog-icon-wrapper">
              <el-icon class="dialog-icon"><Document /></el-icon>
            </div>
            <span :id="titleId" :class="titleClass">
              {{ editingId ? '编辑公告' : '发布公告' }}
            </span>
          </div>
        </template>
        
        <el-form 
          :model="form" 
          :rules="rules" 
          ref="formRef" 
          label-width="80px"
          class="announcement-form"
        >
          <el-form-item label="标题" prop="title">
            <el-input 
              v-model="form.title" 
              placeholder="请输入公告标题"
              size="large"
              class="form-input"
              :prefix-icon="Document"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="内容" prop="content">
            <el-input 
              v-model="form.content" 
              type="textarea" 
              :rows="8" 
              placeholder="请输入公告内容，支持多行文本"
              class="form-textarea"
              maxlength="1000"
              show-word-limit
            />
          </el-form-item>
        </el-form>
        
        <template #footer>
          <div class="dialog-footer">
            <el-button 
              @click="handleCancel"
              size="large"
              class="cancel-button"
            >
              取消
            </el-button>
            <el-button 
              type="primary" 
              @click="handleSubmit" 
              :loading="submitting"
              size="large"
              class="submit-button"
            >
              <span v-if="!submitting">{{ editingId ? '更新' : '发布' }}</span>
              <span v-else>{{ editingId ? '更新中...' : '发布中...' }}</span>
            </el-button>
          </div>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Document, Plus, Edit, Delete, Clock } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { announcementApi } from '@/api'
import dayjs from 'dayjs'
import type { FormInstance, FormRules } from 'element-plus'

const loading = ref(false)
const submitting = ref(false)
const announcements = ref<any[]>([])
const showCreateDialog = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()
const form = ref({
  title: '',
  content: ''
})

const emptyText = computed(() => {
  return loading.value ? '加载中...' : '暂无公告，点击上方按钮发布第一条公告'
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { min: 5, max: 1000, message: '内容长度在 5 到 1000 个字符', trigger: 'blur' }
  ]
}

const loadAnnouncements = async () => {
  loading.value = true
  try {
    const res = await announcementApi.getAnnouncements()
    if (res.code === 200) {
      announcements.value = res.data || []
    } else {
      ElMessage.error(res.message || '加载公告失败')
    }
  } catch (error: any) {
    console.error('加载公告失败:', error)
    ElMessage.error(error.message || '加载公告失败')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (editingId.value) {
      const res = await announcementApi.updateAnnouncement(editingId.value, {
        title: form.value.title,
        content: form.value.content
      })
      if (res.code === 200) {
        ElMessage.success('公告已更新')
        showCreateDialog.value = false
        await loadAnnouncements()
        resetForm()
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } else {
      const res = await announcementApi.createAnnouncement({
        title: form.value.title,
        content: form.value.content
      })
      if (res.code === 200) {
        ElMessage.success('公告已发布')
        showCreateDialog.value = false
        await loadAnnouncements()
        resetForm()
      } else {
        ElMessage.error(res.message || '发布失败')
      }
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
    }
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  showCreateDialog.value = false
  resetForm()
}

const resetForm = () => {
  form.value = { title: '', content: '' }
  editingId.value = null
  formRef.value?.clearValidate()
}

const editAnnouncement = (announcement: any) => {
  editingId.value = announcement.id
  form.value = {
    title: announcement.title || '',
    content: announcement.content || ''
  }
  showCreateDialog.value = true
}

const deleteAnnouncement = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      '删除后无法恢复，确定要删除这条公告吗？', 
      '确认删除', 
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const res = await announcementApi.deleteAnnouncement(id)
    if (res.code === 200) {
      ElMessage.success('公告已删除')
      await loadAnnouncements()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel' && error.message !== 'cancel') {
      console.error('删除失败:', error)
    }
  }
}

const formatDate = (row: any) => {
  return dayjs(row.publishTime).format('YYYY-MM-DD HH:mm')
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<style scoped>
.announcement-manage {
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

.create-button {
  height: 44px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

.create-button:active {
  transform: translateY(0);
}

/* 公告卡片 */
.announcement-card {
  border-radius: 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  overflow: hidden;
}

.announcement-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

:deep(.announcement-card .el-card__body) {
  padding: 0;
}

/* 表格样式 */
.announcement-table {
  width: 100%;
}

:deep(.announcement-table .el-table__header) {
  background: #fafbfc;
}

:deep(.announcement-table .el-table__header th) {
  background: #fafbfc;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
  padding: 16px 20px;
  border-bottom: 2px solid #e5e7eb;
}

:deep(.announcement-table .el-table__body tr) {
  transition: all 0.2s ease;
}

:deep(.announcement-table .el-table__body tr:hover) {
  background: #f9fafb;
  transform: scale(1.001);
}

:deep(.announcement-table .el-table__body td) {
  padding: 20px;
  border-bottom: 1px solid #f3f4f6;
}

:deep(.announcement-table .el-table__empty-block) {
  padding: 60px 20px;
}

:deep(.announcement-table .el-table__empty-text) {
  color: #9ca3af;
  font-size: 14px;
}

/* 表格单元格样式 */
.title-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 18px;
  color: #667eea;
  flex-shrink: 0;
}

.title-text {
  font-weight: 600;
  color: #1a1d29;
  font-size: 15px;
}

.content-cell {
  color: #4b5563;
  font-size: 14px;
  line-height: 1.6;
  max-width: 400px;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

.time-icon {
  font-size: 16px;
  color: #9ca3af;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  padding: 8px 16px;
}

.edit-btn {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.2);
}

.edit-btn:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateY(-1px);
}

.delete-btn {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  border: 1px solid rgba(245, 108, 108, 0.2);
}

.delete-btn:hover {
  background: rgba(245, 108, 108, 0.15);
  border-color: rgba(245, 108, 108, 0.3);
  transform: translateY(-1px);
}

/* 对话框样式 */
:deep(.announcement-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.announcement-dialog .el-dialog__header) {
  padding: 0;
  margin: 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.dialog-icon-wrapper {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.dialog-icon {
  font-size: 20px;
  color: white;
}

:deep(.announcement-dialog .el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #1a1d29;
  letter-spacing: 0.3px;
}

:deep(.announcement-dialog .el-dialog__body) {
  padding: 28px;
}

:deep(.announcement-dialog .el-dialog__headerbtn) {
  top: 24px;
  right: 24px;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s;
}

:deep(.announcement-dialog .el-dialog__headerbtn:hover) {
  background: rgba(0, 0, 0, 0.05);
}

/* 表单样式 */
.announcement-form {
  margin-top: 8px;
}

:deep(.form-input .el-input__wrapper) {
  border-radius: 10px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s ease;
  padding: 12px 16px;
}

:deep(.form-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset;
}

:deep(.form-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset, 0 4px 12px rgba(102, 126, 234, 0.1);
}

:deep(.form-textarea .el-textarea__inner) {
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  transition: all 0.3s ease;
}

:deep(.form-textarea .el-textarea__inner:hover) {
  border-color: rgba(102, 126, 234, 0.3);
}

:deep(.form-textarea .el-textarea__inner:focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

:deep(.el-form-item.is-error .el-input__wrapper),
:deep(.el-form-item.is-error .el-textarea__inner) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 1px #f56c6c inset;
}

:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 6px;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: #fafbfc;
}

.cancel-button {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 500;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: white;
  color: #374151;
  transition: all 0.2s ease;
}

.cancel-button:hover {
  background: #f9fafb;
  border-color: rgba(0, 0, 0, 0.15);
}

.submit-button {
  border-radius: 10px;
  padding: 10px 24px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-content {
    width: 100%;
  }

  .create-button {
    width: 100%;
    justify-content: center;
  }

  .announcement-card {
    border-radius: 12px;
  }

  :deep(.announcement-table .el-table__body td) {
    padding: 16px 12px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 6px;
  }

  .action-btn {
    width: 100%;
  }
}

/* 加载动画优化 */
:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

:deep(.el-loading-spinner) {
  margin-top: -25px;
}

:deep(.el-loading-spinner .circular) {
  width: 42px;
  height: 42px;
}
</style>