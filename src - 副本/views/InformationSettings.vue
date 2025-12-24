<template>
  <div class="sys-config-container sys-config-theme-dark">
    <!-- ================= 顶部导航栏 ================= -->
    <header class="sys-config-header">
      <div class="sys-config-header-left">
        <div class="sys-config-icon-box">
          <el-icon :size="24" class="sys-config-primary-icon">
            <Setting />
          </el-icon>
        </div>
        <div class="sys-config-title-text">
          <h1>系统参数配置</h1>
          <span class="sys-config-sub-title">终端属性 · 阈值设定 · 运行维护</span>
        </div>
      </div>

      <div class="sys-config-header-right">
        <button class="sys-config-btn-exit" @click="handleExit">
          <el-icon>
            <SwitchButton />
          </el-icon>
          退出返回
        </button>
      </div>
    </header>

    <!-- ================= 主体内容区 ================= -->
    <div class="sys-config-body">
      <el-scrollbar class="sys-config-scroll-area">
        <div class="sys-config-grid">
          <!-- 板块 1: 归属与标识 -->
          <div class="sys-config-section">
            <div class="sys-config-section-header">
              <el-icon>
                <OfficeBuilding />
              </el-icon>
              <span>归属与标识</span>
              <div class="sys-config-section-line"></div>
            </div>
            <div class="sys-config-section-body">
              <el-row :gutter="0">
                <el-col :span="24" class="sys-mb-15">
                  <el-form-item label="所属单位名称">
                    <el-input inputmode="none" v-model="formData.unit_name" size="large" placeholder="例如：某营一连"
                      class="sys-config-input" @focus="openKeyboard('default', 'unit_name', $event)"
                      @click="updateCursorPos" @keyup="updateCursorPos">
                      <template #prefix>
                        <el-icon>
                          <Flag />
                        </el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>

                <el-col :span="24" class="sys-mb-15">
                  <el-form-item label="所属库室名称">
                    <el-input v-model="formData.warehouse" size="large" placeholder="例如：01库室" class="sys-config-input"
                      @focus="openKeyboard('default', 'warehouse', $event)" inputmode="none" @click="updateCursorPos"
                      @keyup="updateCursorPos">
                      <template #prefix>
                        <el-icon>
                          <House />
                        </el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>

                <el-col :span="24">
                  <el-form-item label="所属库室位置">
                    <el-input v-model="formData.warehouse_location" size="large" placeholder="例如：一楼东侧区域"
                      class="sys-config-input" @focus="openKeyboard('default', 'warehouse_location', $event)"
                      inputmode="none" @click="updateCursorPos" @keyup="updateCursorPos">
                      <template #prefix>
                        <el-icon>
                          <Location />
                        </el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 板块 2: 终端设备配置 -->
          <div class="sys-config-section">
            <div class="sys-config-section-header">
              <el-icon>
                <Cpu />
              </el-icon>
              <span>终端设备配置</span>
              <div class="sys-config-section-line"></div>
            </div>
            <div class="sys-config-section-body">
              <el-row :gutter="0">
                <el-col :span="24" class="sys-mb-15">
                  <el-form-item label="终端设备编号">
                    <el-input v-model="formData.terminal_id" size="large" disabled placeholder="自动获取"
                      class="sys-config-input sys-disabled-input" @click="updateCursorPos" @keyup="updateCursorPos">
                      <template #prefix>
                        <el-icon>
                          <Cpu />
                        </el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>

                <el-col :span="24" class="sys-mb-15">
                  <el-form-item label="&nbsp;&nbsp;&nbsp;&nbsp;自定义编号">
                    <el-input v-model="formData.cabinet_number" size="large" placeholder="例如：01"
                      class="sys-config-input" @focus="openKeyboard('default', 'cabinet_number', $event)"
                      @click="updateCursorPos" @keyup="updateCursorPos">
                      <template #prefix>
                        <el-icon>
                          <Edit />
                        </el-icon>
                      </template>
                    </el-input>
                  </el-form-item>
                </el-col>

                <el-col :span="24">
                  <el-form-item label="终端设备类型">
                    <el-select v-model="formData.name" size="large" class="sys-config-select"
                      popper-class="sys-config-dropdown" placeholder="请选择终端类型">
                      <el-option label="一类柜" value="一类柜" />
                      <el-option label="二类柜" value="二类柜" />
                      <el-option label="三类柜" value="三类柜" />
                      <el-option label="门禁系统" value="门禁系统" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
          </div>

          <!-- 板块 3: 环境监测阈值 -->
          <!--
          <div class="sys-config-section">
            <div class="sys-config-section-header">
              <el-icon>
                <Odometer />
              </el-icon>
              <span>环境报警阈值</span>
              <div class="sys-config-section-line"></div>
            </div>
            <div class="sys-config-section-body">
              <div class="sys-threshold-group">
                <div class="sys-group-label">
                  <el-icon color="#ff4d4f">
                    <Sunny />
                  </el-icon>
                  温度报警上限 (°C)
                  <span class="sys-value-display">{{ formData.temp_threshold }}°C</span>
                </div>
                <el-slider
                  v-model="formData.temp_threshold"
                  :min="20"
                  :max="80"
                  :marks="{ 30: '正常', 50: '警告', 70: '危险' }"
                  class="sys-config-slider"
                />
              </div>

              <div class="sys-threshold-group sys-mt-20">
                <div class="sys-group-label">
                  <el-icon color="#00f2ff">
                    <Pouring />
                  </el-icon>
                  湿度报警上限 (%RH)
                  <span class="sys-value-display" style="color: #00f2ff"
                    >{{ formData.humid_threshold }}%</span
                  >
                </div>
                <el-slider
                  v-model="formData.humid_threshold"
                  :min="30"
                  :max="100"
                  :marks="{ 40: '干燥', 80: '潮湿' }"
                  class="sys-config-slider blue-mode"
                />
              </div>
            </div>
          </div>
        -->

          <!-- 板块 4: 交互与系统 -->
          <!--
          <div class="sys-config-section">
            <div class="sys-config-section-header">
              <el-icon>
                <Operation />
              </el-icon>
              <span>交互与系统</span>
              <div class="sys-config-section-line"></div>
            </div>
            <div class="sys-config-section-body">
              <div class="sys-switch-row">
                <span class="sys-sw-label">启用触摸音效</span>
                <el-switch
                  v-model="formData.enable_audio"
                  active-text="ON"
                  inactive-text="OFF"
                  style="--el-switch-on-color: var(--sys-primary-dark); --el-switch-off-color: #333"
                />
              </div>
              <div class="sys-switch-row">
                <span class="sys-sw-label">启用错拿语音报警</span>
                <el-switch
                  v-model="formData.enable_voice_alert"
                  active-text="ON"
                  inactive-text="OFF"
                  style="--el-switch-on-color: var(--sys-error); --el-switch-off-color: #333"
                />
              </div>
              <div class="sys-switch-row">
                <span class="sys-sw-label">无人操作自动屏保 (分钟)</span>
                <el-input-number
                  v-model="formData.screensaver_time"
                  :min="1"
                  :max="60"
                  size="small"
                  class="sys-config-input-number"
                />
              </div>
            </div>
          </div>
          -->
        </div>
      </el-scrollbar>

      <!-- 底部操作栏 -->
      <div class="sys-config-footer">
        <!--
        <div class="sys-footer-left">
          <button class="sys-btn-text danger" @click="handleReset">
            <el-icon>
              <RefreshLeft />
            </el-icon>
            恢复默认设置
          </button>
        </div>
      -->
        <div></div>
        <div class="sys-footer-right">
          <button class="sys-config-save-btn" @click="handleSave">
            <div class="sys-btn-content">
              <el-icon :size="20">
                <Select />
              </el-icon>
              <div class="sys-text-group" style="justify-content: center">
                <span class="sys-btn-main-text">保存配置</span>
              </div>
            </div>
            <div class="sys-scan-line"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- 关键点2：在容器上添加 @mousedown.prevent -->
    <!-- 这可以防止点击键盘背景时焦点丢失，但不会阻止 SimpleKeyboard 的按键点击 -->
    <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition" @mousedown.prevent>
      <SimpleKeyboard v-model="currentInputValue" :defaultLayout="currentLayout" @onKeyPress="handleKeyPress"
        @onClose.stop="showKeyboard = false" keyboardClass="show-keyboard" />
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, defineAsyncComponent, ref, nextTick, watch, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import {
  Setting,
  SwitchButton,
  OfficeBuilding,
  Flag,
  House,
  Location,
  Cpu,
  /*
  Odometer,
  Sunny,
  Pouring,
  Operation,
  */
  Select,
  //RefreshLeft,
  Edit,
} from '@element-plus/icons-vue'
import { ElMessage, /*ElMessageBox,*/ ElLoading } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
const router = useRouter()
const audioStore = useAudioStore()

const showKeyboard = ref(false)
const activeField = ref('')
const currentInputValue = ref('')
const scrollAreaHeight = ref('60vh')
const currentLayout = ref('number')
const cursorIndex = ref(0) // 新增：用于记录光标当前的位置
const activeInputDom = ref(null) // 新增：用于存储当前获得焦点的 DOM 元素
const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard_black.vue'))
const keyboardPosition = ref({
  top: '0px',
  left: '0px',
  position: 'absolute',
})
// 新增：通用更新光标位置的方法
// 绑定到 @click 和 @keyup 上，确保用户手动点哪里，我们就记哪里
const updateCursorPos = (event) => {
  // 确保获取的是 input 元素
  const inputEl =
    event.target.tagName === 'INPUT' ? event.target : event.target.querySelector('input')
  if (inputEl) {
    cursorIndex.value = inputEl.selectionStart
    activeInputDom.value = inputEl // 双重保险，确保 activeInputDom 是最新的
    console.log('当前光标位置更新为:', cursorIndex.value)
  }
}
watch(currentInputValue, (newValue, oldValue) => {
  if (showKeyboard.value && activeField.value) {
    // 1. 更新数据
    formData[activeField.value] = newValue

    // 2. 计算光标应该移动多少位
    // 简单的逻辑：新长度 - 旧长度 = 变化量
    // 比如：原来是 "123"，在中间插入 "4" 变成 "1243"，长度+1，光标也应该+1
    const oldLength = (oldValue || '').length
    const newLength = (newValue || '').length
    const diff = newLength - oldLength

    // 3. 更新我们记录的光标位置
    cursorIndex.value += diff

    // 边界处理：防止光标位置小于0或超过字符串长度
    if (cursorIndex.value < 0) cursorIndex.value = 0
    if (cursorIndex.value > newLength) cursorIndex.value = newLength

    // 4. 强制设定 DOM 光标位置
    nextTick(() => {
      if (activeInputDom.value) {
        activeInputDom.value.focus()
        // 核心修正：使用 setSelectionRange 精确归位
        activeInputDom.value.setSelectionRange(cursorIndex.value, cursorIndex.value)
      }
    })
  }
})
const openKeyboard = (layout, fieldName, event) => {
  try {
    activeField.value = fieldName
    currentInputValue.value = formData[fieldName] || ''
    currentLayout.value = layout
    showKeyboard.value = true
    scrollAreaHeight.value = '35vh'

    if (event && event.target) {
      activeInputDom.value = event.target

      // 打开键盘时，立即记录一次当前光标位置
      // 防止用户先点了一下输入框中间，然后键盘才弹出来，导致初始位置不对
      cursorIndex.value = event.target.selectionStart || currentInputValue.value.length

      nextTick(() => {
        const targetEl = event.target.closest('.el-form-item') || event.target
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
        event.target.focus()
        // 再次确保选中位置
        event.target.setSelectionRange(cursorIndex.value, cursorIndex.value)
      })
    }

    if (layout === 'default') {
      keyboardPosition.value = {
        bottom: '0px',
        width: '100%',
        left: `0px`,
        position: 'fixed',
        'z-index': 9999,
      }
    }
  } catch (error) {
    console.log(error)
  }
}
// 修改 handleKeyPress 方法，处理按键点击后的焦点丢失
const handleKeyPress = (button) => {
  // 每次按键后也尝试夺回焦点（双重保险）
  nextTick(() => {
    if (activeInputDom.value) activeInputDom.value.focus()
  })

  if (button === '{close}') {
    setTimeout(() => {
      closeKeyboard()
      // 关键点：主动让输入框失去焦点，重置状态
      // 这样用户下次点击输入框时，才能再次触发 @focus 事件唤起键盘
      if (activeInputDom.value) {
        activeInputDom.value.blur()
      }
    }, 200)
  }
  if (button === '{submit}') {
    handleSave()
    // 关键点：主动让输入框失去焦点，重置状态
    // 这样用户下次点击输入框时，才能再次触发 @focus 事件唤起键盘
    if (activeInputDom.value) {
      activeInputDom.value.blur()
    }
  }
}
const closeKeyboard = () => {
  showKeyboard.value = false
  scrollAreaHeight.value = '60vh'
}

const formData = reactive({
  unit_name: '',          // 所属单位名称
  warehouse: '',          // 所属库室名称
  warehouse_location: '', // 所属库室位置
  terminal_id: '',        // 终端唯一ID (UUID)
  cabinet_number: '',     // 自定义编号 (对应 log 中的 cabinet_number)
  name: '',               // 终端设备类型/名称 (对应 log 中的 name)

  /*
  temp_threshold: 45,
  humid_threshold: 80,
  enable_audio: true,
  enable_voice_alert: true,
  screensaver_time: 5,
  */
})

const handleExit = () => {
  router.back()
}

const handleSave = async () => {

  // 1. 开启 Loading
  const loading = ElLoading.service({
    lock: true,
    text: '正在写入系统参数...',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  try {
    // 2. 准备数据
    // 我们将 formData 转换为纯 JSON 对象
    const currentData = toRaw(formData)

    // 3. 调用 electronAPI 接口
    const response = await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'terminal_settings',
        setValues: {
          // A. 更新独立字段 (确保您的 fetchConfigData 下次能读取到正确的值)
          unit_name: currentData.unit_name,
          warehouse: currentData.warehouse,
          warehouse_location: currentData.warehouse_location,
          cabinet_number: currentData.cabinet_number,
          name: currentData.name,
        },
        condition: 'id = 1', // 默认更新 ID 为 1 的记录
      },
    })

    // 4. 处理响应
    if (response.success) {
      setTimeout(() => {
        loading.close()
        // ElMessage.success('系统参数配置已更新')
        audioStore.play('/audio/保存成功.mp3')
        closeKeyboard() // 保存成功后关闭键盘
      }, 800)
    } else {
      throw new Error(response.message || '数据库操作未返回成功状态')
    }

  } catch (error) {
    // 5. 错误处理
    loading.close()
    console.error('保存配置失败:', error)
    ElMessage.error(`保存失败: ${error.message || '未知错误'}`)
  }
}

/*
const handleReset = () => {
  audioStore.play('/audio/警告音.mp3')
  ElMessageBox.confirm('确定要恢复所有参数为出厂默认值吗？此操作不可撤销。', '重置确认', {
    confirmButtonText: '确定重置',
    cancelButtonText: '取消',
    type: 'warning',
    showIcon: false,
    customClass: 'sys-config-message-box warning-mode',
    center: true,
  })
    .then(() => {
      formData.temp_threshold = 45
      formData.humid_threshold = 80
      formData.enable_audio = true
      formData.device_type = '三类柜'
      formData.custom_id = ''
      ElMessage.info('参数已恢复默认')
    })
    .catch(() => { })
}
*/
const fetchConfigData = async () => {
  try {
    const response = await window.electronAPI.el_post({
      action: 'queryMultipleTables',
      payload: {
        arr: [{ tablename: 'terminal_settings', condition: '' }],
      },
    })

    if (response.success && response.data?.terminal_settings) {
      console.log('配置数据:', toRaw(response.data.terminal_settings))
      const data = response.data.terminal_settings
      console.log('配置数据已加载:', toRaw(data))

      // 数据映射
      formData.terminal_id = data.terminal_id || ''

      // 处理可能为 null 的字段，转换为空字符串显示
      formData.unit_name = data.unit_name || ''
      formData.warehouse = data.warehouse || ''
      formData.warehouse_location = data.warehouse_location || ''
      formData.cabinet_number = data.cabinet_number || ''

      // 如果名字是默认的"待命名终端"，可能在前端显示为空让用户选，或者直接显示
      // 这里直接赋值，如果 Log 里是 "待命名终端"，下拉框若没有匹配项可能会显示文字
      // 您的下拉框选项是：一类柜、二类柜等。
      // 如果后端存的是 "待命名终端"，下拉框可能不会高亮任何选项（除非添加该选项），这通常是正常的初始化状态
      formData.name = (data.name == '待命名终端' ? '' : data.name || '')
    }
  } catch (error) {
    console.error('配置加载失败:', error)
  }
}
onMounted(() => {
  console.log('Settings Page Mounted')
  fetchConfigData()
})
</script>

<style scoped>
/* ================= 页面专属主题变量 ================= */
.sys-config-theme-dark {
  --sys-primary: #00f2ff;
  --sys-primary-dark: #0099a1;
  --sys-success: #00ff9d;
  --sys-error: #ff4d4f;
  --sys-bg-dark: #0a0e17;
  --sys-card-bg: #141b2d;
  --sys-border: #2a3546;
  --sys-active-bg: #1c2538;
  --sys-text-main: #ffffff;
  --sys-text-sec: #8899a6;
}

.sys-config-container {
  width: 100%;
  height: 100vh;
  background-color: var(--sys-bg-dark);
  color: var(--sys-text-main);
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* ================= 顶部栏 ================= */
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
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.sys-config-sub-title {
  color: var(--sys-primary-dark);
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 1px;
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
  transition: all 0.3s;
}

.sys-config-btn-exit:hover {
  background: rgba(255, 77, 79, 0.1);
  color: #ff7875;
  border-color: #ff7875;
}

/* ================= 主体内容 ================= */
.sys-config-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  overflow: hidden;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.sys-config-scroll-area {
  flex: 1;
  padding-right: 10px;
}

.sys-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding-bottom: 20px;
}

.sys-config-section {
  background: rgba(20, 27, 45, 0.6);
  border: 1px solid var(--sys-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.sys-config-section:hover {
  border-color: #4a5c76;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
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

.sys-mt-20 {
  margin-top: 20px;
}

.sys-mb-15 {
  margin-bottom: 15px;
}

/* 控件样式 */
.sys-threshold-group {
  padding: 10px 0;
}

.sys-group-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  font-size: 13px;
  margin-bottom: 15px;
}

.sys-value-display {
  font-family: 'Consolas', monospace;
  font-size: 16px;
  color: var(--sys-error);
  font-weight: bold;
}

.sys-switch-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.sys-switch-row:last-child {
  border-bottom: none;
}

.sys-sw-label {
  font-size: 13px;
  color: #ccc;
}

/* ================= 底部操作栏 ================= */
.sys-config-footer {
  height: 70px;
  margin-top: 15px;
  border-top: 1px solid var(--sys-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
}

.sys-config-save-btn {
  width: 200px;
  height: 46px;
  background: linear-gradient(90deg, var(--sys-primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--sys-primary);
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.sys-config-save-btn:hover {
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.4);
}

.sys-btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  position: relative;
  z-index: 2;
}

.sys-text-group {
  display: flex;
  flex-direction: column;
}

.sys-btn-main-text {
  font-size: 15px;
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
  z-index: 1;
}

.sys-btn-text {
  background: none;
  border: 1px solid var(--sys-border);
  color: var(--sys-text-sec);
  padding: 8px 16px;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sys-btn-text:hover {
  color: #fff;
  border-color: #fff;
}

.sys-btn-text.danger:hover {
  color: var(--sys-error);
  border-color: var(--sys-error);
  background: rgba(255, 77, 79, 0.1);
}

/* ================= Element Plus 深度覆盖 ================= */
:deep(.sys-config-input .el-input__wrapper),
:deep(.sys-config-select .el-select__wrapper),
:deep(.sys-config-input-number .el-input__wrapper) {
  background-color: rgba(20, 27, 45, 0.8) !important;
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  transition: all 0.3s;
}

:deep(.sys-config-input .el-input__wrapper:hover),
:deep(.sys-config-input .el-input__wrapper.is-focus),
:deep(.sys-config-select .el-select__wrapper:hover),
:deep(.sys-config-select .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--sys-primary) inset !important;
  background-color: rgba(0, 242, 255, 0.05) !important;
}

:deep(.sys-config-input .el-input__inner),
:deep(.sys-config-select .el-select__selected-item) {
  color: #fff !important;
}

:deep(.sys-disabled-input .el-input__wrapper) {
  background-color: #0f131a !important;
  box-shadow: none !important;
  border: 1px dashed #333;
}

:deep(.sys-disabled-input .el-input__inner) {
  color: #555 !important;
}

:deep(.el-form-item__label) {
  color: var(--sys-text-sec) !important;
  font-size: 14px;
}

:deep(.sys-config-slider .el-slider__runway) {
  background-color: #2a3546;
  height: 4px;
}

:deep(.sys-config-slider .el-slider__bar) {
  background-color: var(--sys-error);
  height: 4px;
}

:deep(.sys-config-slider .el-slider__button) {
  border: 2px solid var(--sys-error);
  background-color: #141b2d;
}

:deep(.sys-config-slider.blue-mode .el-slider__bar) {
  background-color: var(--sys-primary);
}

:deep(.sys-config-slider.blue-mode .el-slider__button) {
  border-color: var(--sys-primary);
}

:deep(.sys-config-input-number .el-input-number__decrease),
:deep(.sys-config-input-number .el-input-number__increase) {
  background: #141b2d;
  border-color: #4a5c76;
  color: #fff;
}

.keyboard-container {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100% !important;
  z-index: 9999 !important;
  background-color: #141b2d !important;
  border-top: 1px solid #00f2ff;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.6);
  border-radius: 0 !important;
  padding: 5px 0 20px 0 !important;
  box-sizing: border-box;
}

:deep(.show-keyboard) {
  background-color: transparent !important;
  color: #fff !important;
}

:deep(.show-keyboard .hg-button) {
  background: #2a3546 !important;
  color: #fff !important;
  border-bottom: 2px solid #151a23 !important;
  transition: all 0.1s;
}

:deep(.show-keyboard .hg-button:active) {
  background: #00f2ff !important;
  color: #000 !important;
  transform: translateY(2px);
}

:deep(.show-keyboard .hg-functionBtn) {
  background: #1c2538 !important;
}
</style>

<style>
/* ================= 全局弹窗样式 (Namespace: sys-config-) ================= */
.sys-config-message-box {
  width: 460px !important;
  max-width: 90vw !important;
  background-color: #0f131a !important;
  background-image:
    linear-gradient(rgba(255, 77, 79, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 77, 79, 0.05) 1px, transparent 1px) !important;
  background-size: 20px 20px !important;
  border: 1px solid #4a5c76 !important;
  border-radius: 0 !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8) !important;
  padding-bottom: 20px !important;
}

/* 红色警告模式 */
.sys-config-message-box.warning-mode {
  border-color: #ff4d4f !important;
  box-shadow:
    0 0 20px rgba(255, 77, 79, 0.15),
    inset 0 0 50px rgba(255, 77, 79, 0.05) !important;
}

/* 角落装饰 */
.sys-config-message-box::before {
  content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  width: 20px;
  height: 20px;
  border-top: 3px solid #ff4d4f;
  border-left: 3px solid #ff4d4f;
  z-index: 10;
}

.sys-config-message-box::after {
  content: '';
  position: absolute;
  bottom: -1px;
  right: -1px;
  width: 20px;
  height: 20px;
  border-bottom: 3px solid #ff4d4f;
  border-right: 3px solid #ff4d4f;
  z-index: 10;
}

.sys-config-message-box .el-message-box__header {
  padding: 25px 25px 0 25px;
}

.sys-config-message-box .el-message-box__title {
  color: #fff !important;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
}

.sys-config-message-box .el-message-box__content {
  color: #aeb9c0 !important;
  padding: 25px 25px 10px 25px !important;
  font-size: 15px;
  line-height: 1.6;
}

.sys-config-message-box .el-message-box__headerbtn .el-message-box__close {
  color: #4a5c76 !important;
}

.sys-config-message-box .el-message-box__headerbtn:hover .el-message-box__close {
  color: #ff4d4f !important;
}

.sys-config-message-box .el-message-box__btns {
  padding: 15px 25px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ================= 核心修改：按钮样式 ================= */

/* 1. 取消按钮：透明幽灵风格 (仿照仅结算按钮) */
.sys-config-message-box .el-button--default,
.sys-config-message-box .el-button--default:focus,
.sys-config-message-box .el-button--default:active {
  background: transparent !important;
  border: 1px solid #4a5c76 !important;
  color: #8899a6 !important;
  box-shadow: none !important;
  border-radius: 4px !important;
  height: 36px;
  padding: 8px 20px;

  /* 强制覆盖 Element 变量以防止点击变白 */
  --el-button-bg-color: transparent !important;
  --el-button-hover-bg-color: transparent !important;
  --el-button-active-bg-color: transparent !important;
  --el-button-text-color: #8899a6 !important;
  --el-button-border-color: #4a5c76 !important;
}

/* 取消按钮 Hover */
.sys-config-message-box .el-button--default:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: #fff !important;
  color: #fff !important;
}

/* 2. 确认按钮：深红警告风格 */
.sys-config-message-box.warning-mode .el-button--primary {
  background: #a31515 !important;
  border: 1px solid #ff4d4f !important;
  color: #fff !important;
  border-radius: 4px !important;
  height: 36px;
  padding: 8px 20px;
}

.sys-config-message-box.warning-mode .el-button--primary:hover {
  background: #ff4d4f !important;
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.4);
}

@keyframes sysBtnScan {
  0% {
    left: -100%;
  }

  20% {
    left: 200%;
  }

  100% {
    left: 200%;
  }
}

/* 下拉框覆盖 */
.el-popper.sys-config-dropdown {
  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
}

.el-popper.sys-config-dropdown .el-popper__arrow::before {
  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
}

.sys-config-dropdown .el-select-dropdown__item {
  color: #ccc !important;
  background: transparent !important;
}

.sys-config-dropdown .el-select-dropdown__item:hover {
  background-color: rgba(0, 242, 255, 0.15) !important;
  color: #fff !important;
}

.sys-config-dropdown .el-select-dropdown__item.selected {
  color: #00f2ff !important;
  font-weight: bold;
}
</style>
