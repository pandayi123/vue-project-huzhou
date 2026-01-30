<template>
  <div class="page-container theme-dark">
    <!-- ================= 顶部导航栏 ================= -->
    <header class="header-bar">
      <div class="header-left">
        <div class="icon-box-glow">
          <el-icon :size="24" class="primary-icon">
            <Files />
          </el-icon>
        </div>
        <div class="title-text">
          <h1>装备盘点</h1>
          <span class="sub-title">实时感知 · 账实校对 · 异常追踪</span>
        </div>
      </div>

      <!-- 修改后：增加并排的盘点历史按钮 -->
      <div class="header-right">
        <button class="history-link-btn header-btn" @click="goToHistory">
          <el-icon>
            <HistoryIcon />
          </el-icon>
          盘点记录
        </button>
        <button class="btn-exit" @click="$router.push('/')">
          <el-icon>
            <SwitchButton />
          </el-icon>
          退出返回
        </button>
      </div>
    </header>

    <!-- ================= 主体内容区 ================= -->
    <div class="main-body">
      <!-- 左侧：盘点明细列表 -->
      <div class="list-section">
        <div class="section-title">
          <!-- 修改后：只保留下拉筛选框 -->
          <div class="title-left">
            <div class="select-wrapper">
              <el-select v-model="selectedName" placeholder="选择装备名称筛选" class="cyber-select"
                popper-class="cyber-select-popper" size="large">
                <el-option label="全部装备名称" value="ALL" />
                <el-option v-for="name in (uniqueNameOptions || []).filter((n) => n !== 'ALL')" :key="name"
                  :label="name" :value="name" />
              </el-select>
            </div>
          </div>

          <!-- 右侧：过滤器标签 -->
          <div class="title-right-actions">
            <div class="filter-tabs">
              <span v-for="tab in filterOptions" :key="tab.value" class="tab"
                :class="{ active: currentFilter === tab.value }" @click="setFilter(tab.value)">
                {{ tab.label }}
                <span class="tab-count" v-if="tab.value === 'ERROR' && stats.mismatch > 0">
                  {{ stats.mismatch }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid">
            <!-- 定位到 <div class="card-grid"> 内部 -->
            <div v-for="item in filteredList" :key="item.id" class="equip-card"
              :class="isItemAbnormal(item) ? 'is-abnormal' : 'is-normal'">
              <!-- 状态角标：异常时显示 -->
              <div class="error-ribbon" v-if="isItemAbnormal(item)">
                <el-icon>
                  <Warning />
                </el-icon>
              </div>

              <!-- 状态角标：正常时显示 (新增) -->
              <div class="success-ribbon" v-else>
                <el-icon>
                  <Check />
                </el-icon>
              </div>

              <!-- 顶部：装备图片 -->
              <div class="equip-image-preview">
                <el-image :src="item.group_image" fit="cover" style="width: 100%; height: 100%">
                  <template #placeholder>
                    <div class="image-placeholder"></div>
                  </template>
                  <template #error>
                    <div class="image-error-slot">
                      <el-icon :size="24">
                        <Box />
                      </el-icon>
                    </div>
                  </template>
                </el-image>
              </div>

              <!-- 中部：核心信息区 -->
              <div class="card-info">
                <div class="equip-name" :title="item.group_name">{{ item.group_name }}</div>
                <div class="equip-code">{{ item.group_code }}</div>

                <!-- 账实对比区：左右分布布局 -->
                <!-- 定位到 status-compare-group 内部 -->
                <div class="status-compare-group">
                  <div class="compare-item">
                    <span class="c-label">系统账面</span>
                    <span class="c-tag" :class="item.group_status === '在位' ? 'st-in' : 'st-out'">
                      {{ item.group_status }}
                    </span>
                  </div>
                  <div class="compare-item">
                    <span class="c-label">柜内感知</span>
                    <!-- 修改 class 和显示逻辑 -->
                    <span class="c-tag" :class="{
                      'st-in': getActualStatus(item) === '在位',
                      'st-out': getActualStatus(item) === '不在位',
                      'st-loading': getActualStatus(item) === '检测中',
                    }">
                      {{ getActualStatus(item) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 底部：柜位信息（新增） -->
              <div class="card-footer-pos">
                <el-icon>
                  <Location />
                </el-icon>
                <span class="pos-text">{{ item.self_address }} 号柜位</span>
              </div>

              <!-- 底边装饰条 -->
              <div class="active-bar" :class="!isItemAbnormal(item) ? 'bg-ok' : 'bg-err'"></div>
            </div>
            <!-- 无数据提示 -->
            <div v-if="filteredList.length === 0" class="no-data-placeholder">
              {{ currentFilter === 'ERROR' ? '当前暂无账实不符项' : '暂无装备数据' }}
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧：盘点数据报告面板 -->
      <div class="operation-section">
        <div class="report-panel">
          <div class="report-header">
            <div class="report-main-title">实时统计信息</div>
            <div class="report-time">装备状态刷新：{{ currentTime }}</div>
          </div>

          <!-- 右侧卡片联动联动左侧过滤器 -->
          <!-- 右侧卡片联动联动左侧过滤器 -->
          <div class="stats-summary-grid">
            <!-- 全部 -->
            <div class="stat-card clickable" :class="{ active: currentFilter === 'ALL' }" @click="setFilter('ALL')">
              <div class="s-num">{{ equipmentList.length }}</div>
              <div class="s-text">装备总数</div>
            </div>

            <!-- 正常 -->
            <div class="stat-card is-success clickable" :class="{ active: currentFilter === 'NORMAL' }"
              @click="setFilter('NORMAL')">
              <div class="s-num">{{ stats.match }}</div>
              <div class="s-text">账实相符</div>
            </div>

            <!-- 异常 -->
            <div class="stat-card is-danger clickable"
              :class="{ active: currentFilter === 'ERROR', 'has-err': stats.mismatch > 0 }" @click="setFilter('ERROR')">
              <div class="s-num">{{ stats.mismatch }}</div>
              <div class="s-text">异常数量</div>
            </div>
          </div>

          <!-- 账实相符率进度条已按方案二彻底删除 -->

          <div class="analysis-section">
            <div class="analysis-title">装备盘点明细</div>
            <div class="analysis-row success-text">
              <span class="a-label"><i class="dot success"></i> 正常在位</span>
              <span class="a-value">{{ stats.inPlace }} 件</span>
            </div>
            <div class="analysis-row">
              <span class="a-label"><i class="dot"></i> 正常借出</span>
              <span class="a-value">{{ stats.outPlace }} 件</span>
            </div>
            <div class="analysis-row danger-text" v-if="stats.missing > 0">
              <span class="a-label"><i class="dot danger"></i> 异常缺失 (账在实不在)</span>
              <span class="a-value">{{ stats.missing }} 件</span>
            </div>
            <div class="analysis-row danger-text" v-if="stats.unregistered > 0">
              <span class="a-label"><i class="dot danger"></i> 异常占用 (实在账不在)</span>
              <span class="a-value">{{ stats.unregistered }} 件</span>
            </div>
          </div>

          <div class="flex-spacer">
            <el-icon :size="60" class="spacer-icon">
              <Monitor />
            </el-icon>
            <div class="spacer-text">装备状态实时自动更新</div>
          </div>

          <div class="action-footer">
            <button class="cyber-btn" @click="handleOpenSummary">
              <div class="btn-content">
                <el-icon :size="24">
                  <CircleCheck />
                </el-icon>
                <!-- 删掉了 text-group 和 sub-text，直接放文字 -->
                <span class="btn-main-text" style="margin-left: 8px">
                  {{ stats.mismatch > 0 ? '核对并处理异常' : '确认结果并同步' }}
                </span>
              </div>
              <div class="scan-line"></div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 异常核对弹窗 -->
    <el-dialog v-model="summaryVisible" title="异常项快捷处置" width="1000px" class="cyber-dialog">
      <div class="summary-dialog-content">
        <div v-if="abnormalItems.length === 0" class="all-ok-tip">
          <el-icon :size="50" color="#00ff9d">
            <CircleCheck />
          </el-icon>
          <p>当前无异常项，账实百分百吻合</p>
        </div>
        <div v-else class="abnormal-table-container custom-scroll">
          <table class="cyber-table">
            <thead>
              <tr>
                <th width="180">装备信息</th>
                <th width="100">当前异常</th>
                <th width="280">快速处置方案 (点击执行)</th>
                <th>核实备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in abnormalItems" :key="item.id">
                <td>
                  <div class="t-name">{{ item.group_name }}</div>
                  <div class="t-code">{{ item.group_code }}</div>
                </td>
                <td>
                  <span class="mini-tag" :class="getAbnormalType(item).class">
                    {{ getAbnormalType(item).text }}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <!-- 场景1：账在实不在 -> 可能是领了没记 -->
                    <button v-if="item.group_status === '在位'" class="mini-action-btn" @click="fixByBorrow(item)">
                      <el-icon>
                        <EditPen />
                      </el-icon>
                      补录领用
                    </button>

                    <!-- 场景2：实在账不在 -> 可能是放回来没记 -->
                    <button v-if="item.group_status === '已取出'" class="mini-action-btn success"
                      @click="fixByReturn(item)">
                      <el-icon>
                        <Refresh />
                      </el-icon>
                      纠正为在位
                    </button>

                    <!-- 场景3：通用 -> 传感器坏了 -->
                    <button class="mini-action-btn warning" @click="fixByDisableSensor(item)">
                      <el-icon>
                        <Tools />
                      </el-icon>
                      禁用故障传感器
                    </button>
                  </div>
                </td>
                <td>
                  <el-input v-model="item.inventory_remark" placeholder="处置说明..." class="table-input" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <button class="footer-btn cancel" @click="summaryVisible = false">继续核对</button>
          <button class="footer-btn confirm" @click="finalSubmit">
            <el-icon>
              <Promotion />
            </el-icon>
            确认上报并结束
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import {
  Files,
  Box,
  SwitchButton,
  Monitor,
  Warning,
  CircleCheck,
  Promotion,
  Location,
  Check,
  Timer as HistoryIcon,
  EditPen,
  Refresh,
  Tools,
  WarningFilled,
} from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
import { useTimerStore } from '@/stores/timerStore'
const timerStore = useTimerStore()

import plugins from '../assets/js/plugin'

const router = useRouter()
const audioStore = useAudioStore()

// --- 过滤器配置 ---
const filterOptions = [
  { label: '所有项', value: 'ALL' },
  { label: '正常项', value: 'NORMAL' },
  { label: '异常项', value: 'ERROR' },
]

// --- 核心状态变量 ---
const equipmentList = ref([]) // 真实装备列表
const config_blob = ref(null) // 硬件配置信息
const realtimeSwitchMap = reactive({}) // 硬件感知映射表 { self_address: status }
const isPolling = ref(false) // 轮询开关
const summaryVisible = ref(false)
const showKeyboard = ref(false)
const currentFilter = ref('ALL')
const selectedName = ref('ALL') // 【新增：记录选中的装备名称】

// --- 新增：计算不重复的装备名称列表 ---
const uniqueNameOptions = computed(() => {
  // 增加安全检查，防止数据加载前报错
  if (!equipmentList.value || equipmentList.value.length === 0) return ['ALL']

  const names = equipmentList.value.map((item) => item.group_name)
  // 去重并排序
  const uniqueNames = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  return ['ALL', ...uniqueNames]
})

// --- 新增：跳转历史方法 ---
const goToHistory = () => {
  audioStore.play('/audio/按钮点击声.mp3')
  router.push('/inventory-history') // 请确保你的路由中有这个路径
}

// --- 时间格式化 ---
const formatTime = () => {
  const now = new Date()
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
}
const currentTime = ref(formatTime())

// --- 1. 初始化配置与数据 ---
const fetchConfigData = async () => {
  try {
    const response = await window.electronAPI.el_post({
      action: 'queryMultipleTables',
      payload: { arr: [{ tablename: 'terminal_settings', condition: '' }] },
    })
    if (response.success && response.data?.terminal_settings) {
      config_blob.value = JSON.parse(response.data.terminal_settings.config_blob)
    }
  } catch (error) {
    console.error('配置加载失败:', error)
  }
}

const getRealData = async () => {
  let allData = []
  let currentPage = 1
  let hasMore = true
  const pageSize = 10
  try {
    while (hasMore) {
      const res = await window.electronAPI.el_post({
        action: 'queryPagination',
        payload: { tableName: 'equipment', page: currentPage, pageSize: pageSize },
      })
      if (res.data?.data?.length > 0) {
        allData = [...allData, ...res.data.data]
        currentPage++
      } else {
        hasMore = false
      }
    }

    // ================= [新增/同步的代码段] =================
    allData.forEach((row) => {
      // 1. 格式化日期（防止弹窗查看详情时日期太长）
      if (row.group_distribution_time) {
        const date = new Date(row.group_distribution_time)
        if (!isNaN(date.getTime())) {
          row.group_distribution_time = date.toISOString().split('T')[0]
        }
      }
      // 2. 补全锁位置（虽然盘点不用开门，但保证数据结构完整性）
      if (!row.lock_self_address && config_blob.value?.lock?.details?.length > 0) {
        row.lock_self_address = config_blob.value.lock.details[0].self_address
      }
    })

    // 3. 核心：按物理柜位排序！让盘点顺序与柜子摆放顺序一致
    allData.sort((a, b) => {
      return (Number(a.self_address) || 0) - (Number(b.self_address) || 0)
    })
    // =====================================================

    // 最后再赋值给响应式变量，并增加盘点专用的备注字段
    equipmentList.value = allData.map((item) => ({ ...item, inventory_remark: '' }))
  } catch (error) {
    console.error('数据获取失败:', error)
  }
}

// --- 2. 硬件感知轮询 ---
const updateAllHardwareStatus = async () => {
  if (!config_blob.value?.switch?.expansion_board_addresses) return
  for (const address of config_blob.value.switch.expansion_board_addresses) {
    try {
      const result = await window.electronAPI.el_post({
        action: 'read_all_inputs',
        payload: { deviceAddress: address, startAddress: 0x0001, registerCount: 10 },
      })
      if (result?.success && result.data) {
        console.log('硬件状态数据:', result.data)
        result.data.forEach((state, index) => {
          const detail = config_blob.value.switch.details.find(
            (d) => d.expansion_board_address === address && d.channel_address === index + 1,
          )
          if (detail) {
            realtimeSwitchMap[detail.self_address] = state
          }
        })
      }
    } catch (e) {
      console.error('读取硬件失败:', e)
    }
  }
}
const lastMismatchCount = ref(-1) // 记录上一次的异常数量，初始为-1用于识别初次加载
const startMonitorLoop = async () => {
  isPolling.value = true
  while (isPolling.value) {
    await updateAllHardwareStatus()
    currentTime.value = formatTime()

    // --- [新增：实时语音提示逻辑] ---
    const currentMismatch = stats.value.mismatch // 获取当前最新的异常总数

    // 只有当不是初次扫描（lastMismatchCount !== -1）且数量发生变化时才触发
    if (lastMismatchCount.value !== -1) {
      if (currentMismatch > lastMismatchCount.value) {
        // 场景：异常增加了（比如有人私自拿走了装备）
        audioStore.play('/audio/拿错提示音.mp3') // 建议使用急促、警示性的音效
        ElMessage.warning('检测到新的账务不符项！')
      } else if (currentMismatch < lastMismatchCount.value) {
        // 场景：异常减少了（比如错拿的放回去了，或者缺失的补回来了）
        audioStore.play('/audio/拿对提示音.mp3') // 建议使用清脆、正向的音效
        ElMessage.success('异常项已消除，状态恢复正常')
      }
    }

    // 更新旧值，供下一次循环比对
    lastMismatchCount.value = currentMismatch
    // ----------------------------

    await new Promise((r) => setTimeout(r, 1000)) // 建议盘点时设为 800ms，感知更灵敏
  }
}

// 修改后
const getActualStatus = (item) => {
  const status = realtimeSwitchMap[item.self_address]

  // 如果 status 是 undefined，说明硬件还没完成首次扫描
  if (status === undefined) {
    return '检测中'
  }

  // 1 表示压下（在位），0 表示弹起（离位）
  return status === 1 ? '在位' : '不在位'
}

// --- 修改后 ---
const isItemAbnormal = (item) => {
  const actual = getActualStatus(item)

  // 如果还在检测中，先认为它是正常的，避免页面闪烁大量红色
  if (actual === '检测中') {
    return false
  }

  // 核心逻辑对齐：账面 group_status vs 传感器 actual_status
  return item.group_status !== (actual === '在位' ? '在位' : '已取出')
}

// 统计逻辑修正
const stats = computed(() => {
  const list = equipmentList.value
  const abnormalList = list.filter(isItemAbnormal)
  return {
    match: list.length - abnormalList.length,
    mismatch: abnormalList.length,
    inPlace: list.filter((i) => i.group_status === '在位' && getActualStatus(i) === '在位').length,
    outPlace: list.filter((i) => i.group_status === '已取出' && getActualStatus(i) === '不在位')
      .length,
    missing: abnormalList.filter((i) => i.group_status === '在位').length,
    unregistered: abnormalList.filter((i) => i.group_status === '已取出').length,
  }
})

// --- 修改：filteredList 逻辑（整合标签过滤和名称过滤） ---
const filteredList = computed(() => {
  let list = equipmentList.value || []

  // 1. 标签状态过滤 (全部/异常/正常)
  if (currentFilter.value === 'NORMAL') {
    list = list.filter((i) => !isItemAbnormal(i))
  } else if (currentFilter.value === 'ERROR') {
    list = list.filter(isItemAbnormal)
  }

  // 2. 下拉框名称过滤 (如果选了特定名称，则进一步过滤)
  if (selectedName.value !== 'ALL') {
    list = list.filter((item) => item.group_name === selectedName.value)
  }

  return list
})

const abnormalItems = computed(() => equipmentList.value.filter(isItemAbnormal))

const getAbnormalType = (item) => {
  const actual = getActualStatus(item)
  if (item.group_status === '在位' && actual === '不在位')
    return { text: '异常离位', class: 'st-out-warn' }
  if (item.group_status === '已取出' && actual === '在位')
    return { text: '异常占用', class: 'st-unreg' }
  return { text: '未知异常', class: 'st-other' }
}

// --- 4. 交互与提交 ---
const handleInputFocus = () => {
  showKeyboard.value = true
}

const setFilter = (type) => {
  audioStore.play('/audio/按钮点击声.mp3')
  currentFilter.value = type
}

const handleOpenSummary = () => {
  audioStore.play('/audio/按钮点击声.mp3')
  summaryVisible.value = true
}

const finalSubmit = async () => {
  const loading = ElLoading.service({ text: '正在同步盘点数据...' })
  try {
    const summary = `盘点完成：总数${equipmentList.value.length}, 异常${stats.value.mismatch}。`
    plugins.logUserAction('装备盘点', summary, {
      details: abnormalItems.value.map((i) => ({ code: i.group_code, remark: i.inventory_remark })),
    })

    ElMessage.success('盘点数据已同步至管理系统')
    summaryVisible.value = false
    setTimeout(() => {
      router.push('/')
    }, 1000)
  } catch {
    ElMessage.error('同步失败')
  } finally {
    loading.close()
  }
}

// --- [核心功能：快速处置逻辑] ---

/**
 * 处置方案1：补录领用 (针对：账面在，实物不在)
 */
const fixByBorrow = async (item) => {
  try {
    const { value: reason } = await ElMessageBox.prompt('检测到紧急领用，请输入领用用途', '补录领用登记', {
      confirmButtonText: '确认补录',
      cancelButtonText: '取消',
      inputPlaceholder: '例如：紧急领用、演训调拨...',
      customClass: 'cyber-message-box',
    })

    if (reason) {
      // 1. 插入领用记录
      await window.electronAPI.el_post({
        action: 'insert',
        payload: {
          tableName: 'borrow_records',
          setValues: {
            equipment_id: item.id,
            group_code: item.group_code,
            group_name: item.group_name,
            username: '系统核对补录',
            borrow_time: formatTime(),
            status: 0,
            remark: `盘点补录：${reason}`
          }
        }
      })
      // 2. 更新装备状态
      await window.electronAPI.el_post({
        action: 'update',
        payload: {
          tableName: 'equipment',
          setValues: { group_status: '已取出' },
          condition: `id = ${item.id}`
        }
      })

      item.group_status = '已取出' // 同步前端视图
      item.inventory_remark = '已完成补录登记'
      audioStore.play('/audio/领用完成数据已保存.mp3')
      ElMessage.success(`${item.group_name} 领用记录已补齐`)
    }
  } catch{ console.log('取消补录') }
}

/**
 * 处置方案2：纠正为在位 (针对：账面不在，实物在位)
 */
const fixByReturn = async (item) => {
  await ElMessageBox.confirm(`确认为该装备已归还，仅系统账面未更新？`, '状态纠正', {
    type: 'warning',
    customClass: 'cyber-message-box',
  })

  await window.electronAPI.el_post({
    action: 'update',
    payload: {
      tableName: 'equipment',
      setValues: { group_status: '在位' },
      condition: `id = ${item.id}`
    }
  })
  item.group_status = '在位'
  item.inventory_remark = '已手动纠正为在位状态'
  ElMessage.success('状态已纠正')
}

/**
 * 处置方案3：禁用故障传感器 (针对：硬件微动开关损坏)
 */
const fixByDisableSensor = async (item) => {
  await ElMessageBox.confirm(
    `确定禁用 ${item.self_address} 号柜位的传感器感知吗？禁用后系统将不再自动检测该位置的实时状态。`,
    '传感器屏蔽/报修',
    { confirmButtonText: '确认禁用', type: 'error', customClass: 'cyber-message-box' }
  )

  // 1. 获取当前内存中的配置
  const newConfig = JSON.parse(JSON.stringify(config_blob.value))
  // 2. 找到对应开关配置
  const switchDetail = newConfig.switch.details.find(d => d.self_address == item.self_address)
  if (switchDetail) {
    switchDetail.admin_status = 0 // 标记为禁用

    // 3. 写回数据库
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'terminal_settings',
        setValues: { config_blob: JSON.stringify(newConfig) },
        condition: `id > 0` // 假设只有一行配置
      }
    })

    config_blob.value = newConfig // 更新本地内存
    item.inventory_remark = '传感器故障已屏蔽，待维修'
    ElMessage.warning('传感器已禁用，请及时通知维保人员')
  }
}

onMounted(async () => {
  if (timerStore.isTimerActive) timerStore.stopInterval()
  await fetchConfigData()
  await getRealData()
  startMonitorLoop()
  // plugins.logUserAction('页面访问', '进入装备盘点页面')
})

onUnmounted(() => {
  isPolling.value = false
  // 4. 恢复全局定时器（如果有）
  if (!timerStore.isTimerActive) timerStore.startInterval()
})
</script>

<style scoped>
/* ==========================================================
   1. 基础变量与全局布局
   ========================================================== */
.theme-dark {
  --primary: #00f2ff;
  --primary-dark: #0099a1;
  --success: #00ff9d;
  --error: #ff4d4f;
  --warning: #e6a23c;
  --bg-dark: #0a0e17;
  --card-bg: #141b2d;
  --border: #2a3546;
  --text-main: #ffffff;
  --text-sec: #8899a6;
}

.page-container {
  width: 100%;
  height: 100vh;
  background-color: var(--bg-dark);
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ==========================================================
   2. 顶部导航栏 (Header)
   ========================================================== */
.header-bar {
  height: 70px;
  background: #11151f;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box-glow {
  width: 42px;
  height: 42px;
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1c2538;
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.1);
}

.primary-icon {
  color: var(--primary);
}

.title-text h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
}

.sub-title {
  color: var(--primary-dark);
  font-size: 12px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 盘点历史按钮合并后的样式 */
.history-link-btn {
  background: rgba(0, 242, 255, 0.05);
  border: 1px solid var(--primary-dark);
  color: var(--primary);
  padding: 0 18px;
  height: 36px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.history-link-btn:hover {
  background: rgba(0, 242, 255, 0.15);
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
  border-color: var(--primary);
}

.btn-exit {
  background: transparent;
  border: 1px solid var(--error);
  color: var(--error);
  padding: 8px 18px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==========================================================
   3. 主体布局与列表展示区
   ========================================================== */
.main-body {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

.list-section {
  flex: 1;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.section-title {
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border);
}

.title-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.select-wrapper {
  width: 200px;
}

.title-right-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-tabs {
  display: flex;
  background: #0d121c;
  padding: 3px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.tab {
  padding: 6px 15px;
  font-size: 13px;
  color: var(--text-sec);
  cursor: pointer;
  transition: 0.3s;
  position: relative;
}

.tab.active {
  color: var(--primary);
  background: #1c2538;
  border-radius: 2px;
}

.tab-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--error);
  color: white;
  border-radius: 10px;
  padding: 0 5px;
  font-size: 10px;
}

/* ==========================================================
   4. 装备卡片网格 (Card Grid)
   ========================================================== */
.scroll-area {
  flex: 1;
  padding: 15px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.equip-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  height: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.equip-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: #4a5c76;
}

.equip-card.is-abnormal {
  border-color: var(--error);
  background: rgba(255, 77, 79, 0.04);
  box-shadow: inset 0 0 15px rgba(255, 77, 79, 0.05);
}

.equip-card.is-normal {
  border-color: rgba(0, 255, 157, 0.4);
  background: rgba(0, 255, 157, 0.05);
}

/* 角标公共样式 */
.error-ribbon,
.success-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-left: 30px solid transparent;
  z-index: 5;
}

.error-ribbon {
  border-top: 30px solid var(--error);
}

.success-ribbon {
  border-top: 30px solid #139865;
}

.error-ribbon .el-icon,
.success-ribbon .el-icon {
  position: absolute;
  top: -28px;
  left: -16px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.equip-image-preview {
  width: 100%;
  height: 100px;
  background: #000;
  border-bottom: 1px solid var(--border);
}

.image-placeholder,
.image-error-slot {
  background: #0d121c;
  width: 100%;
  height: 100%;
}

.image-error-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
}

.card-info {
  padding: 10px 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.equip-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.equip-code {
  font-size: 12px;
  color: var(--text-sec);
  font-family: 'Consolas', monospace;
  margin-bottom: 8px;
  word-break: break-all;
}

.status-compare-group {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.compare-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.c-label {
  font-size: 12px;
  color: #66788a;
}

.c-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 2px;
  font-weight: bold;
}

.st-in {
  background: rgba(0, 255, 157, 0.15);
  color: var(--success);
  border: 1px solid rgba(0, 255, 157, 0.2);
}

.st-out {
  background: rgba(255, 255, 255, 0.05);
  color: #8899a6;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.st-loading {
  background: rgba(255, 255, 255, 0.05);
  color: #555;
  border: 1px solid #333;
}

.card-footer-pos {
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--primary);
  font-size: 12px;
}

.active-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
}

.bg-ok {
  background: rgba(0, 255, 157, 0.4);
  box-shadow: 0 -1px 6px var(--success);
}

.bg-err {
  background: var(--error);
  box-shadow: 0 -1px 6px var(--error);
}

/* ==========================================================
   5. 右侧报告面板 (Operation Section)
   ========================================================== */
.operation-section {
  flex: 0 0 360px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.report-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.report-header {
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 15px;
}

.report-main-title {
  font-size: 19px;
  font-weight: bold;
  color: var(--primary);
  letter-spacing: 1px;
}

.report-time {
  font-size: 14px;
  color: #6d8096;
  margin-top: 5px;
  font-family: monospace;
}

.stats-summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  padding: 15px 5px;
  text-align: center;
  border-radius: 4px;
  transition: 0.3s;
  cursor: pointer;
}

.stat-card:hover {
  border-color: var(--primary);
  background: rgba(0, 242, 255, 0.05);
}

.stat-card.active {
  border-color: var(--primary);
  box-shadow: inset 0 0 10px rgba(0, 242, 255, 0.1);
}

.stat-card .s-num {
  font-size: 24px;
  font-weight: bold;
  font-family: 'Consolas';
}

.stat-card.is-success .s-num {
  color: var(--success);
}

.stat-card.is-danger.has-err .s-num {
  color: var(--error);
}

.stat-card .s-text {
  font-size: 13px;
  color: var(--text-sec);
  margin-top: 5px;
}

.analysis-section {
  background: rgba(0, 0, 0, 0.1);
  padding: 15px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.02);
}

.analysis-title {
  font-size: 15px;
  color: var(--primary-dark);
  font-weight: bold;
  padding-bottom: 10px;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.analysis-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
  font-size: 13px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background: #555;
}

.dot.success {
  background: var(--success);
  box-shadow: 0 0 5px var(--success);
}

.dot.danger {
  background: var(--error);
  box-shadow: 0 0 5px var(--error);
}

.success-text {
  color: var(--success);
  font-weight: bold;
}

.danger-text {
  color: var(--error);
  font-weight: bold;
}

.flex-spacer {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0.1;
}

.spacer-text {
  font-size: 12px;
  margin-top: 10px;
}

/* ==========================================================
   6. 按钮与交互 (Buttons & Cyber Effects)
   ========================================================= */
.cyber-btn {
  width: 100%;
  height: 45px;
  background: linear-gradient(90deg, var(--primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--primary);
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  height: 100%;
}

.btn-main-text {
  font-size: 16px;
  font-weight: bold;
}

.scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-20deg);
  animation: btnScan 4s infinite;
}

@keyframes btnScan {
  0% {
    left: -100%;
  }

  25% {
    left: 200%;
  }

  100% {
    left: 200%;
  }
}

/* ==========================================================
   7. 组件穿透覆盖 (Element Plus Scoped) - 同步系统参数页样式
   ========================================================== */

/* 1. 下拉框本体背景与边框 (兼容新旧版 Element Plus) */
.cyber-select :deep(.el-select__wrapper),
.cyber-select :deep(.el-input__wrapper) {
  background-color: rgba(20, 27, 45, 0.8) !important;
  /* 深蓝半透明 */
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  /* 默认边框 */
  transition: all 0.3s;
}

/* 2. 鼠标悬停 或 聚焦时的样式 (青色微光与边框) */
.cyber-select :deep(.el-select__wrapper:hover),
.cyber-select :deep(.el-select__wrapper.is-focused),
.cyber-select :deep(.el-input__wrapper:hover),
.cyber-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary) inset !important;
  /* 青色高亮边框 */
  background-color: rgba(0, 242, 255, 0.05) !important;
  /* 青色微光背景 */
}

/* 3. 选中文本的颜色 */
.cyber-select :deep(.el-select__selected-item),
.cyber-select :deep(.el-input__inner) {
  color: #fff !important;
  font-family: 'Segoe UI', sans-serif;
  font-weight: bold;
}

/* 4. 占位符颜色 (提示文字) */
.cyber-select :deep(.el-select__placeholder) {
  color: var(--text-sec) !important;
}

/* 5. 右侧小图标颜色 */
.cyber-select :deep(.el-icon) {
  color: var(--primary-dark);
}

/* 处置按钮样式 */
.action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mini-action-btn {
  background: rgba(0, 242, 255, 0.1);
  border: 1px solid var(--primary-dark);
  color: var(--primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.mini-action-btn:hover {
  background: var(--primary-dark);
  color: #000;
}

.mini-action-btn.success {
  border-color: var(--success);
  color: var(--success);
  background: rgba(0, 255, 157, 0.05);
}

.mini-action-btn.warning {
  border-color: var(--warning);
  color: var(--warning);
  background: rgba(230, 162, 60, 0.05);
}
</style>

<style>
/* ==========================================================
   8. 全局与弹窗样式 (Non-Scoped)
   ========================================================== */
/* 弹窗避让逻辑 */
.cyber-dialog-reason.el-dialog {
  background-color: #141b2d !important;
  border: 1px solid #0099a1 !important;
  border-radius: 8px !important;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
}

.cyber-dialog-reason.is-keyboard-open {
  transform: translateY(-85%) !important;
}

/* 弹窗内部表格 */
.abnormal-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #2a3546;
  border-radius: 4px;
}

.cyber-table {
  width: 100%;
  border-collapse: collapse;
}

.cyber-table th {
  background: #0d121c;
  padding: 12px;
  font-size: 13px;
  color: #00f2ff;
  border-bottom: 1px solid #2a3546;
  text-align: left;
}

.cyber-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.t-name {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

.t-code {
  font-size: 12px;
  color: #8899a6;
  font-family: monospace;
}

/* 异常标记 */
.mini-tag {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: bold;
}

.st-out-warn {
  background: rgba(255, 77, 79, 0.15);
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
}

.st-unreg {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
  border: 1px solid #e6a23c;
}

.st-other {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid #8899a6;
}

.table-input .el-input__wrapper {
  background: rgba(0, 0, 0, 0.3) !important;
  box-shadow: none !important;
  border: 1px solid #4a5c76;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  gap: 15px;
  padding: 20px;
}

.footer-btn {
  flex: 1;
  height: 45px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 15px;
  font-weight: bold;
}

.footer-btn.cancel {
  background: #1c2538;
  border: 1px solid #2a3546;
  color: #8899a6;
}

.footer-btn.confirm {
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%);
  border: 1px solid #00f2ff;
  color: #fff;
}

/* ==========================================================
   8. 全局下拉框样式 - 终极修复版 (覆盖内部变量)
   ========================================================== */

.el-popper.cyber-select-popper {
  /* 1. 必须覆盖这个变量，Element内部列表背景色引用的就是它 */
  --el-bg-color-overlay: #141b2d !important;

  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
}

/* 2. 隐藏小箭头背景 */
.el-popper.cyber-select-popper .el-popper__arrow::before {
  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
}

/* 3. 下拉选项基础样式 - 强制透明 */
.cyber-select-popper .el-select-dropdown__item {
  color: #ccc !important;
  background: transparent !important;
  font-family: 'Segoe UI', sans-serif;
  height: 40px !important;
  line-height: 40px !important;
}

/* 4. 鼠标悬停 (Hover) */
.cyber-select-popper .el-select-dropdown__item.hover,
.cyber-select-popper .el-select-dropdown__item:hover {
  background-color: rgba(0, 242, 255, 0.15) !important;
  color: #fff !important;
}

/* 5. 选中项 (Selected) */
.cyber-select-popper .el-select-dropdown__item.selected {
  color: #00f2ff !important;
  background-color: rgba(0, 242, 255, 0.1) !important;
  font-weight: bold;
}

/* 6. 强制清除内部 List 的背景 */
.cyber-select-popper .el-select-dropdown__list,
.cyber-select-popper .el-scrollbar__view {
  background: transparent !important;
  padding: 5px 0 !important;
}
</style>
