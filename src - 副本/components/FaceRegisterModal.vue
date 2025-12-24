<template>
  <el-dialog v-model="dialogVisible" title="人脸生物特征采集" width="500px" class="cyber-dialog-person" :append-to-body="true"
    :close-on-click-modal="false" @close="handleClose" @open="initCamera">
    <div class="face-modal-body">
      <!-- 提示信息 -->
      <div class="target-info">
        正在为 <span class="highlight">{{ personName }}</span> ({{ maskIdCard(idCard) }})采集人脸
      </div>

      <!-- 视频预览区 -->
      <div class="camera-wrapper">
        <video ref="videoRef" autoplay muted playsinline class="camera-view"></video>

        <!-- 扫描框 UI 装饰 -->
        <div class="scan-overlay">
          <div class="scan-line"></div>
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
        </div>

        <!-- 摄像头未启动时的占位 -->
        <div v-if="!isCameraActive" class="camera-placeholder">
          <el-icon class="is-loading" :size="30" v-if="isInitializing">
            <Loading />
          </el-icon>
          <div v-else>摄像头未启动</div>
        </div>
      </div>

      <!-- 状态与错误显示 -->
      <div class="status-bar" :class="{ error: isError }">
        <div class="status-dot" :class="{ active: isCameraActive && !isError }"></div>
        {{ statusMessage }}
      </div>

      <!-- 操作按钮 -->
      <div class="action-area">
        <button class="cyber-btn" @click="handleRegister" :disabled="!isCameraActive || isProcessing">
          <div class="btn-content">
            <el-icon v-if="isProcessing" class="is-loading">
              <Loading />
            </el-icon>
            <el-icon v-else>
              <Aim />
            </el-icon>
            <span>{{ isProcessing ? '正在注册...' : '立即采集并注册' }}</span>
          </div>
          <div class="scan-line" v-if="!isProcessing"></div>
        </button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onUnmounted, toRaw } from 'vue'
import { Loading, Aim } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
const audioStore = useAudioStore()

// 接收父组件参数
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  personName: { type: String, default: '' },
  idCard: { type: String, required: true }, // 必须传入身份证号作为 ID
})

const emit = defineEmits(['update:modelValue', 'success'])

// 状态控制
const videoRef = ref(null)
const isCameraActive = ref(false)
const isInitializing = ref(false)
const isProcessing = ref(false)
const statusMessage = ref('等待摄像头启动...')
const isError = ref(false)
let mediaStream = null

// 计算属性控制 v-model
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 初始化摄像头
const initCamera = async () => {
  isInitializing.value = true
  isError.value = false
  statusMessage.value = '正在初始化摄像头硬件...'

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user', // 优先使用前置
      },
      audio: false,
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      // 等待视频元数据加载完成
      videoRef.value.onloadedmetadata = () => {
        isCameraActive.value = true
        isInitializing.value = false
        statusMessage.value = '摄像头就绪，请正对屏幕'
      }
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
    isError.value = true
    isInitializing.value = false
    statusMessage.value = `摄像头启动失败: ${error.message}`
    ElMessage.error('无法调用摄像头，请检查设备连接或权限')
  }
}

// 停止摄像头
const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
  isCameraActive.value = false
}

// 关闭弹窗处理
const handleClose = () => {
  stopCamera()
  dialogVisible.value = false
}

// 截图并转换为 Base64
const captureImage = () => {
  if (!videoRef.value || !isCameraActive.value) return null

  const canvas = document.createElement('canvas')
  const video = videoRef.value
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  return canvas.toDataURL('image/png') // 返回 Base64
}

const handleRegister = async () => {
  if (isProcessing.value) return
  if (!props.idCard) {
    ElMessage.error('无法获取用户身份证号，无法注册')
    return
  }

  // 1. 重置状态
  isProcessing.value = true
  isError.value = false
  statusMessage.value = '正在捕获图像...'

  try {
    const imageData = captureImage()
    if (!imageData) throw new Error('图像捕获失败')

    // ==========================================
    // 第一步：先进行人脸识别 (face_check)
    // ==========================================
    statusMessage.value = '正在核验人脸状态...'

    const checkResponse = await window.electronAPI.el_post({
      action: 'face_check',
      payload: {
        user_id: props.idCard,
        image_data: imageData,
        image_type: 'BASE64',
        face_threshold: 80,
        timestamp: Date.now(),
      },
    })

    console.log('checkResponse:', toRaw(checkResponse))

    // 逻辑分支判断
    let shouldRegister = false

    if (checkResponse?.data?.success) {
      // ✅ 识别成功 = 库里已经有人脸了
      // 直接抛出“已存在”错误，阻止注册
      const error = new Error('该身份证号已注册人脸')
      error.code = 2 // 伪造一个 code 2 走统一错误处理
      throw error
    } else {
      // ❌ 识别失败，检查原因
      const checkErrorCode = checkResponse?.data?.error_code

      if (checkErrorCode === 2) {
        // ✅ 关键点：错误码 2 代表“查无此人” -> 可以注册
        shouldRegister = true
      } else {
        // ❌ 其他错误 (1:无人脸, 3:多脸, 4:非活体) -> 直接报错，不注册
        const error = new Error(getErrorMessage(checkErrorCode))
        error.code = checkErrorCode
        throw error
      }
    }

    // ==========================================
    // 第二步：如果通过检查，执行注册 (face_register)
    // ==========================================
    if (shouldRegister) {
      statusMessage.value = '检测通过，正在录入...'

      // ✅ 新增：等待 1500ms,防止人脸服务器繁忙
      await new Promise(resolve => setTimeout(resolve, 1500))

      const registerResponse = await window.electronAPI.el_post({
        action: 'face_register',
        payload: {
          user_id: props.idCard,
          image_data: imageData,
          image_type: 'BASE64',
          face_threshold: 80,
          timestamp: Date.now(),
        },
      })

      console.log('registerResponse:', toRaw(registerResponse))

      if (registerResponse?.data?.success) {
        // 注册成功流程
        statusMessage.value = '注册成功！'
        audioStore.play('/audio/人脸注册成功.mp3')
        // emit('success')
        emit('success', imageData)
        setTimeout(() => {
          handleClose()
        }, 1500)
      } else {
        // 注册接口返回的错误 (极其罕见，通常是写入失败)
        const regErrorCode = registerResponse?.data?.error_code
        const error = new Error(getErrorMessage(regErrorCode))
        error.code = regErrorCode
        throw error
      }
    }

  } catch (error) {
    console.error('流程终止:', error)
    isError.value = true
    statusMessage.value = error.message

    // 统一错误语音播报
    const code = error.code
    switch (code) {
      case 1:
        audioStore.play('/audio/未检测到人脸.mp3')
        break
      case 2:
        statusMessage.value = '该用户已存在，无需重复注册' // 优化提示文案
        audioStore.play('/audio/用户已存在.mp3')
        break
      case 3:
        audioStore.play('/audio/检测到多张人脸.mp3')
        break
      case 4:
        audioStore.play('/audio/非活体检测.mp3')
        break
      default:
        audioStore.play('/audio/注册失败.mp3')
        break
    }

  } finally {
    isProcessing.value = false
  }
}


// 错误码映射
const getErrorMessage = (errorCode) => {
  const errorMap = {
    1: '未检测到人脸，请正对摄像头',
    2: '该身份证号已注册人脸',
    3: '检测到多张人脸，请保持画面单人',
    4: '检测失败（非活体或遮挡）',
    5: '图像质量不合格（过暗或模糊）',
    6: '服务未连接',
    7: '系统繁忙',
  }
  return errorMap[errorCode] || `注册失败(Code: ${errorCode})`
}
const maskIdCard = (val) => {
  if (!val) return ''
  // 如果长度不足8位，直接显示，避免报错
  if (val.length <= 8) return val
  // 截取前4位 + **** + 后4位
  return val.slice(0, 4) + '**********' + val.slice(-4)
}
// 组件卸载时强制关闭摄像头
onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
/* 复用你现有的变量系统 */
.face-modal-body {
  padding: 20px;
  background: #0a0e17;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.target-info {
  color: #8899a6;
  font-size: 14px;
}

.target-info .highlight {
  color: #00f2ff;
  font-weight: bold;
}

/* 摄像头容器 - 赛博朋克风格 */
.camera-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
  background: #000;
  border: 1px solid #2a3546;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
}

.camera-view {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1);
  /* 镜像显示，用户体验更好 */
}

.camera-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  background: #111;
  z-index: 1;
}

/* 扫描 UI 叠加层 */
.scan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.7);
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: rgba(0, 242, 255, 0.5);
  box-shadow: 0 0 10px #00f2ff;
  animation: scanMove 2s infinite linear;
}

@keyframes scanMove {
  0% {
    top: 0%;
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

.corner {
  position: absolute;
  width: 20px;
  height: 20px;
  border: 2px solid #00f2ff;
}

.tl {
  top: 10px;
  left: 10px;
  border-right: none;
  border-bottom: none;
}

.tr {
  top: 10px;
  right: 10px;
  border-left: none;
  border-bottom: none;
}

.bl {
  bottom: 10px;
  left: 10px;
  border-right: none;
  border-top: none;
}

.br {
  bottom: 10px;
  right: 10px;
  border-left: none;
  border-top: none;
}

/* 状态栏 */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #00ff9d;
  background: rgba(0, 255, 157, 0.1);
  padding: 8px 15px;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}

.status-bar.error {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #555;
  transition: all 0.3s;
}

.status-dot.active {
  background: #00ff9d;
  box-shadow: 0 0 8px #00ff9d;
}

/* 按钮区域 */
.action-area {
  width: 100%;
  display: flex;
  justify-content: center;
}

.cyber-btn {
  /* 复用主页面的按钮样式，微调宽度 */
  width: 200px;
  height: 40px;
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%);
  border: 1px solid #00f2ff;
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cyber-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(0.8);
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 2;
}

.scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-20deg);
  animation: btnScan 3s infinite;
}
</style>
