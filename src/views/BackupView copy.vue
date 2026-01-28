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
          <span class="sub-title">实时校对 · 账物相符 · 自动预警</span>
        </div>
      </div>

      <div class="header-right">
        <div class="inventory-timer" v-if="isScanning">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
          正在同步柜内实时状态...
        </div>
        <button class="btn-open-door" @click="startInventoryScan" :disabled="isScanning">
          <el-icon>
            <Refresh />
          </el-icon>
          重新扫描
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
          <div class="title-left">
            <span class="text-glow">盘点明细 ({{ filteredList.length }})</span>
            <div class="status-legend">
              <span class="dot normal"></span> 账实相符
              <span class="dot warning"></span> 账实不符
            </div>
          </div>

          <div class="filter-tabs">
            <span v-for="tab in filterOptions" :key="tab.value" class="tab"
              :class="{ active: currentFilter === tab.value }" @click="currentFilter = tab.value">
              {{ tab.label }}
            </span>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid">
            <div v-for="item in filteredList" :key="item.id" class="equip-card"
              :class="{ 'abnormal-card': item.actual_status !== item.db_status }">
              <!-- 异常角标 -->
              <div class="error-ribbon" v-if="item.actual_status !== item.db_status">
                <el-icon>
                  <Warning />
                </el-icon>
              </div>

              <!-- 装备图片 -->
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
                <div class="equip-code">编号：{{ item.group_code }}</div>

                <!-- 状态对比区 -->
                <div class="status-compare">
                  <div class="compare-row">
                    <span class="label">账面:</span>
                    <span :class="item.db_status === '在位' ? 'text-in' : 'text-out'">{{ item.db_status }}</span>
                  </div>
                  <div class="compare-row">
                    <span class="label">感应:</span>
                    <span :class="item.actual_status === '在位' ? 'text-in' : 'text-out'">{{ item.actual_status }}</span>
                  </div>
                </div>
              </div>

              <div class="active-bar" :class="item.actual_status === item.db_status ? 'bg-success' : 'bg-error'"></div>
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧：盘点结论报告 -->
      <div class="operation-section">
        <div class="inventory-report">
          <div class="report-header">
            <div class="report-title">盘点数据摘要</div>
            <div class="report-date">{{ currentTime }}</div>
          </div>

          <!-- 统计大数字 -->
          <div class="stats-grid">
            <div class="stats-box">
              <div class="s-val">{{ equipmentList.length }}</div>
              <div class="s-lab">总数</div>
            </div>
            <div class="stats-box success">
              <div class="s-val">{{ stats.match }}</div>
              <div class="s-lab">账实相符</div>
            </div>
            <div class="stats-box danger">
              <div class="s-val">{{ stats.mismatch }}</div>
              <div class="s-lab">异常项</div>
            </div>
          </div>

          <div class="detail-analysis">
            <div class="analysis-item">
              <span class="dot success"></span>
              <span class="lab">正常在位</span>
              <span class="val">{{ stats.inPlace }}</span>
            </div>
            <div class="analysis-item">
              <span class="dot out"></span>
              <span class="lab">正常出库</span>
              <span class="val">{{ stats.outPlace }}</span>
            </div>
            <div class="analysis-item danger-text">
              <span class="dot danger"></span>
              <span class="lab">非法移位 (缺失)</span>
              <span class="val">{{ stats.missing }}</span>
            </div>
          </div>

          <div class="remark-area">
            <div class="area-title">盘点备注说明</div>
            <textarea class="remark-input custom-scroll" placeholder="请输入本次盘点的异常说明或处理意见..."
              v-model="inventoryRemark"></textarea>
          </div>

          <div class="action-footer">
            <button class="cyber-btn" @click="handleSubmitReport" :disabled="isScanning">
              <div class="btn-content">
                <el-icon :size="22">
                  <Checked />
                </el-icon>
                <div class="text-group">
                  <span class="btn-main-text">提交盘点报告</span>
                  <span class="btn-sub-text">同步至管理系统 · 记录存档</span>
                </div>
              </div>
              <div class="scan-line"></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Box, Files, SwitchButton, Refresh, Loading,
  Warning, Box as BoxIcon, Checked
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// --- 模拟数据 ---
const isScanning = ref(false)
const inventoryRemark = ref('')
const currentFilter = ref('ALL')
const filterOptions = [
  { label: '全部', value: 'ALL' },
  { label: '正常', value: 'NORMAL' },
  { label: '异常', value: 'ERROR' }
]

const equipmentList = ref([
  { id: 1, group_name: '95式自动步枪', group_code: 'AR-95-001', db_status: '在位', actual_status: '在位', group_image: '' },
  { id: 2, group_name: '95式自动步枪', group_code: 'AR-95-002', db_status: '在位', actual_status: '不在位', group_image: '' },
  { id: 3, group_name: '03式自动步枪', group_code: 'AR-03-054', db_status: '已取出', actual_status: '已取出', group_image: '' },
  { id: 4, group_name: '03式自动步枪', group_code: 'AR-03-055', db_status: '在位', actual_status: '在位', group_image: '' },
  { id: 5, group_name: '战术头盔', group_code: 'TH-2023-09', db_status: '已取出', actual_status: '在位', group_image: '' },
  { id: 6, group_name: '防弹背心', group_code: 'BV-SD-102', db_status: '在位', actual_status: '在位', group_image: '' },
  { id: 7, group_name: '手持电台', group_code: 'RT-G5-991', db_status: '在位', actual_status: '不在位', group_image: '' },
  { id: 8, group_name: '夜视仪', group_code: 'NVG-X2-008', db_status: '在位', actual_status: '在位', group_image: '' },
])

// --- 计算属性 ---
const filteredList = computed(() => {
  if (currentFilter.value === 'NORMAL') {
    return equipmentList.value.filter(i => i.db_status === i.actual_status)
  }
  if (currentFilter.value === 'ERROR') {
    return equipmentList.value.filter(i => i.db_status !== i.actual_status)
  }
  return equipmentList.value
})

const stats = computed(() => {
  const match = equipmentList.value.filter(i => i.db_status === i.actual_status).length
  const inPlace = equipmentList.value.filter(i => i.db_status === '在位' && i.actual_status === '在位').length
  const outPlace = equipmentList.value.filter(i => i.db_status === '已取出' && i.actual_status === '已取出').length
  const missing = equipmentList.value.filter(i => i.db_status === '在位' && i.actual_status === '不在位').length

  return {
    match,
    mismatch: equipmentList.value.length - match,
    inPlace,
    outPlace,
    missing
  }
})

const currentTime = ref(new Date().toLocaleString())

// --- 方法 ---
const startInventoryScan = () => {
  isScanning.value = true
  ElMessage.info('硬件指令已发送，正在轮询柜位传感器...')

  // 模拟扫描过程
  setTimeout(() => {
    isScanning.value = false
    ElMessage.success('盘点扫描完成，发现 ' + stats.value.mismatch + ' 项异常')
  }, 2000)
}

const handleSubmitReport = () => {
  ElMessageBox.confirm('确定提交本次盘点报告吗？异常项将自动生成警报记录。', '提交确认', {
    confirmButtonText: '确定提交',
    cancelButtonText: '取消',
    type: 'warning',
    customClass: 'cyber-message-box'
  }).then(() => {
    ElMessage.success('报告提交成功，已存档')
  })
}

onMounted(() => {
  // 页面加载自动开始一次扫描
  startInventoryScan()
})
</script>

<style scoped>
/* 继承领用页面的核心布局变量 */
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

/* 盘点特有样式 */
.inventory-timer {
  color: var(--primary);
  font-size: 13px;
  margin-right: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-legend {
  margin-left: 20px;
  font-size: 12px;
  color: var(--text-sec);
  display: flex;
  align-items: center;
  gap: 15px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot.normal {
  background: var(--success);
  box-shadow: 0 0 5px var(--success);
}

.dot.warning {
  background: var(--error);
  box-shadow: 0 0 5px var(--error);
}

.dot.out {
  background: #555;
}

/* 异常卡片样式 */
.abnormal-card {
  border-color: var(--error) !important;
  background: rgba(255, 77, 79, 0.05) !important;
}

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

.error-ribbon .el-icon {
  position: absolute;
  top: -28px;
  left: -16px;
  color: #fff;
  font-size: 14px;
}

.status-compare {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #333;
}

.compare-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 2px;
}

.compare-row .label {
  color: #666;
}

.text-in {
  color: var(--success);
  font-weight: bold;
}

.text-out {
  color: var(--text-sec);
}

/* 右侧报告区域 */
.inventory-report {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.report-header {
  margin-bottom: 20px;
}

.report-title {
  font-size: 18px;
  color: var(--primary);
  font-weight: bold;
}

.report-date {
  font-size: 12px;
  color: #555;
  margin-top: 5px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 25px;
}

.stats-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  padding: 15px 5px;
  text-align: center;
  border-radius: 4px;
}

.stats-box .s-val {
  font-size: 22px;
  font-weight: bold;
  font-family: 'Consolas';
}

.stats-box .s-lab {
  font-size: 11px;
  color: var(--text-sec);
  margin-top: 5px;
}

.stats-box.success .s-val {
  color: var(--success);
}

.stats-box.danger .s-val {
  color: var(--error);
}

.detail-analysis {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.analysis-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 13px;
}

.analysis-item .lab {
  flex: 1;
  margin-left: 10px;
  color: #ccc;
}

.analysis-item .val {
  font-family: monospace;
  font-weight: bold;
}

.danger-text {
  color: var(--error);
}

.remark-input {
  width: 100%;
  flex: 1;
  background: #0d121c;
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 10px;
  color: #fff;
  font-size: 13px;
  resize: none;
  outline: none;
  margin-top: 10px;
}

.remark-input:focus {
  border-color: var(--primary);
}

.bg-success {
  background: var(--success);
  box-shadow: 0 -2px 10px var(--success);
}

.bg-error {
  background: var(--error);
  box-shadow: 0 -2px 10px var(--error);
}

/* 基础复用样式 (保持与原页面一致) */
.page-container {
  width: 100%;
  height: 100vh;
  background-color: var(--bg-dark);
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header-bar {
  height: 70px;
  background: #11151f;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
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
}

.primary-icon {
  color: var(--primary);
}

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
}

.operation-section {
  flex: 0 0 360px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.section-title {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
}

.filter-tabs {
  display: flex;
  background: #0d121c;
  padding: 3px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.tab {
  padding: 5px 12px;
  font-size: 12px;
  color: var(--text-sec);
  cursor: pointer;
  transition: all 0.3s;
}

.tab.active {
  color: var(--primary);
  background: #1c2538;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  padding: 15px;
}

.equip-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  height: 230px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s;
}

.equip-image-preview {
  height: 100px;
  background: #000;
}

.card-info {
  padding: 10px;
  flex: 1;
}

.equip-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 4px;
}

.equip-code {
  font-size: 12px;
  color: var(--text-sec);
  font-family: monospace;
}

.active-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
}

.cyber-btn {
  width: 100%;
  height: 55px;
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
  gap: 10px;
}

.btn-main-text {
  font-size: 16px;
  font-weight: bold;
}

.btn-sub-text {
  font-size: 11px;
  opacity: 0.7;
}

.btn-exit {
  background: transparent;
  border: 1px solid var(--error);
  color: var(--error);
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-open-door {
  background: transparent;
  border: 1px solid var(--primary);
  color: var(--primary);
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
