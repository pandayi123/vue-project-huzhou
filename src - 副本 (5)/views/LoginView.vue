<!--
这项设计可以提炼为一套基于RBAC（基于角色的访问控制）的分级权限体系与动态多因子/多人鉴权机制。

以下是为您整理的系统设计逻辑摘要，可直接用于技术文档或需求说明书中：

1. 权限体系设计 (RBAC Model)

系统采用三级金字塔权限模型，严格控制管理边界：

Level 1: 普通用户 (User)

权限范围：仅拥有基础业务操作权限（如存取、查询）。

管理能力：无账号管理权限。

Level 2: 管理员 (Admin)

权限范围：拥有“向下管理”权限。

管理能力：可增删改查 User 账号；不可创建、修改或删除 Admin 及更高等级账号（防止权限滥用或平行越权）。

Level 3: 系统管理员 (System Admin)

权限范围：拥有“全域管理”权限 (Root/Superuser)。

管理能力：可管理所有层级账号（含自身和其他 System Admin），拥有系统的最高控制权。

2. 登录鉴权逻辑 (Authentication Logic)

登录采用可配置的动态多人/多因子验证策略，由数据库字段直接驱动前端验证槽位（Slots）：

动态验证规则 (N+M+K 模型)：

需 N 人普通用户验证 (auth_user_required)

需 M 人管理员验证 (auth_admin_required)

需 K 人审批人/远程验证 (auth_approver_required)

注：当 auth_approver_required = 1 时，触发远程平台审批流程。

验证流程：
前端根据上述参数动态渲染验证卡片（Slot），用户需依次完成所有槽位的身份认证（人脸/指纹/密码/动态码）方可解锁进入系统。

3. 特权豁免策略 (Privilege Bypass)

超级通道：System Admin 账号具备最高优先级的鉴权豁免权。

逻辑表现：无论当前配置了何种复杂的多人验证规则（例如需要2管理员+1远程审批），一旦识别到登录者身份为 System Admin（通过人脸或专用动态码），系统将立即跳过剩余所有验证步骤，直接通过登录。

一句话总结：
系统实现了一个三级垂直权限管理架构，前端登录支持基于数据库配置的动态多人组合验证，并保留了系统管理员的无条件特权通行能力。
-->
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

// 1. 新增：已验证用户ID集合 (防止一人多饰)
// ======================================================
const verifiedUserIds = ref(new Set())

// ======================================================
// 2. 新增：统一身份核验后置处理器 (Gatekeeper)
//    所有验证方式(密码/OTP/人脸/指纹)最终都汇聚到这里进行“查重”
// ======================================================
const handleAuthSuccess = async (user) => {
  /*
  verificationSlots 元素属性结构
  interface VerificationSlot {
  id: number;               // 槽位唯一标识
  roleName: string;         // 角色名称（如“操作员”、“管理员”）
  type: string;             // 角色类型（如 'user', 'admin', 'approver'）
  verified: boolean;        // 是否已验证通过
  verifierInfo?: object;    // 可选：验证通过后的用户信息（如 `{ id: number, real_name: string, role: string }`）
  }
  */
  // --- 场景 A: 系统管理员/超级动态码 (直接通关) ---
  if (user.role === 'system_admin' || user.is_system_otp) {
    audioStore.play('/audio/系统管理员登录.mp3')
    verificationSlots.value.forEach((slot) => {
      slot.verified = true
      slot.roleName = '系统管理员'
    })
    triggerLoginSuccess()
    return
  }

  // --- 场景 B: 普通验证 (查重逻辑) ---

  // 1. [关键] 检查是否重复验证 (一人多饰漏洞修复)
  if (verifiedUserIds.value.has(user.id)) {
    errorMessage.value = `用户 [${user.real_name}] 已验证，请勿重复操作`
    hasError.value = true
    audioStore.play('/audio/同一账号禁止重复验证.mp3')
    return
  }

  // 2. 检查权限 (Role Mismatch)
  // 简单逻辑：如果当前格子需要 admin，但来的是 user，则拒绝
  // (注：admin 通常可以解锁 user 格子，视具体业务而定，这里写严格匹配)
  const requiredRole = currentSlot.value.type
  if (user.role !== requiredRole && user.role !== 'admin') {
    errorMessage.value = `权限不足：当前需要验证 [${currentSlot.value.roleName}]`
    hasError.value = true
    audioStore.play('/audio/权限不足当前需要验证管理员账号.mp3')
    return
  }

  // --- 验证通过 ---
  // 1. 记录 ID 防止再次使用
  verifiedUserIds.value.add(user.id)

  // 2. 更新 UI 状态
  if (currentSlot.value) {
    currentSlot.value.verified = true
    currentSlot.value.verifierInfo = user
  }

  // 3. 流程流转
  if (allVerified.value) {
    triggerLoginSuccess()
  } else {
    audioStore.play('/audio/验证通过.mp3')
    setTimeout(() => {
      activateNextUnverifiedSlot()
      resetInputs()
    }, 500)
  }
}
// ======================================================
// 4. 修改：生物识别模拟逻辑 (独立函数)
//    人脸/指纹 的查重逻辑在这里触发
// ======================================================
const simulateVerify = async (isSuccess) => {
  if (!isSuccess) return

  // 1. 模拟硬件回调的数据
  // 在实际代码中，这里不需要 if/else，而是直接使用硬件返回的 ID
  // 为了测试“一人多饰”漏洞，我们这里模拟：
  // 当前是 admin 格子 -> 返回 ID:2001 的管理员
  // 当前是 user 格子 -> 返回 ID:1001 的用户

  const mockUserMap = {
    user: { id: 1001, real_name: '王操作', role: 'user' },
    admin: { id: 2001, real_name: '李管理', role: 'admin' },
    approver: { id: 3001, real_name: '赵审批', role: 'approver' },
  }

  // 获取当前格子需要的角色类型
  const type = currentSlot.value ? currentSlot.value.type : 'user'

  // 模拟识别到了对应的人
  // 【测试漏洞时】：你可以把这里写死，例如始终返回 id: 2001
  // 这样当第二个 admin 格子验证时，handleAuthSuccess 就会报错
  let detectedUser = mockUserMap[type] || mockUserMap['user']

  // 2. 将模拟出的用户传给统一处理器
  // 所有的查重、权限判断都在 handleAuthSuccess 里发生
  handleAuthSuccess(detectedUser)
}
// ======================================================
// 5. 登录成功跳转
// ======================================================
const triggerLoginSuccess = () => {
  setTimeout(() => {
    const targetPath = route.query.redirect || '/'
    router.replace(targetPath)
  }, 1000)
}

// [新增] 工具函数：更新数据库字段 (用于回写失败次数、锁定状态)
const updateTerminalSettingsDB = async (updates) => {
  try {
    const payload = {
      tableName: 'terminal_settings',
      setValues: updates,
      condition: 'id=1',
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
    ['deriveBits'],
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
    KEY_LEN * 8,
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
  // if (!timerStore.isTimerActive) timerStore.startInterval()
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
// [新增] 修改一：更新用户表数据的工具函数
const updateUserDB = async (userId, updates) => {
  try {
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'users',
        setValues: updates,
        condition: `id=${userId}`,
      },
    })
  } catch (error) {
    console.error(`更新用户[${userId}]失败:`, error)
  }
}
// [新增] 修改二：提取通用的终端锁定/失败处理逻辑
const handleGlobalFailure = async (settings, now) => {
  const maxAttempts = settings.dynamic_code_max_attempts || 5
  // 读取当前失败次数 (默认为0)
  const currentFail = (settings.dynamic_code_current_failed_count || 0) + 1
  const remaining = maxAttempts - currentFail

  const updates = {
    dynamic_code_current_failed_count: currentFail,
  }

  let errorText = ''
  let audioPath = '/audio/验证失败.mp3'

  if (currentFail >= maxAttempts) {
    // 超过最大次数，锁定 30 分钟
    const lockDuration = 30 * 60 * 1000
    const lockDate = new Date(now.getTime() + lockDuration)
    // 写入锁定时间
    updates.dynamic_code_locked_until = toLocalDateTime(lockDate)
    errorText = '错误过多，系统已锁定30分钟'
    audioPath = '/audio/系统已锁定.mp3'
  } else {
    errorText = `验证失败，剩余 ${remaining} 次机会`
  }

  // 更新数据库
  await updateTerminalSettingsDB(updates)

  // 显示错误
  errorMessage.value = errorText
  hasError.value = true
  isVerifying.value = false
  audioStore.play(audioPath)
}
// [修改三] 重构后的验证主函数
const verifyCodeWithBackend = async (code) => {
  isVerifying.value = true
  const settings = terminalSettings.value

  // 1. 基础检查
  if (!settings) {
    errorMessage.value = '系统配置未加载'
    hasError.value = true
    isVerifying.value = false
    return
  }

  const now = new Date()

  // 2. 全局锁定检查 (针对 OTP 和 密码 均生效)
  if (settings.dynamic_code_locked_until) {
    const lockTime = new Date(settings.dynamic_code_locked_until.replace(/-/g, '/'))
    if (now < lockTime) {
      errorMessage.value = '系统已锁定，请30分钟后再试'
      audioStore.play(`/audio/系统已锁定.mp3`)
      hasError.value = true
      isVerifying.value = false
      return
    }
  }

  // =========================================================
  // 分支 A: 动态码 (OTP)
  // =========================================================
  if (currentMethod.value === 'otp') {
    // 检查过期
    if (settings.dynamic_code_expiry) {
      const expiry = new Date(settings.dynamic_code_expiry.replace(/-/g, '/'))
      if (now > expiry) {
        errorMessage.value = '动态码已过期'
        hasError.value = true
        isVerifying.value = false
        audioStore.play(`/audio/动态码已过期.mp3`)
        return
      }
    } else {
      errorMessage.value = '尚未设置动态码'
      hasError.value = true
      isVerifying.value = false
      audioStore.play(`/audio/尚未设置动态码.mp3`)
      return
    }

    try {
      // 验证哈希
      const inputHash = await computeHashForVerification(code, settings.dynamic_code_salt)

      if (inputHash === settings.dynamic_code_hash) {
        // --- OTP 成功 ---
        // 1. 清除终端全局错误计数
        await updateTerminalSettingsDB({
          dynamic_code_current_failed_count: 0,
          dynamic_code_locked_until: null,
        })

        // 2. 构造用户身份
        let identifiedUser = null
        if (settings.dynamic_code_permissions === 'system_admin') {
          identifiedUser = {
            id: 'SYS_OTP_USER',
            real_name: '动态码账号',
            role: 'system_admin',
            is_system_otp: true,
          }
        } else {
          identifiedUser = {
            id: 'SYS_OTP_USER',
            real_name: '动态码账号',
            role: settings.dynamic_code_permissions,
            is_system_otp: false,
          }
        }

        isVerifying.value = false
        handleAuthSuccess(identifiedUser)

      } else {
        // --- OTP 失败 ---
        // 调用通用失败处理 (累加计数、锁定)
        await handleGlobalFailure(settings, now)
      }
    } catch (e) {
      console.error(e)
      isVerifying.value = false
    }
  }

  // =========================================================
  // 分支 B: 密码 (Password)
  // =========================================================
  else if (currentMethod.value === 'password') {
    try {
      // 1. 查询所有用户 (使用 queryAll)
      const res = await window.electronAPI.el_post({
        action: 'queryAll',
        payload: {
          tableName: 'users',
          condition: 'status=1',
        },
      })

      let matchedUser = null
      let isUserPersonalLocked = false

      // 2. 遍历比对
      if (res && (Array.isArray(res) || Array.isArray(res.data))) {
        const userList = Array.isArray(res) ? res : res.data

        for (const user of userList) {
          if (!user.password_hash || !user.salt) continue

          const hash = await computeHashForVerification(code, user.salt)

          if (hash === user.password_hash) {
            // 密码对上了，检查个人锁定时间
            if (user.password_locked_until) {
              const lockTime = new Date(user.password_locked_until.replace(/-/g, '/'))
              if (now < lockTime) {
                isUserPersonalLocked = true
                break
              }
            }
            // 通过
            matchedUser = user
            matchedUser.role = user.password_permissions || user.role || 'user'
            break
          }
        }
      }

      // 3. 结果判断
      if (isUserPersonalLocked) {
        // 密码对但人被锁
        errorMessage.value = '该账号已被管理员锁定'
        hasError.value = true
        isVerifying.value = false
        audioStore.play('/audio/系统已锁定.mp3')
      }
      else if (matchedUser) {
        // --- 密码成功 ---

        // 1. 清除终端全局错误计数 (既然输入了正确密码，说明是自己人)
        await updateTerminalSettingsDB({
          dynamic_code_current_failed_count: 0,
          dynamic_code_locked_until: null,
        })

        // 2. 清除用户个人错误计数
        await updateUserDB(matchedUser.id, {
          password_current_failed_count: 0,
          password_locked_until: null,
        })

        isVerifying.value = false
        handleAuthSuccess(matchedUser)

      } else {
        // --- 密码失败 ---
        // 关键点：密码错误也调用 handleGlobalFailure
        // 这样可以共用 OTP 的计数器，输错密码也会导致终端锁定
        console.log('密码错误，计入终端错误次数')
        await handleGlobalFailure(settings, now)
      }

    } catch (e) {
      console.error('密码验证出错:', e)
      errorMessage.value = '系统内部错误'
      hasError.value = true
      isVerifying.value = false
    }
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
