<template>
  <div class="register-container">
    <!-- 背景装饰元素 -->
    <div class="background-decoration">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- 主注册卡片 -->
    <div class="register-card">
      <!-- 返回按钮 -->
      <div class="back-button" @click="goToLogin">
        <el-icon><ArrowLeft /></el-icon>
      </div>

      <!-- Logo和标题区域 -->
      <div class="register-header">
        <div class="logo-wrapper">
          <img src="/logo.png" alt="Logo" class="logo-image" />
        </div>
        <h1 class="register-title">创建账号</h1>
        <p class="register-subtitle">加入我们，开启精彩的旅行之旅</p>
      </div>

      <!-- 注册表单 -->
      <el-form 
        :model="registerForm" 
        :rules="registerRules" 
        ref="registerFormRef" 
        class="register-form"
        label-position="top"
      >
        <el-form-item prop="username" class="form-item">
          <template #label>
            <div class="form-label">
              <el-icon><User /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>用户名</span>
            </div>
          </template>
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            size="large"
            class="custom-input"
            :prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password" class="form-item">
          <template #label>
            <div class="form-label">
              <el-icon><Lock /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>密码</span>
            </div>
          </template>
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            size="large"
            class="custom-input"
            :prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <el-form-item prop="confirmPassword" class="form-item">
          <template #label>
            <div class="form-label">
              <el-icon><Lock /></el-icon>
              <span class="label-text"><span class="required-mark">*</span>确认密码</span>
            </div>
          </template>
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            class="custom-input"
            :prefix-icon="Lock"
            show-password
            clearable
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <!-- 密码强度指示器 -->
        <div class="password-strength" v-if="registerForm.password">
          <div class="strength-label">密码强度：</div>
          <div class="strength-bars">
            <div 
              class="strength-bar" 
              :class="getPasswordStrengthClass(0)"
            ></div>
            <div 
              class="strength-bar" 
              :class="getPasswordStrengthClass(1)"
            ></div>
            <div 
              class="strength-bar" 
              :class="getPasswordStrengthClass(2)"
            ></div>
          </div>
          <span class="strength-text">{{ getPasswordStrengthText() }}</span>
        </div>

        <el-form-item class="submit-item">
          <el-button
            type="primary"
            size="large"
            :loading="registerLoading"
            @click="handleRegister"
            class="register-button"
          >
            <span v-if="!registerLoading">立即注册</span>
            <span v-else>注册中...</span>
          </el-button>
        </el-form-item>

        <!-- 登录链接 -->
        <div class="login-link">
          <span>已有账号？</span>
          <el-link type="primary" @click="goToLogin" class="link-text">
            立即登录
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock, ArrowLeft } from '@element-plus/icons-vue'
import { authApi } from '@/api'

const router = useRouter()

const registerFormRef = ref<FormInstance>()
const registerLoading = ref(false)

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (_rule: any, value: any, callback: any) => {
  if (!value) {
    callback(new Error('请确认密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

// 计算密码强度
const getPasswordStrength = computed(() => {
  const password = registerForm.password
  if (!password) return 0
  
  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  
  if (strength <= 2) return 1
  if (strength <= 4) return 2
  return 3
})

const getPasswordStrengthClass = (index: number) => {
  const strength = getPasswordStrength.value
  if (index < strength) {
    if (strength === 1) return 'weak'
    if (strength === 2) return 'medium'
    return 'strong'
  }
  return ''
}

const getPasswordStrengthText = () => {
  const strength = getPasswordStrength.value
  if (strength === 1) return '弱'
  if (strength === 2) return '中'
  if (strength === 3) return '强'
  return ''
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
  } catch (error) {
    console.log('表单验证失败:', error)
    return
  }
  
  registerLoading.value = true
  try {
    const res = await authApi.register({
      username: registerForm.username,
      password: registerForm.password,
      confirmPassword: registerForm.confirmPassword
    })
    
    if (res.code === 200 && res.data) {
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } else {
      ElMessage.error(res.message || '注册失败')
    }
  } catch (error: any) {
    console.error('注册错误:', error)
    const errorMessage = error?.response?.data?.message || error?.message || '注册失败，请稍后再试'
    ElMessage.error(errorMessage)
  } finally {
    registerLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<style scoped>
.register-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #4d4d98 50%, #c2d4f3 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  overflow: hidden;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 背景装饰球 */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.6;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  top: -200px;
  left: -200px;
  animation-delay: 0s;
}

.orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 192, 203, 0.4) 0%, transparent 70%);
  bottom: -150px;
  right: -150px;
  animation-delay: 5s;
}

.orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(173, 216, 230, 0.3) 0%, transparent 70%);
  top: 50%;
  right: 10%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* 注册卡片 */
.register-card {
  position: relative;
  width: 100%;
  max-width: 480px;
  padding: 48px 40px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  animation: slideUp 0.6s ease-out;
  z-index: 1;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 返回按钮 */
.back-button {
  position: absolute;
  top: 24px;
  left: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
}

.back-button:hover {
  background: rgba(102, 126, 234, 0.2);
  transform: translateX(-2px);
}

/* 头部区域 */
.register-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #202d76 100%);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-in-out infinite;
  padding: 12px;
  box-sizing: border-box;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
  }
}

.logo-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 8px;
}

.register-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1d29;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.register-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin: 0;
  font-weight: 400;
}

/* 表单样式 */
.register-form {
  margin-top: 8px;
}

.form-item {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.form-label .el-icon {
  color: #667eea;
  font-size: 16px;
}

.label-text {
  display: inline-flex;
  align-items: center;
}

.required-mark {
  color: #f56c6c;
  margin-right: 4px;
  font-weight: 600;
}

/* 隐藏 Element Plus 默认的必填标记 */
:deep(.el-form-item.is-required .el-form-item__label::before) {
  display: none;
}

:deep(.custom-input .el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  padding: 12px 16px;
}

:deep(.custom-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset;
  background: rgba(255, 255, 255, 1);
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset, 0 4px 12px rgba(102, 126, 234, 0.15);
  background: rgba(255, 255, 255, 1);
}

:deep(.custom-input .el-input__inner) {
  font-size: 15px;
}

/* 密码强度指示器 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 12px;
  font-size: 13px;
}

.strength-label {
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
}

.strength-bars {
  display: flex;
  gap: 6px;
  flex: 1;
}

.strength-bar {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  transition: all 0.3s ease;
}

.strength-bar.weak {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.strength-bar.medium {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.strength-bar.strong {
  background: linear-gradient(90deg, #10b981, #34d399);
}

.strength-text {
  font-weight: 600;
  min-width: 24px;
  text-align: right;
}

.strength-bar.weak ~ .strength-text {
  color: #ef4444;
}

.strength-bar.medium ~ .strength-text {
  color: #f59e0b;
}

.strength-bar.strong ~ .strength-text {
  color: #10b981;
}

/* 提交按钮 */
.submit-item {
  margin-bottom: 24px;
  margin-top: 32px;
}

.register-button {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
}

.register-button:active:not(:disabled) {
  transform: translateY(0);
}

/* 登录链接 */
.login-link {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
}

.link-text {
  font-weight: 600;
  margin-left: 4px;
  text-decoration: none;
}

.link-text:hover {
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 640px) {
  .register-card {
    padding: 36px 24px;
    border-radius: 20px;
  }

  .register-title {
    font-size: 28px;
  }

  .logo-wrapper {
    width: 64px;
    height: 64px;
    padding: 10px;
  }
}

/* 表单验证错误样式优化 */
:deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px #f56c6c inset;
}

:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 6px;
  padding-left: 4px;
}
</style>

