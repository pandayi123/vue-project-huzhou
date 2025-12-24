<template>
  <div class="page-container theme-dark">
    <!-- ================= 顶部导航栏 ================= -->
    <header class="header-bar">
      <div class="header-left">
        <div class="icon-box-glow icon-box-return">
          <!-- 更换为归还相关的图标 -->
          <el-icon :size="24" class="primary-icon">
            <RefreshLeft />
          </el-icon>
        </div>
        <div class="title-text">
          <h1>装备归还</h1>
          <span class="sub-title">智能识别 · 自动盘点 · 精准归位</span>
        </div>
      </div>

      <div class="header-right">
        <!-- 搜索框 -->
        <div class="search-wrapper">
          <el-input
            v-model="searchVal"
            placeholder="扫描装备条码或输入编号..."
            class="custom-search-input"
            :prefix-icon="Search"
            clearable
          />
        </div>
        <button class="btn-exit" @click="$router.push('/')">
          <el-icon>
            <SwitchButton />
          </el-icon> 退出系统
        </button>
      </div>
    </header>

    <!-- ================= 主体内容区 ================= -->
    <div class="main-body">

      <!-- 左侧：装备卡片列表 -->
      <div class="list-section">
        <div class="section-title">
          <div class="title-left">
            <span class="text-glow">待归还清单 ({{ filteredList.length }})</span>
            <span v-if="selectedIds.length > 0" class="selection-count">
              已选中 <span class="highlight-num">{{ selectedIds.length }}</span> 项
            </span>
          </div>

          <!-- 标签栏：默认定位在'待归还' -->
          <div class="filter-tabs" ref="tabsContainer">
            <div class="tab-glider" :style="gliderStyle"></div>
            <span
              v-for="(tab, index) in filterOptions"
              :key="tab.value"
              class="tab"
              :class="{ active: currentFilter === tab.value }"
              :ref="el => tabRefs[index] = el"
              @click="setFilter(tab.value)"
            >
              {{ tab.label }}
            </span>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid">
            <div v-for="item in filteredList" :key="item.id" class="equip-card" :class="{
              'active': selectedIds.includes(item.id),
              'status-in-stock': item.group_status === '在位' // 归还页面中，在位的装备反而是'非活动'状态
            }" @click="toggleSelect(item.id)">
              <div class="check-ribbon" v-if="selectedIds.includes(item.id)">
                <el-icon>
                  <Check />
                </el-icon>
              </div>

              <!-- 状态 Badge -->
              <div class="card-status-badge" :class="item.group_status === '已取出' ? 'st-pending-return' : 'st-in'">
                {{ item.group_status === '已取出' ? '待归还' : '已在位' }}
              </div>

              <div class="card-icon">
                <!-- 图标逻辑：已取出显示时钟/等待归还，在位显示对勾 -->
                <el-icon v-if="item.group_status === '已取出'" :size="32" class="icon-warning">
                  <Timer />
                </el-icon>
                <el-icon v-else :size="32" class="icon-success">
                  <CircleCheckFilled />
                </el-icon>
              </div>

              <div class="card-info">
                <div class="equip-name" :title="item.group_name">{{ item.group_name }}</div>
                <div class="equip-code">NO. {{ item.group_code }}</div>
                <div class="equip-pos">
                  <el-icon>
                    <Location />
                  </el-icon> 应归还至：{{ item.self_address }}号
                </div>
              </div>

              <div class="active-bar"></div>
            </div>

            <div v-if="filteredList.length === 0" class="no-data-tip">
              没有找到符合条件的装备
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧：详情与操作面板 -->
      <div class="operation-section">
        <!-- 场景1：未选中 -->
        <template v-if="selectedIds.length === 0">
          <div class="empty-placeholder">
            <div class="icon-circle return-theme">
              <el-icon :size="50">
                <Download />
              </el-icon>
            </div>
            <div class="empty-text">请选择归还装备</div>
            <div class="empty-sub">支持扫描枪连续扫码归还</div>
          </div>
        </template>

        <!-- 场景2：单选详情 -->
        <template v-else-if="selectedIds.length === 1">
          <div class="detail-card">
            <div class="detail-header">
              <div class="header-title-group">
                <div class="big-name">{{ singleItem.group_name }}</div>
                <div class="status-tag-large" :class="singleItem.group_status === '已取出' ? 'st-pending-return' : 'st-in'">
                   {{ singleItem.group_status === '已取出' ? '状态：待归还' : '状态：已在位' }}
                </div>
              </div>
              <button class="btn-text-action" @click="clearSelection">取消</button>
            </div>

            <div class="info-table">
              <div class="info-row">
                <span class="label">装备编号</span>
                <span class="value font-mono highlight">{{ singleItem.group_code }}</span>
              </div>
              <div class="info-row">
                <span class="label">借出人</span>
                <span class="value">{{ singleItem.borrower || '张三 (0921)' }}</span>
              </div>
              <div class="info-row">
                <span class="label">借出时间</span>
                <span class="value">{{ singleItem.group_distribution_time }}</span>
              </div>
               <div class="info-row">
                <span class="label">归还目标位</span>
                <span class="value highlight-pos">{{ singleItem.self_address }} 号位</span>
              </div>
            </div>

            <div class="remark-area">
              <div class="area-title">装备完好度检查 / 备注</div>
              <div class="remark-content custom-scroll">
                {{ singleItem.group_remark || '请检查装备外观是否完好，配件是否齐全。' }}
              </div>
            </div>

            <div class="action-footer">
              <!-- 按钮逻辑反转：只有“已取出”的才能归还 -->
              <button class="cyber-btn return-btn" :class="{ 'disabled': singleItem.group_status === '在位' }"
                :disabled="singleItem.group_status === '在位'">
                <div class="btn-content">
                  <el-icon :size="24" v-if="singleItem.group_status === '已取出'">
                    <RefreshLeft />
                  </el-icon>
                  <el-icon :size="24" v-else>
                    <CircleCheckFilled />
                  </el-icon>
                  <div class="text-group">
                    <span class="btn-main-text">{{ singleItem.group_status === '已取出' ? '确认归还' : '无需归还' }}</span>
                    <span class="btn-sub-text">{{ singleItem.group_status === '已取出' ? '核对无误 · 立即入库' : '装备已在柜中'
                      }}</span>
                  </div>
                </div>
                <div class="scan-line" v-if="singleItem.group_status === '已取出'"></div>
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
                </el-icon> 批量归还清单
              </div>
              <button class="btn-text-action danger" @click="clearSelection">清空</button>
            </div>

            <div class="batch-summary">
              <div class="summary-item">
                <span class="num">{{ selectedItems.length }}</span>
                <span class="txt">总选中</span>
              </div>
              <div class="summary-item success">
                <span class="num">{{ validReturnItemsCount }}</span>
                <span class="txt">可归还</span>
              </div>
              <!-- 这里的 Warning 逻辑是：选了已经在位的装备 -->
              <div class="summary-item warning" v-if="selectedItems.length - validReturnItemsCount > 0">
                <span class="num">{{ selectedItems.length - validReturnItemsCount }}</span>
                <span class="txt">已在库</span>
              </div>
            </div>

            <el-scrollbar class="batch-list-scroll">
              <div class="batch-list">
                <div v-for="item in selectedItems" :key="item.id" class="batch-item">
                  <div class="item-left">
                    <div class="b-name">{{ item.group_name }}</div>
                    <div class="b-code">{{ item.group_code }}</div>
                  </div>
                  <div class="item-right">
                    <span class="mini-tag" :class="item.group_status === '已取出' ? 'st-pending-return' : 'st-in'">
                      {{ item.group_status === '已取出' ? '待还' : '在库' }}
                    </span>
                    <div class="b-pos">入: {{ item.self_address }}</div>
                    <button class="btn-icon-remove" @click.stop="toggleSelect(item.id)">
                      <el-icon><Close /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </el-scrollbar>

            <div class="action-footer">
              <div v-if="selectedItems.length - validReturnItemsCount > 0" class="batch-warning">
                <el-icon><Warning /></el-icon> 包含 {{ selectedItems.length - validReturnItemsCount }} 个已在库装备，将自动忽略
              </div>
              <button class="cyber-btn return-btn" :class="{ 'disabled': validReturnItemsCount === 0 }"
                :disabled="validReturnItemsCount === 0">
                <div class="btn-content">
                  <el-icon :size="24">
                    <Box />
                  </el-icon>
                  <div class="text-group">
                    <span class="btn-main-text">批量归还 ({{ validReturnItemsCount }}项)</span>
                    <span class="btn-sub-text">库存自动更新 · 记录生成</span>
                  </div>
                </div>
                <div class="scan-line" v-if="validReturnItemsCount > 0"></div>
              </button>
            </div>
          </div>
        </template>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import {
  Box, SwitchButton, Location, RefreshLeft, CircleCheckFilled, Timer,
  Warning, Check, Download, List, Close, Search
} from '@element-plus/icons-vue'

// --- 数据部分 ---
const searchVal = ref('')
// 归还页面默认查看“已取出”的装备
const currentFilter = ref('OUT')
const selectedIds = ref([])
const tabRefs = ref([])
const tabsContainer = ref(null)

// 选项数据
const filterOptions = [
  { label: '待归还 (借出)', value: 'OUT' }, // 默认放第一位或重点位
  { label: '全部装备', value: 'ALL' },
  { label: '已在库', value: 'IN' }
]

// 模拟数据：为了演示，多造一些 '已取出' 的数据
const mockList = ref([
  {
    id: 1,
    group_name: '高清夜视仪 NV-Pro',
    group_code: 'EQ-OUT-001',
    group_status: '已取出',
    borrower: '李四',
    self_address: '101',
    group_distribution_time: '2025-12-08 08:30',
    group_remark: '借用时镜头盖已缺失。'
  },
  {
    id: 2,
    group_name: '无线电通讯组 (A组)',
    group_code: 'EQ-OUT-002',
    group_status: '已取出',
    borrower: '王五',
    self_address: '102',
    group_distribution_time: '2025-12-07 14:20',
    group_remark: ''
  },
  {
    id: 3,
    group_name: '应急医疗箱',
    group_code: 'MED-2023-X',
    group_status: '在位',
    borrower: '',
    self_address: '103',
    group_distribution_time: '-',
    group_remark: '未开封'
  },
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: 10 + i,
    group_name: `训练用模拟终端 ${i + 1}`,
    group_code: `TRAIN-00${i}`,
    // 归还界面，让大部分数据处于“已取出”状态以便演示
    group_status: i % 4 === 0 ? '在位' : '已取出',
    borrower: i % 4 === 0 ? '' : `学员${i + 100}`,
    self_address: `${200 + i}`,
    group_distribution_time: '2025-12-08 09:00',
    group_remark: '正常训练借出'
  }))
])

// --- 动画与样式 ---
const gliderStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 })

const updateGlider = () => {
  nextTick(() => {
    const activeIndex = filterOptions.findIndex(opt => opt.value === currentFilter.value)
    if (activeIndex !== -1 && tabRefs.value[activeIndex]) {
      const activeEl = tabRefs.value[activeIndex]
      gliderStyle.value = {
        width: `${activeEl.offsetWidth}px`,
        transform: `translateX(${activeEl.offsetLeft}px)`,
        opacity: 1
      }
    }
  })
}

watch(currentFilter, () => updateGlider())

// --- 计算属性 ---

const filteredList = computed(() => {
  let list = mockList.value

  if (searchVal.value) {
    const keyword = searchVal.value.toLowerCase()
    list = list.filter(item =>
      item.group_name.toLowerCase().includes(keyword) ||
      item.group_code.toLowerCase().includes(keyword)
    )
  }

  if (currentFilter.value === 'IN') {
    list = list.filter(item => item.group_status === '在位')
  } else if (currentFilter.value === 'OUT') {
    list = list.filter(item => item.group_status === '已取出') // 注意状态判断逻辑
  }

  return list
})

const selectedItems = computed(() => {
  return mockList.value.filter(item => selectedIds.value.includes(item.id))
})

const singleItem = computed(() => selectedItems.value[0])

// 归还页面：有效的 Item 是状态为 '已取出' (OUT) 的
const validReturnItemsCount = computed(() => {
  return selectedItems.value.filter(item => item.group_status === '已取出').length
})

// --- 方法 ---

const setFilter = (val) => {
  currentFilter.value = val
}

const toggleSelect = (id) => {
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

onMounted(() => {
  updateGlider()
})
</script>

<style scoped>
/* 继承原有的深色主题变量，但微调高亮色以区分归还/领用 */
/* 领用通常是 Cyan/Blue, 归还我们可以引入一些 Amber/Orange 作为“待处理”的提示，或者保持一致 */
.theme-dark {
  --primary: #00f2ff;
  --primary-dark: #0099a1;
  --success: #00ff9d;
  --warning: #ffb700; /* 新增：待归还的高亮色 */
  --return-btn-bg: #ffb700;
  --error: #ff4d4f;
  --bg-dark: #0a0e17;
  --card-bg: #141b2d;
  --border: #2a3546;
  --active-bg: #1c2538;
  --text-main: #ffffff;
  --text-sec: #8899a6;
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

/* Header */
.header-bar {
  height: 70px;
  background: #11151f;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
}

.header-left { display: flex; align-items: center; gap: 12px; }

.icon-box-glow {
  width: 42px; height: 42px;
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: var(--active-bg);
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.1);
}

.icon-box-return {
  /* 归还页面可以稍微改一下光晕颜色区分 */
  box-shadow: 0 0 15px rgba(255, 183, 0, 0.1);
  border-color: rgba(255, 183, 0, 0.3);
}
.icon-box-return .primary-icon { color: var(--warning); }

.title-text h1 { margin: 0; font-size: 22px; font-weight: 600; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
.sub-title { color: var(--text-sec); font-size: 11px; letter-spacing: 1px; font-weight: bold; }

.header-right { display: flex; align-items: center; gap: 15px; }
.search-wrapper { width: 300px; }

/* 复用 Input 样式 */
:deep(.custom-search-input .el-input__wrapper) {
  background-color: var(--bg-dark);
  border: 1px solid var(--border);
  box-shadow: none !important;
  border-radius: 4px;
}
:deep(.custom-search-input .el-input__inner) { color: #fff; height: 32px; }

.btn-exit {
  background: transparent; border: 1px solid var(--border); color: var(--text-sec);
  padding: 6px 16px; font-size: 13px; border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
}
.btn-exit:hover { border-color: var(--error); color: var(--error); }

/* Main Body */
.main-body { flex: 1; display: flex; padding: 15px; gap: 15px; overflow: hidden; }

/* Left List */
.list-section {
  flex: 1; background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 8px; display: flex; flex-direction: column; min-width: 0;
}

.section-title {
  padding: 12px 20px; border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
  background: rgba(0,0,0,0.2);
}

.title-left { color: #fff; display: flex; align-items: center; gap: 12px; }
.selection-count { font-size: 12px; background: var(--warning); color: #000; padding: 1px 6px; border-radius: 2px; font-weight: bold; }

/* Filter Tabs */
.filter-tabs { position: relative; display: flex; background: #0d121c; padding: 3px; border-radius: 4px; border: 1px solid var(--border); }
.tab-glider {
  position: absolute; top: 3px; left: 0; height: calc(100% - 6px);
  background: var(--active-bg); border: 1px solid var(--border); border-radius: 2px;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); pointer-events: none;
}
.tab {
  position: relative; z-index: 2; padding: 5px 12px; font-size: 12px; color: var(--text-sec);
  cursor: pointer; transition: color 0.3s;
}
.tab.active { color: var(--primary); text-shadow: 0 0 0.5px currentColor; }

/* Scroll & Grid */
.scroll-area { flex: 1; padding: 15px; }
.card-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.no-data-tip { grid-column: 1 / -1; text-align: center; color: var(--text-sec); padding: 40px; border: 1px dashed var(--border); border-radius: 8px; }

/* Equip Card */
.equip-card {
  position: relative; background: rgba(255,255,255,0.03); border: 1px solid var(--border);
  border-radius: 6px; padding: 12px; cursor: pointer; transition: all 0.2s;
  display: flex; flex-direction: column; justify-content: space-between; height: 145px; overflow: hidden;
}
.equip-card:hover { background: var(--active-bg); border-color: #555; }
.equip-card.active {
  background-color: rgba(255, 183, 0, 0.05); /* 选中时的黄色背景 */
  border: 1px solid var(--warning);
  box-shadow: inset 0 0 10px rgba(255, 183, 0, 0.1);
}

/* 归还页面特色：在位的装备反而变暗，因为它们不需要被归还 */
.equip-card.status-in-stock { opacity: 0.5; filter: grayscale(0.8); }

.active-bar {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 2px;
  background: var(--warning); transform: scaleX(0); transition: transform 0.3s;
}
.equip-card.active .active-bar { transform: scaleX(1); }

.check-ribbon {
  position: absolute; right: 0; top: 0; width: 0; height: 0;
  border-top: 32px solid var(--warning); border-left: 32px solid transparent; z-index: 2;
}
.check-ribbon .el-icon { position: absolute; top: -30px; left: -18px; color: #000; font-weight: bold; }

.card-status-badge {
  position: absolute; top: 8px; right: 8px; padding: 2px 6px; border-radius: 4px;
  font-size: 10px; font-weight: bold; z-index: 1;
}

/* 状态样式 */
.st-pending-return {
  color: var(--warning); background: rgba(255, 183, 0, 0.15); border: 1px solid rgba(255, 183, 0, 0.3);
}
.st-in {
  color: var(--success); background: rgba(0, 255, 157, 0.1); border: 1px solid rgba(0, 255, 157, 0.2);
}

.card-icon { margin-bottom: 5px; }
.icon-warning { color: var(--warning); filter: drop-shadow(0 0 5px rgba(255, 183, 0, 0.3)); }
.icon-success { color: var(--success); }

.equip-name { font-size: 14px; font-weight: bold; color: #fff; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.equip-code { font-size: 11px; color: var(--text-sec); font-family: monospace; margin-bottom: 6px; }
.equip-pos { font-size: 12px; color: var(--text-sec); display: flex; align-items: center; gap: 3px; }

/* Right Section */
.operation-section {
  flex: 0 0 360px; width: 360px; background: var(--card-bg);
  border: 1px solid var(--border); border-radius: 8px;
  display: flex; flex-direction: column; overflow: hidden;
}

.empty-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-sec); }
.icon-circle {
  width: 100px; height: 100px; border-radius: 50%; border: 2px dashed var(--border);
  display: flex; align-items: center; justify-content: center; margin-bottom: 15px;
}
.icon-circle.return-theme { color: var(--warning); border-color: rgba(255,183,0,0.3); }

.detail-card, .batch-card { display: flex; flex-direction: column; height: 100%; }
.detail-header, .batch-header {
  padding: 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: flex-start;
  background: rgba(0,0,0,0.2);
}
.header-title-group { display: flex; flex-direction: column; gap: 10px; flex: 1; }
.big-name { font-size: 20px; font-weight: bold; color: #fff; line-height: 1.2; }
.status-tag-large { font-size: 12px; padding: 3px 10px; border-radius: 4px; font-weight: bold; align-self: flex-start; }

.info-table { padding: 15px 20px; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.info-row .label { color: var(--text-sec); font-size: 13px; }
.info-row .value { color: #fff; font-size: 14px; }
.highlight { color: var(--primary); font-family: monospace; }
.highlight-pos { color: var(--success); font-weight: bold; }

.remark-area { flex: 1; padding: 10px 20px; display: flex; flex-direction: column; min-height: 0; }
.area-title { color: var(--text-sec); font-size: 12px; margin-bottom: 8px; }
.remark-content { flex: 1; background: #0d121c; border: 1px solid var(--border); padding: 10px; color: #ccc; font-size: 12px; overflow-y: auto; }

.action-footer { padding: 15px 20px; border-top: 1px solid var(--border); background: rgba(0,0,0,0.2); }

/* Cyber Button - Return Variant */
.cyber-btn {
  width: 100%; height: 50px;
  background: linear-gradient(90deg, var(--primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--primary); color: #fff; cursor: pointer; position: relative; overflow: hidden; transition: all 0.3s;
}

/* 归还按钮使用偏橙黄色的渐变，以示区分 */
.cyber-btn.return-btn {
  background: linear-gradient(90deg, #b88b0b 0%, #946c00 100%);
  border-color: #ffb700;
}
.cyber-btn.return-btn:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(255, 183, 0, 0.4);
}

.cyber-btn.disabled { background: #1f2636; border-color: #444; color: #666; cursor: not-allowed; pointer-events: none; }

.btn-content { display: flex; align-items: center; justify-content: center; gap: 12px; height: 100%; position: relative; z-index: 2; }
.text-group { display: flex; flex-direction: column; align-items: flex-start; }
.btn-main-text { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
.btn-sub-text { font-size: 9px; opacity: 0.7; letter-spacing: 1px; }

.scan-line {
  position: absolute; top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: skewX(-20deg); animation: btnScan 3s infinite; z-index: 1;
}
@keyframes btnScan { 0% { left: -100%; } 100% { left: 200%; } }

.btn-text-action { background: none; border: 1px solid var(--text-sec); color: var(--text-sec); padding: 3px 10px; font-size: 12px; cursor: pointer; border-radius: 2px; }
.btn-text-action:hover { color: #fff; border-color: #fff; }
.btn-text-action.danger:hover { color: var(--error); border-color: var(--error); }

/* Batch List */
.batch-title { font-size: 16px; color: #fff; display: flex; align-items: center; gap: 8px; }
.batch-summary { display: flex; gap: 8px; padding: 12px 20px; background: rgba(0,0,0,0.2); }
.summary-item { flex: 1; background: var(--bg-dark); border: 1px solid var(--border); padding: 8px; text-align: center; display: flex; flex-direction: column; }
.summary-item .num { font-size: 16px; font-weight: bold; color: #fff; }
.summary-item .txt { font-size: 11px; color: var(--text-sec); }
.summary-item.success .num { color: var(--warning); /* 在归还页，成功=可归还=Warning色 */ }
.summary-item.warning .num { color: #555; /* 不可用=已在库=灰色 */ }

.batch-list-scroll { flex: 1; background: transparent; }
.batch-list { padding: 0 20px; }
.batch-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
.item-left .b-name { color: #fff; font-size: 13px; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-left .b-code { color: var(--text-sec); font-size: 11px; font-family: monospace; }
.item-right { display: flex; align-items: center; gap: 8px; }
.mini-tag { font-size: 10px; padding: 1px 4px; border-radius: 2px; }
.b-pos { color: var(--success); font-size: 12px; }
.btn-icon-remove { background: none; border: none; color: var(--text-sec); cursor: pointer; padding: 2px; }
.btn-icon-remove:hover { color: var(--error); }
.batch-warning { background: rgba(85, 85, 85, 0.2); color: #aaa; padding: 6px; font-size: 11px; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; border: 1px solid #444; }

</style>
