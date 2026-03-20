<template>
  <!-- 必须绑定在最外层容器上 -->
  <div class="sys-config-container sys-config-theme-dark" :class="{ 'keyboard-active': showKeyboard }">
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
            <span>提交建议反馈</span>
            <div class="sys-config-section-line"></div>
          </div>

          <el-scrollbar class="form-scroll-area" always>
            <div class="sys-config-section-body">
              <el-form ref="feedbackFormRef" :model="feedbackForm" :rules="rules" label-position="top">
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

                <el-form-item label="反馈内容（请描述具体问题或改进建议）" id="field-content" prop="content">
                  <el-input v-model="feedbackForm.content" type="textarea" :rows="9" inputmode="none"
                    placeholder="请在此输入反馈内容..." class="sys-config-input-textarea"
                    @focus="openKeyboard('default', 'content', $event)" @click="updateCursorPos"
                    @keyup="updateCursorPos" />
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
                      <span class="sys-btn-main-text">提交反馈</span>
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
          <span>更新与修复日志（共{{ logList.length }}条）</span>
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
                  </el-icon>
                  {{ log.resolve_time }}
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
    <transition name="slide-up">
      <div v-if="showKeyboard" class="keyboard-container" @mousedown.prevent>
        <SimpleKeyboard v-model="currentInputValue" @onKeyPress="handleKeyPress" @onClose="showKeyboard = false"
          keyboardClass="show-keyboard" />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineAsyncComponent, watch, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import {
  ChatDotSquare,
  SwitchButton,
  EditPen,
  OfficeBuilding,
  Promotion,
  Calendar,
} from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
// --- 修改：在 import 中增加 useConfigStore ---
import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()
const terminal_id = ref('') // 存储终端ID

const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard_black.vue'))
const router = useRouter()
const audioStore = useAudioStore()

const feedbackFormRef = ref(null) // 表单引用

// 定义校验规则
const rules = {
  content: [
    // 将 trigger 设置为 ['blur', 'change']
    { required: true, message: '反馈内容不能为空', trigger: ['blur', 'change'] },
    { min: 8, message: '为了更好地解决问题，请至少输入8个字符', trigger: ['blur', 'change'] }
  ]
}

// --- 基础数据 ---
const systemUnitName = ref('加载中...')
const logList = ref([
  {
    problem: '领用用途选项固定，无法覆盖所有实际使用场景，缺乏灵活性',
    proposing_unit: '修理营',
    resolve_time: '2026-01-27',
    solution: '已上线‘预设+自定义’双模式。在保留作战演训、公差外带、检修保养等标准项的同时，新增手动录入功能，提升了用途填报的灵活性与详细程度，确保领用记录有据可查、记录详实，以满足高标准的任务追溯要求。',
    type: 'feature',
  },
  {
    problem: '库室电子开锁保持时间稍短，导致配合机械钥匙开门不方便',
    proposing_unit: '运输营',
    resolve_time: '2026-01-22',
    solution: '已延长库门开锁状态的保持时间，确保有足够的时间用机械钥匙开门。',
    type: 'fix',
  },
  {
    problem: '图片上传功能单一（仅限芯片图），无法满足装备实物图的多样化展示需求',
    proposing_unit: '修理营',
    resolve_time: '2026-01-15',
    solution: '已扩展图片上传接口，在数据库及前端界面新增“装备图片”字段及对应的上传组件。实现多维度图片管理，提升数据的可读性。',
    type: 'feature',
  },
  {
    problem: '领用和归还界面的装备信息展示不够直观，建议增加装备缩略图显示',
    proposing_unit: '修理营',
    resolve_time: '2026-01-10',
    solution: '已在领用、归还界面增加装备缩略图展示，方便快速核对装备实物，提高操作效率。',
    type: 'feature',
  },
  {
    problem: '领取或归还时需要手动在列表里翻找勾选，无法根据装备的实际挪动自动匹配和统计信息',
    proposing_unit: '机动营',
    resolve_time: '2025-12-26',
    solution: '已新增“快捷领用/归还”按钮。‘快捷模式’下，系统能自动锁定位置变动的装备，操作员只需一键确认即可完成流程，无需手动检索，确保存取操作精准、高效。目前系统支持“快捷领用/归还”和“精确领用/归还”两种模式。',
    type: 'feature',
  },
])

// --- 反馈表单 ---
const feedbackForm = reactive({
  type: 'suggestion',
  content: '',
})

// --- 键盘逻辑 ---
const showKeyboard = ref(false)
const activeField = ref('')
const currentInputValue = ref('')
const cursorIndex = ref(0) // 记录光标位置
const activeInputDom = ref(null) // 记录当前输入框 DOM

const updateCursorPos = (event) => {
  const inputEl = event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT'
    ? event.target
    : event.target.querySelector('textarea, input');
  if (inputEl) {
    cursorIndex.value = inputEl.selectionStart;
    activeInputDom.value = inputEl;
    console.log('当前光标位置:', cursorIndex.value);
  }
};

const openKeyboard = (layout, fieldName, event) => {
  activeField.value = fieldName;
  currentInputValue.value = feedbackForm[fieldName] || '';
  showKeyboard.value = true;

  if (event && event.target) {
    // 1. 确保获取到的是原生的 input 或 textarea 元素
    const inputEl = event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT'
      ? event.target
      : event.target.querySelector('textarea, input');

    activeInputDom.value = inputEl;
    cursorIndex.value = inputEl.selectionStart || currentInputValue.value.length;

    // 2. 延迟执行，等待主体高度压缩动画 (.main-body 的 transition) 完成
    // 建议延迟比 CSS 的 0.3s 稍微长一点（比如 350ms），确保计算位置时容器高度已固定
    setTimeout(() => {
      if (activeInputDom.value) {
        // 将 'center' 改为 'start'，这会让元素顶部对齐滚动区域的顶部
        activeInputDom.value.scrollIntoView({
          behavior: 'smooth',
          block: 'start' // 关键修改：直接置顶
        });

        activeInputDom.value.focus();
        activeInputDom.value.setSelectionRange(cursorIndex.value, cursorIndex.value);
      }
    }, 350);
  }
};

watch(currentInputValue, (newValue, oldValue) => {
  if (showKeyboard.value && activeField.value) {
    // 1. 更新表单数据
    feedbackForm[activeField.value] = newValue;

    // 2. 计算光标偏移量
    const oldLength = (oldValue || '').length;
    const newLength = (newValue || '').length;
    const diff = newLength - oldLength;

    // 3. 更新索引
    cursorIndex.value += diff;
    if (cursorIndex.value < 0) cursorIndex.value = 0;

    // 4. 强制 DOM 保持光标位置
    nextTick(() => {
      if (activeInputDom.value) {
        activeInputDom.value.focus();
        activeInputDom.value.setSelectionRange(cursorIndex.value, cursorIndex.value);
      }
    });
  }
});

const handleKeyPress = (button) => {
  // 每次按键后尝试夺回焦点
  nextTick(() => {
    if (activeInputDom.value) activeInputDom.value.focus();
  });

  if (button === '{close}' || button === '{submit}') {
    setTimeout(() => {
      showKeyboard.value = false;
      if (activeInputDom.value) activeInputDom.value.blur();
    }, 200);
  }
};

const handleGlobalClick = (event) => {
  if (!showKeyboard.value) return;

  // 检查是否点在键盘上
  const isClickOnKeyboard = event.target.closest('.keyboard-container');
  // 检查是否点在输入框或表单项上
  const isClickOnInput = event.target.tagName === 'TEXTAREA' ||
    event.target.tagName === 'INPUT' ||
    event.target.closest('.el-input') ||
    event.target.closest('.el-form-item');

  if (!isClickOnKeyboard && !isClickOnInput) {
    showKeyboard.value = false;
    if (activeInputDom.value) activeInputDom.value.blur();
  }
};

// --- 核心操作 ---
const handleExit = () => {
  audioStore.play('/audio/按钮点击声.mp3')
  router.push('/')
}

const submitFeedback = async () => {
  // 1. 调用 Element Plus 的表单校验
  try {
    await feedbackFormRef.value.validate()
  } catch (error) {
    // 校验失败
    console.log('校验失败:', error)
    audioStore.play('/audio/校验失败请参考红色文字提示.mp3')
    return // 拦截提交
  }

  // 2. 校验通过后，显示 Loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在保存反馈数据...',
    background: 'rgba(0, 0, 0, 0.8)',
  })
  await new Promise(resolve => setTimeout(resolve, 1000))

  try {
    // 3. 构造数据包并发送 (保持你之前的逻辑)
    const payloadData = {
      terminal_id: terminal_id.value || configStore.terminal.terminal_id,
      unit_name: systemUnitName.value,
      feedback_type: feedbackForm.type,
      content: feedbackForm.content,
      status: 'pending',
      is_synced: 0
    }

    const response = await window.electronAPI.el_post({
      action: 'insert',
      payload: { tableName: 'system_feedback', setValues: payloadData }
    })

    // ... 之前的代码
    if (response.success) {
      audioStore.play('/audio/保存成功.mp3')
      feedbackForm.content = ''
      showKeyboard.value = false

      ElMessageBox.confirm(
        '反馈内容已成功送达系统后台，请选择下一步操作。',
        '提交成功',
        {
          confirmButtonText: '继续反馈',
          cancelButtonText: '返回主页',
          // type: 'success', // 注意：如果要完全自定义样式，可以不设 type 或在 CSS 中覆盖图标颜色
          dangerouslyUseHTMLString: true,
          distinguishCancelAndClose: true,
          customClass: 'sys-config-message-box success-mode', // 【核心】添加 success-mode
          center: true,
          showClose: false,
        }
      ).then(() => {
        audioStore.play('/audio/按钮点击声.mp3')
      }).catch(() => {
        audioStore.play('/audio/按钮点击声.mp3')
        router.push('/')
      })
    }
  } catch (error) {
    ElMessage.error('提交失败：' + (error.message || '网络异常'))
  } finally {
    loading.close()
  }
}

onMounted(async () => {
  document.addEventListener('mousedown', handleGlobalClick);

  try {
    const response = await window.electronAPI?.el_post({
      action: 'queryMultipleTables',
      payload: { arr: [{ tablename: 'terminal_settings', condition: 'id = 1' }] }
    })

    if (response?.success && response.data?.terminal_settings) {
      const settings = response.data.terminal_settings;
      systemUnitName.value = settings.unit_name || '未知单位';
      terminal_id.value = settings.terminal_id || 'unknown_terminal';
    }
  } catch (error) {
    console.error('获取终端信息失败:', error);
    systemUnitName.value = '获取失败';
  }
});
onBeforeUnmount(() => {
  // 销毁监听，防止内存泄漏
  document.removeEventListener('mousedown', handleGlobalClick);
});
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
/* ================= 主体布局：完全还原旧页面的平滑逻辑 ================= */
.main-body {
  display: flex;
  flex: 1;
  padding: 20px;
  gap: 20px;
  overflow: hidden;

  /* 核心： transition 必须为 all，且曲线必须是 cubic-bezier */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  /* 设定一个明确的基准高度 */
  height: calc(100vh - 70px);
}

/* 键盘激活时的布局：强制锁定 flex 属性防止闪烁 */
.keyboard-active .main-body {
  /* 0 0 表示：不放大、不缩小、基础高度固定为 420px */
  flex: 0 0 420px !important;
  height: 420px !important;
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
  padding: 30px 25px;
  /* 增加上下内边距，原为 20px */
  display: flex;
  flex-direction: column;
  min-height: 100%;
  /* 确保高度撑满 */
}

.form-scroll-area {
  flex: 1;
}

/* ================= 输入控件覆盖 (对标配置页) ================= */

/* 找到 215 行左右，修改或添加以下代码 */
:deep(.el-form-item) {
  margin-bottom: 20px !important;
  /* 增加表单项之间的垂直间距，原为默认 */
}

:deep(.el-form-item__label) {
  color: var(--sys-text-sec) !important;
  margin-bottom: 12px !important;
  /* 标签和输入框之间也拉开一点 */
  font-size: 15px !important;
  /* 稍微调大字号 */
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
  background: rgba(255, 255, 255, 0.03);
  /* 稍微加深背景 */
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
  font-size: 13px;
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
  color: var(--sys-primary);
  margin-bottom: 8px;
  padding-right: 60px;
  /* 避开右上角标签 */
}

.resolve-time {
  font-size: 13px;
  color: var(--sys-text-sec);
  display: flex;
  align-items: center;
  gap: 5px;
}

.log-detail {
  margin-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 15px;
  /* 修复之前的 pt 错误 */
}

/* 关键对齐布局：恢复之前的 flex 结构 */
.detail-row {
  display: flex;
  margin-bottom: 10px;
  font-size: 14px;
  line-height: 1.6;
}

.detail-row .label {
  color: var(--sys-text-sec);
  width: 75px;
  /* 恢复固定宽度 */
  flex-shrink: 0;
  /* 防止被挤压 */
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
  flex: 1;
  /* 占据剩余空间并支持自动换行 */
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
  /* 修改这里：最后一位改为 0，让内容紧贴底边 */
  padding: 5px 0 0 0 !important;
  /* 增加阴影，让它和主体的衔接更自然 */
  box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.8);
}

/* ================= 滚动条始终显示样式定制 ================= */

/* 1. 强制滚动条轨道透明度为 1 (不再自动隐藏) */
:deep(.log-section .el-scrollbar__bar) {
  opacity: 1 !important;
  width: 6px;
  /* 稍微调窄一点更精致 */
}

/* ================= 虚拟键盘滑入滑出动画 (严格对应 slide-up) ================= */
.slide-up-enter-active,
.slide-up-leave-active {
  /* 增加高度动画同步，让主体合拢和键盘下滑更协调 */
  transition:
    transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.2s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  /* 确保完全滑到屏幕外 */
  opacity: 0;
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
  opacity: 1;
}

/* ---------------- 键盘内部按键样式覆盖 (修复黑色主题) ---------------- */

/* 1. 整体背景透明（由父容器 .keyboard-container 提供深色背景） */
:deep(.show-keyboard) {
  background-color: transparent !important;
  color: #fff !important;
}

/* 2. 普通按键样式 */
:deep(.show-keyboard .hg-button) {
  background: #2a3546 !important;
  color: #fff !important;
  border-bottom: 2px solid #151a23 !important;
  transition: all 0.1s;
}

/* 3. 按键点击状态 */
:deep(.show-keyboard .hg-button:active) {
  background: var(--sys-primary) !important;
  color: #000 !important;
  transform: translateY(2px);
}

/* 4. 功能键（如 Shift, Backspace, Enter）样式 */
:deep(.show-keyboard .hg-functionBtn) {
  background: #1c2538 !important;
}

/* 5. 底部容器背景补充 */
.keyboard-container {
  background-color: #141b2d !important;
  /* 确保这个颜色和设置页一致 */
}


/* 控制红色校验文字的样式 */
:deep(.el-form-item__error) {
  /* 1. 设置字体大小 (根据需要修改，比如 14px 或 0.23rem) */
  font-size: 14px !important;

  /* 2. 确保颜色使用你定义的错误色 */
  color: var(--sys-error) !important;

  /* 3. 调整文字与输入框的间距 */
  margin-top: 0px;

  /* 4. 如果需要加粗或调整行高 */
  font-weight: 500;
  line-height: 1;
}

/* 额外优化：当校验失败时，让 textarea 的边框亮度提高，提醒用户 */
:deep(.el-form-item.is-error .el-textarea__inner) {
  box-shadow: 0 0 0 1px var(--sys-error) inset !important;
  background-color: rgba(255, 77, 79, 0.05) !important;
  /* 淡淡的红色背景 */
}
</style>
<style>
/* ================= 升级版全局弹窗样式 (完全对标参数页) ================= */
.sys-config-message-box.success-mode {
  width: 480px !important;
  /* 1. 强化背景：使用更纯粹的深黑，并增加微弱的内发光 */
  background-color: #0a0e17 !important;
  background-image:
    linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px) !important;
  background-size: 30px 30px !important;

  /* 2. 强化边框：改为实色青色，并增加外发光阴影，消除“透明感” */
  border: 1px solid #00f2ff !important;
  border-radius: 0 !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.9),
    inset 0 0 20px rgba(0, 242, 255, 0.1) !important;
  position: relative;
  overflow: hidden;
}

/* 顶部装饰条：模拟配置页头部风格 */
.sys-config-message-box.success-mode::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #0099a1, #00f2ff, #0099a1);
  z-index: 11;
}

/* 四角装饰点：强化科技感 */
.sys-config-message-box.success-mode::after {
  content: 'SUCCESS';
  position: absolute;
  top: 10px;
  right: 15px;
  font-family: 'Arial';
  font-size: 10px;
  color: rgba(0, 242, 255, 0.3);
  letter-spacing: 2px;
}

/* 标题样式 */
.sys-config-message-box.success-mode .el-message-box__header {
  padding: 30px 25px 10px 25px !important;
  background: rgba(255, 255, 255, 0.02);
}

.sys-config-message-box.success-mode .el-message-box__title {
  color: #00f2ff !important;
  font-size: 22px !important;
  font-weight: bold !important;
  letter-spacing: 1px;
}

/* 内容文字：增加字间距和清晰度 */
.sys-config-message-box.success-mode .el-message-box__message {
  color: #c0c9d0 !important;
  font-size: 16px !important;
  padding: 20px 0 !important;
}

/* 按钮区域：底部背景微亮 */
.sys-config-message-box.success-mode .el-message-box__btns {
  padding: 20px 25px 25px 25px !important;
  background: rgba(0, 0, 0, 0.2);
}

/* ================= 核心：按钮样式重塑 (对标配置页保存按钮) ================= */
.sys-config-message-box.success-mode .el-button {
  height: 44px !important;
  padding: 0 30px !important;
  border-radius: 2px !important;
  font-weight: bold !important;
  text-transform: uppercase;
}

/* “返回主页”按钮：幽灵风格，灰色文本 */
.sys-config-message-box.success-mode .el-button:not(.el-button--primary) {
  background: transparent !important;
  border: 1px solid #2a3546 !important;
  color: #8899a6 !important;
}
.sys-config-message-box.success-mode .el-button:not(.el-button--primary):hover {
  border-color: #555 !important;
  color: #fff !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

/* “继续反馈”按钮：完全复刻配置页“保存”按钮的渐变色 */
.sys-config-message-box.success-mode .el-button--primary {
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%) !important;
  border: 1px solid #00f2ff !important;
  color: #ffffff !important;
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.2) !important;
  position: relative;
}

.sys-config-message-box.success-mode .el-button--primary:hover {
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.4) !important;
  transform: translateY(-1px);
}

/* 隐藏自带的 Success 图标（由自定义配色替代感官） */
.sys-config-message-box.success-mode .el-message-box__status {
  display: none !important;
}
</style>
