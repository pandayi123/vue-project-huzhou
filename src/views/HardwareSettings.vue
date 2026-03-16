<template>
  <div class="sys-config-container sys-config-theme-dark">
    <!-- ================= 顶部导航栏 ================= -->
    <header class="sys-config-header">
      <div class="sys-config-header-left">
        <div class="sys-config-icon-box">
          <el-icon :size="24" class="sys-config-primary-icon">
            <Cpu />
          </el-icon>
        </div>
        <div class="sys-config-title-text">
          <h1>硬件配置</h1>
          <span class="sys-config-sub-title">门锁控制器 · 传感器映射</span>
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
    <div class="sys-config-body" v-loading="loading" element-loading-background="rgba(10, 14, 23, 0.8)">
      <el-scrollbar class="sys-config-scroll-area">
        <div class="sys-config-grid">

          <!-- 板块 1: 门锁控制单元 -->
          <div class="sys-config-section">
            <div class="sys-config-section-header">
              <el-icon>
                <Lock />
              </el-icon>
              <span>门锁控制单元</span>
              <div class="sys-config-section-line"></div>
            </div>
            <div class="sys-config-section-body">
              <div class="hw-status-panel">
                <div class="hw-status-label">当前扩展板地址</div>
                <div class="hw-address-tags secondary">
                  <div v-for="addr in form_lock.expansion_board_addresses" :key="addr" class="hw-tag-item">
                    <span class="hw-status-dot active"></span>
                    板{{ addr }}
                  </div>
                  <div v-if="!form_lock.expansion_board_addresses.length" class="hw-tag-item">未扫描到门控设备</div>
                </div>
              </div>

              <!-- [新增] 已设置门锁列表矩阵 -->
              <div class="hw-configured-container">
                <div class="hw-configured-title">
                  <el-icon>
                    <Memo />
                  </el-icon> 已注册门锁列表 ({{ form_lock.details.length }})
                </div>
                <div class="hw-node-grid custom-scroll">
                  <div v-for="item in form_lock.details" :key="item.self_address" class="hw-node-card">
                    <div class="hw-node-id">#{{ item.self_address }} 锁</div>
                    <div class="hw-node-info">板{{ item.expansion_board_address }} - 寄存器{{
                      item.open_lock_register_address }}</div>
                  </div>
                  <div v-if="!form_lock.details.length" class="hw-node-empty">未配置门锁地址</div>
                </div>
              </div>

              <!-- [修改] 底部按钮：仿照右侧风格 -->
              <div class="sys-btn-group sys-mt-20">
                <button class="sys-minor-action-btn" @click="openLockRegDialog">
                  <el-icon>
                    <Setting />
                  </el-icon> 设置新地址
                </button>
              </div>
            </div>
          </div>

          <!-- 板块 2: 微动传感器单元 -->
          <div class="sys-config-section">
            <div class="sys-config-section-header">
              <el-icon>
                <Compass />
              </el-icon>
              <span>微动传感单元</span>
              <div class="sys-config-section-line"></div>
            </div>
            <div class="sys-config-section-body">
              <div class="hw-status-panel">
                <div class="hw-status-label">当前扩展板地址</div>
                <div class="hw-address-tags secondary">
                  <div v-for="addr in form_switch.expansion_board_addresses" :key="addr" class="hw-tag-item">
                    <span class="hw-status-dot active"></span>
                    板{{ addr }}
                  </div>
                  <div v-if="!form_switch.expansion_board_addresses.length" class="hw-tag-item">未扫描到门控板</div>
                </div>
              </div>

              <!-- 已配置列表矩阵 -->
              <div class="hw-configured-container">
                <div class="hw-configured-title">
                  <el-icon>
                    <Memo />
                  </el-icon> 已注册传感器列表 ({{ form_switch.details.length }})
                </div>
                <div class="hw-node-grid custom-scroll">
                  <div v-for="item in form_switch.details" :key="item.self_address" class="hw-node-card"
                    :style="realtimeSignals[item.self_address] ? 'border-color: var(--sys-success)' : ''">
                    <div class="hw-node-id">#{{ item.self_address }}</div>
                    <div class="hw-node-info">板{{ item.expansion_board_address }}-路{{ item.channel_address }}</div>
                  </div>
                  <!-- 将 v-if 这一行修改为： -->
                  <div v-if="!form_switch.details.length"
                    style="font-size:14px; grid-column: 1 / -1; text-align: center; padding: 20px 0; color: var(--sys-text-sec); white-space: nowrap;">
                    注册列表暂时为空
                  </div>
                </div>
              </div>

              <!-- 修改点 1：替换原有按钮为按钮组 -->
              <div class="sys-btn-group sys-mt-20">
                <button class="sys-minor-action-btn danger-outline" @click="handleResetAll">
                  <el-icon>
                    <Delete />
                  </el-icon> 全部重置
                </button>
                <button class="sys-minor-action-btn" @click="openRegDialog">
                  <el-icon>
                    <Plus />
                  </el-icon> 批量注册
                </button>
                <!-- [新增] 手动注册按钮 -->
                <button class="sys-minor-action-btn" @click="openManualRegDialog">
                  <el-icon>
                    <EditPen />
                  </el-icon> 感应注册
                </button>
                <!-- 新增：开关检测按钮 -->
                <button class="sys-minor-action-btn" @click="openTestDialog">
                  <el-icon>
                    <Monitor />
                  </el-icon> 单元检测
                </button>
              </div>
            </div>
          </div>

        </div>
      </el-scrollbar>

      <!-- 底部操作栏 -->
      <div class="sys-config-footer">
        <div class="sys-footer-left">
          <button class="sys-btn-text" @click="handleReDetect">
            <el-icon>
              <Refresh />
            </el-icon> 重新扫描扩展板
          </button>
        </div>
      </div>
    </div>

    <!-- 对码状态弹窗 -->
    <el-dialog v-model="isApplying" :show-close="false" class="sys-config-message-box warning-mode" width="460px"
      center>
      <div class="hw-loading-dialog">
        <div class="hw-loading-spinner"></div>
        <div class="hw-loading-text">系统侦听中...</div>
        <div class="hw-loading-sub">请按照顺序物理触发对应开关</div>
        <div class="hw-loading-current">当前等待编号：<span>{{ currentId }}</span></div>
        <button class="sys-btn-text danger sys-mt-20" @click="isApplying = false">中断当前任务</button>
      </div>
    </el-dialog>

    <!-- 修改点 2：新增批量注册对话框 (参考盘点页样式) -->
    <el-dialog v-model="regVisible" title="批量注册传感器" width="420px" class="sys-config-dialog-unique" destroy-on-close>
      <div class="reg-dialog-content">
        <el-form label-position="top" :model="regForm" :rules="batchRules" ref="batchFormRef">
          <el-form-item label="起始编号 (自定 ID，范围1-9999)" prop="startId">
            <el-input v-model="regForm.startId" class="sys-config-input" placeholder="点击输入起始编号"
              @focus="openKeyboard('startId', regForm, $event)" @click="updateCursorPos" @keyup="updateCursorPos" />
          </el-form-item>

          <el-form-item label="本次注册数量" prop="count">
            <!-- 修改后 -->
            <el-input v-model="regForm.count" class="sys-config-input" placeholder="点击输入数量"
              @focus="openKeyboard('count', regForm, $event)" @click="updateCursorPos" @keyup="updateCursorPos" />
          </el-form-item>
        </el-form>

        <div class="reg-preview" v-if="regForm.count > 0">
          <el-icon>
            <InfoFilled />
          </el-icon>
          当前检测到 {{ form_switch.expansion_board_addresses.length }} 块扩展板，
          物理支持最大编号至 #{{ form_switch.expansion_board_addresses.length * 10 }}
        </div>
      </div>

      <template #footer>
        <div class="reg-footer">
          <button class="footer-btn cancel" @click="regVisible = false">取消</button>
          <button class="footer-btn confirm" @click="submitBatchReg">确认生成</button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改点 2：新增“开关实时检测”弹窗 (参考盘点页风格) -->
    <el-dialog v-model="testVisible" title="传感器物理信号实时监测" width="800px" class="sys-config-dialog-unique" destroy-on-close
      @close="stopTestPolling">
      <div class="test-dialog-content">
        <div class="test-header-tip">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          <span>系统正在实时侦听物理信号，请触发柜内开关进行测试...</span>
        </div>

        <!-- 信号矩阵网格 -->
        <div class="test-signal-grid custom-scroll">
          <div v-for="item in form_switch.details" :key="item.self_address" class="test-signal-card"
            :class="{ 'is-active': realtimeSignals[item.self_address] === 1 }">
            <div class="s-node-id">#{{ item.self_address }}</div>
            <div class="s-status-text">
              {{ realtimeSignals[item.self_address] === 1 ? '已触发 (通)' : '未触发 (断)' }}
            </div>
            <!-- 装饰性光圈，仅在激活时显示 -->
            <div class="s-glow-ring"></div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="reg-footer">
          <button class="footer-btn confirm" @click="testVisible = false">结束检测</button>
        </div>
      </template>
    </el-dialog>

    <!-- 修改点 2：新增“手动单条注册”对话框 -->
    <el-dialog v-model="manualRegVisible" title="手动单条录入传感器" width="420px" class="sys-config-dialog-unique"
      destroy-on-close>
      <div class="reg-dialog-content">
        <el-form label-position="top">
          <el-form-item label="传感器映射编号 (自定 ID)">
            <el-input-number v-model="manualForm.self_address" :min="1" class="cyber-number-input"
              controls-position="right" />
          </el-form-item>

          <el-row :gutter="15">
            <el-col :span="12">
              <el-form-item label="扩展板 ID">
                <el-input-number v-model="manualForm.expansion_board_address" :min="1" class="cyber-number-input"
                  controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="物理通道地址">
                <el-input-number v-model="manualForm.channel_address" :min="1" :max="16" class="cyber-number-input"
                  controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <div class="reg-footer">
          <button class="footer-btn cancel" @click="manualRegVisible = false">取消</button>
          <button class="footer-btn confirm" @click="submitManualReg">保存录入</button>
        </div>
      </template>
    </el-dialog>

    <!-- [底部新增] 门锁地址设置弹窗 -->
    <el-dialog v-model="lockRegVisible" title="设置门锁控制地址" width="420px" class="sys-config-dialog-unique"
      destroy-on-close>
      <div class="reg-dialog-content">
        <el-form label-position="top">
          <el-form-item label="门锁映射编号 (柜体标识 #)">
            <el-input-number v-model="lockForm.self_address" :min="1" class="cyber-number-input"
              controls-position="right" />
          </el-form-item>
          <el-row :gutter="15">
            <el-col :span="12">
              <el-form-item label="门控板 ID">
                <el-input-number v-model="lockForm.expansion_board_address" :min="1" class="cyber-number-input"
                  controls-position="right" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="开锁寄存器地址">
                <el-input-number v-model="lockForm.open_lock_register_address" :min="1" class="cyber-number-input"
                  controls-position="right" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <template #footer>
        <div class="reg-footer">
          <button class="footer-btn cancel" @click="lockRegVisible = false">取消</button>
          <button class="footer-btn confirm" @click="submitLockReg">保存设置</button>
        </div>
      </template>
    </el-dialog>

    <!-- 危险操作确认对话框 -->
    <el-dialog v-model="resetVisible" title="操作确认" width="500px" class="sys-config-dialog-unique" destroy-on-close>
      <div class="reg-dialog-content">
        <div
          style="color: var(--sys-error); font-weight: bold; font-size: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;">
          <el-icon>
            <Warning />
          </el-icon> 确定要清空所有注册传感单元吗？
        </div>
        <div style="color: var(--sys-text-sec); font-size: 15px; ">
          此操作将清空已注册传感器列表。清空后，原有的“装备-感应点”对应关系将失效。为确保开关感应的准确性，请在重置后前往装备管理页面，并且依照物理布局重新完成装备地址核对。
          <br />
        </div>
      </div>
      <template #footer>
        <div class="reg-footer">
          <button class="footer-btn cancel" @click="resetVisible = false">取消</button>
          <!-- 特别为重置按钮设置红色警告色 -->
          <button class="footer-btn confirm" style="background: #8b0000; border-color: #ff4d4f;" @click="executeReset">
            确定重置
          </button>
        </div>
      </template>
    </el-dialog>

    <!-- 在 template 根节点最后添加键盘容器 -->
    <!-- 页面底部的键盘组件调用 -->
    <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition" @mousedown.prevent>
      <SimpleKeyboard v-model="currentInputValue" defaultLayout="number" @onKeyPress="handleKeyPress"
        @onClose.stop="showKeyboard = false" keyboardClass="show-keyboard" />
    </div>

  </div>


</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick, defineAsyncComponent, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  Cpu, Lock, SwitchButton, Compass, Memo,
  Refresh, Delete, Plus, Monitor, Loading, InfoFilled, EditPen, Setting, Warning // 新增
} from '@element-plus/icons-vue'

// --- 导入 Store 和 API ---
import { useConfigStore } from '@/stores/configStore'
import { useTimerStore } from '@/stores/timerStore'
import { useAudioStore } from '@/stores/audioStore'
import { ElMessageBox, ElMessage } from 'element-plus'
// 1. 引入虚拟键盘组件
const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard_black.vue'))

const resetVisible = ref(false) // 控制重置确认弹窗

const router = useRouter()
const configStore = useConfigStore()
const timerStore = useTimerStore()
const audioStore = useAudioStore()
const config_blob = ref(null) // 全局配置快照

const loading = ref(false)
const isApplying = ref(false)
const currentId = ref('--')

const form_lock = reactive({
  expansion_board_addresses: [],
  details: [], // <--- 必须加上这一行，初始化为空数组
  initialAddress: 1,
  quantity: 1
})

const form_switch = reactive({
  expansion_board_addresses: [],
  details: []
})


// 2. 定义新变量
const regVisible = ref(false)
const regForm = reactive({
  startId: 1,
  count: 10
})

// 2. 新增检测相关的响应式变量
const testVisible = ref(false)
const isPollingSignals = ref(false)
const realtimeSignals = reactive({}) // 存储实时信号状态 { self_address: 0/1 }



// 2. 键盘相关状态
const showKeyboard = ref(false)
const currentInputValue = ref('')
const activeField = ref('')
const activateForm = ref(null)
const keyboardPosition = ref({
  top: '0px',
  left: '0px',
  position: 'fixed',
  zIndex: 3000
})
// 在原有变量附近添加
const cursorIndex = ref(0)
const activeInputDom = ref(null)

// --- [新增] 表单校验引用 ---
const batchFormRef = ref(null)
const manualFormRef = ref(null)
const lockFormRef = ref(null)

// --- [新增] 校验逻辑 (参考旧代码) ---
const validateNumber = (min, max, label) => {
  return (rule, value, callback) => {
    const num = Number(value)
    if (value === '' || value === null || value === undefined) {
      callback(new Error(`请输入${label}`))
    } else if (num < min || num > max) {
      callback(new Error(`${label}范围: ${min}-${max}`))
    } else {
      callback()
    }
  }
}

const batchRules = {
  startId: [{ validator: validateNumber(1, 9999, '起始编号'), trigger: 'change' }],
  count: [{ validator: validateNumber(1, 300, '注册数量'), trigger: 'change' }]
}

const manualRules = {
  self_address: [{ validator: validateNumber(1, 9999, '映射编号'), trigger: 'change' }],
  expansion_board_address: [{ validator: validateNumber(1, 7, '扩展板ID'), trigger: 'change' }],
  channel_address: [{ validator: validateNumber(1, 10, '物理通道'), trigger: 'change' }]
}

const lockRules = {
  self_address: [{ validator: validateNumber(1, 99, '映射编号'), trigger: 'change' }],
  expansion_board_address: [{ validator: validateNumber(201, 202, '门控板ID'), trigger: 'change' }],
  open_lock_register_address: [{ validator: validateNumber(1, 255, '寄存器地址'), trigger: 'change' }]
}

// 3. 键盘按键处理
const handleKeyPress = (button) => {
  if (button === '{close}') {
    showKeyboard.value = false
  }
}

// 4. 监听键盘值变化同步到表单
watch(currentInputValue, (newValue, oldValue) => {
  if (activeField.value && activateForm.value) {
    // 1. 同步数据
    activateForm.value[activeField.value] = newValue ? Number(newValue) : 0

    // 2. 计算光标位移 (新长度 - 旧长度)
    const oldLength = (oldValue || '').length
    const newLength = (newValue || '').length
    const diff = newLength - oldLength

    // 3. 更新内部记录的光标位置
    cursorIndex.value += diff

    // 边界处理
    if (cursorIndex.value < 0) cursorIndex.value = 0
    if (cursorIndex.value > newLength) cursorIndex.value = newLength

    // 4. 核心：强制回填光标到 DOM
    nextTick(() => {
      if (activeInputDom.value) {
        activeInputDom.value.focus()
        activeInputDom.value.setSelectionRange(cursorIndex.value, cursorIndex.value)
      }
    })
  }
})

// 5. 打开键盘并定位
const openKeyboard = (fieldName, formRef, event) => {
  activeField.value = fieldName
  activateForm.value = formRef
  currentInputValue.value = String(formRef[fieldName] || '')
  showKeyboard.value = true

  // 新增：捕获真实的 input DOM 元素并记录初始光标
  if (event && event.target) {
    // 兼容 Element Plus 的 input 结构，确保抓到原生 input 标签
    const inputEl = event.target.tagName === 'INPUT' ? event.target : event.target.querySelector('input')
    activeInputDom.value = inputEl

    // 记录当前光标位置，如果没有则默认在文字最后
    cursorIndex.value = inputEl.selectionStart || currentInputValue.value.length

    nextTick(() => {
      inputEl.focus()
      // 强制设置一次光标位置
      inputEl.setSelectionRange(cursorIndex.value, cursorIndex.value)
    })
  }

  nextTick(() => {
    const rect = event.target.getBoundingClientRect()
    keyboardPosition.value = {
      top: `${rect.bottom + 12}px`,
      left: `${rect.left - 80}px`,
      position: 'fixed',
      zIndex: 9999
    }
  })
}
const updateCursorPos = (event) => {
  const inputEl = event.target.tagName === 'INPUT' ? event.target : event.target.querySelector('input')
  if (inputEl) {
    cursorIndex.value = inputEl.selectionStart
    activeInputDom.value = inputEl
  }
}

// --- 核心方法：获取/刷新硬件数据 ---
const fetchConfigData = async () => {
  loading.value = true
  try {
    // 1. 从 Store 加载本地配置
    config_blob.value = JSON.parse(configStore.terminal.config_blob)
    Object.assign(form_switch, config_blob.value.switch)
    Object.assign(form_lock, config_blob.value.lock)

    setTimeout(() => {
      audioStore.play(`/audio/正在扫描硬件设备.mp3`)
    }, 1000)


    // 2. 调用 Electron API 扫描 485 在线设备
    const response = await window.electronAPI.el_post({
      action: 'check_485_device_online',
      payload: {},
    })

    if (response?.success && response.data?.length) {
      // 过滤地址：1-7 为开关板，201-202 为门控板
      form_switch.expansion_board_addresses = response.data
        .map(el => Number(el.currentAddr))
        .filter(addr => addr <= 7)

      form_lock.expansion_board_addresses = response.data
        .map(el => Number(el.currentAddr))
        .filter(addr => [201, 202].includes(addr))

      // 同步到配置快照
      config_blob.value.switch.expansion_board_addresses = form_switch.expansion_board_addresses
      config_blob.value.lock.expansion_board_addresses = form_lock.expansion_board_addresses

      // 更新持久化存储
      await saveConfigToDB()

    }
  } catch (error) {
    console.error('获取配置失败:', error)
    ElMessage.error('硬件扫描失败，请检查物理连接')
  } finally {
    loading.value = false
  }
}

// --- 通用方法：保存配置到数据库和 Store ---
const saveConfigToDB = async () => {
  const finalBlob = JSON.stringify(config_blob.value)
  // 更新 Store
  configStore.terminal.config_blob = finalBlob
  // 更新数据库
  await window.electronAPI.el_post({
    action: 'update',
    payload: {
      tableName: 'terminal_settings',
      setValues: { config_blob: finalBlob },
      condition: 'id = 1',
    },
  })
}

// 底部“重新检测扩展板”按钮
const handleReDetect = () => {
  fetchConfigData(true)
}

// 开启检测
const openTestDialog = () => {
  testVisible.value = true
  startTestPolling()
}

// 开启轮询（模拟硬件读取）
const startTestPolling = async () => {
  isPollingSignals.value = true
  while (isPollingSignals.value) {
    // 这里调用您的硬件 API 读取接口
    // 模拟逻辑：随机让一些传感器变绿（实际开发时替换为读取 expansion_board_addresses 的逻辑）
    /*
    const res = await window.electronAPI.el_post({
      action: 'read_all_inputs',
      payload: { ... }
    })
    */

    // 模拟演示数据更新
    form_switch.details.forEach(d => {
      // 实际开发中，这里应根据硬件返回的 binary 数组匹配到对应的 self_address
      // realtimeSignals[d.self_address] = 硬件返回的值
    })

    await new Promise(r => setTimeout(r, 500)) // 500ms 刷新一次
  }
}

// 停止轮询
const stopTestPolling = () => {
  isPollingSignals.value = false
}

// 2. 新增手动录入相关变量
const manualRegVisible = ref(false)
const manualForm = reactive({
  self_address: 1,
  expansion_board_address: 1,
  channel_address: 1
})

// 3. 实现方法

// 打开手动录入弹窗
const openManualRegDialog = () => {
  // 自动预测下一个 ID
  if (form_switch.details.length > 0) {
    const maxId = Math.max(...form_switch.details.map(d => d.self_address))
    manualForm.self_address = maxId + 1
  }
  manualRegVisible.value = true
}

// 提交单条录入
const submitManualReg = () => {
  // 检查自定 ID 是否冲突
  const index = form_switch.details.findIndex(d => d.self_address === manualForm.self_address)

  const record = { ...manualForm }

  if (index !== -1) {
    // 如果 ID 已存在，询问是否覆盖
    ElMessageBox.confirm(`传感器编号 #${record.self_address} 已存在，是否覆盖原有映射数据？`, '覆盖提醒')
      .then(() => {
        form_switch.details[index] = record
        manualRegVisible.value = false
      })
  } else {
    form_switch.details.push(record)
    // 重新排序
    form_switch.details.sort((a, b) => a.self_address - b.self_address)

    // 确保扩展板 ID 被记录
    if (!form_switch.expansion_board_addresses.includes(record.expansion_board_address)) {
      form_switch.expansion_board_addresses.push(record.expansion_board_address)
      form_switch.expansion_board_addresses.sort((a, b) => a - b)
    }

    manualRegVisible.value = false
  }
}

// 3. 定义方法

// 打开对话框
const openRegDialog = () => {
  // 默认起始 ID 为当前最大 ID + 1
  if (form_switch.details.length > 0) {
    const maxId = Math.max(...form_switch.details.map(d => d.self_address))
    regForm.startId = maxId + 1
  } else {
    regForm.startId = 1
  }
  regVisible.value = true
}

// 点击清空按钮：仅打开弹窗
const handleResetAll = () => {
  resetVisible.value = true
}

// 弹窗内点击确定：执行真正的重置逻辑
const executeReset = async () => {
  resetVisible.value = false // 关闭弹窗
  loading.value = true

  try {
    // 1. 仅清空映射详情列表
    form_switch.details = []

    // 2. 同步更新配置快照 (config_blob)
    if (config_blob.value && config_blob.value.switch) {
      config_blob.value.switch.details = []
    }

    // 3. 持久化存储到数据库和 Store
    await saveConfigToDB()

    audioStore.play(`/audio/reset_success.mp3`)
  } catch (error) {
    console.error('重置失败:', error)
  } finally {
    loading.value = false
  }
}

// 提交批量注册 (核心逻辑：按每板 10 个自动分配)
// 6. 重写批量注册逻辑 (纯逻辑添加)
const submitBatchReg = async () => {

  loading.value = true;
  try {
    await batchFormRef.value.validate();
  } catch {
    loading.value = false;
    audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`);
    return;
  }

  // 1. 获取物理在线的板卡列表
  const onlineBoards = [...form_switch.expansion_board_addresses].sort((a, b) => a - b);
  if (onlineBoards.length === 0) {
    audioStore.play(`/audio/未检测到扩展板.mp3`);
    loading.value = false;
    return;
  }

  const currentDetails = [...form_switch.details];

  // 2. 【寻找所有空闲的物理槽位】
  // 我们遍历所有在线板卡和它们的路数(1-10)，看哪些还没在 details 里
  const freePhysicalSlots = [];
  for (const boardAddr of onlineBoards) {
    for (let ch = 1; ch <= 10; ch++) {
      // 检查 details 中是否已经有 ID 占用了这个“板地址+路地址”
      const isSlotOccupied = currentDetails.some(d =>
        Number(d.expansion_board_address) === Number(boardAddr) &&
        Number(d.channel_address) === Number(ch)
      );

      if (!isSlotOccupied) {
        freePhysicalSlots.push({
          board: boardAddr,
          channel: ch
        });
      }
    }
  }

  // 3. 【执行配对绑定】
  let addedCount = 0;
  const targetCount = Number(regForm.count);
  let checkId = Number(regForm.startId); // 用户希望开始的编号
  const finalNewEntries = [];

  // 只要还没加够数量，并且还有空闲的物理槽位
  while (addedCount < targetCount && freePhysicalSlots.length > 0) {

    // A. 检查逻辑 ID (self_address) 是否已被占用
    const isIdUsed = currentDetails.some(d => d.self_address === checkId)

    if (!isIdUsed) {
      // B. ID 没被占用，从空闲物理槽位队列里取出一个
      const slot = freePhysicalSlots.shift(); // 取出最前面的一个空闲槽位

      finalNewEntries.push({
        self_address: checkId,
        expansion_board_address: slot.board,
        channel_address: slot.channel,
        admin_status: 1,
        hardware_status: 0,
        item_placed: false,
        faulty: false
      });

      addedCount++;
    }

    // C. 无论 ID 是否被占用，checkId 都要自增往后搜，直到凑满数量
    checkId++;

    // 安全边界
    if (checkId > 10000) break;
  }

  // 4. 合并并保存
  if (addedCount > 0) {
    // 将新生成的条目合并到旧列表
    const updatedDetails = [...currentDetails, ...finalNewEntries];

    // 排序
    form_switch.details = updatedDetails.sort((a, b) => a.self_address - b.self_address);
    config_blob.value.switch.details = form_switch.details;

    await saveConfigToDB();

    audioStore.play(`/audio/设置已完成.mp3`);
  } else {
    audioStore.play(`/audio/已达注册上限.mp3`);
  }

  loading.value = false;
  regVisible.value = false;
}

const handleExit = () => {
  router.back()
}

// --- 生命周期控制 ---
onMounted(async () => {
  // 必须停止全局轮询，防止 485 冲突
  if (timerStore.isTimerActive) {
    timerStore.stopInterval()
  }
  await fetchConfigData()
})

onUnmounted(() => {
  // 退出页面恢复全局轮询
  if (!timerStore.isTimerActive) {
    timerStore.startInterval()
  }
  stopTestPolling() // 确保测试停止
})
</script>

<style scoped>
/* 此处保持原有样式不变，已确保 dark 主题和布局正确 */
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
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

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

.sys-config-title-text {
  display: flex;
  flex-direction: column;
}

.sys-config-title-text h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
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
}

.sys-config-primary-icon {
  color: var(--sys-primary);
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

.sys-config-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.sys-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding-bottom: 20px;
}

.hw-status-panel {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--sys-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
}

.hw-status-label {
  font-size: 13px;
  color: var(--sys-text-sec);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.hw-address-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.hw-tag-item {
  background: rgba(0, 242, 255, 0.1);
  border: 1px solid rgba(0, 242, 255, 0.3);
  color: var(--sys-primary);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Consolas', monospace;
}

.hw-address-tags.secondary .hw-tag-item {
  background: rgba(0, 255, 157, 0.05);
  border-color: rgba(0, 255, 157, 0.2);
  color: var(--sys-success);
}

.hw-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.hw-status-dot.active {
  background: var(--sys-primary);
  box-shadow: 0 0 8px var(--sys-primary);
}

.hw-configured-container {
  margin-top: 15px;
  border: 1px solid var(--sys-border);
  border-radius: 6px;
  overflow: hidden;
}

.hw-configured-title {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 13px;
  color: var(--sys-primary);
  border-bottom: 1px solid var(--sys-border);
  display: flex;
  align-items: center;
  gap: 6px;
}

.hw-node-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 8px;
  padding: 12px;
  max-height: 240px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.1);
}

.hw-node-card {
  background: var(--sys-active-bg);
  border: 1px solid var(--sys-border);
  padding: 8px 4px;
  border-radius: 4px;
  text-align: center;
}

.hw-node-id {
  font-weight: bold;
  color: #fff;
  font-size: 14px;
}

.hw-node-info {
  font-size: 12px;
  color: var(--sys-text-sec);
  margin-top: 2px;
}

.sys-minor-action-btn {
  width: 100%;
  padding: 10px;
  background: transparent;
  border: 1px solid var(--sys-primary-dark);
  color: var(--sys-primary);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sys-minor-action-btn.highlight {
  background: rgba(0, 242, 255, 0.15);
  border-style: dashed;
  font-weight: bold;
}

.sys-config-section {
  background: rgba(20, 27, 45, 0.6);
  border: 1px solid var(--sys-border);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
}

.sys-config-section-header {
  padding: 12px 15px;
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

:deep(.sys-config-input .el-input__wrapper) {
  background-color: rgba(20, 27, 45, 0.8) !important;
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
}

:deep(.sys-config-input .el-input__inner) {
  color: #fff !important;
}

/* 统一调整表单项之间的间距 */
:deep(.el-form-item) {
  margin-bottom: 25px !important;
  /* 调大这个值会增加上下两个输入框的间距 */
}

:deep(.el-form-item__label) {
  color: var(--sys-text-sec) !important;
  font-size: 14px !important;
  /* 在这里调整大小，单位可以是 px, rem 等 */
  font-weight: bold;
  /* 如果需要加粗可以顺便添加 */
}

/* 调整校验错误信息的间距 */
:deep(.el-form-item__error) {
  padding-top: 5px !important;
  /* 增加或减少文字与输入框的间距 */
  /* 或者使用 margin-top */
  /* margin-top: 2px !important; */

  /* 如果你想让字号也顺便改一下 */
  font-size: 12px !important;
}

.sys-config-footer {
  height: 70px;
  margin-top: 15px;
  border-top: 1px solid var(--sys-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
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
  transition: all 0.3s;
}

.sys-btn-text:hover {
  color: #fff;
  border-color: #fff;
}

.sys-btn-text.danger {
  color: var(--sys-error);
  border-color: var(--sys-error);
}

.sys-btn-text.danger:hover {
  background: rgba(255, 77, 79, 0.1);
}

.hw-loading-dialog {
  text-align: center;
  padding: 20px;
}

.hw-loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(0, 242, 255, 0.1);
  border-top-color: var(--sys-primary);
  border-radius: 50%;
  margin: 0 auto 15px;
  animation: hw-rotate 1s linear infinite;
}

.hw-loading-text {
  font-size: 18px;
  color: #fff;
  font-weight: bold;
}

.hw-loading-sub {
  color: var(--sys-text-sec);
  font-size: 12px;
  margin-top: 8px;
}

.hw-loading-current {
  margin-top: 20px;
  background: #000;
  padding: 10px;
  border-radius: 4px;
  border: 1px dashed var(--sys-primary);
  color: var(--sys-primary);
  font-size: 24px;
  font-weight: bold;
}

@keyframes hw-rotate {
  to {
    transform: rotate(360deg);
  }
}

.sys-mb-15 {
  margin-bottom: 15px;
}

.sys-mt-20 {
  margin-top: 20px;
}

/* --- 自定义深色滚动条样式 (复用盘点页逻辑) --- */

/* 1. 针对 Webkit 浏览器 (Chrome, Electron) */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
  /* 纵向滚动条宽度 */
  height: 6px;
  /* 横向滚动条高度 */
}

/* 滚动条轨道 */
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  /* 深色半透明背景 */
  border-radius: 10px;
}

/* 滚动条滑块 (Thumb) */
.custom-scroll::-webkit-scrollbar-thumb {
  background: #2a3546;
  /* 深灰蓝滑块 */
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.1);
  /* 淡淡的青色边框 */
  transition: all 0.3s;
}

/* 鼠标悬停滑块变亮 */
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #0099a1;
  /* 悬停变为青色 */
}

/* 2. 针对 Firefox 浏览器 */
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: #2a3546 rgba(0, 0, 0, 0.2);
}

/* 全部重置按钮样式 */
.sys-minor-action-btn.danger-outline {
  border-color: var(--sys-error);
  color: var(--sys-error);
  background: rgba(255, 77, 79, 0.05);
}

.sys-minor-action-btn.danger-outline:hover {
  background: rgba(255, 77, 79, 0.15);
  box-shadow: 0 0 10px rgba(255, 77, 79, 0.2);
}

/* 注册对话框内部样式 */
.reg-dialog-content {
  padding: 10px 0;
}

.reg-tip {
  font-size: 12px;
  color: var(--sys-text-sec);
  margin-top: 4px;
}

.reg-preview {
  margin-top: 20px;
  background: rgba(0, 242, 255, 0.05);
  border: 1px solid rgba(0, 242, 255, 0.2);
  padding: 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--sys-primary);
  font-size: 14px;
  font-weight: bold;
}

/* 计数器样式定制 */
.cyber-number-input {
  width: 100% !important;
}

:deep(.cyber-number-input .el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.3) !important;
  box-shadow: 0 0 0 1px var(--sys-border) inset !important;
}

:deep(.cyber-number-input .el-input-number__increase),
:deep(.cyber-number-input .el-input-number__decrease) {
  background-color: var(--sys-active-bg) !important;
  border-color: var(--sys-border) !important;
  color: var(--sys-primary) !important;
}

/* 弹窗页脚按钮 (直接复用盘点页逻辑) */
.reg-footer {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding-bottom: 10px;
}

.footer-btn {
  min-width: 120px;
  height: 38px;
  border-radius: 4px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.footer-btn.cancel {
  background: transparent;
  border: 1px solid var(--sys-border);
  color: var(--sys-text-sec);
}

.footer-btn.confirm {
  background: linear-gradient(90deg, var(--sys-primary-dark), #005f66);
  border: 1px solid var(--sys-primary);
  color: #fff;
}

/* Dialog 全局样式覆盖（确保 class 对应） */
:deep(.sys-config-dialog-unique) {
  background: #141b2d !important;
  border: 1px solid var(--sys-primary-dark) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5) !important;
}

:deep(.sys-config-dialog-unique .el-dialog__title) {
  color: var(--sys-primary) !important;
  font-size: 16px;
}

/* 修改按钮组为 3 列平铺 */
.sys-btn-group {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  /* 变更为 4 列 */
  gap: 8px;
  /* 间距稍微缩小一点，防止溢出 */
}

/* 按钮文字稍微缩小一点点防止挤压 */
.sys-minor-action-btn {
  font-size: 13px;
  padding: 8px 4px;
}

/* --- 检测弹窗专项样式 --- */
.test-header-tip {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--sys-primary);
  background: rgba(0, 242, 255, 0.05);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 13px;
  border-left: 3px solid var(--sys-primary);
}

.test-signal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 10px;
  max-height: 450px;
  overflow-y: auto;
  padding: 5px;
}

.test-signal-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--sys-border);
  border-radius: 4px;
  padding: 12px 8px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* 未激活状态文字 */
.s-node-id {
  font-family: 'Consolas', monospace;
  font-size: 16px;
  color: #fff;
  margin-bottom: 4px;
}

.s-status-text {
  font-size: 11px;
  color: var(--sys-text-sec);
}

/* --- 激活（有信号）状态的赛博发光效果 --- */
.test-signal-card.is-active {
  background: rgba(0, 255, 157, 0.1);
  border-color: var(--sys-success);
  box-shadow: 0 0 15px rgba(0, 255, 157, 0.2);
}

.test-signal-card.is-active .s-node-id {
  color: var(--sys-success);
  text-shadow: 0 0 8px var(--sys-success);
}

.test-signal-card.is-active .s-status-text {
  color: #fff;
  font-weight: bold;
}

/* 装饰性光圈动画 */
.s-glow-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 100px;
  background: radial-gradient(circle, var(--sys-success) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
}

.test-signal-card.is-active .s-glow-ring {
  opacity: 0.15;
  animation: pulse-ring 2s infinite;
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.1;
  }

  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.2;
  }

  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.1;
  }
}

/* 弹窗页脚居中 */
.reg-footer {
  display: flex;
  justify-content: center;
  padding: 10px 0;
}

/* 键盘容器样式 */
.keyboard-container {
  background: #1a2234;
  border: 1px solid var(--sys-primary);
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  padding: 8px;
  width: 500px;
  /* 缩小键盘尺寸适配暗色屏 */
}

/* 强制键盘在 Dialog 之上 */
:deep(.el-overlay) {
  z-index: 2000 !important;
}

.keyboard-container {
  z-index: 3001 !important;
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
