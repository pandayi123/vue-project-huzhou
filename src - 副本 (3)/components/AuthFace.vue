<template>
  <!-- 根元素直接就是 video-container，不再有外层 div -->
  <div class="video-container" :class="{ 'shake-anim1': isError }">
    <video ref="videoRef" autoplay muted playsinline class="camera-view"></video>

    <!-- 扫描动画，失败时隐藏 -->
    <div v-if="!isError" class="scan-line"></div>

    <!-- 状态文字，失败时改变颜色 -->
    <div class="face-text-overlay" :class="{ 'error-text': isError }">
      {{ statusText }}
    </div>

    <!-- 摄像头加载占位符 -->
    <div v-if="!isCameraActive" class="camera-placeholder">
      <el-icon class="is-loading" :size="30">
        <Loading />
      </el-icon>
      <p>正在启动摄像头</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Loading } from '@element-plus/icons-vue'
// import { useAudioStore } from '@/stores/audioStore'

const emit = defineEmits(['success'])
// const audioStore = useAudioStore()

const videoRef = ref(null)
const statusText = ref('初始化...')
const isError = ref(false)
const isCameraActive = ref(false)
let mediaStream = null

let isCancelled = false
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
/**
 * [新增] 字符串脱敏工具函数
 * @param {string} str - 原始字符串
 * @param {number} startLen - 开头保留的长度
 * @param {number} endLen - 结尾保留的长度
 * @returns {string} - 脱敏后的字符串
 */
const maskString = (val) => {
  if (!val) return ''
  // 如果长度不足8位，直接显示，避免报错
  if (val.length <= 8) return val
  // 截取前4位 + **** + 后4位
  return val.slice(0, 4) + '**********' + val.slice(-4)
}
const verificationLoop = async () => {
  // 循环的入口，只有当组件被销毁时，isCancelled 才会为 true
  while (!isCancelled) {
    try {
      // 1. 安全检查，如果摄像头或 video 元素不存在，则暂停
      if (!videoRef.value || !mediaStream) {
        await delay(1000) // 等1秒再重试
        continue // 进入下一次循环
      }

      // 2. 截图
      const canvas = document.createElement('canvas')
      const video = videoRef.value
      if (!video.videoWidth) {
        // 视频可能还未加载完
        await delay(500)
        continue
      }
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = canvas.toDataURL('image/png')

      if (!imageData) {
        await delay(1000)
        continue
      }

      // 3. API 调用
      // statusText.value = '正在比对...'
      const response = await window.electronAPI.el_post({
        action: 'face_check',
        payload: { image_data: imageData },
      })

      if (response?.data?.success) {
        // --- 成功：派发事件并跳出循环 ---
        const userInfo = response.data.data
        statusText.value = `已识别: ${maskString(userInfo.UserID)}`
        await delay(1500); // 显示成功信息 2 秒

        const userRes = await window.electronAPI.el_post({
          action: 'query',
          payload: { tableName: 'users', condition: `id_card='${userInfo.UserID}'` },
        })

        if (userRes?.data) {
          emit('success', userRes.data)
        } else {
          throw new Error('未找到用户档案')
        }
        statusText.value = '正在验证下一位人员...'; // 恢复提示
        await delay(1500);
      } else {
        // --- 失败：显示错误，短暂暂停，然后继续循环 ---
        let errorMsg = response?.data?.message || '未匹配'
        if (errorMsg.includes('查无此人')) {
          // 如果消息包含“查无此人”，则使用这个特定的提示
          errorMsg = '未注册';
        } else {
          // 否则，使用服务端返回的原始消息
          errorMsg = response.data.message;
        }
        isError.value = true
        statusText.value = errorMsg

        // 等待 1.5 秒，让用户看到错误
        await delay(1500)

        // 恢复状态，准备下一次循环
        isError.value = false
        // statusText.value = '请重试'
      }
    } catch (e) {
      isError.value = true
      statusText.value = '服务异常'
      console.error('人脸验证异常:', e)

      // 发生异常时也等待一段时间再重试
      await delay(2000)
      isError.value = false
    }

    // ✅ 每次循环结束，无论成功失败，都等待 500ms，避免 CPU 100%
    await delay(500)
  }
}

// --- 生命周期 ---
onMounted(async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    })
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      videoRef.value.onloadedmetadata = () => {
        isCameraActive.value = true
        statusText.value = '请正对摄像头'
        // ✅ 启动 while 循环
        verificationLoop()
      }
    }
  } catch (error) {
    statusText.value = '摄像头启动失败'
    isError.value = true
    console.error('摄像头启动失败:', error)
  }
})

onUnmounted(() => {
  // ✅ 停止循环的关键
  isCancelled = true
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
  }
})
</script>

<style scoped>
/* ================================================= */
/*  👇 完完全全复用父组件的样式，不做任何修改  👇  */
/* ================================================= */

.video-container {
  width: 5.8rem;
  height: 5rem;
  background: #000;
  border: 2px solid var(--primary);
  border-radius: 0.14rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0.3rem rgba(0, 242, 255, 0.15);
  transition: border-color 0.3s;
}

/* 失败时的震动效果 */
.video-container.shake-anim1 {
  border-color: var(--error);
  /* 边框变红 */
}

.camera-view {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, var(--primary), transparent);
  animation: scan 2s linear infinite;
  z-index: 2;
  box-shadow: 0 0 8px var(--primary);
}

.face-text-overlay {
  position: absolute;
  bottom: 0.2rem;
  left: 0;
  width: 100%;
  text-align: center;
  color: var(--primary);
  font-size: 0.23rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  z-index: 3;
  transition: color 0.3s;
}

/* 失败时文字变红 */
.face-text-overlay.error-text {
  color: var(--error);
}

.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #111;
  color: #666;
  z-index: 5;
}

.camera-placeholder p {
  margin-top: 0.2rem;
  font-size: 0.2rem;
}

/* 动画 (从父组件复制) */
@keyframes scan {
  0% {
    top: 0;
    opacity: 0;
  }

  10% {
    opacity: 1;
  }

  90% {
    opacity: 1;
  }

  100% {
    top: 100%;
    opacity: 0;
  }
}

@keyframes shake {

  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }

  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }

  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }

  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
