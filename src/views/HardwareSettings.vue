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
          <h1>硬件通信配置</h1>
          <span class="sys-config-sub-title">串口链路 · 门锁控制器 · 传感器映射</span>
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
                <div class="hw-status-label">当前在线门控板 ID</div>
                <div class="hw-address-tags">
                  <div v-for="addr in form_lock.expansion_board_addresses" :key="addr" class="hw-tag-item">
                    <span class="hw-status-dot active"></span>
                    {{ addr }} 号板
                  </div>
                  <div v-if="!form_lock.expansion_board_addresses.length" class="hw-tag-empty">未扫描到门控设备</div>
                </div>
              </div>

              <el-row :gutter="20">
                <el-col :span="24" class="sys-mb-15">
                  <el-form-item label="门锁起始映射编号">
                    <el-input v-model="form_lock.initialAddress" size="large" class="sys-config-input"
                      placeholder="例如：1">
                      <template #prefix><el-icon>
                          <Key />
                        </el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="物理门锁安装数量">
                    <el-input v-model="form_lock.quantity" size="large" class="sys-config-input" placeholder="范围 1-2">
                      <template #prefix><el-icon>
                          <Operation />
                        </el-icon></template>
                    </el-input>
                  </el-form-item>
                </el-col>
              </el-row>

              <div class="sys-mt-20">
                <button class="sys-minor-action-btn" @click="isApplying = true">
                  <el-icon>
                    <Check />
                  </el-icon> 应用门锁地址映射
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
                <div class="hw-status-label">当前在线传感板 ID</div>
                <div class="hw-address-tags secondary">
                  <div v-for="addr in form_switch.expansion_board_addresses" :key="addr" class="hw-tag-item">
                    <span class="hw-status-dot active"></span>
                    {{ addr }} 号板
                  </div>
                  <div v-if="!form_switch.expansion_board_addresses.length" class="hw-tag-empty">未扫描到采集设备</div>
                </div>
              </div>

              <el-row :gutter="20">
                <el-col :span="12" class="sys-mb-15">
                  <el-form-item label="传感器起始编号">
                    <el-input v-model="form_switch.initialAddress" size="large" class="sys-config-input" />
                  </el-form-item>
                </el-col>
                <el-col :span="12" class="sys-mb-15">
                  <el-form-item label="本次添加数量">
                    <el-input v-model="form_switch.quantity" size="large" class="sys-config-input" />
                  </el-form-item>
                </el-col>
              </el-row>

              <!-- 已配置列表矩阵 -->
              <div class="hw-configured-container">
                <div class="hw-configured-title">
                  <el-icon>
                    <Memo />
                  </el-icon> 已注册传感器列表 ({{ form_switch.details.length }})
                </div>
                <div class="hw-node-grid">
                  <div v-for="item in form_switch.details" :key="item.self_address" class="hw-node-card">
                    <div class="hw-node-id">#{{ item.self_address }}</div>
                    <div class="hw-node-info">板{{ item.expansion_board_address }} - 通{{ item.channel_address }}</div>
                  </div>
                  <div v-if="!form_switch.details.length" class="hw-node-empty">等待对码添加...</div>
                </div>
              </div>

              <button class="sys-minor-action-btn highlight sys-mt-20" @click="isApplying = true">
                <el-icon>
                  <Pointer />
                </el-icon> 开始捕获/对码添加
              </button>
            </div>
          </div>

        </div>
      </el-scrollbar>

      <!-- 底部操作栏 -->
      <div class="sys-config-footer">
        <div class="sys-footer-left">
          <button class="sys-btn-text danger" @click="handleExit">
            <el-icon>
              <RefreshLeft />
            </el-icon> 重启硬件链路
          </button>
        </div>
        <div class="sys-footer-right">
          <button class="sys-config-save-btn" @click="handleSave">
            <div class="sys-btn-content">
              <el-icon :size="20"><Select /></el-icon>
              <div class="sys-text-group"><span class="sys-btn-main-text">保存全部配置</span></div>
            </div>
            <div class="sys-scan-line"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- 对码状态弹窗 (复用系统信息页 MessageBox 样式) -->
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Cpu, Lock, SwitchButton, Key, Operation, Compass, Memo,
  Pointer, RefreshLeft, Select, Check
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const isApplying = ref(false)
const currentId = ref('--')

// 初始化表单数据，防止页面因变量未定义而崩溃
const form_lock = reactive({
  expansion_board_addresses: [],
  initialAddress: 1,
  quantity: 1
})

const form_switch = reactive({
  expansion_board_addresses: [],
  initialAddress: 1,
  quantity: 0,
  details: []
})

const handleExit = () => {
  router.back()
}

const handleSave = () => {
  ElMessage.success('配置已暂存')
}

onMounted(() => {
  // 模拟从数据库加载数据
  form_lock.expansion_board_addresses = [201]
  form_switch.expansion_board_addresses = [1, 2, 3]
  form_switch.details = [
    { self_address: 1, expansion_board_address: 1, channel_address: 1 },
    { self_address: 2, expansion_board_address: 1, channel_address: 2 }
  ]
})
</script>

<style scoped>
/* ================= 1. 核心视觉基因 (严格对齐信息页) ================= */
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

/* ================= 2. 布局样式 (严格对齐信息页) ================= */
.sys-config-header {
  height: 70px;
  background: #11151f;
  border-bottom: 1px solid var(--sys-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px;
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
}

/* ================= 3. 硬件页专属样式 ================= */
.hw-status-panel {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--sys-border);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 20px;
}

.hw-status-label {
  font-size: 11px;
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
  animation: hw-pulse 2s infinite;
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
  font-size: 12px;
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
  max-height: 160px;
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
  font-size: 10px;
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

/* ================= 4. 复用信息页通用样式 ================= */
.sys-config-section {
  background: rgba(20, 27, 45, 0.6);
  border: 1px solid var(--sys-border);
  border-radius: 8px;
  overflow: hidden;
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

:deep(.el-form-item__label) {
  color: var(--sys-text-sec) !important;
}

.sys-config-footer {
  height: 70px;
  margin-top: 15px;
  border-top: 1px solid var(--sys-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sys-config-save-btn {
  width: 200px;
  height: 46px;
  background: linear-gradient(90deg, var(--sys-primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--sys-primary);
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.sys-btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  position: relative;
  z-index: 2;
  height: 100%;
}

.sys-scan-line {
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  animation: sysBtnScan 3s infinite;
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

@keyframes sysBtnScan {
  from {
    left: -100%;
  }

  to {
    left: 150%;
  }
}

@keyframes hw-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes hw-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 242, 255, 0.7);
  }

  70% {
    box-shadow: 0 0 0 10px rgba(0, 242, 255, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(0, 242, 255, 0);
  }
}

.sys-mb-15 {
  margin-bottom: 15px;
}

.sys-mt-20 {
  margin-top: 20px;
}

.sys-btn-text.danger {
  color: var(--sys-error);
  border: 1px solid var(--sys-error);
  background: transparent;
  padding: 6px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
</style>
