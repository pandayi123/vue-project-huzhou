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

      <div class="header-right">
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
          <div class="title-left">
            <span class="text-glow">实测明细 ({{ filteredList.length }})</span>
            <div class="inventory-indicator">
              <span class="ind-item"><i class="dot success"></i> 正常</span>
              <span class="ind-item"><i class="dot danger"></i> 异常</span>
            </div>
          </div>

          <!-- 过滤器标签 -->
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
                      'st-loading': getActualStatus(item) === '检测中'
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
            <div class="report-time">上次开关检测时间：{{ currentTime }}</div>
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

    <!-- 异常核对弹窗 (已对齐键盘避让逻辑) -->
    <el-dialog v-model="summaryVisible" title="异常项明细核对" width="850px" class="cyber-dialog cyber-dialog-reason"
      :class="{ 'is-keyboard-open': showKeyboard }" :append-to-body="true" :close-on-click-modal="false">
      <div class="summary-dialog-content">
        <div v-if="abnormalItems.length === 0" class="all-ok-tip">
          <el-icon :size="50" color="#00ff9d">
            <CircleCheck />
          </el-icon>
          <p>账实百分百吻合，无异常项需备注</p>
        </div>
        <div v-else class="abnormal-table-container custom-scroll">
          <table class="cyber-table">
            <thead>
              <tr>
                <th width="220">装备名称 / 编号</th>
                <th width="140">异常原因</th>
                <th>核实备注 (点击输入)</th>
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
                  <el-input v-model="item.inventory_remark" placeholder="输入核实原因（如：传感器误报、紧急借出）" class="table-input"
                    @focus="handleInputFocus" @blur="showKeyboard = false" />
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
} from '@element-plus/icons-vue'
import { ElMessage, ElLoading } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
import { useTimerStore } from '@/stores/timerStore'
const timerStore = useTimerStore()

import plugins from '../assets/js/plugin'

const router = useRouter()
const audioStore = useAudioStore()

// --- 过滤器配置 ---
const filterOptions = [
  { label: '全部装备', value: 'ALL' },
  { label: '异常项', value: 'ERROR' },
  { label: '正常项', value: 'NORMAL' },
]

// --- 核心状态变量 ---
const equipmentList = ref([]) // 真实装备列表
const config_blob = ref(null) // 硬件配置信息
const realtimeSwitchMap = reactive({}) // 硬件感知映射表 { self_address: status }
const isPolling = ref(false) // 轮询开关
const summaryVisible = ref(false)
const showKeyboard = ref(false)
const currentFilter = ref('ALL')

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

const filteredList = computed(() => {
  if (currentFilter.value === 'NORMAL') return equipmentList.value.filter((i) => !isItemAbnormal(i))
  if (currentFilter.value === 'ERROR') return equipmentList.value.filter(isItemAbnormal)
  return equipmentList.value
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
   CSS 变量及全局布局
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

/* Header */
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

.main-body {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

/* 列表展示区 */
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
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
}

.inventory-indicator {
  display: flex;
  gap: 15px;
  margin-left: 20px;
  font-size: 12px;
  color: var(--text-sec);
}

.ind-item {
  display: flex;
  align-items: center;
  gap: 5px;
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

/* 添加 warning 状态圆点的颜色 */
.dot.warning {
  background: var(--warning);
  box-shadow: 0 0 5px var(--warning);
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

.scroll-area {
  flex: 1;
  padding: 15px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

/* 卡片样式 */
/* --- 列表网格：固定5列 --- */
.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  /* 强制5列 */
  gap: 12px;
}

/* --- 卡片基础样式 --- */
.equip-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  height: auto;
  /* 增加高度以容纳更多信息 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
}

.equip-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: #4a5c76;
}

/* 异常状态下的卡片 */
.equip-card.is-abnormal {
  border-color: var(--error);
  background: rgba(255, 77, 79, 0.04);
  box-shadow: inset 0 0 15px rgba(255, 77, 79, 0.05);
}

/* 正常状态下的卡片：绿色边框和微光背景 */
.equip-card.is-normal {
  border-color: rgba(0, 255, 157, 0.4);
  /* 绿色边框，带透明度不刺眼 */
  background: rgba(0, 255, 157, 0.05);
}

/* 异常角标（红色小三角） */
.error-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 30px solid var(--error);
  border-left: 30px solid transparent;
  z-index: 5;
}

/* 正常角标（绿色小三角） */
.success-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 30px solid #139865;
  border-left: 30px solid transparent;
  z-index: 5;
}

/* 统一图标在三角形内的位置 */
.error-ribbon .el-icon,
.success-ribbon .el-icon {
  position: absolute;
  top: -28px;
  /* 向上移动到边框区域 */
  left: -16px;
  /* 向左微调实现对角线居中 */
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  /* 让勾选稍微粗一点点，更有力量感 */
}

/* --- 装备图片展示 --- */
.equip-image-preview {
  width: 100%;
  height: 100px;
  /* 缩减图片高度，留给文字 */
  background: #000;
  border-bottom: 1px solid var(--border);
}

.image-placeholder {
  background: #0d121c;
  width: 100%;
  height: 100%;
}

.image-error-slot {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
  background: #0d121c;
}

/* --- 信息内容区 --- */
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
  white-space: pre-wrap;
}

/* --- 账实对比组（左右紧凑型） --- */
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

/* 状态标签配色优化 */
.st-in {
  background: rgba(0, 255, 157, 0.15);
  color: var(--success);
  border: 1px solid rgba(0, 255, 157, 0.2);
}

.st-out {
  background: rgba(255, 255, 255, 0.05);
  color: #8899a6;
  /* 使用更有质感的灰蓝色 */
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* st-out-warn 仅保留给弹窗内的 mini-tag 使用 */
.st-out-warn {
  background: rgba(255, 77, 79, 0.15);
  color: var(--error);
  border: 1px solid rgba(255, 77, 79, 0.2);
}

/* --- 底部柜位信息 --- */
.card-footer-pos {
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--primary);
  font-size: 12px;
}

.pos-text {
  font-weight: 500;
}

/* --- 底部进度条装饰 --- */
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

/* 右侧报告面板 */
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

/* [修复] 右侧头部样式 */
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

/* 联动卡片样式 */
.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  padding: 15px 5px;
  text-align: center;
  border-radius: 4px;
  transition: 0.3s;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
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

.success-text {
  color: var(--success);
  font-weight: bold;
}

.danger-text {
  color: var(--error);
  font-weight: bold;
}

.warning-text {
  color: var(--warning);
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

/* 弹窗样式 */
.summary-dialog-content {
  padding: 0 20px;
}

.abnormal-table-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--border);
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
  color: var(--primary);
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.cyber-table td {
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  text-align: left;
}

.t-name {
  font-size: 14px;
  color: #fff;
  font-weight: bold;
}

.t-code {
  font-size: 12px;
  color: var(--text-sec);
  font-family: monospace;
}

.mini-tag {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: bold;
}

.st-unreg {
  background: rgba(230, 162, 60, 0.2);
  color: var(--warning);
  border: 1px solid var(--warning);
}

.table-input :deep(.el-input__wrapper) {
  background: rgba(0, 0, 0, 0.3) !important;
  box-shadow: none !important;
  border: 1px solid #4a5c76;
}

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

.footer-btn.confirm {
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%);
  border: 1px solid var(--primary);
  color: #fff;
}

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
.st-loading {
  background: rgba(255, 255, 255, 0.05);
  color: #555;
  border: 1px solid #333;
}
</style>

<style>
/* 弹窗位移全局逻辑 */
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

/* 让按钮内部内容水平排列 */
.btn-content {
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 */
  gap: 12px;
  /* 图标和文字之间的间距 */
  width: 100%;
  height: 100%;
}

/* 让两行文字垂直堆叠，并靠左对齐 */
.text-group {
  display: flex;
  flex-direction: column;
  /* 文字上下排 */
  align-items: flex-start;
  /* 文字左对齐 */
}

/* 主标题样式 */
.btn-main-text {
  font-size: 16px;
  font-weight: bold;
  line-height: 1.2;
}

/* 副标题样式 */
.btn-sub-text {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
}
</style>
