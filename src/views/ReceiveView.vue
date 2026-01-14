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
          <h1>装备领用</h1>
          <span class="sub-title">智能感知 · 实时物联 · 智慧监管</span>
        </div>
      </div>

      <div class="header-right">
        <!-- 新增：快捷领用按钮 -->
        <button class="btn-open-door" @click="handleManualOpenDoor">
          <el-icon>
            <Unlock />
          </el-icon>
          快捷领用
        </button>

        <button class="btn-exit" @click="handleSafeExit">
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
            <span v-for="(tab, index) in filterOptions" :key="tab.value" class="tab"
              :class="{ active: currentFilter === tab.value }" :ref="(el) => (tabRefs[index] = el)"
              @click="setFilter(tab.value)">
              {{ tab.label }}
            </span>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid">
            <div v-for="item in filteredList" :key="item.id" class="equip-card" :class="{
              active: selectedIds.includes(item.id),
              'borrow-card-removed': item.group_status !== '在位',
            }" @click="toggleSelect(item.id)">
              <div class="check-ribbon" v-if="selectedIds.includes(item.id)">
                <el-icon>
                  <Check />
                </el-icon>
              </div>

              <div class="card-status-badge" :class="item.group_status === '在位' ? 'st-in' : 'borrow-tag-removed'">
                {{ item.group_status }}
              </div>

              <!-- 装备大图展示区 -->
              <div class="equip-image-preview">
                <el-image :src="item.group_image" fit="cover" style="width: 100%; height: 100%">
                  <!-- 指定加载时的占位 -->
                  <template #placeholder>
                    <div style="background: #0d121c; width: 100%; height: 100%"></div>
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
            <div class="empty-sub">选择装备或直接点击上方“快捷领用”</div>
          </div>
        </template>

        <!-- 场景2：单选详情 -->
        <template v-else-if="selectedIds.length === 1">
          <div class="detail-card">
            <div class="detail-header">
              <div class="header-title-group">
                <div class="big-name">{{ singleItem.group_name }}</div>
                <div class="status-tag-large"
                  :class="singleItem.group_status === '在位' ? 'st-in' : 'borrow-tag-removed'">
                  {{ singleItem.group_status }}
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
                <span class="value">{{ singleItem.self_address }} 号位 /
                  {{ singleItem.lock_self_address === 1 ? '上柜' : '下柜' }}</span>
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
              <button class="cyber-btn" :class="{ disabled: singleItem.group_status !== '在位' }"
                :disabled="singleItem.group_status !== '在位'" @click="handleStartBorrowProcess">
                <div class="btn-content">
                  <el-icon :size="24" v-if="singleItem.group_status === '在位'">
                    <Unlock />
                  </el-icon>
                  <el-icon :size="24" v-else>
                    <CircleCloseFilled />
                  </el-icon>
                  <div class="text-group">
                    <span class="btn-main-text">{{
                      singleItem.group_status === '在位' ? '立即领用' : '不可领用'
                      }}</span>
                    <span class="btn-sub-text">{{
                      singleItem.group_status === '在位'
                        ? '操作溯源 · 异常监控'
                        : '装备已取出 · 禁止操作'
                    }}</span>
                  </div>
                </div>
                <div class="scan-line" v-if="singleItem.group_status === '在位'"></div>
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
                <span class="txt">可领用</span>
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
                    <button class="btn-icon-view" @click.stop="openDetailModal(item)" title="查看详情">
                      <el-icon>
                        <View />
                      </el-icon>
                    </button>
                    <span class="mini-tag" :class="item.group_status === '在位' ? 'st-in' : 'borrow-tag-removed'">
                      {{ item.group_status }}
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
                系统将自动跳过 {{ selectedItems.length - validItemsCount }} 个不可用装备
              </div>

              <button class="cyber-btn" :class="{ disabled: validItemsCount === 0 }" :disabled="validItemsCount === 0"
                @click="handleStartBorrowProcess">
                <div class="btn-content">
                  <el-icon :size="24">
                    <Collection />
                  </el-icon>
                  <div class="text-group">
                    <span class="btn-main-text">批量领用 ({{ validItemsCount }}项)</span>
                    <span class="btn-sub-text">操作溯源 · 异常监控</span>
                  </div>
                </div>
                <div class="scan-line" v-if="validItemsCount > 0"></div>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- 详情查看弹窗 (只读) -->
      <el-dialog v-model="detailVisible" title="装备详情概览" width="400px" class="cyber-dialog" :append-to-body="true"
        :destroy-on-close="true">
        <div class="detail-card-modal">
          <div class="detail-header-modal">
            <div class="big-name-modal">{{ viewingItem.group_name }}</div>
            <div class="status-tag-large" :class="viewingItem.group_status === '在位' ? 'st-in' : 'st-out'">
              {{ viewingItem.group_status }}
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
      <el-dialog v-model="borrowProcessVisible" :show-close="false" :close-on-click-modal="false" width="600px"
        class="cyber-dialog process-dialog" center :append-to-body="true">
        <div class="process-container" :class="{ 'mode-maintenance': currentProcessMode === 'MAINTENANCE' }">
          <!-- 标题区：动态文案 -->
          <div class="process-header">
            <div class="p-title">
              {{ currentProcessMode === 'BORROW' ? '正在领用装备' : '柜内维护/检修' }}
            </div>
            <div class="p-sub">
              {{
                currentProcessMode === 'BORROW'
                  ? '柜门已打开，请取走选中的装备'
                  : '柜门已打开，请进行清洁或检修，完成后请关门'
              }}
            </div>
          </div>

          <!-- 动画指示器 -->
          <div class="scan-anim-box">
            <div class="scanner"></div>
          </div>

          <!-- 实时列表 -->
          <div class="monitor-list">
            <div v-if="activeBorrowList.length === 0" class="maintenance-tip">
              <el-icon :size="40" color="#E6A23C">
                <Tools />
              </el-icon>
              <div class="tip-text">当前处于手动维护/检修模式</div>
              <!--
              <div class="tip-sub">系统已开启安全监控，请勿随意移动柜内装备</div>
            -->
            </div>
            <!-- 待领取的正确装备 -->
            <div v-for="item in activeBorrowList" :key="'target-' + item.id" class="m-item"
              :class="{ taken: item.isTaken }">
              <div class="m-left">
                <!-- 情况1：已经取出了 (无论是自动感应还是手动点击) -->
                <el-icon v-if="item.isTaken" color="#00ff9d" :size="20">
                  <Check />
                </el-icon>

                <!-- 情况2：还没取出，且传感器是好的 -> 显示雷达动画等待感应 -->
                <el-icon v-else-if="!isSensorDisabled(item.self_address)" class="pulse-icon" color="#00f2ff" :size="20">
                  <Location />
                </el-icon>

                <!-- 情况3：还没取出，但传感器坏了/禁用了 -> 显示维修图标 -->
                <el-icon v-else color="#E6A23C" :size="20">
                  <Tools />
                </el-icon>

                <div class="m-item-thumb">
                  <el-image :src="item.group_image" fit="cover">
                    <!-- 加载过程中的背景：设为深色 -->
                    <template #placeholder>
                      <div class="thumb-placeholder-bg"></div>
                    </template>
                    <!-- 加载失败或无图的显示：深色背景 + 图标 -->
                    <template #error>
                      <div class="thumb-err">
                        <el-icon :size="18">
                          <Box />
                        </el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>

                <div class="m-info-group">
                  <span class="m-name">{{ item.group_name }}</span>
                  <span class="m-addr">
                    位置: {{ item.self_address }}号
                    <span v-if="isSensorDisabled(item.self_address)"
                      style="color: #e6a23c; font-size: 13px; margin-left: 5px">(传感器已禁用)</span>
                  </span>
                </div>
              </div>

              <!-- 右侧状态栏 -->
              <div class="m-status">
                <!-- 状态A: 已取出 -->
                <span v-if="item.isTaken" class="success-text">已取出</span>

                <!-- 状态B: 传感器坏了/禁用 -> 显示手动按钮 -->
                <button v-else-if="isSensorDisabled(item.self_address)" class="manual-confirm-btn"
                  @click="manualConfirmTaken(item)">
                  <el-icon>
                    <Pointer />
                  </el-icon>
                  确认取出
                </button>

                <!-- 状态C: 正常等待感应 -->
                <span v-else>等待取出...</span>
              </div>
            </div>

            <!-- 报警区域：检测到拿错的装备 -->
            <div v-for="errItem in wrongTakenList" :key="'wrong-' + errItem.id" class="m-item error-shake">
              <div class="m-left">
                <el-icon color="#ff4d4f" :size="24">
                  <Warning />
                </el-icon>

                <div class="m-item-thumb error-border">
                  <el-image :src="errItem.group_image" fit="cover">
                    <template #placeholder>
                      <div class="thumb-placeholder-bg"></div>
                    </template>
                    <template #error>
                      <div class="thumb-err">
                        <el-icon :size="18">
                          <Box />
                        </el-icon>
                      </div>
                    </template>
                  </el-image>
                </div>

                <div class="m-info-group">
                  <span class="m-name" style="color: #ff4d4f">误拿警告: {{ errItem.group_name }}</span>
                  <span class="m-addr" style="color: #ff8888">位置: {{ errItem.self_address }}号</span>
                </div>
              </div>
              <div class="m-status error-text">误拿请放回</div>
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
            <div v-if="remainingCount === 0 && wrongTakenList.length === 0 && !areDoorsClosed"
              class="door-warning-anim">
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
              <button v-if="remainingCount === 0 && wrongTakenList.length === 0" class="cyber-btn finish-btn"
                :class="{ 'disabled-state': !areDoorsClosed }" :disabled="!areDoorsClosed" @click="finalizeBorrow">
                <!----建议：目前的“手动点击完成”更安全，因为有时候传感器会因为风吹或者抖动瞬间闭合又断开，
                      自动完成可能会在用户还没完全确认时就提交了。保留手动点击按钮是更稳健的选择。-->
                <span v-if="areDoorsClosed">确认已关门并完成</span>
                <span v-else>等待关门...</span>
              </button>

              <!-- 紧急停止/人工干预 -->
              <button class="btn-text-action danger"
                style="margin-top: 15px; margin-left: auto; font-size: 14px; margin-right: auto"
                @click="forceExitProcess">
                人工强制结束
              </button>
            </div>
          </div>
        </div>
      </el-dialog>

      <!-- ================= [新增] 专门的用途确认弹窗 ================= -->
      <el-dialog v-model="reasonDialogVisible" title="请选择或输入本次操作的用途" width="550px"
        class="cyber-dialog cyber-dialog-reason" :class="{ 'is-keyboard-open': showKeyboard }"
        :close-on-click-modal="false" destroy-on-close @close="handleCloseReasonDialog">
        <div class="reason-modal-content">
          <!-- 1. 快捷选项卡片网格 -->
          <div class="reason-card-grid">
            <div v-for="opt in quickReasons" :key="opt.value" class="reason-card"
              :class="{ active: borrowReason === opt.value }" @click="selectQuickReason(opt.value)">
              <!-- 修改点：使用 el-icon 包装动态组件 -->
              <el-icon class="card-icon" :size="28">
                <component :is="opt.icon" />
              </el-icon>
              <span class="card-label">{{ opt.label }}</span>
              <div class="active-dot"></div>
            </div>
          </div>

          <!-- 2. 自定义输入区 -->
          <div class="custom-input-section">
            <div class="section-divider">
              <span>或者输入自定义详细用途</span>
            </div>
            <el-input v-model="borrowReason" placeholder="在此输入自定义详细用途..." class="cyber-custom-input"
              @focus="openKeyboard('default', 'borrowReason', $event)" @click="updateCursorPos"
              @keyup="updateCursorPos">
              <template #prefix>
                <el-icon>
                  <EditPen />
                </el-icon>
              </template>
            </el-input>
          </div>
        </div>

        <template #footer>
          <div class="reason-footer">
            <button class="footer-btn cancel" @click="cancelReasonDialog">取消</button>
            <button class="footer-btn confirm" :class="{ disabled: !borrowReason }" :disabled="!borrowReason"
              @click="confirmReasonAndOpen">
              <el-icon>
                <Unlock />
              </el-icon>
              确认开门
            </button>
          </div>
        </template>
      </el-dialog>
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
import {
  defineAsyncComponent,
  ref,
  computed,
  onMounted,
  onUnmounted,
  nextTick,
  watch,
  reactive,
  toRaw,
} from 'vue'
import {
  Box,
  SwitchButton,
  Location,
  // Files,
  // Lock,
  Unlock,
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
  Tools,
  Pointer,
  // InfoFilled,
  Aim,
  Checked,
  Monitor,
  Promotion,
  EditPen,
  Memo,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useTimerStore } from '@/stores/timerStore'
import { useAudioStore } from '@/stores/audioStore'
import { useConfigStore } from '@/stores/configStore'
import { useRouter } from 'vue-router'
const router = useRouter()
import plugins from '../assets/js/plugin'

import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()

// 用于累积用户操作足迹
const operationTrace = ref([])

/**
 * 内部辅助函数：记录操作足迹（仅存入数组，不发请求）
*/
/**
 * 内部辅助函数：记录操作足迹（仅存入数组，不发请求）
 */
const trace = (message) => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timeNow = `${hours}:${minutes}:${seconds}` // 格式为 14:48:46

  operationTrace.value.push(`[${timeNow}] ${message}`)
}

// 快捷用途配置
const quickReasons = [
  { label: '作战演训', value: '作战演训', icon: Aim },
  { label: '检修保养', value: '检修保养', icon: Tools },
  { label: '日常勤务', value: '日常勤务', icon: Promotion },
  { label: '公差外带', value: '公差外带', icon: Memo },
  { label: '调拨轮换', value: '调拨轮换', icon: Checked },
  { label: '巡检抽查', value: '巡检抽查', icon: Monitor },
]

// 选择用途时
const selectQuickReason = (val) => {
  borrowReason.value = val
  audioStore.play('/audio/按钮点击声.mp3')
  trace(`选择用途: ${val}`)
}
// 统一处理用途弹窗的取消/关闭
const handleCloseReasonDialog = () => {
  reasonDialogVisible.value = false
  if (showKeyboard.value) {
    showKeyboard.value = false
  }
}
// 新增一个专门的取消函数（用于取消按钮）
const cancelReasonDialog = () => {
  handleCloseReasonDialog()
}

const timerStore = useTimerStore()
const audioStore = useAudioStore()
const configStore = useConfigStore()
// 辅助：判断是否禁用
const isSensorDisabled = (address) => {
  if (!config_blob.value?.switch?.details) return false
  const conf = config_blob.value.switch.details.find((d) => d.self_address == address)
  // 兼容数字和字符串类型的判断
  return conf && (conf.admin_status == 0 || conf.admin_status === '0')
}

// 1. 新增一个控制变量
const reasonDialogVisible = ref(false)

// 动作：手动确认取出
const manualConfirmTaken = (item) => {
  // 直接修改状态
  item.isTaken = true
  // 播放一个音效，给用户正向反馈
  audioStore.play('/audio/按钮点击声.mp3')

  // 触发一次逻辑检查（比如看看是不是所有东西都拿完了，好触发关门提示）
  // 因为 startMonitorLoop 是异步轮询的，这里改了状态，下一次轮询自然会捕捉到 activeBorrowList 的变化
}
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
  { label: '在位 (可借)', value: 'IN' },
  { label: '已取出', value: 'OUT' },
]

// --- 动画与 Ref ---
const tabsContainer = ref(null)
const tabRefs = ref([])
const gliderStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 })

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
  return selectedItems.value.filter((item) => item.group_status === '在位').length
})

// 剩余未取的数量
const remainingCount = computed(() => {
  return activeBorrowList.value.filter((i) => !i.isTaken).length
})

// 2. 键盘相关状态变量
const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard_black.vue'))
const showKeyboard = ref(false)
const currentInputValue = ref('')
const currentLayout = ref('default')
const activeField = ref('')
const cursorIndex = ref(0)
const activeInputDom = ref(null)
const keyboardPosition = ref({
  bottom: '0px',
  width: '100%',
  left: '0px',
  position: 'fixed',
  'z-index': 9999,
})

// 3. 键盘核心方法
const openKeyboard = (layout, fieldName, event) => {
  activeField.value = fieldName
  currentInputValue.value = borrowReason.value || '' // 绑定到领用用途
  currentLayout.value = layout
  showKeyboard.value = true

  if (event && event.target) {
    // 处理 el-select 内部 input 的情况
    const inputEl =
      event.target.tagName === 'INPUT' ? event.target : event.target.querySelector('input')
    activeInputDom.value = inputEl
    cursorIndex.value = inputEl.selectionStart || currentInputValue.value.length

    nextTick(() => {
      inputEl.focus()
      inputEl.setSelectionRange(cursorIndex.value, cursorIndex.value)
    })
  }
}

const updateCursorPos = (event) => {
  const inputEl =
    event.target.tagName === 'INPUT' ? event.target : event.target.querySelector('input')
  if (inputEl) {
    cursorIndex.value = inputEl.selectionStart
    activeInputDom.value = inputEl
    console.log('光标位置已记录:', cursorIndex.value)
  }
}

const handleKeyPress = (button) => {
  if (button === '{close}' || button === '{submit}') {
    showKeyboard.value = false
    if (activeInputDom.value) activeInputDom.value.blur()
  }
}

// 监听键盘输入同步到 borrowReason
// 修改后的 watch 逻辑
watch(currentInputValue, (newValue, oldValue) => {
  if (showKeyboard.value && activeField.value === 'borrowReason') {
    // 1. 更新数据
    borrowReason.value = newValue

    // 2. 计算光标应该移动多少位 (新长度 - 旧长度)
    const oldLength = (oldValue || '').length
    const newLength = (newValue || '').length
    const diff = newLength - oldLength

    // 3. 动态更新光标记录位置
    cursorIndex.value += diff

    // 边界处理：防止光标越界
    if (cursorIndex.value < 0) cursorIndex.value = 0
    if (cursorIndex.value > newLength) cursorIndex.value = newLength

    // 4. 强制设定 DOM 光标位置
    nextTick(() => {
      if (activeInputDom.value) {
        activeInputDom.value.focus()
        activeInputDom.value.setSelectionRange(cursorIndex.value, cursorIndex.value)
      }
    })
  }
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

// 修改过滤器时
const setFilter = (filterType) => {
  currentFilter.value = filterType
  const label = filterOptions.find(o => o.value === filterType)?.label
  trace(`切换过滤器为: ${label}`)
}

watch(currentFilter, () => {
  updateGlider()
})

// 选中/取消选中时
// 选中/取消选中时
const toggleSelect = (id) => {
  audioStore.play(`/audio/按钮点击声.mp3`)
  const index = selectedIds.value.indexOf(id)
  const item = equipmentList.value.find(e => e.id === id)

  // 预设日志显示的名称和编号
  const itemInfo = item ? `${item.group_name} [编号:${item.group_code}]` : `未知装备(ID:${id})`

  if (index === -1) {
    selectedIds.value.push(id)
    trace(`选中装备: ${itemInfo}`)
  } else {
    selectedIds.value.splice(index, 1)
    trace(`取消选中: ${itemInfo}`)
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

// 查看详情时
const openDetailModal = (item) => {
  viewingItem.value = item
  detailVisible.value = true
  trace(`查看详情: ${item.group_name}`)
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
// 1. 确保引入了 Unlock 图标
// import { ..., Unlock } from '@element-plus/icons-vue'

// --- 逻辑控制变量 ---
const isManualFullOpen = ref(false) // 标记：是否为“快捷领用”模式（打开所有锁）
// 1. 【调整】快捷领用按钮触发
const handleManualOpenDoor = () => {
  isManualFullOpen.value = true // 标记为：全开模式
  trace(`点击“快捷领用”按钮`)
  borrowReason.value = ''
  audioStore.play('/audio/请选择装备领用用途.mp3')
  reasonDialogVisible.value = true
}
// 3. 弹窗点击确认后的逻辑
const confirmReasonAndOpen = () => {
  if (!borrowReason.value) return
  reasonDialogVisible.value = false
  executeActualOpenDoor() // 此函数会处理：有选中则领用，没选中则进入维护/全部模式
}
// 在变量定义区添加
const currentProcessMode = ref('BORROW') // 'BORROW' 或 'MAINTENANCE'

// 4. 【核心重构】合并并增强执行逻辑
const executeActualOpenDoor = async () => {
  let targets = []
  let isMaintenanceMode = false

  // --- A. 确定监控目标 ---
  if (isManualFullOpen.value) {
    // 【全开模式】：目标是列表里所有在位的装备
    targets = equipmentList.value.filter((item) => item.group_status === '在位')
    if (targets.length === 0) {
      isMaintenanceMode = true
      currentProcessMode.value = 'MAINTENANCE'
    } else {
      currentProcessMode.value = 'BORROW'
    }
  } else {
    // 【精准领用模式】：目标仅为选中的在位装备
    targets = selectedItems.value.filter((item) => item.group_status === '在位')
    currentProcessMode.value = 'BORROW'
  }

  // --- B. 初始化数据状态 (合并 handleStartBorrowProcess 的初始化逻辑) ---
  activeBorrowList.value = targets.map((item) => ({ ...item, isTaken: false }))
  wrongTakenList.value = []

  const targetIds = targets.map((i) => i.id)
  // 计算哪些是在位但“不该拿”的装备 (用于误拿报警)
  allInPlaceItems.value = equipmentList.value.filter(
    (item) => item.group_status === '在位' && !targetIds.includes(item.id),
  )

  borrowProcessVisible.value = true
  isPolling.value = true
  areDoorsClosed.value = false
  hasPlayedCloseDoorPrompt.value = false

  // --- C. 硬件操作：根据模式决定开锁范围 ---
  try {
    const uniqueLockAddresses = new Set()

    if (isManualFullOpen.value || isMaintenanceMode) {
      // 【全开/维护模式】：获取配置中所有的锁地址
      if (config_blob.value?.lock?.details) {
        config_blob.value.lock.details.forEach((l) => {
          if (l.open_lock_register_address) uniqueLockAddresses.add(l.open_lock_register_address)
        })
      }
    } else {
      // 【精准领用模式】：只获取选中装备对应的锁地址
      targets.forEach((item) => {
        const addr = getLockRegisterAddress(item)
        if (addr) uniqueLockAddresses.add(addr)
      })
    }

    // 执行开锁音效
    audioStore.play('/audio/柜门已打开请取出装备.mp3')

    // 循环发送开锁指令
    for (const lockRegister of uniqueLockAddresses) {
      await window.electronAPI.el_post({
        action: 'control_register',
        payload: {
          deviceAddress: 201,
          registerAddress: lockRegister,
          value: 80,
          isWrite: true,
        },
      })
      await new Promise((r) => setTimeout(r, 200)) // 适当缩短间隔提高响应感
    }

    // 统一亮灯
    await window.electronAPI.el_post({
      action: 'control_register',
      payload: { deviceAddress: 201, registerAddress: 12, value: 900000, isWrite: true },
    })

    startMonitorLoop()
  } catch (error) {
    console.error('流程执行异常:', error)
    // ElMessage.error('硬件响应超时，请重试')
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
// 核心逻辑：安全退出 (直接执行版)
// =================================================================

const handleSafeExit = async () => {
  // 1. 阻断：如果当前正在进行领用流程
  if (borrowProcessVisible.value) {
    ElMessageBox.alert(
      '当前正在进行领用操作，请先完成操作或点击“人工强制结束”关闭流程后再退出。',
      '操作受限',
      {
        type: 'warning',
        customClass: 'cyber-message-box warning-mode',
        confirmButtonText: '知道了',
      },
    )
    return
  }

  // 2. 初次检查 (显示 Loading)
  const loading = ElLoading.service({
    lock: true,
    text: '正在扫描所有柜门状态...',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  let isAllClosed = false
  try {
    isAllClosed = await checkGlobalDoorStatus()
  } catch (e) {
    console.error('Exit check failed:', e)
    isAllClosed = true // 硬件报错时允许通行
  }
  loading.close()

  // 场景 A: 门直接就是关的 -> 安全退出
  if (isAllClosed) {
    router.push('/')
    return
  }

  // 场景 B: 门没关 -> 启动“智能等待”
  audioStore.play('/audio/安全警告检测到柜门未关闭.mp3')

  // --- 状态控制标志 ---
  let stopPolling = false // 控制循环结束
  let isAutoAction = false // 标记是否由硬件触发（防止catch块重复处理）

  // --- 定义后台轮询任务 ---
  const startPollingLoop = async () => {
    while (!stopPolling) {
      try {
        // 等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (stopPolling) break

        const closedNow = await checkGlobalDoorStatus()
        console.log('closedNow:', closedNow)

        if (closedNow) {
          // ==========================================
          // [关键修改]：检测通过后，直接在这里执行跳转
          // ==========================================
          console.log('硬件检测通过，执行自动跳转...')
          isAutoAction = true // 标记一下，告诉下面的 catch 别管闲事
          stopPolling = true

          // 1. 播放成功音效
          // audioStore.play('/audio/柜门已关闭.mp3')

          // 2. 先销毁弹窗 (纯视觉清理)
          ElMessageBox.close()

          // 3. 立即跳转 (不再依赖 catch)
          router.push('/')
          break
        }
      } catch (e) {
        console.error('Polling error:', e)
      }
    }
  }

  // --- 启动轮询 ---
  startPollingLoop()

  // --- 显示 UI 并等待用户交互 ---
  try {
    const htmlContent = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px 0;">
        <div style="margin-bottom: 20px; filter: drop-shadow(0 0 8px rgba(255, 77, 79, 0.4));">
          <svg viewBox="0 0 1024 1024" width="60" height="60" style="color: #ff4d4f;">
             <path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 192a58.432 58.432 0 0 0-58.24 63.744l23.36 256.384a35.072 35.072 0 0 0 69.76 0l23.296-256.384A58.432 58.432 0 0 0 512 256zm0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4z"></path>
          </svg>
        </div>
        <div style="color: #ff4d4f; font-weight: bold; font-size: 20px; letter-spacing: 1px; margin-bottom: 15px;">
          检测到柜门未关闭
        </div>
        <div style="background: rgba(0, 242, 255, 0.08); border: 1px solid rgba(0, 242, 255, 0.2); padding: 15px 25px; border-radius: 6px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
           <svg viewBox="0 0 1024 1024" width="20" height="20" style="color: #00f2ff; animation: rotating 2s linear infinite;">
             <path fill="currentColor" d="M512 64c53.333333 0 106.666667 10.666667 160 32s96 53.333333 128 85.333333 53.333333 74.666667 74.666667 128 32 106.666667 32 160s-10.666667 106.666667-32 160-53.333333 96-85.333333 128-74.666667 53.333333-128 74.666667-106.666667 32-160 32-106.666667-10.666667-160-32-96-53.333333-128-85.333333-53.333333-74.666667-74.666667-128-32-106.666667-32-160 10.666667-106.666667 32-160 53.333333-96 85.333333-128 74.666667-53.333333 128-74.666667 106.666667-32 160-32m0-64C229.226667 0 0 229.226667 0 512s229.226667 512 512 512 512-229.226667 512-512S794.773333 0 512 0z"></path>
           </svg>
           <span style="color: #00f2ff; font-size: 14px; font-weight: bold;">
             <Loading />请关闭柜门，系统检测后将自动退出...
           </span>
        </div>
        <div style="color: #666; font-size: 12px;">
          如果传感器故障，可点击下方按钮强制退出
        </div>
      </div>
    `

    // 这里会卡住，等待用户点击按钮 OR 被代码关闭
    await ElMessageBox.confirm(htmlContent, '安全阻断', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '忽视风险，强制退出',
      showCancelButton: false,
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      confirmButtonClass: 'el-button--danger',
      customClass: 'cyber-message-box error-mode',
      center: true,
    })

    // 路径 1: 用户点击了“强制退出”按钮 (Promise Resolved)
    stopPolling = true
    console.log('用户点击强制退出')
    router.push('/')
  } catch (action) {
    // 路径 2: 弹窗被关闭 (被上面的 ElMessageBox.close() 触发)
    stopPolling = true

    // 如果是我们的代码自动触发的关闭，这里什么都不用做，因为跳转已经在循环里做了
    if (isAutoAction) {
      console.log('捕获到自动关闭动作，catch 块无需处理')
      return
    }

    console.log('异常关闭:', action)
  }
}

// --- 新增：全局检测所有柜门状态 ---
// 这个函数不依赖于 activeBorrowList，而是直接扫描配置中存在的所有锁板
const checkGlobalDoorStatus = async () => {
  // 如果没有配置锁，直接放行
  if (!config_blob.value?.lock?.details) return true

  // 1. 获取所有涉及到锁控板通道 (去重)
  // 假设锁控板是 Device 201，我们需要知道使用了哪些通道
  // 根据你的代码逻辑，channel 1 -> index 6, channel 2 -> index 7
  const usedChannels = new Set()
  config_blob.value.lock.details.forEach((lock) => {
    if (lock.channel_address) usedChannels.add(lock.channel_address)
  })

  try {
    // 2. 读取锁控板全部状态 (Device 201)
    const res = await window.electronAPI.el_post({
      action: 'read_all_inputs',
      payload: {
        deviceAddress: 201,
        startAddress: 0x0000,
        registerCount: 10,
      },
    })

    if (res && res.success && res.data && res.data.length >= 8) {
      // 3. 遍历所有配置过的通道进行检查
      for (const channel of usedChannels) {
        let dataIndex = -1
        if (channel === 1) dataIndex = 6
        if (channel === 2) dataIndex = 7

        // 如果读取到的值为 0 (假设 0=开, 1=关)，则返回 false
        if (dataIndex !== -1 && res.data[dataIndex] === 0) {
          return false // 发现至少有一个门没关
        }
      }
      return true // 所有门都关好了
    }
    // 如果读取失败，为了安全起见，通常返回 false (阻止退出) 或者 true (放行但报错)
    // 建议返回 false 强迫用户检查
    return false
  } catch (e) {
    console.error('全局门锁状态读取失败', e)
    return false
  }
}
// =================================================================
// 核心业务：领用流程 (Handle Borrow Process)
// =================================================================

// 1. 启动领用流程
// 2. 【调整】右下角“立即领用/批量领用”按钮触发
const handleStartBorrowProcess = () => {
  // 校验是否有选中的在位装备
  const itemsToBorrow = selectedItems.value.filter((item) => item.group_status === '在位')
  if (itemsToBorrow.length === 0) {
    audioStore.play('/audio/没有可领用的装备选中.mp3')
    return
  }

  isManualFullOpen.value = false // 标记为：精准领用模式（仅开选中的锁）
  borrowReason.value = ''
  audioStore.play('/audio/请选择装备领用用途.mp3')
  reasonDialogVisible.value = true
}
/*
const handleStartBorrowProcess = async () => {
  const itemsToBorrow = selectedItems.value.filter((item) => item.group_status === '在位')

  if (itemsToBorrow.length === 0) {
    audioStore.play('/audio/没有可领用的装备选中.mp3')
    return
  }

  // B. 逻辑对齐：像快捷领用一样，先清空用途并弹出确认框
  borrowReason.value = ''
  audioStore.play('/audio/请选择装备领用用途.mp3')
  reasonDialogVisible.value = true

  // 1.1 初始化状态
  activeBorrowList.value = itemsToBorrow.map((item) => ({
    ...item,
    isTaken: false,
  }))
  wrongTakenList.value = []

  // 1.2 记录其他在位的装备
  const targetIds = itemsToBorrow.map((i) => i.id)
  allInPlaceItems.value = equipmentList.value.filter(
    (item) => item.group_status === '在位' && !targetIds.includes(item.id),
  )

  // 1.3 打开全屏监控弹窗
  borrowProcessVisible.value = true
  isPolling.value = true
  areDoorsClosed.value = false // [修改点] 流程开始，重置门状态为未关闭
  hasPlayedCloseDoorPrompt.value = false // [新增] 重置语音锁

  // 1.4 发送开锁指令
  try {
    audioStore.play('/audio/柜门已打开请取出装备.mp3')

    const uniqueLockAddresses = new Set()
    itemsToBorrow.forEach((item) => {
      const addr = getLockRegisterAddress(item)
      if (addr) {
        uniqueLockAddresses.add(addr)
      }
    })

    for (const lockRegister of uniqueLockAddresses) {
      await window.electronAPI.el_post({
        action: 'control_register',
        payload: {
          deviceAddress: 201, // 锁控板地址
          registerAddress: lockRegister,
          value: 50, // 脉冲时间
          isWrite: true,
        },
      })
      // 开灯
      await window.electronAPI.el_post({
        action: 'control_register',
        payload: {
          deviceAddress: 201,
          registerAddress: 12,
          value: 900000,
          isWrite: true,
        },
      })
      await new Promise((r) => setTimeout(r, 200))
    }
  } catch (e) {
    console.error('部分柜门可能未打开，请检查', e)
  }

  // 1.5 启动硬件轮询
  startMonitorLoop()
}
*/

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
/*
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
*/

// 2. 硬件轮询循环
const startMonitorLoop = async () => {
  while (isPolling.value) {
    try {
      // ================= Phase 1: 物品状态检测 =================

      // A. 读取所有微动开关硬件状态
      await updateAllHardwareStatus()

      // B. 检查【目标装备】是否已取出
      for (const target of activeBorrowList.value) {
        const isRemoved = checkItemRemoved(target)
        // 状态防抖：只有状态改变时才更新和播放音效
        if (isRemoved && !target.isTaken) {
          target.isTaken = true
          audioStore.play('/audio/拿对提示音.mp3')
        } else if (!isRemoved && target.isTaken) {
          // 只有传感器是【好的/启用的】，才允许系统自动把状态改回 false
          if (!isSensorDisabled(target.self_address)) {
            target.isTaken = false
          }
        }
      }

      // C. 检查【在位装备】是否被误拿
      const currentWrongList = []
      for (const safeItem of allInPlaceItems.value) {
        const isRemoved = checkItemRemoved(safeItem)
        if (isRemoved) {
          currentWrongList.push(safeItem)
        }
      }

      // 误拿报警触发
      if (currentWrongList.length > wrongTakenList.value.length) {
        audioStore.play('/audio/拿错提示音.mp3')
      }
      wrongTakenList.value = currentWrongList

      // ================= Phase 2: 门锁状态检测 =================

      // 核心逻辑修改：
      // 只有满足：1. 剩余待取数量为0 (remainingCount == 0)
      // 且 2. 误拿数量为0 (wrongTakenList.length == 0)
      // 才开始检测门锁

      const allItemsTaken = activeBorrowList.value.every((i) => i.isTaken)
      const noErrors = wrongTakenList.value.length === 0

      if (allItemsTaken && noErrors) {
        // [新增] 播放“请关闭柜门”语音 (只播一次)
        if (!hasPlayedCloseDoorPrompt.value) {
          audioStore.play('/audio/所有装备已取出请关闭柜门.mp3') // 请确保文件名正确
          hasPlayedCloseDoorPrompt.value = true
        }

        // 满足条件，开始检测门锁
        // areDoorsClosed.value = await checkDoorStatus()
        // --- 修改点：这里改用 checkGlobalDoorStatus 而不是 checkDoorStatus ---
        // checkGlobalDoorStatus 会检查配置中所有的门，不论你还了哪个柜子的装备
        areDoorsClosed.value = await checkGlobalDoorStatus()

        // 可选：如果门关了，可以自动触发完成，或者等待用户点击按钮
        // 如果想自动完成，可以在这里判断：
        if (areDoorsClosed.value) {
          // 增加一个 500ms 的二次确认（防抖），防止传感器瞬时跳变
          await new Promise((r) => setTimeout(r, 500))
          const doubleCheck = await checkGlobalDoorStatus()
          if (doubleCheck) {
            await finalizeBorrow()
            return
          }
        }
      } else {
        // 如果用户又把东西放回去了，重置语音锁，以便下次取出时再次提醒
        if (!allItemsTaken) {
          hasPlayedCloseDoorPrompt.value = false
        }
        // 如果物品还没取完，或者有错误，强制认为门没好（或者不关心门的状态）
        // 这样 UI 上的“完成”按钮就会一直处于禁用或等待状态
        areDoorsClosed.value = false
      }

      // 轮询间隔
      await new Promise((r) => setTimeout(r, 500))
    } catch (e) {
      console.error('监控循环异常', e)
      await new Promise((r) => setTimeout(r, 1000))
    }
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

// 修改后的 checkItemRemoved 函数
const checkItemRemoved = (item) => {
  // 1. 获取配置
  let switchConfig = null
  if (config_blob.value?.switch?.details) {
    switchConfig = config_blob.value.switch.details.find((d) => d.self_address == item.self_address)
  }

  // 2. 如果传感器被禁用 (admin_status == 0)
  if (switchConfig && (switchConfig.admin_status == 0 || switchConfig.admin_status === '0')) {
    // 【关键】：这里永远返回 false。
    // 意味着：
    // 1. 作为背景装备时，它永远不会触发"误拿"（符合预期）。
    // 2. 作为目标装备时，它永远不会"自动变绿"，我们需要在 UI 上给用户一个手动按钮（见下一步）。
    return false
  }

  // 3. 正常硬件逻辑
  const status = realtimeSwitchMap[item.self_address]
  if (status === undefined) return false
  return status === 0
}

// 3. 确认完成并保存
const finalizeBorrow = async () => {
  // 停止硬件轮询并开启加载状态
  isPolling.value = false
  el_loading.value = true

  // await new Promise((resolve) => setTimeout(resolve, 10000)) // 模拟延迟

  // 1. 从 authStore 中获取验证通过的人员名单
  // 假设我们将所有验证人的名字拼在一起存入数据库
  const verifiedUsers = authStore.verifiedUsers || []

  // 生成记录姓名：例如 "张三, 李四"
  const operatorNames =
    verifiedUsers.length > 0 ? verifiedUsers.map((u) => u.real_name).join(', ') : '系统管理员' // 兜底方案

  const operatorIdCards =
    verifiedUsers.length > 0
      ? verifiedUsers.map((u) => u.id_card).join(', ')
      : 'SYSTEM_ADMIN_BYPASS'

  // 生成标准的 YYYY-MM-DD HH:mm:ss 格式
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const timeNow = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

  try {
    // 【修改点 1】：增加判断。只有当领用列表不为空时，才执行数据库写入
    if (activeBorrowList.value.length > 0) {
      for (const item of activeBorrowList.value) {
        if (item.isTaken) {
          // A. 插入领用记录
          await window.electronAPI.el_post({
            action: 'insert',
            payload: {
              tableName: 'borrow_records',
              setValues: {
                terminal_id: configStore.terminal?.terminal_id || 'UNKNOWN',
                equipment_id: item.id,
                group_code: item.group_code,
                group_name: item.group_name,
                // --- 这里使用动态获取的姓名和身份证 ---
                username: operatorNames,
                id_card: operatorIdCards,
                // ----------------------------------
                borrow_time: timeNow,
                status: 0, // 0 = 未归还
                is_synced: 0,
                remark: borrowReason.value,
              },
            },
          })

          // B. 更新装备状态为“已取出”
          await window.electronAPI.el_post({
            action: 'update',
            payload: {
              tableName: 'equipment',
              setValues: { group_status: '已取出' },
              condition: `id = ${item.id}`,
            },
          })
        }
      }
      // 领用成功音效
      audioStore.play('/audio/领用完成数据已保存.mp3')
    } else {
      // 【修改点 2】：如果是空列表（维护模式）
      console.log('没有领用任何装备')
    }

    // --- 公共收尾逻辑 ---
    borrowReason.value = ''
    borrowProcessVisible.value = false
    selectedIds.value = []

    // 统一跳转：无论是领用还是维护，完成后均返回首页
    if (activeBorrowList.value.length === 0) {
      // ElMessage.success('维护操作已记录')
    }

    setTimeout(() => {
      router.replace('/')
    }, 50)
    // 所有数据库操作完成后，在这里统一清空
    borrowReason.value = ''
    borrowProcessVisible.value = false
  } catch (e) {
    audioStore.play('/audio/数据保存失败请联系管理员.mp3')
    console.error('结算失败:', e)
  } finally {
    el_loading.value = false
  }
}

// 4. 人工强制结束 (已修改：允许跳过传感器故障导致的报警)
const forceExitProcess = async () => {
  // ================= Step 1: 误拿/传感器故障处理 =================
  if (wrongTakenList.value.length > 0) {
    try {
      await ElMessageBox.confirm(
        `<div style="text-align: left;">
           <div style="color: #ff4d4f; font-weight: bold; font-size: 16px; margin-bottom: 10px;">
             <el-icon><WarningFilled /></el-icon> 检测到 ${wrongTakenList.value.length} 件装备异常离位
           </div>
           <div style="background: rgba(255, 77, 79, 0.1); border: 1px solid #ff4d4f; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
             <span style="color: #ffccc7; font-size: 13px;">系统检测到未选中的装备被取出。</span>
           </div>
           <div style="font-size: 13px; color: #ccc;">
             <p><strong>情况 A (真实误拿)：</strong>请立即将报警装备放回原位。</p>
             <p style="margin-top:8px;"><strong>情况 B (开关损坏)：</strong>如果装备实际都在位，但传感器误报，请点击 <span style="color:#E6A23C; font-weight:bold;">[强制忽略故障]</span> 继续。</p>
           </div>
         </div>`,
        '异常状态确认',
        {
          dangerouslyUseHTMLString: true,
          confirmButtonText: '强制忽略故障 (传感器已坏)', // 对应 try
          cancelButtonText: '我再去检查一下', // 对应 catch
          confirmButtonClass: 'el-button--warning',
          distinguishCancelAndClose: true,
          customClass: 'cyber-message-box error-mode',
          center: true,
        },
      )

      // === 用户选择了“强制忽略故障” ===
      // 1. 停止轮询，防止下一秒硬件又把报警状态写回来
      isPolling.value = false

      // 2. 清空误拿列表，假装它们都在位
      wrongTakenList.value = []

      // 3. 继续向下执行结算逻辑...
    } catch (action) {
      console.log('用户选择了取消或关闭，不做任何操作，继续留在监控界面:', action)
      // 用户选择了取消或关闭，不做任何操作，继续留在监控界面
      return
    }
  }

  // ================= Step 2: 正常/异常流程判断 =================
  // 注意：此时已通过了上面的“误拿阻断”检查

  const allItemsTaken = activeBorrowList.value.every((i) => i.isTaken)
  const takenCount = activeBorrowList.value.filter((i) => i.isTaken).length
  const remainingNum = activeBorrowList.value.length - takenCount

  // 场景A：全部取走 (且无误拿/误拿已被忽略)
  if (allItemsTaken) {
    secureFinalize('NORMAL')
  }
  // 场景B：还有物品未取出 (或者传感器坏了显示未取出)
  else {
    ElMessageBox.confirm(
      `<div style="text-align: left;">
         <div style="color: #E6A23C; font-weight: bold; font-size: 15px; margin-bottom: 10px;">
           <i class="el-icon-warning"></i> 领用未完成确认
         </div>
         <div style="color: #ccc; margin-bottom: 8px;">
           仍有 <span style="color: #E6A23C; font-size: 16px; font-weight: bold;">${remainingNum}</span> 件装备显示“未取出”。
         </div>
         <div style="background: rgba(255, 255, 255, 0.05); padding: 8px; border-radius: 4px; font-size: 13px; color: #aaa;">
           <p><strong>情况 1：</strong>如果您确实没有取出 / 不想领了 —— 请点击 <span style="color:#00f2ff">放弃/部分领用</span></p>
           <p style="margin-top:4px;"><strong>情况 2：</strong>如果您已全部取出(传感器故障) —— 请点击 <span style="color:#E6A23C">强制标记全取</span></p>
         </div>
       </div>`,
      '结算确认',
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '强制标记为已取并保存', // 对应 confirm (处理坏传感器-拿不出来)
        cancelButtonText: '放弃 / 仅结算已取项', // 对应 cancel (进入二级判断)
        distinguishCancelAndClose: true,
        customClass: 'cyber-message-box warning-mode',
        center: true,
      },
    )
      .then(() => {
        // === 逻辑分支 1：强制全部领用 ===
        isPolling.value = false // 再次确保停止轮询
        activeBorrowList.value.forEach((item) => {
          if (!item.isTaken) item.isTaken = true
        })
        console.warn('用户执行了强制领用操作')
        secureFinalize('FORCE')
      })
      .catch((action) => {
        // === 逻辑分支 2：放弃/部分领用 ===
        if (action === 'cancel') {
          if (takenCount > 0) {
            handlePartialSettlement(takenCount)
          } else {
            closeBorrowProcess()
            audioStore.play('/audio/流程已取消未发生领用.mp3')
          }
        }
      })
  }
}

// entryType: 'NORMAL'(正常), 'FORCE'(强制全取), 'PARTIAL'(部分结算)
// --- 修改后的安全提交包装器 (While循环版) ---
// 逻辑：门没关 -> 弹窗提示(只有强制按钮) + 后台循环检测 -> 门关了自动提交 OR 用户点强制提交
const secureFinalize = async (entryType = 'NORMAL') => {
  console.log('entryType:', entryType)

  // 1. 初次检查 (Loading)
  const loading = ElLoading.service({
    lock: true,
    text: '正在检查柜门闭合状态...',
    background: 'rgba(0, 0, 0, 0.7)',
  })

  let isAllClosed = false
  try {
    isAllClosed = await checkGlobalDoorStatus()
  } catch (e) {
    console.error(e)
  }
  loading.close()

  // 场景 A: 门直接就是关的 -> 马上完成
  if (isAllClosed) {
    await finalizeBorrow()
    return
  }

  // 场景 B: 门没关 -> 启动“智能等待”模式
  audioStore.play('/audio/安全警告检测到柜门未关闭.mp3')

  // --- 状态控制标志 ---
  let stopPolling = false // 控制循环结束
  let isAutoAction = false // 标记是否由硬件触发（防止catch块重复处理）

  // --- 定义后台轮询任务 (仿照 handleSafeExit 的模式) ---
  const startPollingLoop = async () => {
    while (!stopPolling) {
      try {
        // 等待 1 秒
        await new Promise((resolve) => setTimeout(resolve, 1000))

        if (stopPolling) break

        const closedNow = await checkGlobalDoorStatus()

        if (closedNow) {
          console.log('检测到柜门关闭，自动提交...')
          isAutoAction = true // 标记自动动作
          stopPolling = true // 停止后续循环

          // 1. 在这里直接执行业务提交，确保顺序
          await finalizeBorrow()

          // 2. 编程方式关闭当前的 MessageBox (这会触发下面的 catch)
          ElMessageBox.close()
          break
        }
      } catch (e) {
        console.error('Polling error:', e)
        // 报错不中断循环，等待下一次重试
      }
    }
  }

  // --- 启动轮询 ---
  startPollingLoop()

  // --- 弹出警告框 (UI 线程挂起等待) ---
  try {
    const htmlContent = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 5px 0;">

        <!-- 1. 警告大图标 -->
        <div style="margin-bottom: 20px; filter: drop-shadow(0 0 8px rgba(255, 77, 79, 0.4));">
          <svg viewBox="0 0 1024 1024" width="60" height="60" style="color: #ff4d4f;">
            <path fill="currentColor" d="M512 64a448 448 0 1 1 0 896 448 448 0 0 1 0-896zm0 192a58.432 58.432 0 0 0-58.24 63.744l23.36 256.384a35.072 35.072 0 0 0 69.76 0l23.296-256.384A58.432 58.432 0 0 0 512 256zm0 512a51.2 51.2 0 1 0 0-102.4 51.2 51.2 0 0 0 0 102.4z"></path>
          </svg>
        </div>

        <!-- 2. 主标题 -->
        <div style="color: #ff4d4f; font-weight: bold; font-size: 20px; letter-spacing: 1px; margin-bottom: 20px;">
          检测到柜门未关闭
        </div>

        <!-- 3. 动态等待状态框 -->
        <div style="background: rgba(0, 242, 255, 0.08); border: 1px solid rgba(0, 242, 255, 0.2); padding: 15px 25px; border-radius: 6px; display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
           <svg viewBox="0 0 1024 1024" width="20" height="20" style="color: #00f2ff; animation: rotating 2s linear infinite;">
             <path fill="currentColor" d="M512 64c53.333333 0 106.666667 10.666667 160 32s96 53.333333 128 85.333333 53.333333 74.666667 74.666667 128 32 106.666667 32 160s-10.666667 106.666667-32 160-53.333333 96-85.333333 128-74.666667 53.333333-128 74.666667-106.666667 32-160 32-106.666667-10.666667-160-32-96-53.333333-128-85.333333-53.333333-74.666667-74.666667-128-32-106.666667-32-160 10.666667-106.666667 32-160 53.333333-96 85.333333-128 74.666667-53.333333 128-74.666667 106.666667-32 160-32m0-64C229.226667 0 0 229.226667 0 512s229.226667 512 512 512 512-229.226667 512-512S794.773333 0 512 0z"></path>
           </svg>
           <span style="color: #00f2ff; font-size: 15px; font-weight: bold; text-shadow: 0 0 5px rgba(0, 242, 255, 0.3);">系统正在等待柜门关闭...</span>
        </div>

        <!-- 4. 辅助说明 -->
        <div style="color: #8899a6; font-size: 12px; margin-bottom: 25px;">
          检测到关闭信号后，将自动提交并结束流程
        </div>

        <!-- 5. 底部故障提示 -->
        <div style="width: 100%; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px; color: #666; font-size: 12px;">
          如果门磁传感器发生故障，您可以点击下方按钮强制完成
        </div>
      </div>
    `
    // 等待用户点击
    await ElMessageBox.confirm(htmlContent, '安全检测', {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '忽视风险，强制执行',
      showCancelButton: false,
      showClose: false,
      closeOnClickModal: false,
      closeOnPressEscape: false,
      confirmButtonClass: 'el-button--danger',
      customClass: 'cyber-message-box error-mode',
      center: true,
    })

    // ============================================
    // 路径 1: 用户失去了耐心，手动点击了“强制执行”
    // ============================================
    stopPolling = true // 停止后台轮询
    console.log('用户手动点击强制执行')
    await finalizeBorrow()
  } catch (action) {
    // ============================================
    // 路径 2: 弹窗被关闭 (通常是被循环里的 ElMessageBox.close() 触发)
    // ============================================
    stopPolling = true // 确保轮询停止

    // 检查是否是自动触发的
    if (isAutoAction) {
      console.log('自动检测流程已完成提交，无需操作')
      return
    }

    // 如果未来有其他关闭弹窗的情况，可以在这里处理
    console.log('弹窗异常关闭:', action)
  }
}
// 辅助函数：处理部分领用结算 (修改后：支持退回指引)
const handlePartialSettlement = (count) => {
  ElMessageBox.confirm(
    `<div style="text-align: left;">
       <div style="color: #00f2ff; font-weight: bold; font-size: 15px; margin-bottom: 10px;">
         检测到您已取出 ${count} 件装备
       </div>
       <div style="color: #ccc; margin-bottom: 15px; font-size: 13px;">
         请选择您的下一步操作：
       </div>
       <div style="margin-bottom: 8px; padding: 8px; background: rgba(0, 242, 255, 0.05); border-radius: 4px;">
         <span style="color: #00f2ff; font-weight:bold;">方案 A (结算):</span>
         <div style="color:#8899a6; font-size:12px; margin-top: 2px;">
           也就是“部分领用”。系统将保存这 ${count} 件装备的取出记录，并结束流程。
         </div>
       </div>
       <div style="padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px;">
         <span style="color: #fff; font-weight:bold;">方案 B (退回):</span>
         <div style="color:#8899a6; font-size:12px; margin-top: 2px;">
           我不想取了。请点击下方按钮，<strong>回到监控界面</strong>，根据指引将装备放回原位。
         </div>
       </div>
     </div>`,
    '操作确认',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '结算已取出的装备', // 对应 Confirm
      cancelButtonText: '退回装备 (查看位置)', // 对应 Cancel (修改点)
      distinguishCancelAndClose: true,
      customClass: 'cyber-message-box',
      center: true,
    },
  )
    .then(() => {
      // [新增] 只要决定提交数据，必须立刻停止轮询，防止状态被硬件覆盖
      isPolling.value = false
      // === 用户选择 A：结算 ===
      // finalizeBorrow()
      // [修复点 3] 替换 finalizeBorrow()，传入 PARTIAL 标记
      secureFinalize('PARTIAL')
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
        offset: 100
      })
      */
        audioStore.play('/audio/请根据列表指示将装备放回.mp3') // 建议添加此音效

        // 此时：
        // 1. 监控弹窗 borrowProcessVisible 依然是 true
        // 2. 硬件轮询 startMonitorLoop 依然在运行
        // 3. 当用户把装备放回去时，checkItemRemoved 会变回 false
        // 4. item.isTaken 会自动变回 false (变回蓝色图标)
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
  console.log('users:', toRaw(authStore.verifiedUsers))
  if (timerStore.isTimerActive) timerStore.stopInterval()
  await fetchConfigData()
  await getData()
  updateGlider()
  plugins.logUserAction('点击事件', `登录装备领用页面`, {})
})
/**
 * 汇总并提交本次页面的操作日志摘要
 */
const submitSessionLog = () => {
  // 如果没有操作痕迹，则不提交
  if (operationTrace.value.length === 0) return

  // 1. 整理摘要字符串
  const sessionSummary = operationTrace.value.join('\n')

  // 2. 获取当前用户信息（从 authStore 提取）
  const userNames = authStore.verifiedUsers.length > 0
    ? authStore.verifiedUsers.map(u => u.real_name).join(', ')
    : '系统管理员'

  const userIdCards = authStore.verifiedUsers.length > 0
    ? authStore.verifiedUsers.map(u => u.id_card).join(', ')
    : 'SYSTEM'

  // 3. 调用插件方法写入数据库 logs 表
  // 参数1: action, 参数2: description, 参数3: extraData
  plugins.logUserAction(
    '装备领用',
    sessionSummary,
    {
      username: userNames,
      id_card: userIdCards,
      log_level: '普通',
      // description: sessionSummary // 将详细轨迹存入描述字段
    }
  )

  // 4. 提交后清空队列，防止重复提交
  operationTrace.value = []
}
onUnmounted(async () => {
  // 1. 提交操作摘要日志
  submitSessionLog()

  // 2. 硬件控制：关灯
  await window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201,
      registerAddress: 12,
      value: 0,
      isWrite: true,
    },
  })

  // 3. 清理状态
  authStore.clearAuth()
  isPolling.value = false

  // 4. 恢复全局定时器（如果有）
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
/*
.cyber-dialog .el-dialog__header {

  border-bottom: 1px solid var(--border);
  padding: 15px 20px;
  margin-right: 0;
  background: rgba(0, 0, 0, 0.2);

}
*/
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
/* 修改后 */
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
  gap: 15px;

  /* === 新增/修改这三行核心代码 === */
  flex-direction: row !important;
  /* 强制水平方向 */
  flex-wrap: nowrap !important;
  /* 强制禁止换行 */
  justify-content: center;
  /* =========================== */
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
  font-size: 12px;
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
  /*padding: 12px 12px;*/
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 220px;
  /* 增加高度 */
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
  left: 8px;
  /* 从 right 改为 left */
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: bold;
  z-index: 5;
  /* 确保在图片之上 */
}

/* 装备图片区域样式 */
.equip-image-preview {
  width: 100%;
  height: 120px;
  /* 固定图片高度 */
  background: #000;
  border-bottom: 1px solid var(--border);
}

.equip-image-preview :deep(.el-image__inner) {
  /* 确保图片加载前不显示白色 */
  background-color: transparent !important;
}

.equip-image-preview :deep(.el-image__placeholder),
.equip-image-preview :deep(.el-image__wrapper) {
  background-color: #0d121c !important;
  /* 跟你的卡片背景色一致 */
}

.image-error-slot {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  background: #0d121c;
}

/* 调整文字信息区的间距 */
.card-info {
  padding: 10px 12px;
  /* 给文字留出内边距 */
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.st-in {
  color: var(--success);
  background: rgba(0, 255, 157, 0.15);
  border: 1px solid rgba(0, 255, 157, 0.3);
}

.st-out {
  color: #666;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #444;
  box-shadow: none;
}

.equip-card.status-out {
  opacity: 0.6;
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
  font-size: 12px;
  color: var(--text-sec);
  font-family: 'Consolas', monospace;
  margin-bottom: 6px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  /* 保留原有属性 */
  line-clamp: 2;
  /* 添加标准属性 */
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
  font-size: 12px;
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
  font-size: 12px;
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
  /*border-bottom: 1px solid #333;*/
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
  padding: 10px 12px;
  /* 稍微减小上下 padding，增加紧凑感 */
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
  font-size: 13px;
  color: #666;
}

.m-status {
  font-size: 12px;
  color: #888;
}

/* ==========================================================
   监控列表缩略图样式优化
   ========================================================== */
.m-item-thumb {
  width: 90px;
  /* 宽度设为 90px */
  height: 65px;
  /* 高度设为 55px */
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border);
  background: #0d121c;
  /* 默认底色：与主背景一致的深色 */
  flex-shrink: 0;
  margin-right: 2px;
}

/* 拿错时的图片边框 */
.m-item-thumb.error-border {
  border-color: var(--error);
  box-shadow: 0 0 8px rgba(255, 77, 79, 0.4);
}

/* 强制 el-image 撑满容器 */
.m-item-thumb :deep(.el-image) {
  width: 100%;
  height: 100%;
  display: block;
}

/* 占位/加载中背景 */
.thumb-placeholder-bg {
  width: 100%;
  height: 100%;
  background: #0d121c;
}

/* 错误/无图状态 */
.thumb-err {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0d121c;
  /* 关键：确保这里不是白色 */
  color: #334155;
  /* 图标颜色设为灰蓝色，不刺眼 */
}

/* 让 el-image 内部组件背景透明 */
.m-item-thumb :deep(.el-image__inner) {
  background: transparent !important;
}

.m-item-thumb :deep(.el-image__error),
.m-item-thumb :deep(.el-image__placeholder) {
  background: #0d121c !important;
  /* 强制覆盖 Element Plus 默认的浅色背景 */
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
  /*border-top: 1px solid #333;*/
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

.btn-open-door {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 6px 16px;
  font-size: 13px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s;
  margin-right: 10px;
}

.btn-open-door:hover {
  background: rgba(0, 242, 255, 0.1);
  box-shadow: 0 0 12px rgba(0, 242, 255, 0.4);
}

.maintenance-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
}

.tip-text {
  color: #e6a23c;
  font-size: 18px;
  font-weight: bold;
  margin-top: 15px;
}

.tip-sub {
  color: #888;
  font-size: 12px;
  margin-top: 8px;
}

/* ==========================================================
   领用页面专属：已取出装备的红色视觉风格
   ========================================================== */

/* 专属标签样式 */
.borrow-tag-removed {
  color: var(--error) !important;
  background: rgba(255, 77, 79, 0.12) !important;
  border: 1px solid rgba(255, 77, 79, 0.3) !important;
  box-shadow: 0 0 5px rgba(255, 77, 79, 0.1);
}

/* 专属卡片边框样式 */
.equip-card.borrow-card-removed {
  opacity: 0.85;
  background: rgba(255, 77, 79, 0.02);
  border-color: var(--error) !important;
  /* 边框变红 */
}

/* 当已取出的卡片被选中时，依然保持红色边框高亮，而不是原来的青色 */
.equip-card.active.borrow-card-removed {
  border-color: var(--error) !important;
  box-shadow:
    inset 0 0 20px rgba(255, 77, 79, 0.15),
    0 0 10px rgba(255, 77, 79, 0.2) !important;
}

/* 当“已取出”卡片被激活时，底部的动画条和发光效果也要变红 */
.equip-card.active.borrow-card-removed .active-bar {
  background: var(--error) !important;
  box-shadow: 0 -2px 10px var(--error) !important;
}

/* 如果需要，选中时的右上角勾选角标也变红 */
.equip-card.active.borrow-card-removed .check-ribbon {
  border-top-color: var(--error) !important;
}

/* 覆盖 hover 效果，防止 hover 时变成青色边框 */
.equip-card.borrow-card-removed:hover {
  border-color: var(--error) !important;
  background: rgba(255, 77, 79, 0.05);
}

/* ==========================================================
   领用页面专属：已取出装备的红色视觉风格
   ========================================================== */

/* 1. 专属标签样式 */
.borrow-tag-removed {
  color: var(--error) !important;
  background: rgba(255, 77, 79, 0.12) !important;
  border: 1px solid rgba(255, 77, 79, 0.3) !important;
  box-shadow: 0 0 5px rgba(255, 77, 79, 0.1);
}

/* 2. 专属卡片边框样式 */
.equip-card.borrow-card-removed {
  opacity: 0.9;
  /* 稍微提高透明度增加文字可读性 */
  background: rgba(255, 77, 79, 0.02);
  border-color: var(--error) !important;
}

/* 3. 【新增】针对“已取出”卡片底部的文字和图标颜色覆盖 */

/* 柜位位置：图标和文字全部变红 */
.borrow-card-removed .equip-pos {
  color: var(--error) !important;
}

/* 4. 当已取出的卡片被选中时，边框和内发光变红 */
.equip-card.active.borrow-card-removed {
  border-color: var(--error) !important;
  box-shadow: inset 0 0 20px rgba(255, 77, 79, 0.15) !important;
}

/* 5. 当“已取出”卡片被激活时，底部的动画条变红 */
.equip-card.active.borrow-card-removed .active-bar {
  background: var(--error) !important;
  box-shadow: 0 -2px 10px var(--error) !important;
}

/* 6. 选中时的右上角勾选角标变红 */
.equip-card.active.borrow-card-removed .check-ribbon {
  border-top-color: var(--error) !important;
}

/* 7. 覆盖 hover 效果，防止 hover 时变成青色 */
.equip-card.borrow-card-removed:hover {
  border-color: var(--error) !important;
  background: rgba(255, 77, 79, 0.05);
}

/*
   关键修改：去掉 .active 限制。
   只要卡片是“已取出”状态，它的动画条就永远是红色的。
   这样在选中（展开）和取消选中（缩回）的过程中，颜色都不会变蓝。
*/
.borrow-card-removed .active-bar {
  background: var(--error) !important;
  box-shadow: 0 -2px 10px var(--error) !important;
}

/* 1. 键盘容器（移植自人员管理页） */
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

<style>
/* 2. 弹窗基础样式及居中（独立命名） */
.cyber-dialog-reason.el-dialog {
  background-color: #141b2d !important;
  border: 1px solid #0099a1 !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8) !important;
  border-radius: 8px !important;
  transition:
    transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
    top 0.3s !important;
  top: 0 !important;
  /* 将起点固定在屏幕最顶端 */
  /* 初始居中状态 */
  margin-top: 0 !important;
  transform: translateY(calc(50vh - 50%)) !important;
}

/* 3. 键盘打开时上移（关键） */
.cyber-dialog-reason.is-keyboard-open {
  /*
     直接修改偏移量：
     将其设为一个较小的值（如 20px），弹窗就会平滑地滑向顶部
  */
  transform: translateY(3px) !important;
}

/* 针对 el-select 内部样式的微调 */
:deep(.cyber-select .el-input__inner) {
  cursor: text !important;
}
</style>

<style>
/* 弹窗内部布局 */
.reason-modal-content {
  padding: 10px 20px;
}

.tip-banner {
  background: rgba(0, 242, 255, 0.05);
  border-left: 3px solid var(--primary);
  padding: 10px 15px;
  font-size: 13px;
  color: #00f2ff;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 卡片网格 */
.reason-card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 25px;
}

.reason-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid #2a3546;
  border-radius: 6px;
  padding: 15px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.reason-card:hover {
  background: rgba(0, 242, 255, 0.05);
  border-color: #4a5c76;
}

.reason-card.active {
  background: rgba(0, 242, 255, 0.1);
  border-color: var(--primary);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.2);
}

.card-icon {
  font-size: 24px;
  color: var(--text-sec);
  transition: all 0.3s;
}

.reason-card.active .card-icon {
  color: var(--primary);
  transform: scale(1.1);
}

.card-label {
  font-size: 14px;
  color: #ccc;
}

.reason-card.active .card-label {
  color: #fff;
  font-weight: bold;
}

/* 激活点状态 */
.active-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary);
  opacity: 0;
  transition: opacity 0.3s;
}

.reason-card.active .active-dot {
  opacity: 1;
  box-shadow: 0 0 5px var(--primary);
}

/* 自定义输入区 */
.section-divider {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.05);
}

.section-divider span {
  padding: 0 15px;
  font-size: 12px;
  color: #555;
  text-transform: uppercase;
}

/* 底部按钮 */
.reason-footer {
  display: flex;
  gap: 15px;
  justify-content: center;
  padding: 10px 20px 20px;
}

/* 键盘打开时，压缩底部留白 */
.cyber-dialog-reason.is-keyboard-open .reason-footer {
  padding-bottom: 0px !important;
  padding-top: 0px !important;
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
  transition: all 0.3s;
}

.footer-btn.cancel {
  background: transparent;
  border: 1px solid #444;
  color: #888;
}

.footer-btn.confirm {
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%);
  border: 1px solid var(--primary);
  color: #fff;
}

.footer-btn.confirm.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  filter: grayscale(1);
}

.footer-btn.confirm:not(.disabled):hover {
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
}
</style>

<style scoped>
/* ==========================================================
   [优化] 自定义用途输入框样式 - 借鉴人员管理页面风格
   ========================================================== */
.cyber-custom-input {
  width: 100%;
}

/* 1. 输入框容器：深色背景 + 细边框 */
.cyber-custom-input :deep(.el-input__wrapper) {
  background-color: rgba(20, 27, 45, 0.9) !important;
  /* 深蓝色背景 */
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  /* 默认灰色内边框 */
  border-radius: 4px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 45px;
  padding: 0 15px;
}

/* 2. 悬停与聚焦状态：青色发光边框 */
.cyber-custom-input :deep(.el-input__wrapper:hover),
.cyber-custom-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary) inset !important;
  /* 青色边框 */
  background-color: rgba(0, 242, 255, 0.05) !important;
  /* 淡淡的青色光晕 */
}

/* 3. 输入文字颜色：纯白 */
.cyber-custom-input :deep(.el-input__inner) {
  color: #ffffff !important;
  font-family: 'Segoe UI', sans-serif;
  font-size: 14px;
}

/* 4. 占位符颜色：灰蓝色 */
.cyber-custom-input :deep(.el-input__inner::placeholder) {
  color: #5c6d82 !important;
}

/* 5. 前缀图标颜色：青色 */
.cyber-custom-input :deep(.el-input__prefix) {
  color: var(--primary) !important;
  font-size: 18px;
}

/* 6. 额外：针对 Section Divider 的文字微调，使其更协调 */
.section-divider span {
  padding: 0 15px;
  font-size: 13px;
  color: #8899a6;
  /* 改为稍亮的灰蓝色 */
  text-transform: uppercase;
  letter-spacing: 2px;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}
</style>
