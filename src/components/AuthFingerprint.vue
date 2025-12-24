<template>
  <div class="finger-auth-container">
    <!-- 指纹图标/状态显示区 -->
    <div class="finger-icon-box" :class="statusClass">
      <!-- 动态加载圈 -->
      <svg v-if="isLoading" class="spinner" viewBox="0 0 50 50">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
      </svg>

      <!-- 指纹图标 -->
      <svg v-else viewBox="0 0 24 24" class="finger-svg">
        <path
          d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25.16.22.11.54-.12.7-.23.16-.54.11-.7-.12-.9-1.26-2.04-2.25-3.39-2.94-2.87-1.47-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.21-.39.21zm6.25 12.07c-.13 0-.26-.05-.35-.15-.87-1.03-1.34-2.33-1.34-3.64 0-1.31.47-2.61 1.34-3.64.23-.27.64-.3.91-.07.27.23.3.64.07.91-.63.74-.97 1.69-.97 2.65 0 .96.34 1.91.97 2.65.23.27.2.68-.07.91-.16.13-.37.2-.56.18zm-2.5-3.83c0-1.78.63-3.6 1.82-5.02.16-.19.45-.22.64-.06.19.16.22.45.06.64-1.01 1.2-1.53 2.72-1.53 4.22s.51 3.01 1.53 4.22c.16.19.13.48-.06.64-.19.16-.48.13-.64-.06-1.2-1.4-1.82-3.03-1.82-4.58zm5.5 4.54c-1.25 0-2.43-.5-3.32-1.38-.2-.19-.2-.51 0-.71.19-.2.51-.2.71 0 .7.69 1.62 1.08 2.61 1.08 1.96 0 3.56-1.59 3.56-3.56 0-1.96-1.59-3.56-3.56-3.56-1 0-1.92.39-2.61 1.09-.2.19-.51.19-.71 0-.19-.19-.19-.51 0-.71.89-0.89 2.07-1.38 3.32-1.38 2.51 0 4.56 2.05 4.56 4.56s-2.05 4.56-4.56 4.56z" />
      </svg>
    </div>

    <!-- 提示文字 -->
    <p class="status-text" :class="{ 'error-text': status === 'error' }">
      {{ statusText }}
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, } from 'vue'
// import { useAudioStore } from '@/stores/audioStore'

const emit = defineEmits(['success', 'error'])
// const audioStore = useAudioStore()

// 状态定义
const status = ref('waiting') // waiting, scanning, processing, success, error
const statusText = ref('请按压指纹传感器')
let isCancelled = false

// 计算属性：是否显示加载动画
const isLoading = computed(() => status.value === 'scanning' || status.value === 'processing')

// 计算属性：动态 Class
const statusClass = computed(() => ({
  'is-active': isLoading.value,
  'is-error': status.value === 'error',
  'is-success': status.value === 'success',
}))

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 核心验证循环 (考勤机/连续验证模式)
 */
const startScanLoop = async () => {
  console.log('启动指纹监听循环 (连续模式)...')
  isCancelled = false
  status.value = 'waiting'
  statusText.value = '请按压指纹传感器'

  while (!isCancelled) {
    try {
      // --- 阶段 1: 监测手指 ---
      // 使用轻量级指令，避免频繁调用 get_image 占用资源
      const detectRes = await window.electronAPI.el_post({ action: 'detect_finger_status' })

      // 如果没检测到，休息 500ms 继续轮询
      if (!detectRes.data?.success || !detectRes.data.fingerPresent) {
        await delay(500)
        continue
      }

      // --- 阶段 2: 开始采集 ---
      status.value = 'scanning'
      statusText.value = '正在读取...'
      await delay(200) // 物理缓冲：等待指腹压实，提高图像质量

      // 4. 采集图像
      const imgRes = await window.electronAPI.el_post({ action: 'get_fingerprint_image' })
      if (!imgRes.data?.success) {
        console.warn('图像采集失败，重试中...')
        status.value = 'waiting'
        continue
      }

      // 4.5 生成特征 (Generate Template)
      const genRes = await window.electronAPI.el_post({
        action: 'generate_fingerprint_template',
        payload: { bufferId: 0 }
      })

      if (!genRes.data?.success) {
        throw new Error('特征提取失败，请调整手指')
      }

      // --- 阶段 3: 识别身份 ---
      status.value = 'processing'
      statusText.value = '正在验证身份...'

      const searchRes = await window.electronAPI.el_post({
        action: 'identify_fingerprint',
        payload: { bufferId: 0 }
      })

      if (searchRes.data?.success) {
        // ===========================
        //      验证成功逻辑
        // ===========================
        const hardwareId = searchRes.data.templateId
        console.log(`硬件识别成功，ID: ${hardwareId}`)

        // 6. 查库: 硬件ID -> 身份证
        const bioRes = await window.electronAPI.el_post({
          action: 'query',
          payload: {
            tableName: 'biometrics',
            condition: `bio_subtype = ${hardwareId} AND bio_type = 'fingerprint'`,
          },
        })

        if (!bioRes.data) throw new Error('该指纹未绑定任何用户')
        const userIdCard = bioRes.data.user_id_card

        // 7. 查库: 身份证 -> 用户信息
        const userRes = await window.electronAPI.el_post({
          action: 'query',
          payload: {
            tableName: 'users',
            condition: `id_card = '${userIdCard}' AND status = 1`,
          },
        })

        if (!userRes.data) throw new Error('关联用户不存在或已禁用')

        // --- B. 全部验证通过 ---
        const userData = userRes.data
        status.value = 'success'
        statusText.value = `已验证: ${userData.real_name || '用户'}`

        // 发射数据 (父组件可以记录日志，但不要关闭弹窗)
        emit('success', userData)

        // 流出松手的时间，用于优化体验
        await delay(1000)

        // 【优化点】：只在检测到未松手时才提示文字
        await waitForLift('请松开手指')

        // 重置
        status.value = 'waiting'
        statusText.value = '请按压指纹传感器'

      } else {
        // --- C. 硬件比对失败 (指纹库里没有这个人) ---
        throw new Error('验证失败，未匹配到指纹')
      }
    } catch (err) {
      // --- 错误处理 ---
      console.error(err)
      status.value = 'error'
      statusText.value = err.message || '读取错误'
      // 停留显示错误结果
      await delay(2000)
      // 【优化点】：只在检测到未松手时才提示文字
      await waitForLift('请松开手指重试')
      status.value = 'waiting'
      statusText.value = '请按压指纹传感器'
    }
  }
}

/**
 * 智能等待手指抬起
 * @param {String} tipText 如果手指没抬起，要显示的提示语
 */
const waitForLift = async (tipText) => {
  // 先检查一次
  let res = await window.electronAPI.el_post({ action: 'detect_finger_status' })

  // 如果当前已经没有手指了，直接返回，不改变界面文字
  if (!res.data?.success || !res.data.fingerPresent) {
    return
  }

  // 只有检测到手指还在，才更新文字
  statusText.value = tipText

  // 循环等待直到手指离开
  while (!isCancelled) {
    res = await window.electronAPI.el_post({ action: 'detect_finger_status' })
    if (!res.data?.success || !res.data.fingerPresent) {
      break // 手指已离开
    }
    await delay(200)
  }
}

onMounted(() => {
  startScanLoop()
})

onUnmounted(() => {
  isCancelled = true
  console.log('停止指纹监听')
})
</script>

<style scoped>
/* 样式保持不变，直接沿用你提供的即可 */
.finger-auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.finger-icon-box {
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 0.2rem;
  transition: all 0.3s;
}

.finger-svg {
  width: 0.8rem;
  height: 0.8rem;
  fill: #666;
  transition: fill 0.3s;
}

.status-text {
  font-size: 0.24rem;
  color: #888;
  transition: color 0.3s;
  height: 0.3rem;
  /* 固定高度防止跳动 */
}

.status-text.error-text {
  color: var(--error, #ff4d4f);
}

/* 状态样式 */
.is-active {
  background: rgba(0, 242, 255, 0.1);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
}

.is-active .finger-svg {
  fill: var(--primary, #00f2ff);
}

.is-error {
  background: rgba(255, 77, 79, 0.1);
  box-shadow: 0 0 15px rgba(255, 77, 79, 0.2);
}

.is-error .finger-svg {
  fill: var(--error, #ff4d4f);
}

.is-success {
  background: rgba(0, 255, 157, 0.1);
}

.is-success .finger-svg {
  fill: var(--success, #00ff9d);
}

/* 加载动画 */
.spinner {
  animation: rotate 2s linear infinite;
  width: 0.8rem;
  height: 0.8rem;
}

.path {
  stroke: var(--primary, #00f2ff);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }

  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }

  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>
