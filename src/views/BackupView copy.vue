<template>
  <div class="sys-config-container sys-config-theme-dark">
    <!-- ================= 顶部导航栏 (已对标配置页) ================= -->
    <header class="sys-config-header">
      <div class="sys-config-header-left">
        <div class="sys-config-icon-box">
          <el-icon :size="24" class="sys-config-primary-icon">
            <ChatDotSquare />
          </el-icon>
        </div>
        <div class="sys-config-title-text">
          <h1>反馈更新</h1>
          <span class="sys-config-sub-title">问题反馈 · 系统迭代 · 优化留痕</span>
        </div>
      </div>

      <div class="sys-config-header-right">
        <button class="sys-config-btn-exit" @click="handleExit">
          <el-icon>
            <SwitchButton />
          </el-icon>
          返回主页
        </button>
      </div>
    </header>

    <!-- ================= 主体内容区 ================= -->
    <div class="main-body" :class="{ 'keyboard-active': showKeyboard }">
      <!-- 左侧：提交反馈 (对标配置页板块样式) -->
      <div class="form-section-wrapper">
        <div class="sys-config-section">
          <div class="sys-config-section-header">
            <el-icon>
              <EditPen />
            </el-icon>
            <span>提交意见反馈</span>
            <div class="sys-config-section-line"></div>
          </div>

          <el-scrollbar class="form-scroll-area" always>
            <div class="sys-config-section-body">
              <el-form :model="feedbackForm" label-position="top">
                <el-form-item label="反馈单位 (系统自动识别)">
                  <el-input v-model="systemUnitName" disabled class="sys-config-input sys-disabled-input">
                    <template #prefix><el-icon>
                        <OfficeBuilding />
                      </el-icon></template>
                  </el-input>
                </el-form-item>

                <el-form-item label="反馈类别">
                  <el-radio-group v-model="feedbackForm.type" class="sys-config-radio-group">
                    <el-radio-button label="bug">功能异常</el-radio-button>
                    <el-radio-button label="suggestion">优化建议</el-radio-button>
                    <el-radio-button label="other">其他</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="详细说明（请描述具体问题或改进想法）" id="field-content">
                  <el-input v-model="feedbackForm.content" type="textarea" :rows="8" placeholder="请输入反馈内容..."
                    class="sys-config-input-textarea" @focus="openKeyboard('default', 'content', $event)" />
                </el-form-item>
              </el-form>

              <!-- 按钮容器 -->
              <div class="form-footer-action">
                <button class="sys-config-save-btn full-width" @click="submitFeedback">
                  <div class="sys-btn-content">
                    <el-icon :size="20">
                      <Promotion />
                    </el-icon>
                    <div class="sys-text-group">
                      <span class="sys-btn-main-text">立即提交反馈</span>
                    </div>
                  </div>
                  <div class="sys-scan-line"></div>
                </button>
              </div>
            </div>
          </el-scrollbar>
        </div>
      </div>

      <!-- 右侧：更新日志 (保持原有逻辑，优化边框) -->
      <div class="log-section">
        <div class="sys-config-section-header">
          <el-icon>
            <Calendar />
          </el-icon>
          <span>更新与修复日志 ({{ logList.length }})</span>
          <div class="sys-config-section-line"></div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="timeline-container">
            <div v-for="(log, index) in logList" :key="index" class="log-card">
              <div class="log-tag" :class="log.type === 'feature' ? 'tag-new' : 'tag-fix'">
                {{ log.type === 'feature' ? '更新' : '修复' }}
              </div>
              <div class="log-header">
                <div class="problem-title">{{ log.problem }}</div>
                <div class="resolve-time">
                  <el-icon>
                    <Calendar />
                  </el-icon> {{ log.resolve_time }}
                </div>
              </div>
              <div class="log-detail">
                <div class="detail-row">
                  <span class="label">反馈单位:</span>
                  <span class="value">{{ log.proposing_unit }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">解决方法:</span>
                  <div class="solution-text">{{ log.solution }}</div>
                </div>
              </div>
              <div class="corner-decoration"></div>
            </div>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <!-- 虚拟键盘 (对标配置页样式) -->
    <div v-if="showKeyboard" class="keyboard-container" @mousedown.prevent>
      <SimpleKeyboard v-model="currentInputValue" @onKeyPress="handleKeyPress" @onClose="showKeyboard = false"
        keyboardClass="show-keyboard" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineAsyncComponent, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChatDotSquare, SwitchButton, EditPen, OfficeBuilding,
  Promotion, Calendar,
} from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'

const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard_black.vue'))
const router = useRouter()
const audioStore = useAudioStore()

// --- 基础数据 ---
const systemUnitName = ref('加载中...')
const logList = ref([
  {
    problem: '人员信息同步异常，部分头像无法正常显示',
    proposing_unit: '勤务中队',
    resolve_time: '2023-10-24 14:20',
    solution: '优化了Blob数据流解析算法，增强了复杂网络环境下断点续传的稳定性。',
    type: 'fix'
  },
  {
    problem: '新增装备领用生物识别二次验证功能',
    proposing_unit: '系统规划部',
    resolve_time: '2023-10-20 09:00',
    solution: '在领用流程中嵌入指纹与人脸双重验证模块，提升库室安全性等级。',
    type: 'feature'
  },
  {
    problem: '系统查询页面在高并发下的响应延迟',
    proposing_unit: '物资管理科',
    resolve_time: '2023-10-15 16:45',
    solution: '对底层数据库TB_Equipment表增加了复合索引，查询效率提升约70%。',
    type: 'fix'
  }
])

// --- 反馈表单 ---
const feedbackForm = reactive({
  type: 'suggestion',
  content: ''
})

// --- 键盘逻辑 ---
const showKeyboard = ref(false)
const activeField = ref('')
const currentInputValue = ref('')

const openKeyboard = (layout, fieldName, event) => {
  activeField.value = fieldName
  currentInputValue.value = feedbackForm[fieldName]
  showKeyboard.value = true

  // 修改这里：从 nextTick 改为 setTimeout
  setTimeout(() => {
    const el = document.getElementById(`field-${fieldName}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200); // 延迟400ms，等待页面收缩动画完成
}

watch(currentInputValue, (newVal) => {
  if (activeField.value) feedbackForm[activeField.value] = newVal
})

const handleKeyPress = (button) => {
  if (button === '{close}' || button === '{submit}') showKeyboard.value = false
}

// --- 核心操作 ---
const handleExit = () => {
  audioStore.play('/audio/按钮点击声.mp3')
  router.push('/')
}

const submitFeedback = async () => {
  if (!feedbackForm.content) {
    audioStore.play('/audio/校验失败请参考红色文字提示.mp3')
    return ElMessage.warning('请输入反馈内容')
  }

  const loading = ElLoading.service({
    lock: true,
    text: '正在加密并上传反馈数据...',
    background: 'rgba(0, 0, 0, 0.8)',
  })

  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1500))
    audioStore.play('/audio/保存成功.mp3')
    ElMessage.success('反馈提交成功，感谢您的意见！')
    feedbackForm.content = ''
    showKeyboard.value = false
  } catch (error) {
    console.log(error)
    ElMessage.error('提交失败，请检查网络连接')
  } finally {
    loading.close()
  }
}

onMounted(async () => {
  // 模拟获取终端配置
  const response = await window.electronAPI?.el_post({
    action: 'queryMultipleTables',
    payload: { arr: [{ tablename: 'terminal_settings', condition: '' }] }
  })
  systemUnitName.value = response?.data?.terminal_settings?.unit_name || '演示终端'
})
</script>

<style scoped>
/* ================= 引入配置页的主题变量 ================= */
.sys-config-theme-dark {
  --sys-primary: #00f2ff;
  --sys-primary-dark: #0099a1;
  --sys-error: #ff4d4f;
  --sys-bg-dark: #0a0e17;
  --sys-card-bg: #141b2d;
  --sys-border: #2a3546;
  --sys-active-bg: #1c2538;
  --sys-text-main: #ffffff;
  --sys-text-sec: #8899a6;
}

/* 容器基础 */
.sys-config-container {
  width: 100%;
  height: 100vh;
  background-color: var(--sys-bg-dark);
  color: var(--sys-text-main);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部导航 (直接复用配置页) */
.sys-config-header {
  height: 70px;
  background: #11151f;
  border-bottom: 1px solid var(--sys-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  flex-shrink: 0;
}

.sys-config-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sys-config-icon-box {
  width: 42px;
  height: 42px;
  border: 1px solid var(--sys-border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sys-active-bg);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.1);
}

.sys-config-primary-icon {
  color: var(--sys-primary);
}

.sys-config-title-text h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.sys-config-sub-title {
  color: var(--sys-primary-dark);
  font-size: 11px;
  font-weight: bold;
}

.sys-config-btn-exit {
  background: transparent;
  border: 1px solid var(--sys-error);
  color: var(--sys-error);
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ================= 主体布局优化 ================= */
.main-body {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.keyboard-active {
  height: 45vh !important;
  /* 键盘弹出时缩短主体 */
  flex: none;
}

.form-section-wrapper {
  flex: 0 0 450px;
  display: flex;
}

.log-section {
  flex: 1;
  background: var(--sys-card-bg);
  border: 1px solid var(--sys-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ================= 配置页风格板块 ================= */
.sys-config-section {
  flex: 1;
  background: rgba(20, 27, 45, 0.6);
  border: 1px solid var(--sys-border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sys-config-section-header {
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--sys-primary);
  font-weight: bold;
  font-size: 14px;
}

.sys-config-section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--sys-primary-dark), transparent);
  margin-left: 10px;
  opacity: 0.5;
}

.sys-config-section-body {
  padding: 20px;
}

.form-scroll-area {
  flex: 1;
}

/* ================= 输入控件覆盖 (对标配置页) ================= */
:deep(.el-form-item__label) {
  color: var(--sys-text-sec) !important;
  margin-bottom: 8px !important;
}

:deep(.sys-config-input .el-input__wrapper),
:deep(.sys-config-input-textarea .el-textarea__inner) {
  background-color: rgba(20, 27, 45, 0.8) !important;
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  border: none !important;
  color: #fff !important;
}

:deep(.sys-config-input .el-input__wrapper.is-focus),
:deep(.sys-config-input-textarea .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px var(--sys-primary) inset !important;
}

:deep(.sys-disabled-input .el-input__wrapper) {
  background-color: #0f131a !important;
  box-shadow: none !important;
  border: 1px dashed #333 !important;
}

/* 单选框组定制 */
:deep(.sys-config-radio-group) {
  display: flex;
  width: 100%;
}

:deep(.sys-config-radio-group .el-radio-button) {
  flex: 1;
}

:deep(.sys-config-radio-group .el-radio-button__inner) {
  width: 100%;
  background: #1c2538;
  border-color: #2a3546;
  color: #8899a6;
}

:deep(.sys-config-radio-group .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: var(--sys-primary-dark);
  border-color: var(--sys-primary);
  color: #fff;
  box-shadow: -1px 0 0 0 var(--sys-primary);
}

/* ================= 按钮样式 (完全对标配置页保存按钮) ================= */
.sys-config-save-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(90deg, var(--sys-primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--sys-primary);
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  margin-top: 10px;
}

.sys-btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  z-index: 2;
}

.sys-btn-main-text {
  font-size: 16px;
  font-weight: bold;
}

.sys-scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-20deg);
  animation: sysBtnScan 3s infinite;
}

@keyframes sysBtnScan {
  from {
    left: -100%;
  }

  to {
    left: 150%;
  }
}

/* ================= 日志卡片样式 (还原之前的对齐布局) ================= */
.scroll-area {
  flex: 1;
  padding: 15px;
}

.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.log-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03); /* 稍微加深背景 */
  border: 1px solid var(--sys-border);
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.log-card:hover {
  border-color: var(--sys-primary);
  background: rgba(0, 242, 255, 0.05);
}

.log-tag {
  position: absolute;
  top: 0;
  right: 20px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: bold;
  border-radius: 0 0 4px 4px;
}

.tag-new { background: #00ff9d; color: #000; }
.tag-fix { background: #0099a1; color: #fff; }

.problem-title {
  font-size: 16px;
  font-weight: bold;
  color: var(--sys-primary);
  margin-bottom: 8px;
  padding-right: 60px; /* 避开右上角标签 */
}

.resolve-time {
  font-size: 12px;
  color: var(--sys-text-sec);
  display: flex;
  align-items: center;
  gap: 5px;
}

.log-detail {
  margin-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 15px; /* 修复之前的 pt 错误 */
}

/* 关键对齐布局：恢复之前的 flex 结构 */
.detail-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 1.6;
}

.detail-row .label {
  color: var(--sys-text-sec);
  width: 75px;      /* 恢复固定宽度 */
  flex-shrink: 0;   /* 防止被挤压 */
}

.detail-row .value {
  color: #fff;
}

.solution-text {
  color: #ccdbe8;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 4px;
  border-left: 2px solid var(--sys-primary-dark);
  flex: 1;          /* 占据剩余空间并支持自动换行 */
}

/* 装饰边角 */
.corner-decoration {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, transparent 50%, rgba(0, 242, 255, 0.1) 50%);
}

/* 键盘容器对标配置页 */
.keyboard-container {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100% !important;
  z-index: 9999 !important;
  background-color: #141b2d !important;
  border-top: 1px solid var(--sys-primary);
  padding: 5px 0 20px 0 !important;
}

/* ================= 滚动条始终显示样式定制 ================= */

/* 1. 强制滚动条轨道透明度为 1 (不再自动隐藏) */
:deep(.log-section .el-scrollbar__bar) {
  opacity: 1 !important;
  width: 6px; /* 稍微调窄一点更精致 */
}

/* 2. 定制滚动条滑块（Thumb）的颜色和形状 */
:deep(.log-section .el-scrollbar__thumb) {
  background-color: var(--sys-primary-dark) !important; /* 使用主题青色 */
  opacity: 0.5; /* 默认半透明 */
  transition: opacity 0.3s;
}

/* 3. 鼠标悬停滑块时加亮 */
:deep(.log-section .el-scrollbar__thumb:hover) {
  opacity: 1;
  background-color: var(--sys-primary) !important;
}

/* 4. (可选) 给滚动条轨道增加一个深色背景，使其视觉上更像一个“槽” */
:deep(.log-section .el-scrollbar__bar.is-vertical) {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  right: 2px; /* 距离边缘一点距离 */
}
</style>
