<template>
  <div class="page-container theme-dark">
    <!-- ================= 顶部导航栏 ================= -->
    <header class="header-bar">
      <div class="header-left">
        <div class="icon-box-glow">
          <el-icon :size="24" class="primary-icon">
            <Box />
          </el-icon>
        </div>
        <div class="title-text">
          <h1>装备归还</h1>
          <span class="sub-title">智能感知 · 实时物联 · 动态监管</span>
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
      <!-- 左侧：装备卡片列表 -->
      <div class="list-section">
        <div class="section-title">
          <div class="title-left">
            <span class="text-glow">装备列表 ({{ filteredList.length }})</span>
            <span v-if="selectedIds.length > 0" class="selection-count">
              已选中 <span class="highlight-num">{{ selectedIds.length }}</span> 项
            </span>
          </div>

          <!-- 平滑切换的标签栏 -->
          <div class="filter-tabs" ref="tabsContainer">
            <div class="tab-glider" :style="gliderStyle"></div>
            <span
              v-for="(tab, index) in filterOptions"
              :key="tab.value"
              class="tab"
              :class="{ active: currentFilter === tab.value }"
              :ref="(el) => (tabRefs[index] = el)"
              @click="setFilter(tab.value)"
            >
              {{ tab.label }}
            </span>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid">
            <!-- 修改 1: :class 逻辑翻转。如果 '在位'，则添加 status-disabled (变灰) -->
            <div
              v-for="item in filteredList"
              :key="item.id"
              class="equip-card"
              :class="{
                active: selectedIds.includes(item.id),
                'status-disabled': item.group_status === '在位',
              }"
              @click="toggleSelect(item.id)"
            >
              <div class="check-ribbon" v-if="selectedIds.includes(item.id)">
                <el-icon>
                  <Check />
                </el-icon>
              </div>

              <!-- 状态标签颜色也需要适配 -->
              <div
                class="card-status-badge"
                :class="item.group_status === '在位' ? 'st-in-place-disabled' : 'st-out-active'"
              >
                {{ item.group_status === '在位' ? '在位' : '待归还' }}
              </div>

              <div class="card-icon">
                <!-- 修改 2: 图标逻辑翻转。'已取出'显示高亮图标，'在位'显示锁定图标 -->
                <el-icon v-if="item.group_status !== '在位'" :size="32" class="icon-active">
                  <SoldOut />
                  <!-- 或者使用 Back/Upload 图标 -->
                </el-icon>
                <el-icon v-else :size="32" class="icon-locked">
                  <Files />
                </el-icon>
              </div>

              <div class="card-info">
                <div class="equip-name" :title="item.group_name">{{ item.group_name }}</div>
                <div class="equip-code">编号：{{ item.group_code }}</div>
                <div class="equip-pos">
                  <el-icon>
                    <Location />
                  </el-icon>
                  {{ item.self_address }}号柜位
                </div>
              </div>
              <div class="active-bar"></div>
            </div>

            <div v-if="filteredList.length === 0" class="no-data-tip">暂无匹配装备</div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧：详情与操作面板 -->
      <div class="operation-section">
        <!-- 场景1：未选中 -->
        <template v-if="selectedIds.length === 0">
          <div class="empty-placeholder">
            <div class="icon-circle">
              <el-icon :size="50">
                <Mouse />
              </el-icon>
            </div>
            <div class="empty-text">等待操作指令</div>
            <div class="empty-sub">请在左侧列表选择装备</div>
          </div>
        </template>

        <!-- 场景2：单选详情 -->
        <template v-else-if="selectedIds.length === 1">
          <div class="detail-card">
            <div class="detail-header">
              <div class="header-title-group">
                <div class="big-name">{{ singleItem.group_name }}</div>
                <div
                  class="status-tag-large"
                  :class="
                    singleItem.group_status === '在位' ? 'st-in-place-disabled' : 'st-out-active'
                  "
                >
                  {{ singleItem.group_status === '在位' ? '在位' : '待归还' }}
                </div>
              </div>
              <button class="btn-text-action" @click="clearSelection">取消选择</button>
            </div>

            <div class="info-table">
              <div class="info-row">
                <span class="label">装备编号</span>
                <span class="value font-mono highlight">{{ singleItem.group_code }}</span>
              </div>
              <div class="info-row">
                <span class="label">装备类型</span>
                <span class="value">{{ singleItem.group_type }}</span>
              </div>
              <div class="info-row">
                <span class="label">存放位置</span>
                <span class="value"
                  >{{ singleItem.self_address }} 号位 /
                  {{ singleItem.lock_self_address === 1 ? '上柜' : '下柜' }}</span
                >
              </div>
              <div class="info-row">
                <span class="label">包含芯片</span>
                <span class="value">{{ singleItem.group_chip_count }} 枚</span>
              </div>
              <div class="info-row">
                <span class="label">配发时间</span>
                <span class="value">{{ singleItem.group_distribution_time }}</span>
              </div>
            </div>

            <div class="remark-area">
              <div class="area-title">参数 / 备注信息</div>
              <div class="remark-content custom-scroll">
                {{ singleItem.group_remark || '该装备暂无详细参数描述...' }}
              </div>
            </div>

            <div class="action-footer">
              <!-- 修改 3: 按钮禁用逻辑翻转 -->
              <button
                class="cyber-btn"
                :class="{ disabled: singleItem.group_status === '在位' }"
                :disabled="singleItem.group_status === '在位'"
                @click="handleStartBorrowProcess"
              >
                <div class="btn-content">
                  <el-icon :size="24" v-if="singleItem.group_status !== '在位'">
                    <SoldOut />
                  </el-icon>
                  <el-icon :size="24" v-else>
                    <CircleCloseFilled />
                  </el-icon>
                  <div class="text-group">
                    <!-- 文案修改 -->
                    <span class="btn-main-text">{{
                      singleItem.group_status !== '在位' ? '立即归还' : '已在位·无需归还'
                    }}</span>
                    <span class="btn-sub-text">{{
                      singleItem.group_status !== '在位'
                        ? '开门放入 · 自动感应'
                        : '装备在库 · 禁止操作'
                    }}</span>
                  </div>
                </div>
                <div class="scan-line" v-if="singleItem.group_status !== '在位'"></div>
              </button>
            </div>
          </div>
        </template>

        <!-- 场景3：批量操作 -->
        <template v-else>
          <div class="batch-card">
            <div class="batch-header">
              <div class="batch-title">
                <el-icon>
                  <List />
                </el-icon>
                批量操作清单
              </div>
              <button class="btn-text-action danger" @click="clearSelection">清空已选</button>
            </div>

            <div class="batch-summary">
              <div class="summary-item">
                <span class="num">{{ selectedItems.length }}</span>
                <span class="txt">总选中</span>
              </div>
              <div class="summary-item success">
                <span class="num">{{ validItemsCount }}</span>
                <span class="txt">可归还</span>
              </div>
              <div class="summary-item warning" v-if="selectedItems.length - validItemsCount > 0">
                <span class="num">{{ selectedItems.length - validItemsCount }}</span>
                <span class="txt">不可用</span>
              </div>
            </div>

            <el-scrollbar class="batch-list-scroll">
              <div class="batch-list">
                <div v-for="item in selectedItems" :key="item.id" class="batch-item">
                  <div class="item-left">
                    <div class="b-name">{{ item.group_name }}</div>
                    <div class="b-code" :title="item.group_code">{{ item.group_code }}</div>
                  </div>
                  <div class="item-right">
                    <button
                      class="btn-icon-view"
                      @click.stop="openDetailModal(item)"
                      title="查看详情"
                    >
                      <el-icon>
                        <View />
                      </el-icon>
                    </button>
                    <span
                      class="mini-tag"
                      :class="
                        item.group_status === '在位' ? 'st-in-place-disabled' : 'st-out-active'
                      "
                    >
                      {{ item.group_status === '在位' ? '在位' : '待归还' }}
                    </span>
                    <div class="b-pos">{{ item.self_address }}号</div>
                    <button class="btn-icon-remove" @click.stop="toggleSelect(item.id)">
                      <el-icon>
                        <Close />
                      </el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </el-scrollbar>

            <div class="action-footer">
              <div v-if="selectedItems.length - validItemsCount > 0" class="batch-warning">
                <el-icon>
                  <Warning />
                </el-icon>
                系统将自动跳过 {{ selectedItems.length - validItemsCount }} 个不可归还装备
              </div>

              <button
                class="cyber-btn"
                :class="{ disabled: validItemsCount === 0 }"
                :disabled="validItemsCount === 0"
                @click="handleStartBorrowProcess"
              >
                <div class="btn-content">
                  <el-icon :size="24">
                    <Collection />
                  </el-icon>
                  <div class="text-group">
                    <span class="btn-main-text">批量归还 ({{ validItemsCount }}项)</span>
                    <span class="btn-sub-text">操作留痕 · 错取报警</span>
                  </div>
                </div>
                <div class="scan-line" v-if="validItemsCount > 0"></div>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- 详情查看弹窗 (只读) -->
      <el-dialog
        v-model="detailVisible"
        title="装备详情概览"
        width="400px"
        class="cyber-dialog"
        :append-to-body="true"
        :destroy-on-close="true"
      >
        <div class="detail-card-modal">
          <div class="detail-header-modal">
            <div class="big-name-modal">{{ viewingItem.group_name }}</div>
            <div
              class="status-tag-large"
              :class="
                viewingItem.group_status === '在位' ? 'st-in-place-disabled' : 'st-out-active'
              "
            >
              {{ viewingItem.group_status === '在位' ? '在位' : '待归还' }}
            </div>
          </div>
          <div class="info-table">
            <div class="info-row">
              <span class="label">装备编号</span>
              <span class="value font-mono highlight">{{ viewingItem.group_code }}</span>
            </div>
            <div class="info-row">
              <span class="label">装备类型</span>
              <span class="value">{{ viewingItem.group_type }}</span>
            </div>
            <div class="info-row">
              <span class="label">存放位置</span>
              <span class="value">{{ viewingItem.self_address }} 号位</span>
            </div>
            <div class="info-row">
              <span class="label">包含芯片</span>
              <span class="value">{{ viewingItem.group_chip_count }} 枚</span>
            </div>
            <div class="info-row">
              <span class="label">配发时间</span>
              <span class="value">{{ viewingItem.group_distribution_time }}</span>
            </div>
          </div>
          <div class="remark-area-modal">
            <div class="area-title">参数 / 备注信息</div>
            <div class="remark-content custom-scroll">
              {{ viewingItem.group_remark || '该装备暂无详细参数描述...' }}
            </div>
          </div>
        </div>
      </el-dialog>

      <!-- ================= 核心：实时领用监控弹窗 (全屏遮罩) ================= -->
      <el-dialog
        v-model="borrowProcessVisible"
        :show-close="false"
        :close-on-click-modal="false"
        width="600px"
        class="cyber-dialog process-dialog"
        center
        :append-to-body="true"
      >
        <div class="process-container">
          <!-- 标题区 -->
          <div class="process-header">
            <div class="p-title">正在归还装备</div>
            <div class="p-sub">柜门已打开，请将选中的装备放入对应位置</div>
          </div>

          <!-- 动画指示器 -->
          <div class="scan-anim-box">
            <div class="scanner"></div>
          </div>

          <!-- 实时列表 -->
          <div class="monitor-list">
            <!-- 待领取的正确装备 -->
            <!-- 请替换原有的 monitor-list 中的 v-for 部分 -->
            <div
              v-for="item in activeBorrowList"
              :key="'target-' + item.id"
              class="m-item"
              :class="{ taken: item.isReturned }"
            >
              <div class="m-left">
                <!-- 情况1: 已归还 -->
                <el-icon v-if="item.isReturned" color="#00ff9d" :size="20">
                  <Check />
                </el-icon>

                <!-- 情况2: 未归还 & 传感器正常 -->
                <el-icon
                  v-else-if="!isSensorDisabled(item.self_address)"
                  class="pulse-icon"
                  color="#00f2ff"
                  :size="20"
                >
                  <Location />
                </el-icon>

                <!-- 情况3: 未归还 & 传感器禁用(坏了) -->
                <el-icon v-else color="#E6A23C" :size="20">
                  <Tools />
                </el-icon>

                <div class="m-info-group">
                  <span class="m-name">{{ item.group_name }}</span>
                  <span class="m-addr">
                    位置: {{ item.self_address }}号
                    <span
                      v-if="isSensorDisabled(item.self_address)"
                      style="color: #e6a23c; font-size: 10px"
                      >(传感器已禁用)</span
                    >
                  </span>
                </div>
              </div>

              <div class="m-status">
                <span v-if="item.isReturned" class="success-text">已归还</span>

                <!-- 增加手动确认按钮 -->
                <button
                  v-else-if="isSensorDisabled(item.self_address)"
                  class="manual-confirm-btn"
                  @click="manualConfirmReturned(item)"
                >
                  <el-icon>
                    <Pointer />
                  </el-icon>
                  确认放入
                </button>

                <span v-else>等待放入...</span>
              </div>
            </div>

            <!-- 报警区域：检测到拿错的装备 -->
            <div
              v-for="errItem in wrongTakenList"
              :key="'wrong-' + errItem.id"
              class="m-item error-shake"
            >
              <div class="m-left">
                <el-icon color="#ff4d4f" :size="24">
                  <Warning />
                </el-icon>
                <div class="m-info-group">
                  <span class="m-name" style="color: #ff4d4f"
                    >误拿警告: {{ errItem.group_name }}</span
                  >
                  <span class="m-addr" style="color: #ff8888"
                    >位置: {{ errItem.self_address }}号</span
                  >
                </div>
              </div>
              <div class="m-status error-text">请立即放回!</div>
            </div>
          </div>

          <!-- 底部操作区 -->
          <div class="process-footer">
            <div class="status-summary" v-if="wrongTakenList.length === 0">
              <span v-if="remainingCount > 0" class="processing-text">
                <el-icon class="is-loading">
                  <Loading />
                </el-icon>
                剩余 {{ remainingCount }} 件待取
              </span>
              <span v-else class="success-text">
                <el-icon>
                  <CircleCheck />
                </el-icon>
                所有装备已取出，请关闭柜门
              </span>
            </div>
            <div class="status-summary error-text" v-else>检测到异常！请放回错误装备</div>

            <!-- [修改点] 底部增加关门提示与按钮禁用逻辑 -->

            <!-- 如果装备全取走，且没有拿错，但门没关，显示黄色闪烁提示 -->
            <div
              v-if="remainingCount === 0 && wrongTakenList.length === 0 && !areDoorsClosed"
              class="door-warning-anim"
            >
              <el-icon class="is-loading">
                <Loading />
              </el-icon>
              检测到柜门未关闭，请关门...
            </div>

            <div class="btn-group">
              <!--
                 1. 只有全部取走且无错误时，才显示完成按钮
                 2. :class disabled-state 动态添加灰色样式
                 3. :disabled 动态禁用，如果门没关就不能点
              -->
              <button
                v-if="remainingCount === 0 && wrongTakenList.length === 0"
                class="cyber-btn finish-btn"
                :class="{ 'disabled-state': !areDoorsClosed }"
                :disabled="!areDoorsClosed"
                @click="secureFinalize('NORMAL')"
              >
                <!-- 修改这里 -->
                <span v-if="areDoorsClosed">确认已关门并完成</span>
                <span v-else>等待关门...</span>
              </button>

              <!-- 紧急停止/人工干预 -->
              <button
                class="btn-text-action danger"
                style="margin-top: 15px; margin-left: auto; margin-right: auto"
                @click="forceExitProcess"
              >
                人工强制结束
              </button>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'
import {
  Box,
  SwitchButton,
  Location,
  Files,
  CircleCloseFilled,
  Warning,
  Check,
  Mouse,
  List,
  Close,
  Collection /*Search,*/,
  View,
  Loading,
  CircleCheck,
  SoldOut,
  Tools,
  Pointer,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useTimerStore } from '@/stores/timerStore'
import { useAudioStore } from '@/stores/audioStore'
// import { useConfigStore } from '@/stores/configStore'
import { useRouter } from 'vue-router'
const router = useRouter()

const timerStore = useTimerStore()
const audioStore = useAudioStore()
// const configStore = useConfigStore()

// --- 新增状态变量 ---
const areDoorsClosed = ref(false) // 默认为 false，因为流程刚开始时门肯定是开的
const hasPlayedCloseDoorPrompt = ref(false) // [新增] 控制关门提示音只播一次

// --- [新增] 领用用途相关变量 ---
const borrowReason = ref('') // 绑定的用途值

// --- 核心数据变量 ---
const config_blob = ref(null)
const equipmentList = ref([])
const searchVal = ref('')
const currentFilter = ref('ALL')
const selectedIds = ref([])
const detailVisible = ref(false)
const viewingItem = ref({})
const el_loading = ref(false)

// --- 业务流程控制变量 ---
const borrowProcessVisible = ref(false) // 监控弹窗显隐
const isPolling = ref(false) // 轮询开关
const activeBorrowList = ref([]) // 目标领用列表（含实时状态）
const wrongTakenList = ref([]) // 误拿列表
const allInPlaceItems = ref([]) // 初始在位的所有装备（用于比对）
const realtimeSwitchMap = reactive({}) // 实时硬件状态映射表 {address: 1/0}

// --- 过滤选项 ---
const filterOptions = [
  { label: '全部装备', value: 'ALL' },
  { label: '待归还（已取出）', value: 'OUT' },
  { label: '在位', value: 'IN' },
]

// --- 动画与 Ref ---
const tabsContainer = ref(null)
const tabRefs = ref([])
const gliderStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 })

// --- 辅助：判断传感器是否禁用 (与领用代码一致) ---
const isSensorDisabled = (address) => {
  if (!config_blob.value?.switch?.details) return false
  const conf = config_blob.value.switch.details.find((d) => d.self_address == address)
  // 兼容数字和字符串类型的判断 (admin_status: 0 表示禁用/维修中)
  return conf && (conf.admin_status == 0 || conf.admin_status === '0')
}

// --- 动作：手动确认归还 (用于传感器损坏时) ---
const manualConfirmReturned = (item) => {
  item.isReturned = true // 在归还场景下，isReturned = true 代表“已归还”
  audioStore.play('/audio/按钮点击声.mp3')
}

// --- 新增：全局检测所有柜门状态 (用于安全退出和结算) ---
const checkGlobalDoorStatus = async () => {
  if (!config_blob.value?.lock?.details) return true

  // 获取所有用到的锁板通道
  const usedChannels = new Set()
  config_blob.value.lock.details.forEach((lock) => {
    if (lock.channel_address) usedChannels.add(lock.channel_address)
  })

  try {
    const res = await window.electronAPI.el_post({
      action: 'read_all_inputs',
      payload: { deviceAddress: 201, startAddress: 0x0000, registerCount: 10 },
    })

    if (res && res.success && res.data && res.data.length >= 8) {
      for (const channel of usedChannels) {
        let dataIndex = -1
        if (channel === 1) dataIndex = 6
        if (channel === 2) dataIndex = 7
        // 0=开, 1=关
        if (dataIndex !== -1 && res.data[dataIndex] === 0) {
          return false
        }
      }
      return true
    }
    return false
  } catch (e) {
    console.error('全局门锁状态读取失败', e)
    return false
  }
}

// =================================================================
// 计算属性
// =================================================================
const filteredList = computed(() => {
  let list = equipmentList.value

  // 1. 全局过滤：必须排除 '已出柜' 和 '未入柜'
  list = list.filter((item) => item.group_status !== '已出柜' && item.group_status !== '未入柜')

  // 2. 搜索过滤
  if (searchVal.value) {
    const keyword = searchVal.value.toLowerCase()
    list = list.filter(
      (item) =>
        (item.group_name && item.group_name.toLowerCase().includes(keyword)) ||
        (item.group_code && item.group_code.toLowerCase().includes(keyword)),
    )
  }

  // 3. 标签过滤
  if (currentFilter.value === 'IN') {
    list = list.filter((item) => item.group_status === '在位')
  } else if (currentFilter.value === 'OUT') {
    list = list.filter((item) => item.group_status !== '在位')
  }

  return list
})

const selectedItems = computed(() => {
  return equipmentList.value.filter((item) => selectedIds.value.includes(item.id))
})

const singleItem = computed(() => selectedItems.value[0])

const validItemsCount = computed(() => {
  // 逻辑翻转：统计所有状态 不是 '在位' 的装备
  return selectedItems.value.filter((item) => item.group_status !== '在位').length
})

// 剩余未取的数量
const remainingCount = computed(() => {
  return activeBorrowList.value.filter((i) => !i.isReturned).length
})

// =================================================================
// UI 交互方法
// =================================================================
const updateGlider = () => {
  nextTick(() => {
    const activeIndex = filterOptions.findIndex((opt) => opt.value === currentFilter.value)
    if (activeIndex !== -1 && tabRefs.value[activeIndex]) {
      const activeEl = tabRefs.value[activeIndex]
      gliderStyle.value = {
        width: `${activeEl.offsetWidth}px`,
        transform: `translateX(${activeEl.offsetLeft}px)`,
        opacity: 1,
      }
    }
  })
}

const setFilter = (filterType) => {
  currentFilter.value = filterType
}

watch(currentFilter, () => {
  updateGlider()
})

const toggleSelect = (id) => {
  audioStore.play(`/audio/按钮点击声.mp3`)
  const index = selectedIds.value.indexOf(id)
  if (index === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(index, 1)
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

const openDetailModal = (item) => {
  viewingItem.value = item
  detailVisible.value = true
}

// =================================================================
// 数据获取与初始化
// =================================================================
const fetchConfigData = async () => {
  try {
    const response = await window.electronAPI.el_post({
      action: 'queryMultipleTables',
      payload: {
        arr: [{ tablename: 'terminal_settings', condition: '' }],
      },
    })

    if (response.success && response.data?.terminal_settings) {
      config_blob.value = JSON.parse(response.data.terminal_settings.config_blob)
    }
  } catch (error) {
    console.error('配置加载失败:', error)
  }
}

const getData = async () => {
  el_loading.value = true
  try {
    let allData = []
    let currentPage = 1
    let hasMoreData = true
    const pageSize = 10

    while (hasMoreData) {
      const response = await window.electronAPI.el_post({
        action: 'queryPagination',
        payload: {
          tableName: 'equipment',
          page: currentPage,
          pageSize: pageSize,
        },
      })

      if (response.data && response.data.data && response.data.data.length > 0) {
        allData = [...allData, ...response.data.data]
        if (response.data.data.length < pageSize) {
          hasMoreData = false
        } else {
          currentPage++
        }
      } else {
        hasMoreData = false
      }
    }

    allData.forEach((row) => {
      if (row.group_distribution_time) {
        const date = new Date(row.group_distribution_time)
        if (!isNaN(date.getTime())) {
          row.group_distribution_time = date.toISOString().split('T')[0]
        }
      }
      if (!row.lock_self_address && config_blob.value?.lock?.details?.length > 0) {
        row.lock_self_address = config_blob.value.lock.details[0].self_address
      }
    })

    allData.sort((a, b) => {
      return (Number(a.self_address) || 0) - (Number(b.self_address) || 0)
    })

    equipmentList.value = allData
  } catch (error) {
    console.error('获取装备数据失败:', error)
    ElMessage.error('数据加载失败')
  } finally {
    el_loading.value = false
  }
}

// =================================================================
// 核心业务：领用流程 (Handle Borrow Process)
// =================================================================

// 1. 启动归还流程
const handleStartBorrowProcess = async () => {
  // 筛选出 需要归还 的装备 (即当前不在位的)
  const itemsToReturn = selectedItems.value.filter((item) => item.group_status !== '在位')

  if (itemsToReturn.length === 0) {
    audioStore.play('/audio/没有可归还的装备选中.mp3')
    return
  }

  // 初始化状态
  // isReturned 在归还页面意为 "isReturned" (是否已归还)
  activeBorrowList.value = itemsToReturn.map((item) => ({
    ...item,
    isReturned: false,
  }))

  // 归还时，"allInPlaceItems" 用于监控是否有人趁机拿走了别的装备
  // 排除掉当前要归还的这些（虽然它们本身就不在位）
  const targetIds = itemsToReturn.map((i) => i.id)
  allInPlaceItems.value = equipmentList.value.filter(
    (item) => item.group_status === '在位' && !targetIds.includes(item.id),
  )

  wrongTakenList.value = [] // 误拿列表

  // UI 状态重置
  borrowProcessVisible.value = true
  isPolling.value = true
  areDoorsClosed.value = false
  hasPlayedCloseDoorPrompt.value = false

  // 发送开锁指令
  try {
    audioStore.play('/audio/柜门已打开请放入装备.mp3') // 建议改为：柜门已打开请放入装备

    const uniqueLockAddresses = new Set()
    itemsToReturn.forEach((item) => {
      const addr = getLockRegisterAddress(item)
      if (addr) uniqueLockAddresses.add(addr)
    })

    for (const lockRegister of uniqueLockAddresses) {
      // 开锁
      await window.electronAPI.el_post({
        action: 'control_register',
        payload: { deviceAddress: 201, registerAddress: lockRegister, value: 50, isWrite: true },
      })
      // 开灯 (时间设长一点)
      await window.electronAPI.el_post({
        action: 'control_register',
        payload: { deviceAddress: 201, registerAddress: 12, value: 900000, isWrite: true },
      })
      await new Promise((r) => setTimeout(r, 500))
    }
  } catch (e) {
    console.error('部分柜门可能未打开', e)
  }

  // 启动循环
  startMonitorLoop()
}

// 辅助：获取锁地址
const getLockRegisterAddress = (item) => {
  if (item.open_lock_register_address) return item.open_lock_register_address
  if (config_blob.value) {
    const lockConfig = config_blob.value.lock.details.find(
      (l) => l.self_address == item.lock_self_address,
    )
    if (lockConfig) return lockConfig.open_lock_register_address
  }
  return null
}

// 辅助：检查门锁状态 (仅当物品都取走且无误拿时调用)
const checkDoorStatus = async () => {
  // 1. 如果没有需要领用的物品，直接返回 true (或根据业务逻辑返回 false)
  if (activeBorrowList.value.length === 0) return true

  // 2. 收集当前任务涉及的所有“通道地址” (1 或 2)
  // 我们需要知道要检查哪些门。通过装备找到对应的锁配置。
  const requiredChannels = new Set()

  if (config_blob.value?.lock?.details) {
    activeBorrowList.value.forEach((item) => {
      // 找到该装备对应的锁配置 (通过 lock_self_address 匹配)
      const lockConfig = config_blob.value.lock.details.find(
        (d) => d.self_address == item.lock_self_address,
      )
      if (lockConfig && lockConfig.channel_address) {
        requiredChannels.add(lockConfig.channel_address)
      }
    })
  }

  // 如果没有找到对应的锁配置，默认无需关门检测
  if (requiredChannels.size === 0) return true

  try {
    // 3. 读取门锁板状态 (Device 201)
    // 参考 executeEverySecond 中的读取方式
    const res = await window.electronAPI.el_post({
      action: 'read_all_inputs',
      payload: {
        deviceAddress: 201, // 门锁板地址
        startAddress: 0x0000,
        registerCount: 10,
      },
    })

    if (res && res.success && res.data && res.data.length >= 8) {
      let allClosed = true

      // 4. 遍历我们需要检查的通道
      for (const channel of requiredChannels) {
        // 映射规则：channel 1 -> index 6, channel 2 -> index 7
        let dataIndex = -1
        if (channel === 1) dataIndex = 6
        if (channel === 2) dataIndex = 7

        if (dataIndex !== -1) {
          // 状态判断：参考代码中 1 为关门，0 为开门
          const isClosed = res.data[dataIndex] === 1
          if (!isClosed) {
            allClosed = false
            break // 只要有一个没关，就判定为未全部关闭
          }
        }
      }
      return allClosed
    }

    return false // 读取失败视为未关门，保证安全
  } catch (e) {
    console.error('门锁状态读取失败', e)
    return false
  }
}

// 2. 硬件轮询循环
const startMonitorLoop = async () => {
  while (isPolling.value) {
    try {
      // ================= Phase 1: 物品状态检测 =================

      // A. 读取硬件
      await updateAllHardwareStatus()

      // B. 检查【目标装备】是否已归还 (放入)
      for (const target of activeBorrowList.value) {
        // 使用新的检测逻辑
        const isInPlace = checkItemInPlace(target)

        // 状态防抖：只有状态改变时才更新
        if (isInPlace && !target.isReturned) {
          target.isReturned = true // 标记为已归还
          audioStore.play('/audio/拿对提示音.mp3')
        } else if (!isInPlace && target.isReturned) {
          // 如果传感器是好的，但信号断了，说明用户又拿出来了 -> 状态回退
          // 如果传感器是禁用的，不允许自动回退 (必须由用户手动操作，避免接触不良导致反复跳变)
          if (!isSensorDisabled(target.self_address)) {
            target.isReturned = false
          }
        }
      }

      // C. 检查【在位装备】是否被误拿 (安全报警)
      const currentWrongList = []
      for (const safeItem of allInPlaceItems.value) {
        // 这里的 checkItemRemoved 逻辑不变：检测 1 -> 0
        const isRemoved = checkItemRemoved(safeItem)
        if (isRemoved) {
          currentWrongList.push(safeItem)
        }
      }

      // 报警触发
      if (currentWrongList.length > wrongTakenList.value.length) {
        audioStore.play('/audio/拿错提示音.mp3')
      }
      wrongTakenList.value = currentWrongList

      // ================= Phase 2: 门锁状态检测 (同领用逻辑) =================

      const allItemsReturned = activeBorrowList.value.every((i) => i.isReturned)
      const noErrors = wrongTakenList.value.length === 0

      if (allItemsReturned && noErrors) {
        // 播放关门提示 (单次)
        if (!hasPlayedCloseDoorPrompt.value) {
          audioStore.play('/audio/所有装备已归还请关闭柜门.mp3') // 建议替换为：所有装备已归还...
          hasPlayedCloseDoorPrompt.value = true
        }

        // 检测门锁
        areDoorsClosed.value = await checkDoorStatus()

        // [可选] 自动完成逻辑 (如果不想要自动，注释掉下面这行)
        if (areDoorsClosed.value) {
          await finalizeBorrow()
          return
        }
      } else {
        // 状态未满足，重置部分标记
        if (!allItemsReturned) {
          hasPlayedCloseDoorPrompt.value = false
        }
        areDoorsClosed.value = false
      }

      await new Promise((r) => setTimeout(r, 500))
    } catch (e) {
      console.error('监控循环异常', e)
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
}

// 辅助：检测装备是否在位 (归还逻辑的核心)
const checkItemInPlace = (item) => {
  // 1. 如果传感器被禁用/损坏，永远返回 false
  // 这样 activeBorrowList 里的 item 就不会自动变绿，强制用户点“手动确认”
  if (isSensorDisabled(item.self_address)) return false

  // 2. 正常硬件检测
  const status = realtimeSwitchMap[item.self_address]
  if (status === undefined) return false

  // 假设 1 = 闭合(有装备), 0 = 断开(无装备)
  // 具体根据您的硬件配置调整，如果相反则改为 status === 0
  return status === 1
}

// 辅助：检测装备是否被移走 (用于误拿报警)
const checkItemRemoved = (item) => {
  if (isSensorDisabled(item.self_address)) return false // 坏传感器忽略报警

  const status = realtimeSwitchMap[item.self_address]
  if (status === undefined) return false
  return status === 0 // 0 代表被移走
}

// 3. 安全提交包装器 (包含门锁检测循环)
const secureFinalize = async (entryType = 'NORMAL') => {
  console.log('entryType:', entryType)
  const loading = ElLoading.service({
    lock: true,
    text: '正在检查柜门闭合状态...',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  let isAllClosed = false
  try {
    isAllClosed = await checkGlobalDoorStatus()
  } catch (e) {
    console.log('e:', e)
  }
  loading.close()

  // 场景 A: 门已关 -> 直接提交
  if (isAllClosed) {
    await finalizeBorrow()
    return
  }

  // 场景 B: 门没关 -> 弹窗提示 + 后台轮询
  audioStore.play('/audio/安全警告检测到柜门未关闭.mp3')

  let stopPolling = false
  let isAutoAction = false

  // 轮询检测门是否关上
  const startPollingLoop = async () => {
    while (!stopPolling) {
      try {
        await new Promise((r) => setTimeout(r, 1000))
        if (stopPolling) break
        const closedNow = await checkGlobalDoorStatus()
        if (closedNow) {
          isAutoAction = true
          stopPolling = true
          await finalizeBorrow() // 自动提交
          ElMessageBox.close() // 关闭弹窗
          break
        }
      } catch (e) {
        console.log('e:', e)
      }
    }
  }
  startPollingLoop()

  // 弹出警告框
  try {
    await ElMessageBox.confirm(
      `<div style="text-align:center">
         <div style="color:#ff4d4f;font-weight:bold;font-size:18px;margin-bottom:10px">检测到柜门未关闭</div>
         <div style="color:#00f2ff;margin-bottom:10px">系统正在等待柜门关闭...</div>
         <div style="color:#666;font-size:12px">检测到信号后将自动完成归还流程</div>
       </div>`,
      '安全检测',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '强制执行 (忽略门磁)',
        showCancelButton: false,
        showClose: false,
        closeOnClickModal: false,
        confirmButtonClass: 'el-button--danger',
        customClass: 'cyber-message-box error-mode',
      },
    )
    // 用户点了强制执行
    stopPolling = true
    await finalizeBorrow()
  } catch (e) {
    console.log('e:', e)
    stopPolling = true
    if (!isAutoAction) console.log('弹窗异常关闭')
  }
}

// 辅助：读取硬件并更新 Map
const updateAllHardwareStatus = async () => {
  if (!config_blob.value?.switch?.expansion_board_addresses) return

  for (const address of config_blob.value.switch.expansion_board_addresses) {
    const result = await window.electronAPI.el_post({
      action: 'read_all_inputs',
      payload: {
        deviceAddress: address,
        startAddress: 0x0001,
        registerCount: 10,
      },
    })

    if (result?.success && result.data) {
      result.data.forEach((state, index) => {
        const detail = config_blob.value.switch.details.find(
          (d) => d.expansion_board_address === address && d.channel_address === index + 1,
        )
        if (detail) {
          realtimeSwitchMap[detail.self_address] = state
        }
      })
    }
  }
}

// 3. 确认完成并保存
const finalizeBorrow = async () => {
  isPolling.value = false
  el_loading.value = true

  const currentUser = { id: 1, username: '管理员', id_card: 'ADMIN001' } // 假设有身份证字段

  // 生成时间字符串
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timeNow = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

  try {
    for (const item of activeBorrowList.value) {
      if (item.isReturned) {
        // isReturned 在归还界面代表 "已归还/已放入"

        // =========================================================
        // 修改 A: 更新 borrow_records 表 (闭环逻辑)
        // 逻辑：找到该装备当前正在进行中(status=0)的记录，把它结单
        // =========================================================
        await window.electronAPI.el_post({
          action: 'update',
          payload: {
            tableName: 'borrow_records',
            setValues: {
              // --- 归还信息 ---
              return_username: currentUser.username,
              return_id_card: currentUser.id_card || '',
              return_time: timeNow, // 写入归还时间
              status: 1, // 1 = 已完结
              return_remark: '正常归还', // 或者使用界面输入的 borrowReason
              is_synced: 0, // 标记为未同步，等待上传
              last_modified: timeNow,
            },
            // 【核心关键点】条件：找到这个装备ID，且状态是未归还(0)的那条记录
            condition: `equipment_id = ${item.id} AND status = 0`,
          },
        })

        // =========================================================
        // 补充保险措施：如果数据库脏了，找不到 status=0 的记录怎么办？
        // (可选) 如果 update 返回 changes: 0，说明没有对应的领用记录，
        // 你可以选择插入一条“无头”归还记录，或者忽略。
        // 但通常硬件逻辑保证了必须先领出才能归还，所以上面的 update 足够。
        // =========================================================

        // =========================================================
        // B. 更新 equipment 表状态 (这部分是正确的，保持不变)
        // =========================================================
        await window.electronAPI.el_post({
          action: 'update',
          payload: {
            tableName: 'equipment',
            setValues: {
              group_status: '在位',
              // last_modified: timeNow // 如果equipment表有这个字段最好更新一下
            },
            condition: `id = ${item.id}`,
          },
        })
      }
    }

    borrowReason.value = ''
    audioStore.play('/audio/归还完成数据已保存.mp3') // 建议改为“归还完成...”

    borrowProcessVisible.value = false
    selectedIds.value = []
    setTimeout(() => {
      router.replace('/')
    }, 50)
  } catch (e) {
    audioStore.play('/audio/数据保存失败请联系管理员.mp3')
    console.error('归还结算失败:', e)
  } finally {
    el_loading.value = false
  }
}

// 4. 强制退出 / 异常处理 (增强版 - 逻辑完善)
const forceExitProcess = () => {
  // ================= Step 1: 安全拦截 (误拿) =================
  if (wrongTakenList.value.length > 0) {
    ElMessageBox.alert(
      `<div style="color: #ff4d4f; font-weight: bold;">检测到库存安全警报</div>
       <div style="margin-top: 10px; color: #ccc;">系统感应到柜内有 <span style="color: #ff4d4f; font-size: 16px;">${wrongTakenList.value.length}</span> 件误拿装备。</div>
       <div style="margin-top: 5px; color: #8899a6; font-size: 12px;">为了保障库存数据准确，系统已锁定结束功能。请将红色报警装备放回原位。</div>`,
      '禁止强制操作',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '收到，立即处理',
        customClass: 'cyber-message-box error-mode',
        center: true,
        showClose: false,
      },
    )
    return
  }

  // ================= Step 2: 正常/异常流程判断 =================
  const allItemsTaken = activeBorrowList.value.every((i) => i.isReturned)
  const takenCount = activeBorrowList.value.filter((i) => i.isReturned).length
  const remainingNum = activeBorrowList.value.length - takenCount

  // 场景A：全部取走 (正常情况)
  if (allItemsTaken) {
    ElMessageBox.confirm(
      `<div style="color: #00f2ff;">确认结束当前领用流程？</div>
       <div style="margin-top: 10px; color: #ccc;">系统检测到所有装备已取出。</div>
       <div style="margin-top: 5px; color: #8899a6; font-size: 12px;">点击确认后，系统将提交数据并关闭柜门控制。</div>`,
      '操作确认',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '确认完成',
        cancelButtonText: '取消',
        customClass: 'cyber-message-box success-mode',
        center: true,
      },
    )
      .then(() => {
        finalizeBorrow()
      })
      .catch(() => {})
  }
  // 场景B：还有物品未取出 (异常情况)
  else {
    ElMessageBox.confirm(
      `<div style="text-align: left;">
     <div style="color: #E6A23C; font-weight: bold; font-size: 15px; margin-bottom: 10px;">
       <i class="el-icon-warning"></i> 传感器状态异常确认
     </div>
     <div style="color: #ccc; margin-bottom: 8px;">
       仍有 <span style="color: #E6A23C; font-size: 16px; font-weight: bold;">${remainingNum}</span> 件装备显示“未感应到/未放入”。
     </div>
     <div style="background: rgba(255, 255, 255, 0.05); padding: 8px; border-radius: 4px; font-size: 12px; color: #aaa;">
       <p><strong>情况 1：</strong>如果您确实没带回来 —— 请点击 <span style="color:#ff4d4f">放弃/部分归还</span></p>
       <p style="margin-top:4px;"><strong>情况 2：</strong>如果您已放入但传感器故障 —— 请点击 <span style="color:#E6A23C">强制标记已还</span></p>
     </div>
   </div>`,
      '异常处理',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '强制标记为已还并保存', // 对应 confirm (处理坏传感器)
        cancelButtonText: '放弃 / 仅结算已还项', // 对应 cancel (进入二级判断)
        distinguishCancelAndClose: true,
        customClass: 'cyber-message-box warning-mode',
        center: true,
      },
    )
      .then(() => {
        // === 逻辑分支 1：用户坚持说都拿了 (强制修正传感器数据) ===
        activeBorrowList.value.forEach((item) => {
          if (!item.isReturned) item.isReturned = true
        })
        console.warn('用户执行了强制领用操作，忽略了传感器状态')
        finalizeBorrow()
      })
      .catch((action) => {
        // === 逻辑分支 2：用户点击了“放弃/部分领用” 或 关闭窗口 ===
        if (action === 'cancel') {
          // [新增关键逻辑] 检查手里是否已经拿了东西
          if (takenCount > 0) {
            // 拦截！不能直接关！
            handlePartialSettlement(takenCount)
          } else {
            // 真的一件都没拿，直接退出
            closeBorrowProcess()
            ElMessage.info('流程已取消，未发生领用')
          }
        }
      })
  }
}

// 辅助函数：处理部分领用结算 (修改后：支持退回指引)
const handlePartialSettlement = (count) => {
  ElMessageBox.confirm(
    `<div style="text-align: left;">
       <div style="color: #00f2ff; font-weight: bold; font-size: 15px; margin-bottom: 10px;">
         检测到您已放入 ${count} 件装备
       </div>
       <div style="color: #ccc; margin-bottom: 15px; font-size: 13px;">
         请选择您的下一步操作：
       </div>
       <div style="margin-bottom: 8px; padding: 8px; background: rgba(0, 242, 255, 0.05); border-radius: 4px;">
         <span style="color: #00f2ff; font-weight:bold;">方案 A (结算):</span>
         <div style="color:#8899a6; font-size:12px; margin-top: 2px;">
           也就是“部分归还”。系统将保存这 ${count} 件装备的归还记录，并结束流程。
         </div>
       </div>
       <div style="padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
         <span style="color: #fff; font-weight:bold;">方案 B (继续):</span>
         <div style="color:#8899a6; font-size:12px; margin-top: 2px;">
           我还有装备要还。请点击下方按钮，<strong>回到监控界面</strong>，继续放入装备。
         </div>
       </div>
     </div>`,
    '操作确认',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '结算已放入的装备',
      cancelButtonText: '继续归还',
      distinguishCancelAndClose: true,
      customClass: 'cyber-message-box',
      center: true,
    },
  )
    .then(() => {
      // === 用户选择 A：结算 ===
      finalizeBorrow()
    })
    .catch((action) => {
      // === 用户选择 B：退回装备 ===
      if (action === 'cancel') {
        // [关键修改] 这里不再调用 closeBorrowProcess()
        // 而是什么都不做，让 confirm 框关闭，从而露出底层的“监控弹窗”

        // 给用户一个提示，告诉他现在该干什么
        /*
        ElMessage({
          message: '请根据列表指示，将标有【已取出】的装备放回对应柜位',
          type: 'info',
          duration: 5000,
          offset: 100,
        })
        */
        audioStore.play('/audio/继续归还操作.mp3')

        // 此时：
        // 1. 监控弹窗 borrowProcessVisible 依然是 true
        // 2. 硬件轮询 startMonitorLoop 依然在运行
        // 3. 当用户把装备放回去时，checkItemRemoved 会变回 false
        // 4. item.isReturned 会自动变回 false (变回蓝色图标)
      }
    })
}

// 辅助函数：统一关闭流程
const closeBorrowProcess = () => {
  isPolling.value = false
  borrowProcessVisible.value = false
  audioStore.play('/audio/设置已中断.mp3')
  selectedIds.value = [] // 清空选中
}

// --- 生命周期 ---
onMounted(async () => {
  if (timerStore.isTimerActive) timerStore.stopInterval()
  await fetchConfigData()
  await getData()
  updateGlider()
})

onUnmounted(async () => {
  // 关灯
  await window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201,
      registerAddress: 12,
      value: 0,
      isWrite: true,
    },
  })
  isPolling.value = false
  if (!timerStore.isTimerActive) timerStore.startInterval()
})
</script>

<style>
/* --- [新增] 用途选择器样式 --- */
.reason-section {
  margin-bottom: 15px;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.reason-label {
  font-size: 12px;
  color: var(--primary);
  margin-bottom: 6px;
  font-weight: bold;
  letter-spacing: 1px;
}

/* ==========================================================
   [修复] 领用用途输入框背景色 (兼容新旧版 Element Plus)
   ========================================================== */
.cyber-select {
  width: 100%;
}

/* 1. 输入框本体背景与边框
   同时针对 .el-input__wrapper (旧版/通用) 和 .el-select__wrapper (新版Select) */
.cyber-select .el-input__wrapper,
.cyber-select .el-select__wrapper {
  background-color: rgba(20, 27, 45, 0.8) !important;
  /* 强制深色背景 */
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  /* 边框颜色 */
  transition: all 0.3s;
}

/* 2. 鼠标悬停 或 聚焦时的样式
   注意：新版使用 .is-focused，旧版使用 .is-focus */
.cyber-select .el-input__wrapper:hover,
.cyber-select .el-input__wrapper.is-focus,
.cyber-select .el-select__wrapper:hover,
.cyber-select .el-select__wrapper.is-focused {
  box-shadow: 0 0 0 1px var(--primary) inset !important;
  /* 聚焦高亮色 */
  background-color: rgba(0, 242, 255, 0.05) !important;
  /* 聚焦背景色 */
}

/* 3. 输入框内的文字颜色
   同时针对 .el-input__inner (旧版) 和 .el-select__selected-item (新版) */
.cyber-select .el-input__inner,
.cyber-select .el-select__selected-item {
  color: #fff !important;
  font-family: 'Segoe UI', sans-serif;
}

/* 4. 修复占位符 (Placeholder) 颜色 */
.cyber-select .el-input__inner::placeholder,
.cyber-select .el-select__placeholder {
  color: #8899a6 !important;
}

/* 下拉菜单 (注意：如果 popper-append-to-body 为 true，这部分可能需要写在全局样式里) */
.el-select-dropdown__item {
  color: #ccc;
}

.el-select-dropdown__item.selected {
  color: var(--primary);
  font-weight: bold;
}

.el-select-dropdown__item:hover {
  background-color: rgba(0, 242, 255, 0.1);
  color: #fff;
}

/* 覆盖 Popper 背景 */
.el-popper.is-light {
  background: #141b2d !important;
  border: 1px solid var(--primary-dark) !important;
}

.el-popper__arrow::before {
  background: #141b2d !important;
  border: 1px solid var(--primary-dark) !important;
}

/* 1. 在这里为弹窗重新定义变量 */
.cyber-dialog {
  --primary: #00f2ff;
  --primary-dark: #0099a1;
  --bg-dark: #0a0e17;
  --card-bg: #141b2d;
  --border: #2a3546;
  --text-main: #ffffff;
  --text-sec: #8899a6;
  --error: #ff4d4f;
  --success: #00ff9d;
}

/* 2. 覆盖 el-dialog 默认的白色背景和边框，并【强制垂直居中】 */
.cyber-dialog.el-dialog {
  background-color: var(--card-bg) !important;
  border: 1px solid var(--primary-dark) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8) !important;
  border-radius: 8px !important;
  margin-top: 0 !important;
  top: 50%;
  transform: translateY(-50%);
}

/* 3. 弹窗头部样式 */
.cyber-dialog .el-dialog__header {
  border-bottom: 1px solid var(--border);
  padding: 15px 20px;
  margin-right: 0;
  background: rgba(0, 0, 0, 0.2);
}

.cyber-dialog .el-dialog__title {
  color: var(--primary);
  font-size: 16px;
  font-weight: bold;
}

/* 4. 关闭按钮颜色 */
.cyber-dialog .el-dialog__headerbtn .el-dialog__close {
  color: var(--text-sec);
  font-size: 18px;
}

.cyber-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--error);
}

/* 5. 弹窗主体重置 */
.cyber-dialog .el-dialog__body {
  padding: 0 !important;
  color: var(--text-main);
  background: transparent !important;
}

/* 6. 针对全屏领用流程弹窗的特殊背景修正 */
.process-dialog.el-dialog {
  background-color: #0d121c !important;
}

/* ==========================================================
   赛博朋克风格 ElMessageBox 样式覆盖
   注意：此部分样式不能加 scoped，否则无法作用于 body 下的弹窗
   ========================================================== */

/* 1. 弹窗容器 */
.cyber-message-box.el-message-box {
  background-color: #141b2d !important;
  border: 1px solid #0099a1 !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(0, 242, 255, 0.05) !important;
  border-radius: 8px !important;
  padding-bottom: 50px !important;
  /* 修改点：加大宽度，或者设置为 auto 让它自适应内容 */
  width: 530px !important;
  max-width: 95vw;
}

/* 红色警告模式 */
.cyber-message-box.error-mode {
  border-color: #ff4d4f !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(255, 77, 79, 0.1) !important;
}

/* 黄色警告模式 */
.cyber-message-box.warning-mode {
  border-color: #e6a23c !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(230, 162, 60, 0.1) !important;
}

/* 2. 标题区 */
.cyber-message-box .el-message-box__header {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cyber-message-box .el-message-box__title {
  color: #fff !important;
  font-weight: bold;
  letter-spacing: 1px;
}

/* 3. 关闭按钮 */
.cyber-message-box .el-message-box__headerbtn .el-message-box__close {
  color: #8899a6 !important;
}

.cyber-message-box .el-message-box__headerbtn:hover .el-message-box__close {
  color: #00f2ff !important;
}

/* 4. 内容区 */
.cyber-message-box .el-message-box__content {
  color: #ccdbe8 !important;
  font-size: 14px;
  padding: 20px 25px !important;
  line-height: 1.6;
}

/* 5. 底部按钮区 */
.cyber-message-box .el-message-box__btns {
  padding: 10px 20px 0;
  display: flex;
  justify-content: center;
  gap: 15px;
}

/* 覆盖默认按钮样式 - 确认按钮 */
.cyber-message-box .el-button--primary {
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%) !important;
  border: 1px solid #00f2ff !important;
  color: #fff !important;
  border-radius: 4px;
  transition: all 0.3s;
  padding: 8px 20px;
}

.cyber-message-box .el-button--primary:hover {
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
  background: linear-gradient(90deg, #00b5bf 0%, #005f66 100%) !important;
}

/* 覆盖默认按钮样式 - 取消按钮 */
.cyber-message-box .el-button:not(.el-button--primary) {
  background: transparent !important;
  border: 1px solid #4a5c76 !important;
  color: #8899a6 !important;
}

.cyber-message-box .el-button:not(.el-button--primary):hover {
  color: #fff !important;
  border-color: #8899a6 !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

/* 针对 error-mode 的按钮特殊处理 */
.cyber-message-box.error-mode .el-button--primary {
  background: linear-gradient(90deg, #d32f2f 0%, #8b0000 100%) !important;
  border-color: #ff4d4f !important;
}

.cyber-message-box.error-mode .el-button--primary:hover {
  box-shadow: 0 0 15px rgba(255, 77, 79, 0.4);
}

/* 针对 warning-mode 的按钮特殊处理 (强制标记为已取) */
.cyber-message-box.warning-mode .el-button--primary {
  background: linear-gradient(90deg, #e6a23c 0%, #b88230 100%) !important;
  border-color: #ffda8e !important;
  color: #000 !important;
  /* 黄底黑字更易读 */
  font-weight: bold;
}
</style>

<style scoped>
/* 全局主题变量 */
.theme-dark {
  --primary: #00f2ff;
  --primary-dark: #0099a1;
  --success: #00ff9d;
  --error: #ff4d4f;
  --bg-dark: #0a0e17;
  --card-bg: #141b2d;
  --border: #2a3546;
  --active-bg: #1c2538;
  --text-main: #ffffff;
  --text-sec: #8899a6;
  --shadow-glow: 0 0 10px rgba(0, 242, 255, 0.2);
}

.page-container {
  width: 100%;
  height: 100vh;
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* ================= 顶部栏 ================= */
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

.primary-icon {
  color: var(--primary);
}

.title-text h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 1px;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
}

.sub-title {
  color: var(--primary-dark);
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

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

/* ================= 主体区域 ================= */
.main-body {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

/* --- 左侧列表 --- */
.list-section {
  flex: 1;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.section-title {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
}

.title-left {
  font-size: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
}

.text-glow {
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
}

.selection-count {
  font-size: 12px;
  color: var(--bg-dark);
  background: var(--primary);
  padding: 1px 6px;
  border-radius: 2px;
  font-weight: bold;
}

.highlight-num {
  color: #000;
  font-size: 14px;
}

.filter-tabs {
  position: relative;
  display: flex;
  background: #0d121c;
  padding: 3px;
  border-radius: 4px;
  border: 1px solid var(--border);
  z-index: 1;
}

.tab-glider {
  position: absolute;
  top: 3px;
  left: 0;
  height: calc(100% - 6px);
  background: var(--active-bg);
  border: 1px solid var(--border);
  border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 1;
  pointer-events: none;
}

.tab {
  position: relative;
  z-index: 2;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-sec);
  cursor: pointer;
  border-radius: 2px;
  transition: color 0.3s;
  border: 1px solid transparent;
  user-select: none;
}

.tab:hover {
  color: #fff;
}

.tab.active {
  color: var(--primary);
  text-shadow: 0 0 0.5px currentColor;
  background: transparent;
  border-color: transparent;
}

.scroll-area {
  flex: 1;
  padding: 15px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.no-data-tip {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-sec);
  padding: 40px;
  font-size: 14px;
  border: 1px dashed var(--border);
  border-radius: 8px;
}

/* === 卡片样式 === */
.equip-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 145px;
  overflow: hidden;
}

.equip-card:hover {
  background: var(--active-bg);
  border-color: #4a5c76;
}

.equip-card.active {
  background-color: rgba(0, 242, 255, 0.05);
  border: 1px solid var(--primary);
  box-shadow: inset 0 0 20px rgba(0, 242, 255, 0.1);
}

.equip-card.active .active-bar {
  transform: scaleX(1);
}

.active-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary);
  box-shadow: 0 -2px 10px var(--primary);
  transform: scaleX(0);
  transition: transform 0.3s;
}

.check-ribbon {
  position: absolute;
  right: 0;
  top: 0;
  width: 0;
  height: 0;
  border-top: 32px solid var(--primary);
  border-left: 32px solid transparent;
  z-index: 2;
}

.check-ribbon .el-icon {
  position: absolute;
  top: -30px;
  left: -18px;
  color: #000;
  font-weight: bold;
  font-size: 14px;
}

.card-status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  z-index: 1;
}

.st-in {
  color: var(--success);
  background: rgba(0, 255, 157, 0.15);
  border: 1px solid rgba(0, 255, 157, 0.3);
}

.st-out {
  color: var(--text-sec);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #444;
}

.equip-card.status-out {
  opacity: 0.6;
}

.card-icon {
  margin-bottom: 5px;
}

.icon-active {
  color: var(--primary);
  filter: drop-shadow(0 0 5px var(--primary-dark));
}

.icon-locked {
  color: #444;
}

.equip-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.equip-code {
  font-size: 11px;
  color: var(--text-sec);
  font-family: 'Consolas', monospace;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-all;
  line-height: 1.4;
  height: 2.8em;
}

.equip-pos {
  font-size: 12px;
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 3px;
}

/* --- 右侧操作面板 --- */
.operation-section {
  flex: 0 0 360px;
  width: 360px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.empty-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-sec);
}

.icon-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 2px dashed var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--border);
  margin-bottom: 15px;
}

.empty-text {
  font-size: 18px;
  color: #fff;
  margin-bottom: 4px;
}

.empty-sub {
  font-size: 12px;
  opacity: 0.5;
}

.detail-card,
.batch-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.btn-text-action {
  background: none;
  border: 1px solid var(--primary-dark);
  color: var(--primary);
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 2px;
  white-space: nowrap;
}

.btn-text-action:hover {
  background: rgba(0, 242, 255, 0.1);
}

.btn-text-action.danger {
  border-color: var(--error);
  color: var(--error);
}

.btn-text-action.danger:hover {
  background: rgba(255, 77, 79, 0.1);
}

.detail-header,
.batch-header {
  padding: 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: rgba(0, 0, 0, 0.2);
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  margin-right: 15px;
}

.big-name {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary);
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
  line-height: 1.2;
}

.batch-title {
  font-size: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 4px;
}

.status-tag-large {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 4px;
  font-weight: bold;
  align-self: flex-start;
}

.info-table {
  padding: 15px 20px;
  background-color: transparent;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row .label {
  color: var(--text-sec);
  font-size: 13px;
  min-width: 70px;
}

.info-row .value {
  color: #fff;
  font-size: 14px;
  word-break: break-all;
  white-space: normal;
}

.info-row .value.highlight {
  color: var(--primary);
  font-family: 'Consolas';
}

.font-mono {
  font-family: monospace;
  letter-spacing: 1px;
}

.remark-area {
  flex: 1;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.area-title {
  color: var(--text-sec);
  font-size: 12px;
  margin-bottom: 8px;
}

.remark-content {
  flex: 1;
  background: #0d121c;
  border: 1px solid var(--border);
  padding: 10px;
  color: #ccc;
  font-size: 12px;
  line-height: 1.5;

  /* --- 核心布局修正 --- */
  overflow-y: auto;
  /* 允许上下滚动 */
  overflow-x: hidden;
  /* 禁止左右滚动 */
  word-break: break-all;
  /* 强制长单词换行 */
  white-space: pre-wrap;
  /* 保留换行符并自动换行 */
}

/* === 自定义滚动条样式 === */
.remark-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.remark-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.remark-content::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
  transition: all 0.3s;
}

.remark-content::-webkit-scrollbar-thumb:hover {
  background: var(--primary-dark);
  box-shadow: 0 0 5px var(--primary);
  cursor: pointer;
}

.batch-summary {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
}

.summary-item {
  flex: 1;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  padding: 8px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.summary-item .num {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.summary-item .txt {
  font-size: 11px;
  color: var(--text-sec);
  margin-top: 2px;
}

.summary-item.success .num {
  color: var(--success);
}

.summary-item.warning .num {
  color: #e6a23c;
}

.batch-list-scroll {
  flex: 1;
  background: transparent;
}

.batch-list {
  padding: 0 20px;
}

.batch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 10px;
}

.item-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.item-left .b-name {
  color: #fff;
  font-size: 14px;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-left .b-code {
  color: var(--text-sec);
  font-size: 12px;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 60px;
  display: block;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-icon-view {
  background: none;
  border: none;
  color: var(--primary-dark);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
}

.btn-icon-view:hover {
  color: var(--primary);
  transform: scale(1.1);
}

.b-pos {
  color: var(--primary);
  font-size: 12px;
}

.mini-tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
}

.btn-icon-remove {
  background: none;
  border: none;
  color: var(--text-sec);
  cursor: pointer;
  padding: 2px;
}

.btn-icon-remove:hover {
  color: var(--error);
}

.batch-warning {
  background: rgba(230, 162, 60, 0.1);
  color: #e6a23c;
  padding: 6px;
  font-size: 11px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 1px solid rgba(230, 162, 60, 0.3);
}

.action-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
}

.cyber-btn {
  width: 100%;
  height: 50px;
  background: linear-gradient(90deg, var(--primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--primary);
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}

.cyber-btn:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.4);
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.cyber-btn.disabled {
  background: #1f2636;
  border-color: #444;
  color: #666;
  cursor: not-allowed;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 100%;
  position: relative;
  z-index: 2;
}

.text-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.btn-main-text {
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 1px;
}

.btn-sub-text {
  font-size: 9px;
  opacity: 0.7;
  letter-spacing: 1px;
  margin-top: 2px;
}

.scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transform: skewX(-20deg);
  animation: btnScan 3s infinite;
  z-index: 1;
}

@keyframes btnScan {
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

/* ==========================================================
   弹窗内部的具体内容样式 (保持 Scoped)
   ========================================================== */
.detail-card-modal {
  display: flex;
  flex-direction: column;
}

.detail-header-modal {
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid #2a3546;
}

.big-name-modal {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.remark-area-modal {
  padding: 15px 20px;
  background: #0a0e17;
  border-top: 1px solid #2a3546;
  height: 180px;
  display: flex;
  flex-direction: column;
}

/* 领用流程监控内容 */
.process-container {
  background: #0d121c;
  padding: 20px;
  color: #fff;
  min-height: 450px;
  display: flex;
  flex-direction: column;
}

.process-header {
  text-align: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #333;
  padding-bottom: 15px;
}

.p-title {
  font-size: 20px;
  color: var(--primary);
  font-weight: bold;
}

.p-sub {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

/* 扫描动画条 */
.scan-anim-box {
  height: 2px;
  width: 100%;
  background: #222;
  position: relative;
  overflow: hidden;
  margin-bottom: 15px;
}

.scanner {
  width: 30%;
  height: 100%;
  background: linear-gradient(90deg, transparent, var(--primary), transparent);
  position: absolute;
  animation: scanMove 2s infinite linear;
}

@keyframes scanMove {
  0% {
    left: -30%;
  }

  100% {
    left: 100%;
  }
}

.monitor-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  /* 增加：防止横向滚动 */
  margin-bottom: 20px;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  max-height: 300px;
}

/* === 复用自定义滚动条样式 (monitor-list) === */
.monitor-list::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.monitor-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.monitor-list::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
  transition: all 0.3s;
}

.monitor-list::-webkit-scrollbar-thumb:hover {
  background: var(--primary-dark);
  box-shadow: 0 0 5px var(--primary);
  cursor: pointer;
}

.m-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.m-item.taken {
  background: rgba(0, 255, 157, 0.1);
}

.m-item.error-shake {
  background: rgba(255, 77, 79, 0.1);
  animation: shake 0.5s;
  border: 1px solid var(--error);
}

.m-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.m-info-group {
  display: flex;
  flex-direction: column;
}

.m-name {
  font-size: 14px;
}

.m-addr {
  font-size: 11px;
  color: #666;
}

.m-status {
  font-size: 12px;
  color: #888;
}

.pulse-icon {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

.process-footer {
  text-align: center;
  border-top: 1px solid #333;
  padding-top: 20px;
}

.status-summary {
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

/* 修改后：增加 Flex 布局以保证图标与文字垂直居中对齐 */
.success-text {
  color: var(--success);
  display: flex;
  align-items: center;
  /* 垂直居中 */
  justify-content: center;
  /* 水平居中 (针对 footer 这种居中场景) */
  gap: 5px;
  /* 图标和文字的间距 */
}

.error-text {
  color: var(--error);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.processing-text {
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

/* 按钮样式优化 */
.finish-btn {
  background: linear-gradient(90deg, var(--primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--primary);
  font-size: 22px;
  letter-spacing: 2px;
  font-weight: bold;
  text-shadow: 0 0 8px rgba(0, 242, 255, 0.6);
  height: 60px;
  transition: all 0.3s;
}

.finish-btn:hover {
  box-shadow: 0 0 25px rgba(0, 242, 255, 0.5);
  background: linear-gradient(90deg, #00b5bf 0%, #005f66 100%);
}

/* [修改点] 禁用状态下的按钮样式 */
.finish-btn.disabled-state {
  background: #2a3546;
  border-color: #4a5c76;
  color: #666;
  cursor: not-allowed;
  box-shadow: none;
  text-shadow: none;
}

.finish-btn.disabled-state:hover {
  background: #2a3546;
  box-shadow: none;
}

/* [修改点] 关门提示文字动画 */
.door-warning-anim {
  color: #e6a23c;
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  animation: pulseText 2s infinite;
}

@keyframes pulseText {
  0% {
    opacity: 0.6;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.6;
  }
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>

<style>
/* ...保留你原有的非 scoped 样式... */

/* ==========================================================
   [修复] 下拉菜单赛博朋克风格覆盖
   使用 popper-class="cyber-dropdown" 定向覆盖
   ========================================================== */

/* 1. 下拉框容器背景和边框 */
.el-popper.cyber-dropdown {
  background: #141b2d !important;
  /* 深蓝背景 */
  border: 1px solid #0099a1 !important;
  /* 青色边框 */
}

/* 2. 隐藏原有的小箭头或者给它改色 */
.el-popper.cyber-dropdown .el-popper__arrow::before {
  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
}

/* 3. 下拉选项的基础样式 */
.cyber-dropdown .el-select-dropdown__item {
  color: #ccc !important;
  /* 默认文字颜色 */
  background: transparent !important;
  /* [关键] 去除默认白色背景 */
}

/* 4. [核心修复] 鼠标悬停 或 键盘聚焦(第一项默认) 的样式 */
.cyber-dropdown .el-select-dropdown__item.hover,
.cyber-dropdown .el-select-dropdown__item:hover {
  background-color: rgba(0, 242, 255, 0.15) !important;
  /* 半透明青色背景 */
  color: #fff !important;
}

/* 5. 选中项的样式 */
.cyber-dropdown .el-select-dropdown__item.selected {
  color: #00f2ff !important;
  /* 选中文字高亮 */
  background-color: rgba(0, 242, 255, 0.05) !important;
  font-weight: bold;
}
</style>

<style>
/* 1. 之前是 .status-out，现在改为 .status-disabled */
.equip-card.status-disabled {
  opacity: 0.5;
  /* 让在位的装备看起来不可操作 */
  background: rgba(0, 0, 0, 0.2);
  border-color: #333;
}

/* 禁用/变灰状态 (在位) */
.st-in-place-disabled {
  color: #666;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #444;
  box-shadow: none;
}

.st-out-active {
  color: var(--primary);
  /* 青色 */
  background: rgba(0, 242, 255, 0.15);
  border: 1px solid rgba(0, 242, 255, 0.3);
  box-shadow: 0 0 5px rgba(0, 242, 255, 0.2);
  /* 增加一点过渡效果 */
  transition: all 0.3s;
}

/* 3. 选中效果保持不变，但要确保它能覆盖 disabled 样式 */
.equip-card.active {
  opacity: 1 !important;
  /* 选中时恢复不透明 */
  background-color: rgba(0, 242, 255, 0.05) !important;
  border: 1px solid var(--primary) !important;
}

/* 4. 修改 import 图标 */
/* 确保在 script 中引入了 SoldOut 或 Upload 之类的图标用于表示归还 */
</style>

<style>
/* ==========================================================
   [修复] 针对“在位”但在选中状态下的特殊样式修正
   ========================================================== */

/* 当卡片同时具备 active (选中) 和 status-disabled (在位/禁用) 时 */
.equip-card.active.status-disabled {
  /* 1. 将边框颜色改为暗淡的蓝灰色，而不是高亮的青色 */
  border-color: #4a5c76 !important;

  /* 2. 去掉选中时的发光阴影，减少视觉抢眼度 */
  box-shadow: none !important;

  /* 3. 背景色稍微调暗一点 */
  background-color: rgba(255, 255, 255, 0.08) !important;
}

/* 同时，把右上角的“对钩”角标背景也变暗，不然角标会很亮 */
.equip-card.active.status-disabled .check-ribbon {
  border-top-color: #4a5c76 !important;
}

/* 如果想让角标里的对钩图标也变暗一点（可选） */
.equip-card.active.status-disabled .check-ribbon .el-icon {
  color: #aaa !important;
}
</style>

<style>
.manual-confirm-btn {
  background: rgba(230, 162, 60, 0.2);
  border: 1px solid #e6a23c;
  color: #e6a23c;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.manual-confirm-btn:hover {
  background: rgba(230, 162, 60, 0.4);
  transform: scale(1.05);
}
</style>
