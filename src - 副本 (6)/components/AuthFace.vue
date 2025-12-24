<template>
  <div class="face-auth-container">
    <!-- 1. 视频预览 -->
    <div class="video-wrapper">
      <video ref="videoRef" autoplay muted playsinline></video>
      <div class="scan-line"></div>
      <div class="overlay-text">{{ statusText }}</div>
    </div>

    <!-- 2. 状态指示器 -->
    <div class="status-indicator" :class="{ 'is-error': isError }">
      {{ isError ? '识别失败' : '正在验证...' }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, } from 'vue'

const emit = defineEmits(['success'])

// --- 状态 ---
const videoRef = ref(null)
const statusText = ref('初始化摄像头...')
const isError = ref(false)
let mediaStream = null
let captureInterval = null

// --- 核心逻辑：持续识别 ---
const startVerificationLoop = async () => {
  if (!videoRef.value || !mediaStream) return

  // 设置一个定时器，每 1.5 秒截图并识别一次
  captureInterval = setInterval(async () => {
    // 截图
    const canvas = document.createElement('canvas')
    const video = videoRef.value
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = canvas.toDataURL('image/png')

    if (!imageData) return

    try {
      statusText.value = '正在比对人脸...'

      // 调用后端的 face_check API
      const response = await window.electronAPI.el_post({
        action: 'face_check',
        payload: { image_data: imageData, face_threshold: 80 },
      })

      if (response?.data?.success) {
        // --- 识别成功 ---
        clearInterval(captureInterval) // 停止循环
        statusText.value = `欢迎您，${response.data.data.UserID}`

        // 查询完整的用户信息 (因为 face_check 只返回 UserID)
        const userRes = await window.electronAPI.el_post({
          action: 'query',
          payload: { tableName: 'users', condition: `id_card='${response.data.data.UserID}'` }
        })

        if (userRes?.data) {
          // ✅ 关键：将完整的 user 对象派发出去
          emit('success', userRes.data)
        } else {
          throw new Error('未找到该用户的详细信息')
        }
      } else {
        // --- 识别失败 (无人脸/非活体/库中无人等) ---
        isError.value = true
        statusText.value = response?.data?.message || '未匹配到用户'
        // 短暂显示错误后恢复
        setTimeout(() => {
          isError.value = false
          statusText.value = '请正对摄像头'
        }, 1500)
      }
    } catch (e) {
      console.error('人脸验证异常:', e)
      isError.value = true
      statusText.value = '验证服务异常'
    }
  }, 1500) // 每 1.5 秒执行一次
}

// --- 生命周期钩子 ---
onMounted(async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      videoRef.value.onloadedmetadata = () => {
        statusText.value = '请正对摄像头'
        // 摄像头准备好后，启动识别循环
        startVerificationLoop()
      }
    }
  } catch (error) {
    statusText.value = '摄像头启动失败'
    isError.value = true
    console.error('摄像头启动失败:', error)
  }
})

onUnmounted(() => {
  // 组件销毁时，务必停止摄像头和定时器
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
  }
  if (captureInterval) {
    clearInterval(captureInterval)
  }
})
</script>

<style scoped>
/* 此处可以复用你注册页面里 video-container, camera-view, scan-line 的样式 */
.face-auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.video-wrapper {
  width: 240px;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  border: 1px solid #444;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  /* 镜像 */
}

/* ... 其他样式 ... */
</style>
