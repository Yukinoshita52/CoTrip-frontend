<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
// 主应用组件
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f7fa;
}

#app {
  min-height: 100vh;
}

/* 美化 ElMessageBox 确认对话框 */
.el-message-box {
  border-radius: 16px !important;
  overflow: hidden !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  border: 1px solid rgba(0, 0, 0, 0.06) !important;
  padding: 0 !important;
}

.el-message-box__header {
  padding: 24px 28px !important;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%) !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06) !important;
  margin: 0 !important;
}

.el-message-box__title {
  font-size: 20px !important;
  font-weight: 600 !important;
  color: #1a1d29 !important;
  letter-spacing: 0.3px !important;
  position: relative !important;
  padding-left: 50px !important;
}

.el-message-box__title::before {
  content: '⚠';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  font-weight: normal;
}

.el-message-box__headerbtn {
  top: 20px !important;
  right: 20px !important;
  width: 32px !important;
  height: 32px !important;
  border-radius: 8px !important;
  transition: all 0.2s !important;
}

.el-message-box__headerbtn:hover {
  background: rgba(0, 0, 0, 0.05) !important;
}

.el-message-box__close {
  font-size: 18px !important;
  color: #666 !important;
}

.el-message-box__content {
  padding: 28px !important;
  background: #ffffff !important;
}

.el-message-box__message {
  padding: 0 !important;
  margin: 0 !important;
}

.el-message-box__message p {
  font-size: 15px !important;
  line-height: 1.8 !important;
  color: #4a4a4a !important;
  margin: 0 !important;
}

/* 警告类型 */
.el-message-box--warning .el-message-box__header {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(255, 152, 0, 0.08) 100%) !important;
}

.el-message-box--warning .el-message-box__title::before {
  content: '⚠';
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%);
}

/* 错误/危险类型 */
.el-message-box--error .el-message-box__header,
.el-message-box--danger .el-message-box__header {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.08) 0%, rgba(244, 67, 54, 0.08) 100%) !important;
}

.el-message-box--error .el-message-box__title::before,
.el-message-box--danger .el-message-box__title::before {
  content: '✕';
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.15) 0%, rgba(244, 67, 54, 0.15) 100%);
}

/* 信息类型 */
.el-message-box--info .el-message-box__header {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.08) 0%, rgba(102, 126, 234, 0.08) 100%) !important;
}

.el-message-box--info .el-message-box__title::before {
  content: 'ℹ';
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.15) 0%, rgba(102, 126, 234, 0.15) 100%);
}

/* 成功类型 */
.el-message-box--success .el-message-box__header {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.08) 0%, rgba(76, 175, 80, 0.08) 100%) !important;
}

.el-message-box--success .el-message-box__title::before {
  content: '✓';
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.15) 0%, rgba(76, 175, 80, 0.15) 100%);
}

.el-message-box__btns {
  padding: 20px 28px !important;
  border-top: 1px solid rgba(0, 0, 0, 0.06) !important;
  background: #fafbfc !important;
  display: flex !important;
  justify-content: flex-end !important;
  gap: 12px !important;
}

.el-message-box__btns .el-button {
  border-radius: 10px !important;
  padding: 10px 24px !important;
  font-weight: 500 !important;
  transition: all 0.3s !important;
  min-width: 100px !important;
}

.el-message-box__btns .el-button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
}

.el-message-box__btns .el-button--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
}

.el-message-box__btns .el-button--primary:hover {
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4) !important;
}

.el-message-box__btns .el-button--danger {
  background: linear-gradient(135deg, #f56c6c 0%, #f44336 100%) !important;
  border: none !important;
}

.el-message-box__btns .el-button--danger:hover {
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.4) !important;
}

/* 输入框样式（如果有） */
.el-message-box__input {
  margin-top: 20px !important;
}

.el-message-box__input .el-input__wrapper {
  border-radius: 10px !important;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1) inset !important;
  transition: all 0.2s !important;
}

.el-message-box__input .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px rgba(102, 126, 234, 0.3) inset !important;
}

.el-message-box__input .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2) inset !important;
}
</style>