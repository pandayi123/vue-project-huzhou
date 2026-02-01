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
              :class="{ 'is-active': selectedId === item.id }" @click="handleSelectCard(item)">
              <!-- 顶部：装备图片 -->
              <div class="equip-image-preview">
                <!-- 新增：状态浮层标签 -->
                <div class="status-overlay-tag" :class="getDetailedStatus(item).class">
                  {{ getDetailedStatus(item).text }}
                </div>
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
                      'st-disabled': getActualStatus(item) === '已禁用', // <--- 新增
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
            <div class="report-main-title">装备统计信息</div>
            <div class="report-time">实时状态刷新：{{ currentTime }}</div>
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
            <div class="analysis-row info-text">
              <span class="a-label"><i class="dot info"></i> 正常借出</span>
              <span class="a-value">{{ stats.outPlace }} 件</span>
            </div>
            <div class="analysis-row danger-text" v-if="stats.missing > 0">
              <span class="a-label"><i class="dot danger"></i> 异常离位 (账在实不在)</span>
              <span class="a-value">{{ stats.missing }} 件</span>
            </div>
            <div class="analysis-row warning-text" v-if="stats.unregistered > 0">
              <span class="a-label"><i class="dot warning"></i> 异常占用 (实在账不在)</span>
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
    <el-dialog v-model="summaryVisible" title="异常项快捷处置" width="1200px" class="cyber-dialog">
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
                <th width="80">实照</th>
                <th width="180">装备/编号/位置</th>
                <th width="200">账实核对</th>
                <th width="100">异常类型</th>
                <th width="280">快速处置方案</th>
                <th>核实备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in abnormalItems" :key="item.id" :class="{ 'is-processed-row': item.isProcessed }">
                <!-- 1. 装备实照 -->
                <td>
                  <el-image :src="item.group_image" class="table-thumb" :preview-src-list="[item.group_image]"
                    fit="cover">
                    <template #error>
                      <div class="thumb-err">
                        <el-icon>
                          <Picture />
                        </el-icon>
                      </div>
                    </template>
                  </el-image>
                </td>

                <!-- 2. 基础信息 + 物理地址 -->
                <td>
                  <div class="t-name">{{ item.group_name }}</div>
                  <div class="t-code">{{ item.group_code }}</div>
                  <div class="t-pos">
                    <el-icon>
                      <Location />
                    </el-icon>
                    {{ item.self_address }}号位
                  </div>
                </td>

                <!-- 3. 账实对比 (视觉强化版) -->
                <td>
                  <div class="compare-row">
                    <span class="dot-label">系统账面:</span>
                    <span class="mini-tag" :class="item.group_status === '在位' ? 'st-in' : 'st-out'">
                      {{ item.group_status }}
                    </span>
                  </div>
                  <div class="compare-row" style="margin-top: 8px">
                    <span class="dot-label">柜内感知:</span>
                    <span class="mini-tag" :class="{
                      'st-in': getActualStatus(item) === '在位',
                      'st-out': getActualStatus(item) === '不在位',
                      'st-disabled': getActualStatus(item) === '已禁用', // <--- 新增
                    }">
                      {{ getActualStatus(item) }}
                    </span>
                  </div>
                </td>

                <!-- 4. 异常类型 -->
                <td>
                  <span v-if="item.isProcessed" class="status-resolved">
                    <el-icon>
                      <Check />
                    </el-icon>
                    已处置
                  </span>
                  <span v-else class="mini-tag" :class="getAbnormalType(item).class">
                    {{ getAbnormalType(item).text }}
                  </span>
                </td>

                <!-- 5. 快速处置按钮 -->
                <td>
                  <div class="action-btns">
                    <template v-if="!item.isProcessed">
                      <button v-if="item.group_status === '在位'" class="mini-action-btn" @click="fixByBorrow(item)">
                        <el-icon>
                          <EditPen />
                        </el-icon>
                        补录领用
                      </button>
                      <button v-if="item.group_status === '已取出'" class="mini-action-btn success"
                        @click="fixByReturn(item)">
                        <el-icon>
                          <Refresh />
                        </el-icon>
                        补录归还
                      </button>
                      <button class="mini-action-btn warning" @click="fixByDisableSensor(item)">
                        <el-icon>
                          <Tools />
                        </el-icon>
                        屏蔽传感
                      </button>
                    </template>
                    <span v-else class="resolved-hint">数据已平账</span>
                  </div>
                </td>

                <!-- 6. 备注 -->
                <td>
                  <el-input v-model="item.inventory_remark" placeholder="备注原因..." class="table-input" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Footer 保持不变 -->
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
  CircleCheck,
  Location,
  Check,
  Timer as HistoryIcon,
  EditPen,
  Refresh,
  Tools,
} from '@element-plus/icons-vue'
import { ElMessage, ElLoading, ElMessageBox } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
import { useTimerStore } from '@/stores/timerStore'
const timerStore = useTimerStore()

import plugins from '../assets/js/plugin'
// --- 1. 定义选中状态变量 ---
const selectedId = ref(null)

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

// --- 2. 定义选中处理函数 ---
const handleSelectCard = (item) => {
  selectedId.value = item.id
  // 播放一个清脆的点按音效
  audioStore.play('/audio/按钮点击声.mp3')
}

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

// 新增：获取详细盘点结论
const getDetailedStatus = (item) => {
  const actual = getActualStatus(item)
  const system = item.group_status

  // 1. 判断检测中
  if (actual === '检测中') return { text: '检测中...', class: 'tag-loading' }

  // 2. 核心逻辑：如果账实相符（或者是传感器已禁用导致的“逻辑相符”）
  if (!isItemAbnormal(item)) {
    if (system === '在位') {
      return { text: '正常在位', class: 'tag-normal-in' }
    } else {
      return { text: '正常借出', class: 'tag-normal-out' }
    }
  }

  // 3. 异常逻辑（仅在账实不符且传感器未禁用的情况下进入）
  if (system === '在位' && actual === '不在位') {
    return { text: '异常离位', class: 'tag-error-missing' }
  }
  if (system === '已取出' && actual === '在位')
    return { text: '异常占用', class: 'tag-error-occupied' }

  return { text: '未知状态', class: 'tag-unknown' }
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
  // === 新增：优先判断是否禁用 ===
  const detail = config_blob.value?.switch?.details?.find(
    (d) => String(d.self_address) === String(item.self_address),
  )
  if (detail && Number(detail.admin_status) === 0) {
    return '已禁用'
  }

  const status = realtimeSwitchMap[item.self_address]
  if (status === undefined) return '检测中'
  return status === 1 ? '在位' : '不在位'
}

// --- 修改后的函数 ---
const isItemAbnormal = (item) => {
  const actual = getActualStatus(item)
  if (actual === '检测中') return false

  // 1. 获取该位置的开关配置
  const detail = config_blob.value?.switch?.details?.find(
    (d) => String(d.self_address) === String(item.self_address),
  )

  // 2. 检查：如果开关被管理员“手动禁用”（admin_status == 0），则不计入异常
  // 注意：确保你的 config_blob 里 admin_status 默认是 1（启用）
  if (detail && Number(detail.admin_status) === 0) {
    return false
  }

  // 3. 核心对比逻辑
  // 传感器 '在位' (1) 对应 账面 '在位'
  // 传感器 '不在位' (0) 对应 账面 '已取出'
  const shouldBeStatus = actual === '在位' ? '在位' : '已取出'
  return item.group_status !== shouldBeStatus
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

// --- 修改后的计算属性 ---
const abnormalItems = computed(() => {
  // 筛选出：当前依然异常的项 OR 在本次盘点过程中已经点击了处置按钮的项
  return (equipmentList.value || []).filter((item) => isItemAbnormal(item) || item.isProcessed)
})

const getAbnormalType = (item) => {
  const actual = getActualStatus(item)
  if (item.group_status === '在位' && actual === '不在位')
    return { text: '异常离位', class: 'st-out-warn' }
  if (item.group_status === '已取出' && actual === '在位')
    return { text: '异常占用', class: 'st-unreg' }
  return { text: '未知异常', class: 'st-other' }
}

//在过滤器切换时重置选中项：
const setFilter = (type) => {
  audioStore.play('/audio/按钮点击声.mp3')
  currentFilter.value = type
  selectedId.value = null // 切换分类时取消选中
}

const handleOpenSummary = () => {
  audioStore.play('/audio/按钮点击声.mp3')
  summaryVisible.value = true
}

const finalSubmit = async () => {
  const loading = ElLoading.service({ text: '正在生成盘点报告...' })
  try {
    // 构造盘点详单
    const inventoryDetails = equipmentList.value.map((item) => ({
      code: item.group_code,
      name: item.group_name,
      address: item.self_address,
      system_status: item.group_status,
      actual_status: getActualStatus(item),
      is_abnormal: isItemAbnormal(item),
      remark: item.inventory_remark || '',
    }))

    // 将详单序列化后存入日志或专门的 inventory_history 表
    await window.electronAPI.el_post({
      action: 'insert',
      payload: {
        tableName: 'inventory_logs', // 假设你有一个专门存历史的表
        setValues: {
          inventory_time: formatTime(),
          total_count: equipmentList.value.length,
          abnormal_count: stats.value.mismatch,
          operator: '当前登录人',
          details_json: JSON.stringify(inventoryDetails),
        },
      },
    })

    ElMessage.success('盘点报告已存档并同步')
    summaryVisible.value = false
    router.push('/')
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
    const { value: reason } = await ElMessageBox.prompt(
      '检测到紧急领用，请输入领用用途',
      '补录领用登记',
      {
        confirmButtonText: '确认补录',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：紧急领用、演训调拨...',
        customClass: 'cyber-message-box',
      },
    )

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
            remark: `盘点补录：${reason}`,
          },
        },
      })
      // 2. 更新装备状态
      await window.electronAPI.el_post({
        action: 'update',
        payload: {
          tableName: 'equipment',
          setValues: { group_status: '已取出' },
          condition: `id = ${item.id}`,
        },
      })

      item.group_status = '已取出' // 同步前端视图
      item.isProcessed = true // 新增这一行
      item.inventory_remark = '已完成补录登记'
      audioStore.play('/audio/领用完成数据已保存.mp3')
      ElMessage.success(`${item.group_name} 领用记录已补齐`)
    }
  } catch {
    console.log('取消补录')
  }
}

/**
 * 处置方案2：补录归还 (针对：实物在位，但系统显示已取出/维修中)
 * 逻辑：1. 将装备状态设为“在位”
 *      2. 将借用记录表中该装备对应的“未归还”记录标记为“已归还”并记录归还时间
 */
const fixByReturn = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确认为该装备已归还？系统将自动销毁对应的未归还记录，完成账务平齐。`,
      '补录归还确认',
      {
        confirmButtonText: '确认归还',
        cancelButtonText: '取消',
        type: 'success',
        customClass: 'cyber-message-box',
      },
    )

    // 1. 更新装备表：恢复为“在位”
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'equipment',
        setValues: { group_status: '在位' },
        condition: `id = ${item.id}`,
      },
    })

    // 2. 核心：平账逻辑。关闭 borrow_records 表中该装备所有未归还(status=0)的记录
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'borrow_records',
        setValues: {
          status: 1, // 状态改为已归还
          return_time: formatTime(), // 记录盘点核对时间为归还时间
        },
        // 匹配该装备 ID 且 状态为未归还的记录
        condition: `equipment_id = ${item.id} AND status = 0`,
      },
    })

    // 3. 更新前端状态同步 UI
    item.group_status = '在位'
    item.isProcessed = true // 新增这一行
    item.inventory_remark = '手动核对实物在位，已完成补录归还及平账处理'

    ElMessage.success(`${item.group_name} 已完成补录归还`)
    audioStore.play('/audio/按钮点击声.mp3')
  } catch (e) {
    console.log('取消归还补录', e)
  }
}

/**
 * 处置方案3：禁用故障传感器 (针对：硬件微动开关损坏)
 */
const fixByDisableSensor = async (item) => {
  await ElMessageBox.confirm(
    `确定禁用 ${item.self_address} 号柜位的传感器感知吗？禁用后系统将不再自动检测该位置的实时状态。`,
    '传感器屏蔽/报修',
    { confirmButtonText: '确认禁用', type: 'error', customClass: 'cyber-message-box' },
  )

  // 1. 获取当前内存中的配置
  const newConfig = JSON.parse(JSON.stringify(config_blob.value))
  // 2. 找到对应开关配置
  const switchDetail = newConfig.switch.details.find((d) => d.self_address == item.self_address)
  if (switchDetail) {
    switchDetail.admin_status = 0 // 标记为禁用

    // 3. 写回数据库
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'terminal_settings',
        setValues: { config_blob: JSON.stringify(newConfig) },
        condition: `id > 0`, // 假设只有一行配置
      },
    })

    config_blob.value = newConfig // 更新本地内存
    item.isProcessed = true // 新增这一行
    item.inventory_remark = '传感器故障已屏蔽'
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

/* --- 修改 .equip-card 基础样式并增加 .is-active 效果 --- */
.equip-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  height: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  /* 让过渡更丝滑 */
  cursor: pointer;
  /* 增加手型，提示可点击 */
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

/* 统一的悬停效果 */
.equip-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(0, 242, 255, 0.4);
  transform: translateY(-2px);
  /* 悬停微动 */
}

/* --- 统一的【选中/激活】样式 --- */
.equip-card.is-active {
  background: rgba(0, 242, 255, 0.08);
  /* 整体背景微亮 */
  border-color: var(--primary);
  /* 青色边框 */
  box-shadow:
    0 0 15px rgba(0, 242, 255, 0.2),
    inset 0 0 15px rgba(0, 242, 255, 0.1);
  /* 内外发光 */
}

/* 选中时，让内部的柜位图标和文字也变亮 */
.equip-card.is-active .card-footer-pos {
  background: rgba(0, 242, 255, 0.1);
  color: #fff;
  text-shadow: 0 0 5px var(--primary);
}

/* 新增：图片上方状态标签 */
/* 约 370 行附近 */
.status-overlay-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 10;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);

  /* --- 关键补充：强制统一高度渲染 --- */
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

/* 正常在位：绿色 */
.tag-normal-in {
  background: rgba(0, 255, 157, 0.85);
  color: #000;
}

/* 正常借出：蓝色或淡灰色 */
.tag-normal-out {
  background: rgba(0, 153, 161, 0.85);
  color: #fff;
}

/* 异常离位：亮红色 */
.tag-error-missing {
  background: rgba(255, 77, 79, 0.9);
  color: #fff;
  animation: breathe 2s infinite;
  /* 异常项增加呼吸闪烁 */
}

/* 异常占用：橙黄色 */
.tag-error-occupied {
  background: rgba(230, 162, 60, 0.9);
  color: #000;
  /* <--- 黄色背景配黑色文字对比度更高 */
  animation: breathe 2s infinite;
}

.tag-loading {
  background: rgba(0, 0, 0, 0.6);
  color: #888;
}

/* 呼吸动画：让异常项更醒目 */
@keyframes breathe {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }

  100% {
    opacity: 1;
  }
}

/* 约 395 行附近 */
.equip-image-preview {
  width: 100%;
  height: 100px;
  background: #000;
  border-bottom: 1px solid var(--border);
  position: relative;
  /* <--- 关键补充：让标签相对于图片容器定位 */
  overflow: hidden;
  /* 确保圆角和边缘对齐 */
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
  background: #4a5c76; /* 默认灰色 */
  margin-right: 8px;
  vertical-align: middle;
}

/* 正常借出行的文字颜色 (统一为青蓝色) */
.info-text {
  color: #00c2cc; /* 采用比 tag-normal-out 稍微亮一点的颜色，保证文字清晰 */
  font-weight: bold;
}

/* 正常借出行的小圆点颜色 */
.dot.info {
  background: #0099a1;
  box-shadow: 0 0 5px rgba(0, 153, 161, 0.8);
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

/* 表格缩略图 */
.table-thumb {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  border: 1px solid #2a3546;
}

.thumb-err {
  width: 100%;
  height: 100%;
  background: #0d121c;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
}

/* 位置信息 */
.t-pos {
  font-size: 11px;
  color: var(--primary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}

/* 账实对比行 */
.compare-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}

.dot-label {
  font-size: 11px;
  color: #8899a6;
}

/* 已处理状态 */
.status-resolved {
  color: var(--success);
  font-weight: bold;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 表格单元格对齐调整 */
.cyber-table td {
  vertical-align: middle;
}

/* 已禁用状态：深红背景，亮红文字 */
.st-disabled {
  background: rgba(255, 77, 79, 0.15) !important;
  color: #ff4d4f !important;
  border: 1px solid rgba(255, 77, 79, 0.3) !important;
}

/* 警告文字颜色（橙黄色） */
.warning-text {
  color: var(--warning);
  /* 对应 #e6a23c */
  font-weight: bold;
}

/* 警告小圆点 */
.dot.warning {
  background: var(--warning);
  box-shadow: 0 0 5px var(--warning);
}

/* 正常借出标签：使用蓝色系 */
.tag-normal-out {
  background: rgba(0, 153, 161, 0.85);
  /* 沉稳的青蓝色 */
  color: #fff;
}

/* 正常在位标签保持明亮绿色 */
.tag-normal-in {
  background: rgba(0, 255, 157, 0.9);
  color: #000;
}
</style>

<style>
/* ==========================================================
   8. 全局与弹窗样式 (Non-Scoped) - 修复背景发白问题
   ========================================================== */

/* 1. 强制覆盖 Dialog 核心背景及边框 */
.cyber-dialog.el-dialog {
  background-color: #141b2d !important;
  background-image: linear-gradient(135deg, rgba(0, 242, 255, 0.05) 0%, transparent 100%);
  border: 1px solid #0099a1 !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(0, 242, 255, 0.05) !important;
  border-radius: 8px !important;

  /* --- 关键居中修复 --- */
  margin: 0 auto !important;
  /* 清除 Element 默认的 15vh 边距 */
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
  /* 同时处理水平和垂直居中 */

  /* --- 防止超出屏幕 --- */
  max-height: 90vh !important;
  /* 最大高度不超过屏幕的 90% */
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

/* 2. 覆盖弹窗标题区颜色 */
.cyber-dialog .el-dialog__header {
  padding: 20px 20px 10px;
  margin-right: 0;
  border-bottom: 1px solid rgba(0, 242, 255, 0.1);
}

.cyber-dialog .el-dialog__title {
  color: #00f2ff !important;
  /* 标题文字青色 */
  font-weight: bold;
  letter-spacing: 1px;
}

/* 3. 覆盖弹窗主体区背景（防止出现白色间隙） */
.cyber-dialog .el-dialog__body {
  flex: 1 !important;
  overflow-y: auto !important;
  background-color: transparent !important;
  color: #ffffff !important;
  padding: 20px !important;
}

/* 4. 覆盖弹窗底部按钮区 */
.cyber-dialog .el-dialog__footer {
  padding: 10px 20px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* 5. 覆盖关闭按钮颜色 */
.cyber-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #00f2ff !important;
}

.cyber-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #ff4d4f !important;
}

/* 弹窗避让键盘逻辑保持不变 */
.cyber-dialog.is-keyboard-open {
  /* 此时将位置上移，translate 第一个参数对应 X，第二个对应 Y */
  transform: translate(-50%, -90%) !important;
  transition: transform 0.3s ease !important;
}

/* ==========================================================
   弹窗内部组件适配 (表格与输入框)
   ========================================================== */

.abnormal-table-container {
  /* 这里的 max-height 配合整体弹窗的高度 */
  max-height: 50vh;
  overflow-y: auto;
  border: 1px solid #2a3546;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
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

/* 表格内的输入框背景适配 */
.table-input .el-input__wrapper {
  background-color: rgba(0, 0, 0, 0.4) !important;
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
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

/* ==========================================================
   自定义深色滚动条样式 (修复白色滑动条)
   ========================================================== */

/* 1. 针对 Webkit 浏览器 (Chrome, Electron, Edge) */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
  /* 纵向滚动条宽度 */
  height: 6px;
  /* 横向滚动条高度 */
}

/* 滚动条轨道 (背景) */
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  /* 深色透明背景 */
  border-radius: 10px;
}

/* 滚动条滑块 (也就是你说的那个白色条) */
.custom-scroll::-webkit-scrollbar-thumb {
  background: #2a3546;
  /* 滑块基础颜色：深灰蓝 */
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.1);
  /* 淡淡的青色边框 */
  transition: all 0.3s;
}

/* 鼠标悬停滑块时变亮 */
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #0099a1;
  /* 悬停时变为青暗色 */
  box-shadow: 0 0 5px rgba(0, 242, 255, 0.2);
}

/* 鼠标点击滑块时 */
.custom-scroll::-webkit-scrollbar-thumb:active {
  background: #00f2ff;
  /* 激活时变为亮青色 */
}

/* 2. 针对 Firefox 浏览器 (兼容性补丁) */
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: #2a3546 rgba(0, 0, 0, 0.2);
}

/* 3. 针对 Element Plus el-scrollbar 的统一覆盖 (如果弹窗内使用了该组件) */
.cyber-dialog .el-scrollbar__bar.is-vertical {
  width: 6px;
}

.cyber-dialog .el-scrollbar__thumb {
  background-color: #2a3546 !important;
  opacity: 1;
  /* 默认是透明的，改为常亮或半透明 */
}

.cyber-dialog .el-scrollbar__thumb:hover {
  background-color: #0099a1 !important;
}

/* 已处理行的背景变淡 */
.is-processed-row {
  background: rgba(0, 255, 157, 0.03) !important;
  opacity: 0.8;
}

/* 已处置绿色标签 */
.mini-tag.st-resolved {
  background: rgba(0, 255, 157, 0.2);
  color: #00ff9d;
  border: 1px solid #00ff9d;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* 处理后的文字提示 */
.resolved-hint {
  font-size: 12px;
  color: #8899a6;
  font-style: italic;
}

/* 调整处置按钮在表格中的宽度，防止撑开 */
.action-btns {
  min-width: 250px;
}
</style>
