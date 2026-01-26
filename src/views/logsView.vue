<template>
  <div class="log-audit-wrapper">
    <div class="page-container theme-dark log-page">
      <!-- 顶部导航 -->
      <header class="header-bar">
        <div class="header-left">
          <div class="icon-box-glow">
            <el-icon :size="24" class="primary-icon">
              <Memo />
            </el-icon>
          </div>
          <div class="title-text">
            <h1>日志审计</h1>
            <span class="sub-title">数据溯源 · 全程留痕 · 安全审计</span>
          </div>
        </div>
        <div class="header-right">
          <!-- 使用原生 button，添加 SwitchButton 图标，并加入点击声 -->
          <button class="btn-exit" @click="router.back()">
            <el-icon>
              <SwitchButton />
            </el-icon>
            退出返回
          </button>
        </div>
      </header>

      <div class="main-body">
        <!-- 左侧分类切换 -->
        <aside class="log-sidebar">
          <div v-for="menu in menuOptions" :key="menu.value" class="menu-item"
            :class="{ active: activeCategory === menu.value }" @click="handleCategoryChange(menu.value)">
            <el-icon>
              <component :is="menu.icon" />
            </el-icon>
            <span>{{ menu.label }}</span>
            <div class="active-indicator"></div>
          </div>
        </aside>

        <!-- 右侧内容区 -->
        <section class="log-content">
          <!-- 1. 修改后的搜索控制栏 -->
          <div class="filter-panel">
            <!-- 日期依然保留在外，因为它是最常用的 -->
            <el-date-picker v-model="filterDate" type="daterange" range-separator="至" start-placeholder="开始日期"
              end-placeholder="结束日期" value-format="YYYY-MM-DD" class="cyber-date-picker" @change="handleDateChange"
              popper-class="cyber-date-picker-popper" />

            <!-- 高级筛选触发按钮 -->
            <!--
            <el-button class="cyber-filter-btn" @click="filterVisible = true">
              <el-icon>
                <Filter />
              </el-icon>
              高级筛选
              <span v-if="Object.values(searchForm).some(v => v !== '')" class="filter-badge">!</span>
            </el-button>
          -->
            <div style="width: 550px"></div>
            <!--
            <el-button class="cyber-search-btn" @click="fetchLogs">执行查询</el-button>
          -->
          </div>

          <!-- 数据表格 -->
          <div class="table-container">
            <el-table :data="tableData" highlight-current-row v-loading="loading" class="cyber-table" height="100%">
              <!-- ================= 分支 A：操作轨迹 / 报警日志 (Logs表) ================= -->
              <template v-if="activeCategory === 'OP_LOG' || activeCategory === 'ALARM'">
                <el-table-column prop="displayTime" label="时间" width="190" />
                <el-table-column v-if="activeCategory === 'OP_LOG'" prop="username" label="操作人" width="150" />
                <el-table-column prop="action" label="动作" width="120">
                  <template #default="scope">
                    <!-- 将 scope.row.log_level === '报警' 改为 scope.row.action === '报警事件' -->
                    <span :class="[
                      'tag-status',
                      scope.row.action === '报警事件' ? 'tag-alarm' : 'tag-normal',
                    ]">
                      {{ scope.row.action }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="详细描述" show-overflow-tooltip>
                  <template #default="scope">
                    <span class="desc-text">{{ scope.row.description }}</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="activeCategory === 'OP_LOG'" label="详情" width="100">
                  <template #default="scope">
                    <el-button link type="primary" @click="showTraceDetail(scope.row)">查看轨迹</el-button>
                  </template>
                </el-table-column>
              </template>

              <!-- ================= 分支 C：入库日志 / 出库日志 ================= -->
              <template v-else-if="activeCategory === 'STOCK_IN' || activeCategory === 'STOCK_OUT'">
                <!-- 1. 装备实照 -->
                <el-table-column label="装备实照" width="130">
                  <template #default="scope">
                    <el-image class="equip-column-image" :src="scope.row.group_image"
                      :preview-src-list="[scope.row.group_image]" preview-teleported fit="cover">
                      <template #placeholder>
                        <div class="image-slot-loading"><el-icon class="is-loading">
                            <Loading />
                          </el-icon></div>
                      </template>
                      <template #error>
                        <div class="image-error-slot"><el-icon>
                            <Picture />
                          </el-icon></div>
                      </template>
                    </el-image>
                  </template>
                </el-table-column>

                <!-- 2. 装备名称与编号 -->
                <el-table-column prop="group_name" label="装备名称" width="150" />
                <el-table-column prop="group_code" label="装备编号" width="150" />

                <!-- 3. 时间 -->
                <el-table-column prop="displayTime" label="时间" width="190" />

                <!-- 4. 动作 -->
                <el-table-column prop="action" label="动作" width="120">
                  <template #default="scope">
                    <span class="tag-status tag-normal">{{ scope.row.action }}</span>
                  </template>
                </el-table-column>

                <!-- 5. 操作人员 -->
                <el-table-column prop="username" label="操作人员" width="150" />

                <!-- 6. 详情 -->
                <el-table-column prop="description" label="详情描述" show-overflow-tooltip>
                  <template #default="scope">
                    <span class="desc-text">{{ scope.row.description }}</span>
                  </template>
                </el-table-column>
              </template>

              <!-- ================= 分支 B：领用记录 / 归还记录 (BorrowRecords表) ================= -->
              <template v-else>
                <!-- 新增：装备实照字段 -->
                <el-table-column label="装备实照" width="130">
                  <template #default="scope">
                    <el-image class="equip-column-image" :src="scope.row.group_image"
                      :preview-src-list="[scope.row.group_image]" preview-teleported fit="cover">
                      <!-- [新增] 加载占位，防止闪白 -->
                      <template #placeholder>
                        <div class="image-slot-loading">
                          <el-icon class="is-loading">
                            <Loading />
                          </el-icon>
                        </div>
                      </template>

                      <template #error>
                        <div class="image-error-slot">
                          <el-icon>
                            <Picture />
                          </el-icon>
                        </div>
                      </template>
                    </el-image>
                  </template>
                </el-table-column>
                <!-- 1. 装备信息 -->
                <el-table-column prop="group_name" label="装备名称" width="150" />
                <el-table-column prop="group_code" label="装备编号" width="150" />

                <!-- 2. 时间详情 (领用显示单行，归还显示起止) -->
                <el-table-column :label="activeCategory === 'RETURN' ? '归还/领用时间' : '领用时间'" width="220">
                  <template #default="scope">
                    <div v-if="activeCategory === 'RETURN'" class="time-chain">
                      <div class="time-node end">还：{{ scope.row.return_time }}</div>
                      <div class="time-node start">领：{{ scope.row.borrow_time }}</div>
                    </div>
                    <div v-else class="time-single">
                      {{ scope.row.borrow_time }}
                    </div>
                  </template>
                </el-table-column>

                <!-- 3. 人员详情 (归还时显示 归还人+领用人) -->
                <el-table-column label="人员详情" width="180">
                  <template #default="scope">
                    <div v-if="activeCategory === 'RETURN'" class="people-info">
                      <div class="sub-p">
                        <span class="label-mini">归还:</span> {{ scope.row.return_username }}
                      </div>
                      <div class="sub-p">
                        <span class="label-mini">领用:</span> {{ scope.row.username }}
                      </div>
                    </div>
                    <div v-else class="people-info">
                      {{ scope.row.username }}
                    </div>
                  </template>
                </el-table-column>

                <!-- 4. 备注/用途 -->
                <el-table-column label="用途/备注">
                  <template #default="scope">
                    <span class="remark-text">
                      {{
                        activeCategory === 'RETURN'
                          ? scope.row.return_remark || '正常归还'
                          : scope.row.remark || '-'
                      }}
                    </span>
                  </template>
                </el-table-column>
              </template>
            </el-table>
          </div>

          <!-- 分页 -->
          <div class="pagination-box">
            <el-pagination background layout="total, prev, pager, next" :total="total" :page-size="20"
              v-model:current-page="currentPage" @current-change="fetchLogs" />
          </div>
        </section>
      </div>

      <!-- 修改后的轨迹详情弹窗 -->
      <el-dialog v-model="detailVisible" title="操作轨迹详情" center width="650px" class="cyber-dialog" align-center
        destroy-on-close>
        <div class="trace-detail-container">
          <!-- 优化1：解决粘连问题，增加布局控制 -->
          <div class="user-info-mini">
            <div class="info-item">
              <span class="label">操作人：</span>
              <span class="value">{{ currentLog.username }}</span>
            </div>
            <div class="info-item">
              <span class="label">时间：</span>
              <span class="value">{{ currentLog.displayTime }}</span>
            </div>
          </div>

          <!-- 优化2：增加标题修饰 -->
          <div class="trace-header">
            <el-icon>
              <List />
            </el-icon>
            轨迹指令流水
          </div>

          <div class="trace-content custom-scroll">
            <div v-for="(line, index) in formattedDescription" :key="index" class="trace-item">
              <span class="trace-time">{{ line.time }}</span>
              <span class="trace-desc">{{ line.text }}</span>
            </div>
          </div>
        </div>
      </el-dialog>
    </div>
    <!-- 2. 新增：高级筛选弹窗 -->
    <el-dialog v-model="filterVisible" title="条件筛选" width="450px" class="cyber-dialog filter-dialog" align-center>
      <div class="filter-form">
        <div class="filter-row">
          <label>操作人员</label>
          <el-input v-model="searchForm.username" placeholder="请输入人员姓名" class="cyber-input" clearable />
        </div>
        <div class="filter-row">
          <label>装备名称</label>
          <el-input v-model="searchForm.group_name" placeholder="请输入装备名称" class="cyber-input" clearable />
        </div>
        <div class="filter-row">
          <label>装备编号</label>
          <el-input v-model="searchForm.group_code" placeholder="请输入装备编号" class="cyber-input" clearable />
        </div>
        <div class="filter-row" v-if="activeCategory === 'OP_LOG'">
          <label>具体动作</label>
          <el-input v-model="searchForm.action" placeholder="如：扫码、领用" class="cyber-input" clearable />
        </div>
      </div>
      <template #footer>
        <div class="filter-footer">
          <el-button @click="resetFilters" class="btn-reset">重置条件</el-button>
          <el-button @click="handleAdvancedSearch" class="btn-submit">开始搜索</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import {
  Memo,
  //Search,
  List,
  Warning,
  CircleCheck,
  RefreshLeft,
  Upload,
  Download,
  SwitchButton,
  Picture, // 新增：用于图片占位
  Loading, // 新增
  /*
  Filter, // 新增
  Delete, // 新增
  Refresh // 新增
  */
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
// 在 script setup 顶部导入部分添加
import { useAudioStore } from '@/stores/audioStore' // 引入音频 Store
const audioStore = useAudioStore() // 初始化
const router = useRouter()

// 菜单配置
const menuOptions = [
  { label: '操作轨迹', value: 'OP_LOG', icon: List },
  { label: '报警日志', value: 'ALARM', icon: Warning },
  { label: '领用记录', value: 'BORROW', icon: Download },
  { label: '归还记录', value: 'RETURN', icon: Upload },
  { label: '入库日志', value: 'STOCK_IN', icon: RefreshLeft },
  { label: '出库日志', value: 'STOCK_OUT', icon: CircleCheck },
]

// 状态变量
const activeCategory = ref('OP_LOG')
const tableData = ref([])
const total = ref(0)
const currentPage = ref(1)
const loading = ref(false)
const filterDate = ref([])
const detailVisible = ref(false)
const currentLog = ref({})

const equipmentImageMap = ref({}) // 存储 { '编号': '图片路径' }
const fetchEquipmentMap = async () => {
  const map = {}
  let currentPage = 1
  let hasMoreData = true
  const pageSize = 15 // 因为含有图片Base64，建议每页数量不要太大

  console.log('开始分页拉取装备实照映射表...')

  try {
    while (hasMoreData) {
      const response = await window.electronAPI.el_post({
        action: 'queryPagination',
        payload: {
          tableName: 'equipment',
          page: currentPage,
          pageSize: pageSize,
        },
      })

      if (response.success && response.data?.data?.length > 0) {
        response.data.data.forEach((item) => {
          if (item.id) {
            // 关键：强制转字符串并去空格，确保匹配成功率
            const codeKey = String(item.id).trim()
            map[codeKey] = item.group_image
          }
        })

        // 判断是否还有下一页
        if (response.data.data.length < pageSize) {
          hasMoreData = false
        } else {
          currentPage++
        }
      } else {
        hasMoreData = false
      }
    }

    equipmentImageMap.value = map
    console.log('装备实照库加载完成，总计匹配到编号数:', Object.keys(map).length)
  } catch (error) {
    console.error('分页获取装备图片映射失败:', error)
  }
}
// 增加处理日期变化的函数
const handleDateChange = () => {
  // 1. 播放点击音效 (保持交互一致性)
  audioStore.play('/audio/调取指定时段日志.mp3')

  // 2. 将页码重置为 1 (防止在旧页码找不到新筛选条件下的数据)
  currentPage.value = 1

  // 3. 执行查询
  fetchLogs()

  // val 如果为 null 说明用户点击了清除按钮，fetchLogs 内部已处理空数组逻辑
}

const formattedDescription = computed(() => {
  if (!currentLog.value.description) return []

  // 将字符串按行分割
  const lines = currentLog.value.description.split('\n')

  return lines
    .map((line) => {
      // 使用正则匹配 [时间] 内容，或者根据第一个空格/右中括号拆分
      // 假设格式为: [2025-01-15 10:00:00] 操作了某某装备
      const match = line.match(/^(\[.*?\])\s*(.*)/)
      if (match) {
        return {
          time: match[1], // 提取时间部分
          text: match[2], // 提取描述部分
        }
      }
      return { time: '', text: line } // 如果不符合格式，则全部作为描述
    })
    .filter((item) => item.time || item.text) // 过滤掉空行
})

// 核心逻辑：数据请求
// --- 修改 1: fetchLogs ---
const fetchLogs = async () => {
  tableData.value = []
  loading.value = true
  try {
    const payload = {
      page: currentPage.value,
      pageSize: 20,
      condition: buildCondition(),
      orderBy:
        activeCategory.value === 'RETURN'
          ? 'return_time DESC'
          : activeCategory.value === 'BORROW'
            ? 'borrow_time DESC'
            : 'timestamp DESC',
    }

    let response
    if (['OP_LOG', 'ALARM', 'STOCK_IN', 'STOCK_OUT'].includes(activeCategory.value)) {
      response = await window.electronAPI.el_post({
        action: 'queryPagination',
        payload: { ...payload, tableName: 'logs' },
      })
    } else {
      response = await window.electronAPI.el_post({
        action: 'queryPagination',
        payload: { ...payload, tableName: 'borrow_records' },
      })
    }

    if (response.success) {
      tableData.value = response.data.data.map((item) => {
        // --- 核心匹配逻辑优化 ---
        // 1. 获取当前日志行的编号，并进行清洗
        const currentCode = item.equipment_id ? String(item.equipment_id).trim() : ''

        // 2. 从内存 Map 中寻找对应的图片
        const matchedImage = equipmentImageMap.value[currentCode] || item.group_image || ''

        return {
          ...item,
          displayTime: item.timestamp || '未知时间',
          group_image: matchedImage, // 注入图片
        }
      })
      total.value = response.data.total
    }
  } catch (error) {
    console.error('Fetch logs failed:', error)
  } finally {
    loading.value = false
  }
}

// --- 状态变量修改 ---
const filterVisible = ref(false) // 控制筛选弹窗
const searchForm = ref({
  username: '',
  group_name: '',
  group_code: '',
  action: '',
})
// 搜索执行
const handleAdvancedSearch = () => {
  currentPage.value = 1
  fetchLogs()
  filterVisible.value = false // 搜索后关闭弹窗
}

// 重置搜索
const resetFilters = () => {
  searchForm.value = { username: '', group_name: '', group_code: '', action: '' }
  filterDate.value = []
  handleAdvancedSearch()
}
// --- 核心逻辑修改：构建SQL条件 ---
// --- 修改 2: buildCondition ---
const buildCondition = () => {
  let cond = []

  // 1. 基础分类过滤
  if (activeCategory.value === 'OP_LOG') {
    if (!searchForm.value.action) cond.push("(action = '装备领用' OR action = '装备归还')")
  } else if (activeCategory.value === 'ALARM') {
    cond.push("action = '报警事件'")
  } else if (activeCategory.value === 'RETURN') {
    cond.push('status = 1') // 归还分类只看已还
  }// === 新增：入库和出库的过滤条件 ===
  else if (activeCategory.value === 'STOCK_IN') {
    cond.push("action = '装备入库'") // 根据你数据库存的具体字符匹配
  } else if (activeCategory.value === 'STOCK_OUT') {
    cond.push("(action = '装备出库' OR action = '删除装备')")
  }
  // BORROW 不加条件，看全部领用

  // 2. 日期范围：匹配不同表的时间字段
  if (filterDate.value?.length === 2) {
    let timeField = 'timestamp'
    if (activeCategory.value === 'BORROW') timeField = 'borrow_time'
    if (activeCategory.value === 'RETURN') timeField = 'return_time'
    cond.push(
      `${timeField} BETWEEN '${filterDate.value[0]} 00:00:00' AND '${filterDate.value[1]} 23:59:59'`,
    )
  }

  // 3. 人员搜索：如果是归还记录，搜“领用人”或“归还人”
  if (searchForm.value.username) {
    if (activeCategory.value === 'RETURN') {
      cond.push(
        `(username LIKE '%${searchForm.value.username}%' OR return_username LIKE '%${searchForm.value.username}%')`,
      )
    } else {
      cond.push(`username LIKE '%${searchForm.value.username}%'`)
    }
  }

  // 4. 常规模糊查询
  if (searchForm.value.group_name) cond.push(`group_name LIKE '%${searchForm.value.group_name}%'`)
  if (searchForm.value.group_code) cond.push(`group_code LIKE '%${searchForm.value.group_code}%'`)

  // 仅在 logs 表分类下才增加 action 搜索，防止报错
  if (
    searchForm.value.action &&
    (activeCategory.value === 'OP_LOG' || activeCategory.value === 'ALARM')
  ) {
    cond.push(`action LIKE '%${searchForm.value.action}%'`)
  }

  return cond.join(' AND ')
}

const handleCategoryChange = (val) => {
  // === 添加这一行 ===
  audioStore.play('/audio/按钮点击声.mp3')
  activeCategory.value = val
  currentPage.value = 1
  fetchLogs()
}

const showTraceDetail = (row) => {
  currentLog.value = row
  detailVisible.value = true
}

onMounted(async () => {
  await fetchEquipmentMap() // 先拿图片映射表
  fetchLogs() // 再拿日志数据
})
</script>

<style scoped>
/* 使用外层包裹类，定义局部变量，防止污染并解决变量缺失问题 */
.log-audit-wrapper {
  --primary: #00f2ff;
  --bg-dark: #0a0f18;
  --border-color: #1e293b;
  --text-main: #ccdbe8;
  --text-dim: #8899a6;
  --primary-dark: #0099a1;
  /* 新增：用于副标题 */
  --border: #2a3546;
  /* 统一变量名 */
  --active-bg: #1c2538;
  /* 新增：用于图标背景 */

  background-color: var(--bg-dark);
  height: 100vh;
  width: 100%;
  color: var(--text-main);
  overflow: hidden;
}

.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 顶部导航 */
/* 1. 顶部栏背景与高度 */
.header-bar {
  height: 70px;
  background: #11151f;
  /* 统一颜色 */
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
  flex-shrink: 0;
  z-index: 10;
}

/* 2. 左侧对齐 */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  /* 装备页面是 12px */
}

/* 3. 图标外框 (核心改动：固定宽高 + 边框 + 发光) */
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
  padding: 0;
  /* 删除之前的 padding */
}

.primary-icon {
  color: var(--primary);
}

/* 4. 主标题 (文字阴影与字号) */
.title-text h1 {
  margin: 0;
  font-size: 22px;
  /* 增加到 22px */
  font-weight: 600;
  letter-spacing: 1px;
  color: #fff;
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  line-height: 1.2;
}

/* 5. 副标题 (颜色由灰变青蓝色，加粗) */
.sub-title {
  color: var(--primary-dark);
  /* 使用 #0099a1 */
  font-size: 12px;
  letter-spacing: 1px;
  font-weight: bold;
  display: block;
  margin-top: 2px;
}

/* 主体布局 */
.main-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  /* 关键：防止主容器溢出 */
}

/* 侧边栏 */
.log-sidebar {
  width: 130px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid var(--border-color);
  padding: 15px 10px;
}

.menu-item {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 6px;
  color: var(--text-dim);
  cursor: pointer;
  border-radius: 6px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  /* --- 在这里修改字体大小 --- */
  font-size: 14px;
  /* 原代码未指定，默认通常是 14px，你可以改为 15px 或 16px */
}

.menu-item:hover {
  background: rgba(0, 242, 255, 0.05);
  color: #fff;
}

.menu-item.active {
  background: linear-gradient(90deg, rgba(0, 242, 255, 0.15) 0%, transparent 100%);
  color: var(--primary);
  font-weight: 600;
}

.active-indicator {
  position: absolute;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--primary);
  box-shadow: 0 0 10px var(--primary);
  opacity: 0;
}

.menu-item.active .active-indicator {
  opacity: 1;
}

/* 内容区 */
.log-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: radial-gradient(circle at top right, rgba(0, 242, 255, 0.03), transparent);
  overflow: hidden;
}

.filter-panel {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* 覆盖 ElementPlus 样式 */
:deep(.cyber-input) .el-input__wrapper {
  background-color: rgba(20, 27, 45, 0.8) !important;
  box-shadow: 0 0 0 1px #2a3546 inset !important;
}

:deep(.cyber-date-picker).el-range-editor.el-input__wrapper {
  background-color: rgba(20, 27, 45, 0.8) !important;
  box-shadow: 0 0 0 1px #2a3546 inset !important;
}

.table-container {
  flex: 1;
  border: 1px solid var(--border-color);
  background: rgba(13, 18, 28, 0.4);
  border-radius: 4px;
  overflow: hidden;
}

/* 表格深度样式调整 */
:deep(.cyber-table) {
  background-color: transparent !important;
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(30, 41, 59, 0.5);
  --el-table-border-color: var(--border-color);
  --el-table-text-color: var(--text-main);
}

:deep(.cyber-table .el-table__cell) {
  border-bottom: 1px solid var(--border-color);
}

/* 标签样式 */
.tag-status {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
  border: 1px solid transparent;
}

.tag-alarm {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  border-color: #ff4d4f;
}

.tag-normal {
  color: var(--primary);
  background: rgba(0, 242, 255, 0.1);
  border-color: var(--primary);
}

.pagination-box {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 详情弹窗 */
.trace-content {
  background: #05080c;
  border: 1px solid var(--border-color);
  padding: 15px;
  max-height: 350px;
  overflow-y: auto;
  border-radius: 4px;
}

/* 1. 删除原有的 pre 样式 */
/* pre { ... } <- 删掉这段 */

/* 2. 修改 trace-content 内部样式 */
.trace-content {
  background: #0d121c !important;
  border: 1px solid var(--border);
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 4px;
}

/* 3. 新增 trace-item 布局样式 */
.trace-item {
  display: flex;
  /* 使用 Flex 布局 */
  gap: 12px;
  /* 时间和描述之间的间距 */
  margin-bottom: 8px;
  /* 行间距 */
  line-height: 1.6;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  align-items: flex-start;
  /* 顶部对齐 */
}

.trace-time {
  color: #8899a6;
  /* 时间颜色：灰色 */
  white-space: nowrap;
  /* 时间不换行 */
  flex-shrink: 0;
  /* 防止时间被挤压 */
}

.trace-desc {
  color: #00ff9d;
  /* 描述颜色：黑客绿 */
  word-break: break-all;
  /* 允许在任意字符间换行 */
  flex: 1;
  /* 占据剩余所有宽度，确保换行后对齐 */
}

/* 滚动条美化 */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: #2a3546;
  border-radius: 3px;
}

/* 1. 在变量区添加错误色 (红色) */
.log-audit-wrapper {
  --error: #ff4d4f;
  /* 新增红色变量 */
  /* ... 其他变量保持不变 ... */
}

/* 2. 添加返回按钮的专用样式 */
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

/* 查询按钮自定义样式 */
.cyber-search-btn {
  background: transparent !important;
  border: 1px solid var(--primary) !important;
  color: var(--primary) !important;
  padding: 0 20px;
  height: 32px;
  /* 与输入框对齐 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.cyber-search-btn:hover {
  background: rgba(0, 242, 255, 0.1) !important;
  box-shadow: 0 0 12px rgba(0, 242, 255, 0.4);
  color: #fff !important;
  border-color: var(--primary) !important;
}

.cyber-search-btn:active {
  transform: scale(0.95);
  background: rgba(0, 242, 255, 0.2) !important;
}

/* ================= 分页组件赛博朋克化重塑 ================= */

.pagination-box {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 10px 0;
}

/* 1. 基础容器背景透明 */
:deep(.el-pagination) {
  --el-pagination-bg-color: transparent !important;
  --el-pagination-button-bg-color: rgba(20, 27, 45, 0.8) !important;
}

/* 2. 总条数文字颜色 */
:deep(.el-pagination__total) {
  color: var(--text-dim) !important;
  font-size: 13px;
}

/* 3. 修改数字按钮、上一页、下一页的默认样式 */
:deep(.el-pagination.is-background .el-pager li),
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  background-color: rgba(20, 27, 45, 0.8) !important;
  border: 1px solid var(--border-color) !important;
  color: var(--text-dim) !important;
  border-radius: 4px;
  transition: all 0.3s;
}

/* 4. 鼠标悬停时：边框变青色，文字变亮 */
:deep(.el-pagination.is-background .el-pager li:hover),
:deep(.el-pagination.is-background .btn-prev:hover),
:deep(.el-pagination.is-background .btn-next:hover) {
  border-color: var(--primary) !important;
  color: var(--primary) !important;
}

/* 5. 激活（当前页）状态：青色底、青色边、发光效果 */
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: rgba(0, 242, 255, 0.15) !important;
  border-color: var(--primary) !important;
  color: var(--primary) !important;
  font-weight: bold;
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
  text-shadow: 0 0 5px rgba(0, 242, 255, 0.5);
}

/* 6. 禁用状态 */
:deep(.el-pagination.is-background .btn-prev:disabled),
:deep(.el-pagination.is-background .btn-next:disabled) {
  border-color: #1a222d !important;
  color: #3d4959 !important;
  cursor: not-allowed;
}

/* ================= 加载动画赛博朋克化 ================= */

/* 1. 修改加载图标（旋转圆圈）的颜色 */
:deep(.el-loading-spinner .path) {
  stroke: var(--primary) !important;
  stroke-width: 3;
}

/* 2. 修改加载文字的颜色 */
:deep(.el-loading-spinner .el-loading-text) {
  color: var(--primary) !important;
  font-family: 'Segoe UI', sans-serif;
  letter-spacing: 2px;
  text-shadow: 0 0 8px rgba(0, 242, 255, 0.5);
}

/* 3. 强制覆盖遮罩层背景（作为双重保险） */
:deep(.el-loading-mask) {
  background-color: rgba(10, 15, 24, 0.8) !important;
}

/* ================= 表格行高亮重塑 (去灰白) ================= */

/* 1. 鼠标悬停行时的背景色 (由灰白改为暗青色) */
:deep(.cyber-table .el-table__row:hover > td) {
  background-color: rgba(0, 242, 255, 0.08) !important;
}

/* 2. 点击选中行后的背景色 (彻底去除默认灰白) */
:deep(.cyber-table .el-table__row.current-row > td) {
  background-color: rgba(0, 242, 255, 0.15) !important;
  /* 选中的底色 */
  border-top: 1px solid var(--primary) !important;
  /* 选中行的顶部发光线 */
  border-bottom: 1px solid var(--primary) !important;
  /* 选中行的底部发光线 */
  color: #fff !important;
  /* 确保文字清晰 */
}

/* 3. 选中行时的文字高亮 (可选) */
:deep(.cyber-table .el-table__row.current-row td) {
  color: var(--primary) !important;
}

/* 4. 去除表格底层可能透出来的白色 */
:deep(.el-table__inner-wrapper::before) {
  display: none;
  /* 去除表格底部横线 */
}

:deep(.el-table__body tr.current-row + tr > td) {
  border-top: none;
  /* 防止双重边框 */
}

/* ================= 轨迹弹窗重塑 (去白、扩距、优化) ================= */

/* 1. 彻底覆盖 Dialog 全局样式 */
:deep(.cyber-dialog.el-dialog) {
  background: #141b2d !important;
  /* 深蓝色背景 */
  border: 1px solid var(--primary-dark) !important;
  box-shadow: 0 0 25px rgba(0, 0, 0, 0.5);
  border-radius: 8px;
}

/* 2. 修改标题颜色及边框 */
:deep(.cyber-dialog .el-dialog__header) {
  margin-right: 0;
  padding: 20px;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
}

:deep(.cyber-dialog .el-dialog__title) {
  color: var(--primary) !important;
  font-weight: bold;
  letter-spacing: 1px;
}

/* 3. 修改关闭按钮颜色 */
:deep(.cyber-dialog .el-dialog__headerbtn .el-dialog__close) {
  color: var(--primary) !important;
}

/* 4. 弹窗主体内容区 */
:deep(.cyber-dialog .el-dialog__body) {
  padding: 20px !important;
  background: transparent !important;
}

/* 5. 解决操作人和时间粘连问题 */
.user-info-mini {
  display: flex;
  gap: 30px;
  /* 增加两个信息块之间的间距 */
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.03);
  padding: 12px 15px;
  border-radius: 4px;
  border-left: 3px solid var(--primary);
}

.info-item .label {
  color: var(--text-dim);
  font-size: 13px;
}

.info-item .value {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}

/* 6. 轨迹内容区优化 */
.trace-header {
  font-size: 13px;
  color: var(--primary);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 5px;
  opacity: 0.8;
}

.trace-content {
  background: #0d121c !important;
  /* 更深的背景色 */
  border: 1px solid var(--border);
  padding: 15px;
  max-height: 400px;
  overflow-y: auto;
  border-radius: 4px;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.5);
}

pre {
  color: #00ff9d !important;
  /* 保持黑客绿，但增加可读性 */
  font-family: 'Consolas', 'Monaco', monospace;
  white-space: pre-wrap;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
}

/* 优化弹窗遮罩层颜色（可选，全局有效） */
:deep(.el-overlay) {
  background-color: rgba(0, 0, 0, 0.7) !important;
}

/* 高级筛选按钮样式 */
.cyber-filter-btn {
  background: rgba(0, 242, 255, 0.05) !important;
  border: 1px solid var(--border) !important;
  color: #fff !important;
  position: relative;
}

.cyber-filter-btn:hover {
  border-color: var(--primary) !important;
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
}

.filter-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4d4f;
  color: white;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 5px #ff4d4f;
}

/* 筛选弹窗表单布局 */
.filter-form {
  padding: 10px 5px;
}

.filter-row {
  margin-bottom: 18px;
}

.filter-row label {
  display: block;
  color: var(--primary);
  font-size: 12px;
  margin-bottom: 8px;
  letter-spacing: 1px;
}

/* 弹窗底部按钮自定义 */
.filter-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding-bottom: 10px;
}

.btn-reset {
  background: transparent !important;
  border: 1px solid #475569 !important;
  color: #94a3b8 !important;
}

.btn-submit {
  background: var(--primary) !important;
  border: none !important;
  color: #000 !important;
  font-weight: bold !important;
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
}

.btn-submit:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 242, 255, 0.6);
}

/* 时间链排版 */
.time-chain {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-node {
  font-size: 14px;
  font-family: 'Consolas', monospace;
  white-space: nowrap;
}

.time-node.end {
  color: var(--primary);
}

/* 归还时间用青色 */
.time-node.start {
  color: #8899a6;
}

/* 领用时间用灰色 */

/* 人员信息排版 */
.people-info {
  line-height: 1.4;
  font-size: 13px;
}

.sub-p {
  font-size: 13px;
  color: #8899a6;
  margin-top: 2px;
}

.label-mini {
  opacity: 0.5;
  font-size: 14px;
  margin-right: 4px;
}

/* 备注限制 */
.remark-text {
  font-size: 14px;
  color: #ccdbe8;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 装备实照列图片样式 */
.equip-column-image {
  width: 90px;
  height: 60px;
  border-radius: 4px;
  border: 1px solid var(--border);
  /* [核心修改] 即使图片没加载出来，也要显示这个深色底，防止闪白 */
  background-color: #0d121c !important;
  display: block;
  margin: 0;
  transition: all 0.3s;
}

.equip-column-image:hover {
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
  transform: scale(1.05);
  cursor: pointer;
}

/* [新增] 加载中插槽样式 */
.image-slot-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #0d121c;
  /* 必须是深色 */
  color: var(--primary);
  /* 加载图标用青色 */
}

/* 统一错误占位样式 */
.image-error-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #0d121c;
  /* 必须是深色 */
  color: #3d4959;
  font-size: 20px;
}

/* 让加载图标转起来 */
.is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
<style>
/*
在 Element Plus 中，日期选择器（el-date-picker）的下拉面板默认是弹出并挂载到 body 上的。
由于它不在当前组件的 DOM 树内，普通的 scoped 样式无法触及它。
要实现“深色背景”且“避免全局污染”，最佳实践是使用 popper-class 属性，
配合一个特定的类名来锁定样式。
命名空间化：通过 popper-class="cyber-date-picker-popper"，Element Plus 会在弹出的那个 div 上加上这个独一无二的类名。
精准打击：我们的 CSS 选择器全部以 .cyber-date-picker-popper 开头。这意味着即使页面上有其他的 el-date-picker（没有加这个类名的）
，它们依然会保持原生的白色外观。
Scoped 之外的必要性：Vue 的 scoped 样式是通过给组件内 DOM 添加 data-v-xxxx 属性实现的，而弹出层是直接挂在 body 下的，
没有这个属性。所以必须写在非 scoped 中，并利用类名做人工隔离。
  */
/* 注意：这段样式不要写在 scoped 里面，或者写在全局样式文件中 */
/* 使用特定的类名 cyber-date-picker-popper 确保只影响当前的日期选择器 */

/* 1. 整体面板背景与边框 */
.cyber-date-picker-popper.el-picker__popper {
  background: #141b2d !important;
  border: 1px solid #1e293b !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
}

.cyber-date-picker-popper .el-picker-panel {
  background: #141b2d !important;
  color: #ccdbe8 !important;
}

/* 2. 中间分隔线 */
.cyber-date-picker-popper .el-date-range-picker__content.is-left {
  border-right: 1px solid #2a3546 !important;
}

/* 3. 头部文字（年份/月份） */
.cyber-date-picker-popper .el-date-range-picker__header div,
.cyber-date-picker-popper .el-picker-panel__icon-btn {
  color: #00f2ff !important;
}

/* 4. 星期列标题 */
.cyber-date-picker-popper .el-date-table th {
  color: #8899a6 !important;
  border-bottom: 1px solid #2a3546 !important;
}

/* 5. 日期数字：普通状态 */
.cyber-date-picker-popper .el-date-table td.available {
  color: #ccdbe8 !important;
}

/* 6. 日期数字：悬停状态 */
.cyber-date-picker-popper .el-date-table td:hover span {
  background-color: rgba(0, 242, 255, 0.2) !important;
  color: #fff !important;
}

/* 7. 日期数字：选中范围内的底色 */
.cyber-date-picker-popper .el-date-table td.in-range .el-date-table-cell {
  background-color: rgba(0, 242, 255, 0.05) !important;
}

/* 8. 日期数字：起始和结束日期的圆点 */
.cyber-date-picker-popper .el-date-table td.start-date span,
.cyber-date-picker-popper .el-date-table td.end-date span {
  background-color: #00f2ff !important;
  color: #000 !important;
  font-weight: bold !important;
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
}

/* 9. 底部按钮区域（如果有） */
.cyber-date-picker-popper .el-picker-panel__footer {
  background: #0d121c !important;
  border-top: 1px solid #2a3546 !important;
}

/* 10. 针对“今天”的颜色 */
.cyber-date-picker-popper .el-date-table td.today span {
  color: #00f2ff !important;
  font-weight: bold;
}

/* 11. 修正小箭头颜色 */
.cyber-date-picker-popper .el-popper__arrow::before {
  background: #141b2d !important;
  border: 1px solid #1e293b !important;
}
</style>
