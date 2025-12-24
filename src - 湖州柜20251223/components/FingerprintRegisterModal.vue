<template>
  <el-dialog v-model="visible" title="生物指纹录入" width="420px" class="cyber-dialog-person" :append-to-body="true"
    :close-on-click-modal="false" :destroy-on-close="true" @open="initEnrollment" @close="handleClose">
    <div class="finger-modal-body">
      <!-- 顶部提示信息 -->
      <div class="target-info">
        正在为 <span class="highlight">{{ personName }}</span> ({{ maskIdCard(idCard) }})采集指纹
      </div>

      <!-- 中间指纹扫描区 -->
      <div class="scan-container">
        <div class="finger-icon-box" :class="statusClass">
          <el-icon :size="120">
            <template v-if="status === 'success'">
              <CircleCheckFilled />
            </template>
            <template v-else-if="status === 'error'">
              <CircleCloseFilled />
            </template>
            <!-- 待抬起状态显示空心或特殊样式，提示用户松手 -->
            <template v-else-if="status === 'waiting_lift'">
              <Pointer style="transform: scale(1.1) rotate(-15deg); opacity: 0.5" />
            </template>
            <template v-else>
              <Pointer style="transform: scale(1.2) rotate(-15deg)" />
            </template>
          </el-icon>

          <!-- 扫描光效 (仅在扫描中显示) -->
          <div v-if="status === 'scanning'" class="scan-beam"></div>

          <!-- 脉冲波纹 (仅在等待按压时显示) -->
          <div v-if="status === 'waiting_press'" class="pulse-ring"></div>

          <!-- [新增] 抬起提示动画 (向上的箭头或扩散圈，这里用反向脉冲模拟) -->
          <div v-if="status === 'waiting_lift'" class="lift-ring"></div>
        </div>
      </div>

      <!-- [新增] 3次采集步骤指示器 -->
      <div class="step-dots" v-if="status !== 'success' && status !== 'error'">
        <div class="dot" :class="{ active: currentStep >= 1 }"></div>
        <div class="dot" :class="{ active: currentStep >= 2 }"></div>
        <div class="dot" :class="{ active: currentStep >= 3 }"></div>
      </div>

      <!-- 底部状态文字与进度 -->
      <div class="status-footer">
        <div class="status-text" :class="statusClass">{{ statusText }}</div>

        <!-- 进度条 -->
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" :style="{ width: displayProgress + '%' }"></div>
        </div>

        <div class="hint-text">
          {{ hintText }}
        </div>
      </div>
    </div>

    <!-- 底部按钮区域 -->
    <template #footer>
      <div class="dialog-footer centered" v-if="status === 'error'">
        <button class="cyber-btn" @click="retry">重新录入</button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, toRaw } from 'vue'
import { Pointer, CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { useAudioStore } from '@/stores/audioStore'

const props = defineProps({
  modelValue: Boolean,
  personName: String,
  idCard: String,
  // 新增：接收终端ID，给定一个默认值防止父组件没传
  terminalId: {
    type: String,
    default: 'terminal_001'
  }
})

const emit = defineEmits(['update:modelValue', 'success'])
const audioStore = useAudioStore()

// --- 状态定义 ---
const status = ref('ready')
const currentStep = ref(0)
const customStatusText = ref('')
const isProcessing = ref(false)
let isCancelled = false

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// --- UI 计算属性 (保持不变，此处省略以节省篇幅，沿用你原来的即可) ---
// ... (displayProgress, statusText, hintText, statusClass, maskIdCard 逻辑与原代码一致)
const displayProgress = computed(() => {
  if (status.value === 'success') return 100

  // 错误状态保持当前进度
  if (status.value === 'error')
    return Math.max(0, currentStep.value > 0 ? currentStep.value - 1 : 0) * 33.3

  let baseProgress = 0
  if (currentStep.value > 0) {
    // 基础进度：完成一步增加 33.3%
    baseProgress += (currentStep.value - 1) * 33.3

    // 【修改点】在这里加上 || status.value === 'waiting_lift'
    // 只要是 扫描中、处理中、或者 等待抬起，都应该保持较高的进度
    if (
      status.value === 'scanning' ||
      status.value === 'processing' ||
      status.value === 'waiting_lift'
    ) {
      baseProgress += 16
    }
  }
  return Math.min(baseProgress, 100)
})

const statusText = computed(() => {
  if (customStatusText.value) return customStatusText.value
  switch (status.value) {
    case 'ready':
      return '准备就绪'
    case 'waiting_press':
      return `请第 ${currentStep.value} 次按压手指`
    case 'scanning':
      return '正在读取指纹...'
    case 'waiting_lift':
      return '读取成功，请抬起手指'
    case 'processing':
      return '正在合成特征...'
    case 'success':
      return '指纹录入完成'
    case 'error':
      return '操作失败'
    default:
      return '未知状态'
  }
})
const hintText = computed(() => {
  if (status.value === 'waiting_press') return '请使用同一根手指重复按压'
  if (status.value === 'waiting_lift') return '松开手指以便进行下一次采集'
  if (status.value === 'scanning') return '请保持手指静止不动'
  if (status.value === 'success') return '数据已自动保存'
  return ''
})
const statusClass = computed(() => ({
  'is-success': status.value === 'success',
  'is-error': status.value === 'error',
  'is-active': status.value === 'scanning' || status.value === 'processing',
  'is-lift': status.value === 'waiting_lift',
}))
const maskIdCard = (val) =>
  !val || val.length <= 8 ? val : val.slice(0, 4) + '**********' + val.slice(-4)

// --- 核心工具函数 ---

// 简单的延时函数
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * [优化] 播放语音并强制等待一段时间
 * 确保用户听完提示，并且留有反应时间
 * @param {string} audioPath 音频路径
 * @param {number} minDuration 最小等待时间(ms)，防止语音过短导致UI闪烁
 */
const playVoiceWithDelay = async (audioPath, minDuration = 1500) => {
  if (isCancelled) return

  const audioPromise = audioStore.play(audioPath) // 假设 store 返回 Promise
  const delayPromise = delay(minDuration)

  // 等待两者都完成
  await Promise.all([audioPromise, delayPromise])
}

// --- 核心流程函数 ---

/**
 * [优化版] 核心录入流程
 * 逻辑：提示 -> 等待手指按下 -> 缓冲300ms -> 采集图像 -> 提示抬起
 */
/*
流程开始前：先查数据库。
  1.如果数据库里这个人有指纹记录 -> 取出旧的硬件ID (bio_subtype) 作为目标 ID。
  2.如果数据库里这个人无指纹记录 -> 询问硬件获取一个新的可用 ID。
流程最后：
  1.先删除目标 ID ,如果有的话(确保干净)。
  2.写入目标 ID。
更新数据库。
*/
const initEnrollment = async () => {
  if (isProcessing.value) return
  isProcessing.value = true
  isCancelled = false

  status.value = 'ready'
  currentStep.value = 0
  customStatusText.value = ''

  try {
    console.log('1')
    // --- 步骤 1: 检查指纹库容量 ---
    customStatusText.value = '正在核验身份记录...'
    // 定义一个变量来存储我们要操作的硬件ID
    let targetHardwareIndex = -1
    // A. 先去 biometrics 表查一下，这个人之前有没有录过指纹
    const dbCheckRes = await window.electronAPI.el_post({
      action: 'query',
      payload: {
        tableName: 'biometrics',
        // 注意：这里 idCard 必须加引号
        condition: `user_id_card = '${props.idCard}' AND bio_type = 'fingerprint'`
      }
    });
    console.log('[重录] 数据库查询结果:', toRaw(dbCheckRes))


    if (dbCheckRes && dbCheckRes.data) {
      // --- 情况 A: 数据库有记录 (编辑模式/重录) ---
      // 从 bio_subtype 字段拿回之前的硬件ID
      // 注意：数据库取出来可能是字符串，最好转一下 Number
      targetHardwareIndex = Number(dbCheckRes.data.bio_subtype);
      console.log(`[重录] 检测到已存在指纹记录，沿用硬件 ID: ${targetHardwareIndex}`);

      customStatusText.value = '检测到旧指纹，准备覆盖...'
      await delay(500);
    } else {
      // --- 情况 B: 数据库无记录 (新增模式) ---
      // 询问硬件要一个新的空位
      customStatusText.value = '正在分配存储空间...'
      const checkRes = await window.electronAPI.el_post({ action: 'check_fingerprint_status' });

      if (isCancelled) return
      if (!checkRes.data?.success) throw new Error(checkRes.data?.message || '检查指纹库失败')

      targetHardwareIndex = checkRes.data.availableIndex;
      console.log(`[新增] 分配新硬件 ID: ${targetHardwareIndex}`);
    }

    // 再次确认 ID 有效
    if (!targetHardwareIndex || targetHardwareIndex < 0) {
      throw new Error("无法分配有效的指纹存储ID");
    }

    // --- 步骤 2: 3次循环采集 ---
    for (let i = 1; i <= 3; i++) {
      if (isCancelled) return
      currentStep.value = i

      // ==============================
      // 阶段 A: 等待按压与采集
      // ==============================
      status.value = 'waiting_press'
      customStatusText.value = '' // 使用默认提示 "请第 N 次按压"

      // 1. 播放语音，并给予用户反应时间
      await playVoiceWithDelay('/audio/请按压指纹仪.mp3')

      let captureSuccess = false
      let loopCount = 0

      // 外层循环：直到采集到合格图像为止
      while (!captureSuccess) {
        if (isCancelled) return

        // --- 子步骤 A1: 循环检测手指是否放上去了 ---
        let fingerDetected = false
        while (!fingerDetected) {
          if (isCancelled) return

          // 使用轻量级指令检测手指状态
          const detectRes = await window.electronAPI.el_post({ action: 'detect_finger_status' })
          if (detectRes.data?.success && detectRes.data.fingerPresent) {
            console.log('检测到手指按压')
            fingerDetected = true
          } else {
            // 没检测到，等待 200ms 后重试
            await delay(200)

            // 超时检查 (可选)
            loopCount++
            if (loopCount > 30) {
              console.log('等待超时，请重新开始')
              throw new Error('等待超时，请重新开始')
            }
          }
        }

        // --- 子步骤 A2: 缓冲期 (关键优化) ---
        // 检测到手指后，不要立即采集！
        // 等待 300ms 让指腹皮肤完全贴合传感器，这一步能极大提高图像质量
        customStatusText.value = '正在读取指纹信息...' // 视觉反馈：状态变为读取中
        await delay(300)

        // --- 子步骤 A3: 执行采集 ---
        if (isCancelled) return
        const imageResult = await window.electronAPI.el_post({ action: 'get_fingerprint_image' })

        if (imageResult.data?.success) {
          captureSuccess = true
          console.log('指纹采集成功')
        } else {
          // 采集失败（可能是手指按太快又抬起了，或者太干）
          customStatusText.value = '采集失败，请重新放置手指'
          console.log('指纹采集失败')
          status.value = 'error' // 短暂显示错误红圈
          await delay(800) // 让用户看到错误提示
          status.value = 'waiting_press' // 恢复等待状态
          customStatusText.value = ''
          // 循环继续，重新检测手指
        }
      }

      // ==============================
      // 阶段 B: 扫描光效与特征生成
      // ==============================
      status.value = 'scanning'
      customStatusText.value = '正在提取指纹特征'
      await delay(600) // 视觉停顿，展示扫描动画

      const genRes = await window.electronAPI.el_post({
        action: 'generate_fingerprint_template',
        payload: { bufferId: i - 1 },
      })

      if (isCancelled) return
      if (!genRes.data?.success) {
        console.log('指纹特征提取失败')
        throw new Error('特征提取失败，请重试')
      } else {
        console.log('指纹特征提取成功')
      }

      // ==============================
      // 阶段 C: 提示抬起 (严格检测)
      // ==============================
      status.value = 'waiting_lift'

      customStatusText.value =
        i === 3 ? '特征提取完成，正在合成指纹模板...' : '特征提取成功，请松开手指'

      // 即使是最后一次，也强制要求用户抬起，保证流程闭环
      // 这里可以根据 i 的值播放不同语音，例如最后一次可以说"即将完成"
      const liftAudio = i === 3 ? '/audio/特征提取完成.mp3' : '/audio/特征提取成功.mp3'
      await playVoiceWithDelay(liftAudio, 1000)

      let isLifted = false
      let liftAttempts = 0
      do {
        if (isCancelled) return
        const detectRes = await window.electronAPI.el_post({ action: 'detect_finger_status' })

        // 目标：fingerPresent 必须为 false
        isLifted = detectRes.data?.success && !detectRes.data.fingerPresent

        if (!isLifted) {
          await delay(200)
          liftAttempts++
          if (liftAttempts > 30) throw new Error('请抬起手指以便继续')
        }
      } while (!isLifted)

      // 抬起后稍作停顿，避免界面跳变太快
      await delay(500)
    }

    // --- 步骤 3: 合成模板 ---
    if (isCancelled) return
    status.value = 'processing'

    const mergeRes = await window.electronAPI.el_post({ action: 'merge_fingerprint_templates' })
    console.log('merge_fingerprint_templates:', toRaw(mergeRes))
    if (!mergeRes.data?.success) throw new Error('指纹合成失败，请重试')

    // --- 步骤 4: 存储 ---
    if (isCancelled) return
    customStatusText.value = '模板合成成功，正在保存指纹数据...'

    // 1. 删除硬件中指定位置的数据 (无论是旧的还是新的，先删确保干净)
    // 这里使用我们在步骤1里确定好的 targetHardwareIndex
    const deleteRes = await window.electronAPI.el_post({
      action: 'delete_fingerprint_template',
      payload: { id: targetHardwareIndex } // 只删除这一个 ID
    })
    console.log(`删除硬件旧模板 ID ${targetHardwareIndex}:`, toRaw(deleteRes))

    // 2. 将合成好的 Buffer 存入硬件的指定位置
    const storeRes = await window.electronAPI.el_post({
      action: 'store_fingerprint_template',
      payload: { templateId: targetHardwareIndex },
    })
    console.log('store_fingerprint_template:', toRaw(storeRes))

    await delay(500)
    // if (isCancelled) return
    if (!storeRes.data?.success) {
      if (storeRes.data?.duplicate) {
        throw new Error(`保存失败，指纹已存在 (ID: ${storeRes.data.duplicateId})`)
      }
      throw new Error('存储失败')
    }

    customStatusText.value = '正在同步数据库记录...';
    // 1. 获取指纹特征数据
    // 注意：你需要确保上一步 mergeRes.data 里返回了合成后的指纹模板数据 (base64字符串)
    // 如果 mergeRes 没有返回，你需要去检查后端 merge_fingerprint_templates 的返回值
    const finalTemplateData = mergeRes.data.templateData || mergeRes.data.data;

    if (!finalTemplateData) {
      console.warn('警告: mergeRes 未返回指纹模板数据，数据库将无法存储特征值');
    }

    // 2. 发送保存请求
    const dbSaveRes = await window.electronAPI.el_post({
      action: 'saveFingerprintTemplate', // <--- 这是我们要去后端监听的新动作名
      payload: {
        userIdCard: props.idCard,        // 身份证号 (必填)
        userName: props.personName,      // 姓名 (选填)
        storedIndex: targetHardwareIndex,     // 硬件里的指纹ID (必填, 例如 1)
        fingerprintData: finalTemplateData, // 指纹特征值 (必填)
        terminalId: props.terminalId // 终端ID (必填)
      }
    });

    console.log('数据库保存结果:', toRaw(dbSaveRes));

    if (!dbSaveRes.data?.success) {
      // 如果数据库保存失败，不仅要报错，理论上可能还需要回滚硬件存储(可选)
      throw new Error('数据库保存失败: ' + (dbSaveRes.data?.message || '未知错误'));
    }

    // --- 全部完成 ---
    status.value = 'success'
    customStatusText.value = ''
    console.log('指纹录入成功')
    await playVoiceWithDelay('/audio/指纹录入成功.mp3', 1000)

    emit('success')
    handleClose()
  } catch (error) {
    if (isCancelled) return
    console.error('error:', error)
    status.value = 'error'
    customStatusText.value = error.message // 界面显示具体错误
    audioStore.play('/audio/指纹录入失败.mp3')
  } finally {
    isProcessing.value = false
  }
}

const retry = () => {
  initEnrollment()
}

const handleClose = () => {
  isCancelled = true
  visible.value = false
}
</script>

<style scoped>
/* ================= 布局与弹窗主体 ================= */
.finger-modal-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: #fff;
  /* 确保背景足够深，以便光效显示 */
  background: radial-gradient(circle at center, #1a2a3a 0%, #0b1116 100%);
}

.target-info {
  color: #8899a6;
  font-size: 14px;
  margin-bottom: 15px;
  text-align: center;
}

.target-info .highlight {
  color: #00f2ff;
  font-weight: bold;
}

/* ================= 扫描区域核心 ================= */
.scan-container {
  width: 180px;
  height: 180px;
  border: 1px solid rgba(0, 242, 255, 0.2);
  background: rgba(0, 0, 0, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
  margin-bottom: 20px;
}

.finger-icon-box {
  color: #4a5c76;
  transition: all 0.5s;
  position: relative;
  z-index: 1;
}

.finger-icon-box.is-active {
  color: var(--primary, #00f2ff);
  text-shadow: 0 0 10px var(--primary, #00f2ff);
}

.finger-icon-box.is-success {
  color: var(--success, #67c23a);
  transform: scale(1.1);
}

.finger-icon-box.is-error {
  color: var(--error, #f56c6c);
  animation: shake 0.5s;
}

.finger-icon-box.is-lift {
  color: #ffd700;
  /* 修改为金色提示 */
  opacity: 0.8;
}

/* ================= 动效 ================= */
/* 扫描光束 */
.scan-beam {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--primary, #00f2ff);
  box-shadow: 0 0 10px var(--primary, #00f2ff);
  opacity: 0.8;
  animation: scanMove 1s infinite linear;
  z-index: 2;
}

/* 等待按压的脉冲 */
.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 2px solid var(--primary, #00f2ff);
  opacity: 0;
  animation: pulse 2s infinite;
}

/* 抬起提示动画 */
.lift-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  height: 80%;
  border-radius: 50%;
  border: 2px dashed #ffd700;
  opacity: 0;
  animation: liftPulse 1.5s infinite;
}

/* ================= 步骤条 ================= */
.step-dots {
  display: flex;
  gap: 12px;
  margin-bottom: 15px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #333;
  border: 1px solid #555;
  transition: all 0.3s;
}

.dot.active {
  background: var(--primary, #00f2ff);
  box-shadow: 0 0 5px var(--primary, #00f2ff);
  border-color: var(--primary, #00f2ff);
}

/* ================= 底部状态栏 ================= */
.status-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-text {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
  height: 24px;
}

.status-text.is-active {
  color: var(--primary, #00f2ff);
}

.status-text.is-success {
  color: var(--success, #67c23a);
}

.status-text.is-error {
  color: var(--error, #f56c6c);
}

.status-text.is-lift {
  color: #ffd700;
}

.hint-text {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  height: 18px;
}

.progress-bar-bg {
  width: 240px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
  margin: 5px 0;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #00f2ff, #00aaff);
  transition: width 0.3s ease;
}

/* ================= 底部按钮 (修复居中与样式) ================= */

/* 1. 修复居中: 添加 display: flex */
.dialog-footer.centered {
  display: flex;
  /* 关键 */
  justify-content: center;
  /* 居中 */
  align-items: center;
  width: 100%;
  padding-bottom: 20px;
  /* 增加底部留白 */
  margin-top: -10px;
  /* 微调位置 */
}

/* 2. 赛博朋克风格按钮样式 (青色科技风) */
.cyber-btn {
  width: 200px;
  height: 40px;
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%);
  border: 1px solid #00f2ff;
  color: #fff;
  position: relative; /* 保持相对定位 */
  display: flex; /* 用于文字居中 */
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
  transition: all 0.3s;
  margin-top:20px;
}

.cyber-btn:hover {
  background: linear-gradient(90deg, #00a1ab 0%, #00727a 100%); /* 悬浮时颜色微调 */
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}

.cyber-btn:active {
  transform: translateY(1px); /* 点击下沉效果 */
  box-shadow: 0 0 5px rgba(0, 242, 255, 0.2); /* 减弱光晕 */
}

/* 动画定义区 (保持不变) */
@keyframes scanMove {
  0% {
    top: -10%;
    opacity: 0;
  }

  50% {
    opacity: 1;
  }

  100% {
    top: 110%;
    opacity: 0;
  }
}

@keyframes pulse {
  0% {
    width: 80%;
    height: 80%;
    opacity: 0.8;
    border-width: 2px;
  }

  100% {
    width: 130%;
    height: 130%;
    opacity: 0;
    border-width: 0px;
  }
}

@keyframes liftPulse {
  0% {
    width: 50%;
    height: 50%;
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
  }

  100% {
    width: 90%;
    height: 90%;
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}
</style>
