<template>
  <div class="page-container theme-dark">
    <!-- ================= 顶部导航栏 ================= -->
    <header class="header-bar">
      <div class="header-left">
        <div class="icon-box-glow">
          <el-icon :size="24" class="primary-icon">
            <ChatDotSquare />
          </el-icon>
        </div>
        <div class="title-text">
          <h1>反馈更新</h1>
          <span class="sub-title">问题反馈 · 系统迭代 · 优化留痕</span>
        </div>
      </div>

      <div class="header-right">
        <button class="btn-exit" @click="handleExit">
          <el-icon>
            <SwitchButton />
          </el-icon>
          返回主页
        </button>
      </div>
    </header>

    <!-- ================= 主体内容区 ================= -->
    <div class="main-body">
      <!-- 左侧：提交反馈 -->
      <div class="form-section">
        <div class="section-title">
          <div class="title-left">
            <span class="text-glow">提交意见反馈</span>
          </div>
        </div>

        <div class="form-content">
          <el-form :model="feedbackForm" label-position="top">
            <div class="cyber-section">
              <div class="section-header">
                <el-icon>
                  <EditPen />
                </el-icon>
                <span>反馈信息录入</span>
                <div class="section-line"></div>
              </div>

              <div class="section-body">
                <el-form-item label="反馈单位 (系统自动识别)">
                  <el-input v-model="systemUnitName" disabled class="cyber-input is-readonly">
                    <template #prefix><el-icon>
                        <OfficeBuilding />
                      </el-icon></template>
                  </el-input>
                </el-form-item>

                <el-form-item label="反馈类别">
                  <el-radio-group v-model="feedbackForm.type" class="cyber-radio full-width-radio">
                    <el-radio-button label="bug">功能异常</el-radio-button>
                    <el-radio-button label="suggestion">优化建议</el-radio-button>
                    <el-radio-button label="other">其他</el-radio-button>
                  </el-radio-group>
                </el-form-item>

                <el-form-item label="详细说明（请描述具体问题或改进想法）">
                  <el-input v-model="feedbackForm.content" type="textarea" :rows="6" placeholder="请输入反馈内容..."
                    class="cyber-input-textarea" @focus="openKeyboard('default', 'content', $event)" />
                </el-form-item>
              </div>
            </div>
          </el-form>

          <div class="form-footer">
            <button class="cyber-btn full-width-btn" @click="submitFeedback">
              <div class="btn-content">
                <el-icon :size="20">
                  <Promotion />
                </el-icon>
                <div class="text-group">
                  <span class="btn-main-text">立即提交反馈</span>
                  <span class="btn-sub-text">数据将同步至技术支持团队</span>
                </div>
              </div>
              <div class="scan-line"></div>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧：更新日志 -->
      <div class="log-section">
        <div class="section-title">
          <div class="title-left">
            <span class="text-glow">更新与修复日志 ({{ logList.length }})</span>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="timeline-container">
            <div v-for="(log, index) in logList" :key="index" class="log-card">
              <!-- 装饰性光标 -->
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

    <!-- 虚拟键盘容器 -->
    <div v-if="showKeyboard" class="keyboard-container" @mousedown.prevent>
      <SimpleKeyboard ref="keyboardRef" v-model="currentInputValue" @onKeyPress="handleKeyPress"
        @onClose="showKeyboard = false" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineAsyncComponent, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChatDotSquare, SwitchButton, EditPen, OfficeBuilding,
  Promotion, Calendar, Loading
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
  } catch (e) {
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
/* 1. 完善变量定义与基础容器 */
.page-container {
  /* 引入日志页面统一变量 */
  --primary: #00f2ff;
  --primary-dark: #0099a1;
  --bg-dark: #0a0f18;
  --border: #2a3546;
  --active-bg: #1c2538;
  --error: #ff4d4f; /* 退出按钮红色 */
  --text-main: #ccdbe8;
  --text-dim: #8899a6;

  width: 100%;
  height: 100vh;
  background-color: var(--bg-dark);
  color: var(--text-main);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 2. 顶部导航条：完全对标日志页面 */
.header-bar {
  height: 70px;
  background: #11151f;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 图标外框 */
.icon-box-glow {
  width: 42px;
  height: 42px;
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--active-bg);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.1);
}



/* 标题与副标题文字排版 */
.title-text h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
  color: #fff;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  line-height: 1.2;
}

/* 3. 退出按钮：改为日志页面的红色风格 */
.btn-exit {
  background: transparent;
  border: 1px solid var(--error);
  color: var(--error);
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
}

.btn-exit:hover {
  background: rgba(255, 77, 79, 0.1);
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.4);
}


.primary-icon {
  color: #00f2ff;
}

.sub-title {
  color: #0099a1;
  font-size: 11px;
  font-weight: bold;
}

.main-body {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

/* 左侧表单区域 */
.form-section {
  flex: 0 0 450px;
  background: #141b2d;
  border: 1px solid #2a3546;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.section-title {
  padding: 15px 20px;
  border-bottom: 1px solid #2a3546;
  background: rgba(0, 0, 0, 0.2);
  font-size: 16px;
}

.form-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 右侧日志区域 */
.log-section {
  flex: 1;
  background: #141b2d;
  border: 1px solid #2a3546;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.scroll-area {
  flex: 1;
  padding: 20px;
}

/* 日志卡片设计 */
.timeline-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.log-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #2a3546;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s;
}

.log-card:hover {
  border-color: #00f2ff;
  background: rgba(0, 242, 255, 0.05);
}

.log-tag {
  position: absolute;
  top: 0;
  right: 20px;
  padding: 4px 12px; /* 稍微增加左右内边距 */
  font-size: 11px;    /* 稍微调大一点点适合中文 */
  font-weight: bold;
  border-radius: 0 0 4px 4px;
}

.tag-new {
  background: #00ff9d;
  color: #000;
}

.tag-fix {
  background: #0099a1;
  color: #fff;
}

.problem-title {
  font-size: 16px;
  font-weight: bold;
  color: #00f2ff;
  margin-bottom: 8px;
  padding-right: 60px;
}

.resolve-time {
  font-size: 12px;
  color: #8899a6;
  display: flex;
  align-items: center;
  gap: 5px;
}

.log-detail {
  margin-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding-top: 15px;
}

.detail-row {
  display: flex;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-row .label {
  color: #8899a6;
  width: 70px;
  flex-shrink: 0;
}

.detail-row .value {
  color: #fff;
}

.solution-text {
  color: #ccdbe8;
  line-height: 1.6;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 4px;
  border-left: 2px solid #0099a1;
  flex: 1;
}

/* 装饰边角 */
.corner-decoration {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, transparent 50%, rgba(0, 242, 255, 0.2) 50%);
}

/* 文本域特殊样式 */
:deep(.cyber-input-textarea .el-textarea__inner) {
  background-color: rgba(20, 27, 45, 0.8) !important;
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  color: #fff;
  border: none;
  padding: 12px;
}

:deep(.cyber-input-textarea .el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #00f2ff inset !important;
}

/* 键盘容器样式保持一致 */
.keyboard-container {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  background-color: #141b2d;
  border-top: 1px solid #00f2ff;
}

/* 按钮样式复用 */
.cyber-btn {
  height: 50px;
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

.btn-main-text {
  font-size: 15px;
  font-weight: bold;
}

.btn-sub-text {
  font-size: 10px;
  opacity: 0.7;
}
</style>
