// MinIO服务器配置
const MINIO_BASE_URL = 'http://121.40.23.40:9000'
const MINIO_BUCKET = 'cotrip'

/**
 * 处理头像URL，将相对路径转换为完整的MinIO地址
 * @param avatarUrl 头像URL（可能是相对路径或完整URL）
 * @returns 完整的头像URL
 */
export const formatAvatarUrl = (avatarUrl?: string): string => {
  if (!avatarUrl) return ''
  
  // 如果已经是完整的URL，直接返回
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl
  }
  
  // 如果是相对路径，拼接完整的MinIO地址
  // 移除开头的斜杠（如果有的话）
  const cleanPath = avatarUrl.startsWith('/') ? avatarUrl.substring(1) : avatarUrl
  return `${MINIO_BASE_URL}/${MINIO_BUCKET}/${cleanPath}`
}

/**
 * 处理图片URL，通用的图片地址转换函数
 * @param imageUrl 图片URL
 * @returns 完整的图片URL
 */
export const formatImageUrl = (imageUrl?: string): string => {
  return formatAvatarUrl(imageUrl)
}