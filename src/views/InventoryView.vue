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
              :class="{ active: currentFilter === tab.value }" @click="currentFilter = tab.value">
              {{ tab.label }}
              <span class="tab-count" v-if="tab.value === 'ERROR' && stats.mismatch > 0">{{ stats.mismatch }}</span>
            </span>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid">
            <div v-for="item in filteredList" :key="item.id" class="equip-card"
              :class="{ 'is-abnormal': isItemAbnormal(item) }">
              <div class="error-badge" v-if="isItemAbnormal(item)">
                <el-icon>
                  <Warning />
                </el-icon>
              </div>
              <div class="equip-image-preview">
                <el-image :src="item.group_image" fit="cover">
                  <template #error>
                    <div class="image-error-slot"><el-icon :size="24">
                        <Box />
                      </el-icon></div>
                  </template>
                </el-image>
              </div>
              <div class="card-info">
                <div class="equip-name">{{ item.group_name }}</div>
                <div class="equip-code">{{ item.group_code }}</div>
                <div class="status-compare-box">
                  <div class="compare-line">
                    <span class="c-label">系统账面</span>
                    <span class="c-value" :class="item.db_status === '武器在位' ? 'st-in' : 'st-out'">{{ item.db_status
                    }}</span>
                  </div>
                  <div class="compare-line">
                    <span class="c-label">柜内感知</span>
                    <span class="c-value" :class="item.actual_status === '武器在位' ? 'st-in' : 'st-out-warn'">{{
                      item.actual_status
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="active-bar" :class="!isItemAbnormal(item) ? 'bg-ok' : 'bg-err'"></div>
            </div>
            <!-- 无数据提示 -->
            <div v-if="filteredList.length === 0" class="no-data-placeholder">
              {{ currentFilter === 'ERROR' ? '太棒了，当前暂无账实不符项' : '暂无装备数据' }}
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧：盘点数据报告面板 -->
      <div class="operation-section">
        <div class="report-panel">
          <div class="report-header">
            <div class="report-main-title">实时统计信息</div>
            <div class="report-time">上次刷新：{{ currentTime }}</div>
          </div>

          <!-- 右侧卡片联动联动左侧过滤器 -->
          <div class="stats-summary-grid">
            <div class="stat-card clickable" :class="{ active: currentFilter === 'ALL' }"
              @click="currentFilter = 'ALL'">
              <div class="s-num">{{ equipmentList.length }}</div>
              <div class="s-text">装备总数</div>
            </div>
            <div class="stat-card is-success clickable" :class="{ active: currentFilter === 'NORMAL' }"
              @click="currentFilter = 'NORMAL'">
              <div class="s-num">{{ stats.match }}</div>
              <div class="s-text">账实相符</div>
            </div>
            <div class="stat-card is-danger clickable"
              :class="{ active: currentFilter === 'ERROR', 'has-err': stats.mismatch > 0 }"
              @click="currentFilter = 'ERROR'">
              <div class="s-num">{{ stats.mismatch }}</div>
              <div class="s-text">异常数量</div>
            </div>
          </div>

          <!-- 账实相符率进度条已按方案二彻底删除 -->

          <div class="analysis-section">
            <div class="analysis-title">盘点明细列表</div>
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
                <span class="btn-main-text" style="margin-left: 8px;">
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
            </el-icon> 确认上报并结束
          </button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Files, Box, SwitchButton, Monitor,
  Warning, CircleCheck, Promotion
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const isScanning = ref(false)
const summaryVisible = ref(false)
const showKeyboard = ref(false)
const currentFilter = ref('ERROR')
// 手动格式化时间函数
const formatTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
}

// 初始化时间
const currentTime = ref(formatTime())

const filterOptions = [
  { label: '异常项', value: 'ERROR' },
  { label: '正常项', value: 'NORMAL' },
  { label: '全部明细', value: 'ALL' }
]

// 模拟数据：包含了 正常、缺失、违规占用 三种场景
const equipmentList = ref([
  { id: 1, group_name: '95式自动步枪', group_code: 'AR-95-001', db_status: '武器在位', actual_status: '武器在位', group_image: '', inventory_remark: '' },
  { id: 2, group_name: '95式自动步枪', group_code: 'AR-95-002', db_status: '武器在位', actual_status: '不在位', group_image: '', inventory_remark: '' },
  { id: 3, group_name: '03式自动步枪', group_code: 'AR-03-054', db_status: '已取出', actual_status: '不在位', group_image: '', inventory_remark: '' },
  { id: 4, group_name: '高清夜视仪', group_code: 'NVG-X-088', db_status: '武器在位', actual_status: '武器在位', group_image: '', inventory_remark: '' },
  { id: 5, group_name: '战术头盔', group_code: 'TH-BK-09', db_status: '已取出', actual_status: '武器在位', group_image: '', inventory_remark: '' },
  { id: 6, group_name: '手持电台', group_code: 'RT-201', db_status: '武器在位', actual_status: '武器在位', group_image: '', inventory_remark: '' },
])

// 判定逻辑
const isItemAbnormal = (item) => {
  return !((item.db_status === item.actual_status) || (item.db_status === '已取出' && item.actual_status === '不在位'));
}

// 异常分类标签
const getAbnormalType = (item) => {
  if (item.db_status === '武器在位' && item.actual_status === '不在位') return { text: '账有实无', class: 'st-out-warn' };
  if (item.db_status === '已取出' && item.actual_status === '武器在位') return { text: '实有账无', class: 'st-unreg' };
  return { text: '其它异常', class: 'st-other' };
}

// 统计逻辑
const stats = computed(() => {
  const abnormalItemsList = equipmentList.value.filter(isItemAbnormal);
  return {
    match: equipmentList.value.length - abnormalItemsList.length,
    mismatch: abnormalItemsList.length,
    inPlace: equipmentList.value.filter(i => i.db_status === '武器在位' && i.actual_status === '武器在位').length,
    outPlace: equipmentList.value.filter(i => i.db_status === '已取出' && i.actual_status === '不在位').length,
    missing: abnormalItemsList.filter(i => i.db_status === '武器在位').length,
    unregistered: abnormalItemsList.filter(i => i.db_status === '已取出').length
  }
})

// 列表过滤
const filteredList = computed(() => {
  if (currentFilter.value === 'NORMAL') return equipmentList.value.filter(i => !isItemAbnormal(i));
  if (currentFilter.value === 'ERROR') return equipmentList.value.filter(isItemAbnormal);
  return equipmentList.value;
})

const abnormalItems = computed(() => equipmentList.value.filter(isItemAbnormal));

// 交互
const handleInputFocus = () => { showKeyboard.value = true; }
const startInventoryScan = () => {
  isScanning.value = true;
  setTimeout(() => { isScanning.value = false; ElMessage.success('硬件同步完成'); }, 1500);
}
const handleOpenSummary = () => { summaryVisible.value = true; }
const finalSubmit = () => { ElMessage.success('盘点数据已同步至管理系统'); summaryVisible.value = false; }

onMounted(() => {
  startInventoryScan();

  // 每秒更新一次时间
  setInterval(() => {
    currentTime.value = formatTime()
  }, 1000)
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
  font-size: 12px;
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
.equip-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  height: 240px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: 0.3s;
}

.equip-card.is-abnormal {
  border-color: var(--error);
  background: rgba(255, 77, 79, 0.05);
}

.error-badge {
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-top: 32px solid var(--error);
  border-left: 32px solid transparent;
  z-index: 2;
}

.error-badge .el-icon {
  position: absolute;
  top: -30px;
  left: -18px;
  color: #fff;
  font-size: 16px;
}

.equip-image-preview {
  width: 100%;
  height: 110px;
  background: #000;
  border-bottom: 1px solid var(--border);
}

.image-error-slot {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
}

.card-info {
  padding: 12px;
  flex: 1;
}

.equip-name {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 4px;
}

.equip-code {
  font-size: 12px;
  color: var(--text-sec);
  font-family: monospace;
}

.status-compare-box {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  padding: 6px 8px;
  margin-top: 5px;
}

.compare-line {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 2px;
}

.st-in {
  color: var(--success);
  font-weight: bold;
}

.st-out {
  color: var(--text-sec);
}

.st-out-warn {
  color: var(--error);
  font-weight: bold;
}

.active-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
}

.bg-ok {
  background: var(--success);
  box-shadow: 0 -2px 8px var(--success);
}

.bg-err {
  background: var(--error);
  box-shadow: 0 -2px 8px var(--error);
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
  margin-bottom: 12px;
}

.analysis-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
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
