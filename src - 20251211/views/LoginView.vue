<template>
  <div class="auth-wrapper">
    <!-- 1. 顶部：标题与状态 -->
    <header class="header">
      <div class="title-box">
        <div class="icon-shield">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path
              d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
          </svg>
        </div>
        <div>
          <h1>安全访问控制</h1>
          <p>请完成以下 {{ totalRequired }} 项身份验证</p>
        </div>
      </div>
      <button class="btn-close" @click="$router.back()">取消</button>
    </header>

    <!-- 2. 中部：动态验证槽位 -->
    <div class="slots-container">
      <div v-for="(slot, index) in verificationSlots" :key="slot.id" class="auth-slot" :class="{
        'is-active': currentSlotIndex === index,
        'is-verified': slot.verified,
      }" @click="activateSlot(index)">
        <div class="slot-status">
          <span v-if="slot.verified" class="icon-check">✓</span>
          <span v-else class="text-pending">{{ index + 1 }}</span>
        </div>
        <div class="slot-info">
          <span class="role-name">{{ slot.roleName }}</span>
          <span class="role-desc">{{ slot.verified ? '验证通过' : '待验证' }}</span>
        </div>
        <div class="active-bar"></div>
      </div>
    </div>

    <!-- 3. 底部：验证交互区 -->
    <transition name="slide-up">
      <div class="interaction-area" v-if="currentSlot && !currentSlot.verified">
        <!-- 验证方式切换 -->
        <div class="method-tabs">
          <div v-for="method in authMethods" :key="method.key" class="tab-item"
            :class="{ active: currentMethod === method.key }" @click="switchMethod(method.key)">
            <span class="tab-icon">{{ method.icon }}</span>
            <span>{{ method.label }}</span>
          </div>
        </div>

        <!-- 验证面板 -->
        <div class="auth-panel">
          <!-- A. 人脸识别模式 (已修改为 Video) -->
          <div v-if="currentMethod === 'face'" class="panel-face">
            <div class="video-container">
              <video ref="videoRef" autoplay muted class="camera-view"></video>
              <!-- 可选：添加扫描动画覆盖层 -->
              <div class="scan-line"></div>
              <div class="face-text-overlay">正在扫描 {{ currentSlot.roleName }}...</div>
            </div>
          </div>

          <!-- B. 指纹识别模式 -->
          <div v-if="currentMethod === 'finger'" class="panel-finger">
            <div class="finger-icon-box" @click="simulateVerify(true)">
              <svg viewBox="0 0 24 24" class="finger-svg">
                <path
                  d="M17.81 4.47c-.08 0-.16-.02-.23-.06C15.66 3.42 14 3 12.01 3c-1.98 0-3.86.47-5.57 1.41-.24.13-.54.04-.68-.2-.13-.24-.04-.55.2-.68C7.82 2.52 9.86 2 12.01 2c2.13 0 3.99.47 6.03 1.52.25.13.34.43.21.67-.09.18-.26.28-.44.28zM3.5 9.72c-.1 0-.2-.03-.29-.09-.23-.16-.28-.47-.12-.7.99-1.4 2.25-2.5 3.75-3.27C9.98 4.04 14 4.03 17.15 5.65c1.5.77 2.76 1.86 3.75 3.25.16.22.11.54-.12.7-.23.16-.54.11-.7-.12-.9-1.26-2.04-2.25-3.39-2.94-2.87-1.47-6.54-1.47-9.4.01-1.36.7-2.5 1.7-3.4 2.96-.08.14-.23.21-.39.21zm6.25 12.07c-.13 0-.26-.05-.35-.15-.87-1.03-1.34-2.33-1.34-3.64 0-1.31.47-2.61 1.34-3.64.23-.27.64-.3.91-.07.27.23.3.64.07.91-.63.74-.97 1.69-.97 2.65 0 .96.34 1.91.97 2.65.23.27.2.68-.07.91-.16.13-.37.2-.56.18zm-2.5-3.83c0-1.78.63-3.6 1.82-5.02.16-.19.45-.22.64-.06.19.16.22.45.06.64-1.01 1.2-1.53 2.72-1.53 4.22s.51 3.01 1.53 4.22c.16.19.13.48-.06.64-.19.16-.48.13-.64-.06-1.2-1.4-1.82-3.03-1.82-4.58zm5.5 4.54c-1.25 0-2.43-.5-3.32-1.38-.2-.19-.2-.51 0-.71.19-.2.51-.2.71 0 .7.69 1.62 1.08 2.61 1.08 1.96 0 3.56-1.59 3.56-3.56 0-1.96-1.59-3.56-3.56-3.56-1 0-1.92.39-2.61 1.09-.2.19-.51.19-.71 0-.19-.19-.19-.51 0-.71.89-0.89 2.07-1.38 3.32-1.38 2.51 0 4.56 2.05 4.56 4.56s-2.05 4.56-4.56 4.56z" />
              </svg>
            </div>
            <p>请按压指纹传感器</p>
          </div>

          <!-- C & D. 数字键盘模式 -->
          <div v-if="['password', 'otp'].includes(currentMethod)" class="panel-numpad">
            <div class="input-screen" :class="{ 'shake-anim': hasError }">
              <span class="input-label" :class="{ 'text-error': hasError }">
                {{
                  hasError
                    ? errorMessage
                    : currentMethod === 'otp'
                      ? '请输入 8 位动态验证码'
                      : '请输入 8 位数字密码'
                }}
              </span>
              <div class="dots">
                <span v-for="n in 8" :key="n" class="dot" :class="{
                  filled: getInputLength() >= n,
                  error: hasError,
                }"></span>
              </div>
            </div>

            <div class="numpad-grid" :class="{ disabled: isVerifying }">
              <button v-for="n in 9" :key="n" @click="handleNumpadInput(n)">{{ n }}</button>
              <button class="action-btn" @click="clearInput()">清空</button>
              <button @click="handleNumpadInput(0)">0</button>
              <button class="action-btn delete" @click="handleNumpadInput('del')">⌫</button>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 验证成功 -->
    <div v-if="allVerified" class="success-overlay">
      <div class="success-content">
        <div class="checkmark-circle">✓</div>
        <h2>验证通过</h2>
        <p>正在进入 {{ targetActionName }}...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, toRaw } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTimerStore } from '@/stores/timerStore'
import { useAudioStore } from '@/stores/audioStore'
const audioStore = useAudioStore()
const router = useRouter()
const route = useRoute()
const timerStore = useTimerStore()

const targetActionName = computed(() => route.query.actionName || '系统')

const auth_page = ref({
  auth_user_required: 0,
  auth_admin_required: 2,
  auth_approver_required: 1,
})

// 新增：存储从数据库获取的完整配置
const terminalSettings = ref(null)

const verificationSlots = ref([])
const currentSlotIndex = ref(0)
const currentMethod = ref('face')

// 输入状态
const otpInput = ref('')
const passwordInput = ref('')
const isVerifying = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const videoRef = ref(null) // 视频元素引用

const authMethods = [
  { key: 'face', label: '人脸', icon: '☺' },
  { key: 'finger', label: '指纹', icon: '☝' },
  { key: 'password', label: '密码', icon: '⌨' },
  { key: 'otp', label: '动态码', icon: '⏱' },
]

const currentSlot = computed(() => verificationSlots.value[currentSlotIndex.value])
const totalRequired = computed(() => verificationSlots.value.length)
const allVerified = computed(
  () =>
    verificationSlots.value.length > 0 && verificationSlots.value.every((slot) => slot.verified),
)


// [新增] 工具函数：更新数据库字段 (用于回写失败次数、锁定状态)
const updateTerminalSettingsDB = async (updates) => {
  try {
    const payload = {
      tableName: 'terminal_settings',
      setValues: updates,
      condition: 'id=1'
    }
    // 调用 electronAPI 更新
    await window.electronAPI.el_post({ action: 'update', payload: payload })

    // 同步更新本地状态，确保界面即时反应
    if (terminalSettings.value) {
      Object.assign(terminalSettings.value, updates)
    }
  } catch (error) {
    console.error('更新数据库失败:', error)
  }
}

// [新增] 工具函数：计算哈希 (用于验证)
// 逻辑严格对齐 plugins.js 中的加密方式
const computeHashForVerification = async (plainCode, saltHex) => {
  const ITERATIONS = 10000
  const KEY_LEN = 64
  const ALGO = 'SHA-512'

  const enc = new TextEncoder()

  // 1. 导入密钥材料
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(plainCode),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )

  // 2. 使用数据库中的 Salt 进行派生 (注意：plugins.js 使用 enc.encode(saltHex))
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode(saltHex),
      iterations: ITERATIONS,
      hash: ALGO,
    },
    keyMaterial,
    KEY_LEN * 8
  )

  // 3. 转 Hex 字符串
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return hashHex
}


const fetchData = async () => {
  console.log('fetchData')
  // 先执行一次开关列表刷新硬件状态
  const response = await window.electronAPI.el_post({
    action: 'queryMultipleTables',
    payload: {
      arr: [{ tablename: 'terminal_settings', condition: 'id=1' }],
    },
  })
  console.log('el_post调用返回的数据:', toRaw(response))
  if (response?.success && response.data) {
    const settings = response.data.terminal_settings
    console.log('终端设置数据terminal_settings加载成功:', toRaw(settings))

    // 1. 保存到 ref 中供验证逻辑使用
    terminalSettings.value = settings

    // 2. 根据数据库配置更新页面权限要求
    auth_page.value = {
      auth_user_required: settings.auth_user_required || 0,
      auth_admin_required: settings.auth_admin_required || 0,
      auth_approver_required: settings.auth_approver_required || 0,
    }

    // 3. 数据加载完毕后，重新生成验证插槽
    generateSlots()
  }
}
onMounted(() => {
  fetchData() // [修改] 建议先调用数据获取
  // generateSlots() // 可以注释掉这里的调用，改为在 fetchData 成功后调用
  if (timerStore.isTimerActive) timerStore.stopInterval()
  startCamera()
})

onUnmounted(() => {
  if (!timerStore.isTimerActive) timerStore.startInterval()
  // 停止摄像头流
  stopCamera()
})
const stopCamera = () => {
  if (videoRef.value) {
    videoRef.value.style.display = 'block'
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
}
const generateSlots = () => {
  const slots = []
  let idCounter = 1
  for (let i = 0; i < auth_page.value.auth_user_required; i++)
    slots.push({ id: idCounter++, roleName: '操作员', type: 'user', verified: false })
  for (let i = 0; i < auth_page.value.auth_admin_required; i++)
    slots.push({ id: idCounter++, roleName: '管理员', type: 'admin', verified: false })
  for (let i = 0; i < auth_page.value.auth_approver_required; i++)
    slots.push({ id: idCounter++, roleName: '审批人', type: 'approver', verified: false })
  verificationSlots.value = slots
  activateNextUnverifiedSlot()
}

const activateSlot = (index) => {
  if (!allVerified.value) {
    currentSlotIndex.value = index
    resetInputs()
  }
}

const switchMethod = (method) => {
  audioStore.play(`/audio/按钮点击声.mp3`)
  currentMethod.value = method
  resetInputs()
  // 切换回人脸时可能需要重新启动摄像头
  if (method === 'face') {
    startCamera()
  }
}

const resetInputs = () => {
  otpInput.value = ''
  passwordInput.value = ''
  hasError.value = false
  errorMessage.value = ''
}

const activateNextUnverifiedSlot = () => {
  const nextIndex = verificationSlots.value.findIndex((s) => !s.verified)
  if (nextIndex !== -1) currentSlotIndex.value = nextIndex
}

const getInputLength = () => {
  return currentMethod.value === 'otp' ? otpInput.value.length : passwordInput.value.length
}

const clearInput = () => {
  audioStore.play(`/audio/清空.mp3`)
  if (isVerifying.value) return
  if (currentMethod.value === 'otp') otpInput.value = ''
  else passwordInput.value = ''
  hasError.value = false
}

const handleNumpadInput = (val) => {
  audioStore.play(`/audio/敲键盘通用声音.mp3`)
  if (isVerifying.value) return

  if (hasError.value) {
    hasError.value = false
    errorMessage.value = ''
    if (currentMethod.value === 'otp') otpInput.value = ''
    else passwordInput.value = ''
  }

  const targetRef = currentMethod.value === 'otp' ? otpInput : passwordInput

  if (val === 'del') {
    targetRef.value = targetRef.value.slice(0, -1)
  } else {
    if (targetRef.value.length < 8) targetRef.value += val
  }

  if (targetRef.value.length === 8) {
    verifyCodeWithBackend(targetRef.value)
  }
}
// 摄像头管理
let mediaStream = null // 媒体流对象
const startCamera = async () => {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: false,
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
  }
}
const verifyCodeWithBackend = async (code) => {
  isVerifying.value = true
  // 模拟一点延迟，增加交互感
  // await new Promise((resolve) => setTimeout(resolve, 300))

  const settings = terminalSettings.value

  // 1. 容错：如果配置还没加载下来
  if (!settings) {
    errorMessage.value = '系统配置未加载'
    hasError.value = true
    isVerifying.value = false
    return
  }

  const now = new Date()

  // 2. [新增] 检查系统是否已锁定
  if (settings.dynamic_code_locked_until) {
    // 兼容处理时间格式
    const lockTime = new Date(settings.dynamic_code_locked_until.replace(/-/g, '/'))
    if (now < lockTime) {
      errorMessage.value = '系统已锁定，请30分钟后再试'
      audioStore.play(`/audio/系统已锁定.mp3`)
      hasError.value = true
      isVerifying.value = false
      return
    }
  }

  // 3. [新增] 检查动态码是否过期
  if (currentMethod.value === 'otp') {
    if (settings.dynamic_code_expiry) {
      const expiry = new Date(settings.dynamic_code_expiry.replace(/-/g, '/'))
      console.log('动态码过期时间:', expiry)
      if (now > expiry) {
        errorMessage.value = '动态码已过期'
        audioStore.play(`/audio/动态码已过期.mp3`)
        hasError.value = true
        isVerifying.value = false
        return
      }
    } else {
      errorMessage.value = '尚未设置动态码'
      audioStore.play(`/audio/尚未设置动态码.mp3`)
      hasError.value = true
      isVerifying.value = false
      return
    }
  }

  let isValid = false
  let isSystemAdmin = false

  // 4. [修改] 执行验证逻辑
  if (currentMethod.value === 'otp') {
    try {
      // 从数据库获取 Salt 和 Hash
      const dbSalt = settings.dynamic_code_salt || ''
      const dbHash = settings.dynamic_code_hash

      // 计算用户输入的 Hash
      const inputHash = await computeHashForVerification(code, dbSalt)

      // 比对
      if (inputHash === dbHash) {
        console.log('动态码验证成功')
        isValid = true
        // 检查是否是超级管理员权限
        if (settings.dynamic_code_permissions === 'system_admin') {
          isSystemAdmin = true
        }
      }
    } catch (e) {
      console.error('哈希计算出错:', e)
      isValid = false
    }
  } else {
    // 密码模式保持原样（或者你自己扩展）
    if (code === '66668888') isValid = true
  }

  // 5. [新增] 处理验证结果
  if (isValid) {
    // --- 验证成功 ---
    if (currentMethod.value === 'otp') {
      // 成功后清空失败计数和锁定时间
      await updateTerminalSettingsDB({
        dynamic_code_current_failed_count: 0,
        dynamic_code_locked_until: null
      })
    }

    isVerifying.value = false

    // 如果是 System Admin 且是动态码模式，直接全部通过
    if (isSystemAdmin && currentMethod.value === 'otp') {
      verificationSlots.value.forEach(slot => slot.verified = true)
      simulateVerify(true)
    } else {
      // 普通验证通过
      simulateVerify(true)
    }

  } else {
    // --- 验证失败 ---
    hasError.value = true
    let errorText = '验证失败'

    if (currentMethod.value === 'otp') {
      // 计算剩余次数
      const maxAttempts = settings.dynamic_code_max_attempts || 5
      const currentFail = (settings.dynamic_code_current_failed_count || 0) + 1
      const remaining = maxAttempts - currentFail

      const updates = {
        dynamic_code_current_failed_count: currentFail
      }

      if (currentFail >= maxAttempts) {
        // 超过最大次数，锁定 30 分钟
        const lockDuration = 30 * 60 * 1000
        const lockDate = new Date(now.getTime() + lockDuration)
        // 使用 plugins 里的格式化函数
        updates.dynamic_code_locked_until = toLocalDateTime(lockDate)
        errorText = '错误过多，系统已锁定'
      } else {
        errorText = `验证失败，剩余 ${remaining} 次`
      }
      audioStore.play(`/audio/动态码验证失败.mp3`)
      // 写入数据库
      await updateTerminalSettingsDB(updates)
    } else {
      errorText = '密码错误'
      audioStore.play(`/audio/密码错误.mp3`)
    }
    errorMessage.value = errorText
    isVerifying.value = false
  }
}
// [新增] 本地时间格式化函数 (修复 plugins.toLocalDateTime 报错问题)
const toLocalDateTime = (date) => {
  const d = date || new Date()
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0') +
    ' ' +
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0') +
    ':' +
    String(d.getSeconds()).padStart(2, '0')
  )
}
const simulateVerify = (success) => {
  // 1. 安全检查
  // 只有当验证结果为 true (success) 且 当前确实选中了一个验证槽位 (currentSlot.value) 时才执行
  if (success && currentSlot.value) {

    // 2. 更新当前状态
    // 将当前正在验证的那个角色（例如“操作员”）的状态标记为“已通过”
    // 这会让界面上对应的卡片显示绿色的钩号 (✓)
    currentSlot.value.verified = true

    // 3. 检查是否所有人都验证通过了
    // allVerified 是一个 computed 属性，只有当列表里所有角色都 verified=true 时才为 true
    if (allVerified.value) {

      // === 分支 A：全部验证完成 ===

      // 设置 1000毫秒 (1秒) 的延时
      // 目的：让用户看清楚“验证通过”的成功动画（success-overlay），提升用户体验
      setTimeout(() => {
        // 获取跳转目标地址
        // 如果 URL 参数里有 redirect（例如 ?redirect=/settings），就跳过去
        // 否则默认跳转到首页 '/'
        const targetPath = route.query.redirect || '/'

        // 执行路由跳转，使用 replace 而不是 push，防止用户按“返回”键回到登录页
        router.replace(targetPath)
      }, 1000)

    } else {

      // === 分支 B：还有人没验证（例如管理员验证了，审批人还没）===

      // 设置 500毫秒 (0.5秒) 的延时
      // 目的：让当前角色的卡片先变绿，稍微停顿一下，再自动跳到下一个格子
      setTimeout(() => {
        // 调用辅助函数，自动选中下一个还没验证的格子
        activateNextUnverifiedSlot()

        // 清空输入框（密码/动态码），重置错误提示
        // 确保下一个人验证时界面是干净的
        resetInputs()
      }, 500)
    }
  }
}
</script>

<style scoped>
/* 保持原有基础样式不变 */
.auth-wrapper {
  --primary: #00f2ff;
  --primary-dark: #0099a1;
  --success: #00ff9d;
  --error: #ff4d4f;
  --bg-dark: #0a0e17;
  --card-bg: #141b2d;
  --border: #2a3546;
  --active-bg: #1c2538;

  font-size: 0.25rem;
  width: 100%;
  height: 100vh;
  background-color: var(--bg-dark);
  color: #fff;
  font-family: 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  user-select: none;
  transform: translateZ(0);
}

.header {
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.21rem 0.42rem;
  background: #11151f;
  border-bottom: 1px solid var(--border);
}

.title-box {
  display: flex;
  align-items: center;
  gap: 0.21rem;
}

.icon-shield {
  width: 0.57rem;
  height: 0.57rem;
  color: var(--primary);
}

.title-box h1 {
  margin: 0;
  font-size: 0.3rem;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.title-box p {
  margin: 0;
  font-size: 0.23rem;
  color: #888;
  margin-top: 0.04rem;
}

.btn-close {
  background: transparent;
  border: 1px solid var(--border);
  color: #ccc;
  padding: 0.11rem 0.28rem;
  font-size: 0.25rem;
  border-radius: 0.07rem;
  cursor: pointer;
  transition:
    background-color 0.2s,
    color 0.2s;
}

.btn-close:active {
  background: #333;
  color: #fff;
}

.slots-container {
  z-index: 10;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.28rem;
  padding: 0.42rem 0;
  flex-shrink: 0;
}

.auth-slot {
  width: 2.3rem;
  height: 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 0.14rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition:
    border-color 0.2s,
    background-color 0.2s;
  overflow: hidden;
}

.auth-slot.is-active {
  background-color: var(--active-bg);
  border-color: var(--primary);
}

.auth-slot.is-verified {
  background-color: #0f221a;
  border-color: #005533;
}

.slot-status {
  width: 0.35rem;
  height: 0.35rem;
  background: #0e3f96;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.11rem;
  font-size: 0.21rem;
  color: #fff;
}

.auth-slot.is-verified .icon-check {
  color: var(--success);
  font-size: 0.21rem;
}

.auth-slot.is-verified .role-name {
  color: var(--success);
}

.role-name {
  font-weight: 600;
  font-size: 0.25rem;
}

.role-desc {
  font-size: 0.25rem;
  color: #666;
  margin-top: 0.04rem;
}

.active-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary);
  transform: scaleX(0);
  transition: transform 0.2s;
}

.auth-slot.is-active .active-bar {
  transform: scaleX(1);
}

.interaction-area {
  z-index: 10;
  flex: 1;
  background: #11151f;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 0.35rem;
  margin-top: auto;
}

.method-tabs {
  display: flex;
  justify-content: center;
  gap: 0.21rem;
  margin-bottom: 0.42rem;
}

.tab-item {
  padding: 0.11rem 0.28rem;
  border-radius: 0.11rem;
  background: #2a3546;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.11rem;
  font-size: 0.25rem;
  border: 1px solid transparent;
  color: #aaa;
}

.tab-item.active {
  background: var(--primary-dark);
  color: #fff;
  border-color: var(--primary);
}

.auth-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 0.18rem;
}

/* === 修改部分：视频区域样式 === */
.panel-face {
  width: 100%;
  display: flex;
  justify-content: center;
}

.video-container {
  width: 5.8rem;
  /* 调整方形宽度 */
  height: 5rem;
  /* 调整方形高度，形成矩形或正方形 */
  background: #000;
  border: 2px solid var(--primary);
  border-radius: 0.14rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0.3rem rgba(0, 242, 255, 0.15);
}

.camera-view {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* 保证视频填满容器 */
}

/* 扫描线动画 */
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
}

/* === 结束修改部分 === */

.finger-svg {
  width: 1.13rem;
  height: 1.13rem;
  fill: #444;
  transition: fill 0.2s;
}

.finger-icon-box:active .finger-svg {
  fill: var(--primary);
}

.panel-finger p {
  margin-top: 0.18rem;
  font-size: 0.23rem;
  color: #888;
}

.panel-finger {
  text-align: center;
  padding-top: 0.35rem;
}

.panel-numpad {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 4.6rem;
}

.input-screen {
  margin-bottom: 0.28rem;
  text-align: center;
}

.input-label {
  font-size: 0.23rem;
  color: #888;
  transition: color 0.3s;
}

.input-label.text-error {
  color: var(--error);
}

.dots {
  display: flex;
  gap: 0.14rem;
  justify-content: center;
  margin-top: 0.14rem;
}

.dot {
  width: 0.14rem;
  height: 0.14rem;
  border-radius: 50%;
  background: #333;
  transition: background-color 0.1s;
}

.dot.filled {
  background: var(--primary);
}

.dot.error {
  background: var(--error);
}

.numpad-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.18rem;
  width: 100%;
  transition: opacity 0.3s;
}

.numpad-grid.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.numpad-grid button {
  background: #1f2636;
  border: 1px solid #2a3546;
  color: #fff;
  font-size: 0.32rem;
  height: 0.85rem;
  border-radius: 0.11rem;
  cursor: pointer;
}

.numpad-grid button:active {
  background: var(--primary-dark);
  border-color: var(--primary);
}

.numpad-grid .action-btn {
  font-size: 0.23rem;
  color: #888;
}

.shake-anim {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
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

.success-overlay {
  position: absolute;
  inset: 0;
  background: #0a0e17;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.success-content {
  text-align: center;
}

.checkmark-circle {
  width: 1.06rem;
  height: 1.06rem;
  background: var(--success);
  color: #000;
  font-size: 0.57rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.28rem;
}

.success-content h2 {
  margin: 0 0 0.09rem 0;
  font-size: 0.35rem;
}

.success-content p {
  margin: 0;
  font-size: 0.23rem;
  color: #888;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition:
    transform 0.3s,
    opacity 0.3s;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(0.35rem);
  opacity: 0;
}
</style>
