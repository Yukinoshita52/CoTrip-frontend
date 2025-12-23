<template>
  <Layout>
    <div class="announcement-manage">
      <div class="page-header">
        <h2>公告管理</h2>
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          发布公告
        </el-button>
      </div>

      <el-table :data="announcements" v-loading="loading" style="width: 100%">
        <el-table-column prop="title" label="标题" width="300" />
        <el-table-column prop="content" label="内容" show-overflow-tooltip />
        <el-table-column prop="publishTime" label="发布时间" width="180" :formatter="formatDate" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="editAnnouncement(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="deleteAnnouncement(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 创建/编辑对话框 -->
      <el-dialog
        v-model="showCreateDialog"
        :title="editingId ? '编辑公告' : '发布公告'"
        width="600px"
      >
        <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
          <el-form-item label="标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入公告标题" />
          </el-form-item>
          <el-form-item label="内容" prop="content">
            <el-input 
              v-model="form.content" 
              type="textarea" 
              :rows="10" 
              placeholder="请输入公告内容"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
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
      // 更新
      const res = await announcementApi.updateAnnouncement(editingId.value, {
        title: form.value.title,
        content: form.value.content
      })
      if (res.code === 200) {
        ElMessage.success('公告已更新')
        showCreateDialog.value = false
        await loadAnnouncements()
      } else {
        ElMessage.error(res.message || '更新失败')
      }
    } else {
      // 创建
      const res = await announcementApi.createAnnouncement({
        title: form.value.title,
        content: form.value.content
      })
      if (res.code === 200) {
        ElMessage.success('公告已发布')
        showCreateDialog.value = false
        await loadAnnouncements()
      } else {
        ElMessage.error(res.message || '发布失败')
      }
    }
    
    // 重置表单
    form.value = { title: '', content: '' }
    editingId.value = null
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('操作失败:', error)
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
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
    await ElMessageBox.confirm('确定要删除这条公告吗？', '确认删除', {
      type: 'warning'
    })
    
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
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const formatDate = (row: any) => {
  return dayjs(row.publishTime).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadAnnouncements()
})
</script>

<style scoped>
.announcement-manage {
  max-width: 1200px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #333;
}
</style>

