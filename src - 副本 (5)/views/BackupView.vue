<template>
  <div class="page-container theme-dark">
    <!-- ================= 顶部导航栏 ================= -->
    <header class="header-bar">
      <div class="header-left">
        <div class="icon-box-glow">
          <el-icon :size="24" class="primary-icon">
            <UserFilled />
          </el-icon>
        </div>
        <div class="title-text">
          <h1>人员管理</h1>
          <span class="sub-title">身份识别 · 权限管控 · 在岗监测</span>
        </div>
      </div>

      <div class="header-right">
        <button class="btn-exit" @click="handleExit">
          <el-icon>
            <SwitchButton />
          </el-icon> 退出返回
        </button>
      </div>
    </header>

    <!-- ================= 主体内容区 ================= -->
    <div class="main-body">

      <!-- 左侧：人员列表 -->
      <div class="list-section">
        <div class="section-title">
          <div class="title-left">
            <span class="text-glow">人员名册 ({{ filteredList.length }})</span>
            <span v-if="selectedIds.length > 0" class="selection-count">
              已选中 <span class="highlight-num">{{ selectedIds.length }}</span> 人
            </span>
          </div>

          <!-- 标签栏：筛选 duty_status -->
          <div class="filter-tabs" ref="tabsContainer">
            <div class="tab-glider" :style="gliderStyle"></div>
            <span v-for="(tab, index) in filterOptions" :key="tab.value" class="tab"
              :class="{ active: currentFilter === tab.value }" :ref="el => tabRefs[index] = el"
              @click="setFilter(tab.value)">
              {{ tab.label }}
            </span>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid">
            <div v-for="item in filteredList" :key="item.id" class="person-card" :class="{
              'active': selectedIds.includes(item.id),
              'status-out': item.duty_status !== 'active'
            }" @click="toggleSelect(item.id)">

              <!-- 选中角标 -->
              <div class="check-ribbon" v-if="selectedIds.includes(item.id)">
                <el-icon>
                  <Check />
                </el-icon>
              </div>

              <!-- 状态标签 -->
              <div class="card-status-badge" :class="getStatusClass(item.duty_status)">
                {{ getStatusLabel(item.duty_status) }}
              </div>

              <!-- 头像区域 -->
              <div class="card-avatar-box" :class="{ 'glow-active': item.duty_status === 'active' }">
                <el-avatar :size="60" :src="item.photo" shape="square" class="cyber-avatar">
                  <span style="font-size: 20px; font-weight: bold;">{{ item.real_name ? item.real_name.charAt(0) : 'U'
                  }}</span>
                </el-avatar>
              </div>

              <!-- 信息区域 -->
              <div class="card-info">
                <div class="person-name" :title="item.real_name">
                  <span v-if="item.rank" class="rank-mini-tag">{{ item.rank }}</span>
                  {{ item.real_name }}
                </div>
                <div class="person-dept">{{ item.department }} <span v-if="item.job_title">· {{ item.job_title }}</span>
                </div>
                <div class="person-code"><span class="font-mono">{{ item.service_no }}</span></div>
              </div>

              <div class="active-bar"></div>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredList.length === 0" class="no-data-tip">
              暂无匹配人员
            </div>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧：详情与操作面板 -->
      <div class="operation-section">

        <!-- 场景1：未选中 (显示添加按钮) -->
        <template v-if="selectedIds.length === 0">
          <div class="empty-placeholder">
            <div class="icon-circle glow-animate">
              <el-icon :size="50">
                <Plus />
              </el-icon>
            </div>
            <div class="empty-text">人员录入</div>
            <div class="empty-sub">点击下方按钮添加新成员</div>

            <button class="cyber-btn mt-20" style="width: 80%; margin-top: 30px;" @click="openEditDialog(null)">
              <div class="btn-content">
                <el-icon :size="20">
                  <Plus />
                </el-icon>
                <div class="text-group">
                  <span class="btn-main-text">添加新人员</span>
                  <span class="btn-sub-text">建立新的人员档案数据</span>
                </div>
              </div>
              <div class="scan-line"></div>
            </button>
          </div>
        </template>

        <!-- 场景2：单选详情 -->
        <template v-else-if="selectedIds.length === 1">
          <div class="detail-card">
            <div class="detail-header">
              <div class="header-title-group">
                <div class="big-name">{{ singleItem.real_name }}</div>
                <div class="sub-role">
                  <span class="role-badge">{{ singleItem.rank || '未授衔' }}</span>
                  <span class="role-badge outline" v-if="singleItem.job_title">{{ singleItem.job_title }}</span>
                </div>
              </div>
              <button class="btn-text-action" @click="clearSelection">取消选择</button>
            </div>

            <!-- 个人大图展示区 -->
            <div class="profile-photo-area">
              <div class="photo-frame">
                <el-image :src="singleItem.photo" fit="cover" style="width: 100%; height: 100%;">
                  <template #error>
                    <div class="photo-error">
                      <el-icon :size="40">
                        <User />
                      </el-icon>
                    </div>
                  </template>
                </el-image>
                <div class="corner-tl"></div>
                <div class="corner-br"></div>
              </div>
            </div>

            <div class="info-table compact">
              <div class="info-row">
                <span class="label">证件/编号</span>
                <span class="value font-mono highlight">{{ singleItem.service_no }}</span>
              </div>
              <div class="info-row">
                <span class="label">所属单位</span>
                <span class="value">{{ singleItem.department }}</span>
              </div>
              <div class="info-row">
                <span class="label">系统角色</span>
                <span class="value">{{ singleItem.role === 'admin' ? '管理员' : '普通用户' }}</span>
              </div>
              <div class="info-row">
                <span class="label">当前状态</span>
                <span class="value">
                  <span class="mini-tag" :class="getStatusClass(singleItem.duty_status)">
                    {{ getStatusLabel(singleItem.duty_status) }}
                  </span>
                </span>
              </div>
              <div class="info-row">
                <span class="label">权限密级</span>
                <span class="value font-mono" style="color:var(--primary)">Level {{ singleItem.security_level }}</span>
              </div>
            </div>

            <div class="action-footer">
              <div class="grid-buttons">
                <button class="cyber-btn primary" @click="openEditDialog(singleItem)">
                  <div class="btn-content">
                    <el-icon>
                      <Edit />
                    </el-icon> <span>编辑档案</span>
                  </div>
                </button>
                <button class="cyber-btn danger-gradient" @click="handleDelete([singleItem.id])">
                  <div class="btn-content">
                    <el-icon>
                      <Delete />
                    </el-icon> <span>删除人员</span>
                  </div>
                </button>
              </div>
            </div>

          </div>
        </template>

        <!-- 场景3：批量操作 (已添加查看功能) -->
        <template v-else>
          <div class="batch-card">
            <div class="batch-header">
              <div class="batch-title">
                <el-icon>
                  <List />
                </el-icon> 批量管理
              </div>
              <button class="btn-text-action danger" @click="clearSelection">清空已选</button>
            </div>

            <div class="batch-summary">
              <div class="summary-item">
                <span class="num">{{ selectedItems.length }}</span>
                <span class="txt">选中人数</span>
              </div>
              <div class="summary-item success">
                <span class="num">{{selectedItems.filter(i => i.duty_status === 'active').length}}</span>
                <span class="txt">在位</span>
              </div>
            </div>

            <el-scrollbar class="batch-list-scroll">
              <div class="batch-list">
                <div v-for="item in selectedItems" :key="item.id" class="batch-item">
                  <div class="item-left">
                    <div class="b-name">{{ item.real_name }} <span class="mini-rank">{{ item.rank }}</span></div>
                    <div class="b-code">{{ item.service_no }}</div>
                  </div>
                  <div class="item-right">
                    <!-- [新增] 查看详情按钮 -->
                    <button class="btn-icon-view" @click.stop="openDetailModal(item)" title="查看详情">
                      <el-icon>
                        <View />
                      </el-icon>
                    </button>

                    <span class="mini-tag" :class="getStatusClass(item.duty_status)">
                      {{ getStatusLabel(item.duty_status) }}
                    </span>
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
              <button class="cyber-btn danger-gradient full-width-btn" @click="handleDelete(selectedIds)">
                <div class="btn-content">
                  <el-icon :size="20">
                    <Delete />
                  </el-icon>
                  <div class="text-group">
                    <span class="btn-main-text">批量删除</span>
                    <span class="btn-sub-text">移除 {{ selectedIds.length }} 名人员数据</span>
                  </div>
                </div>
                <div class="scan-line"></div>
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- ================= 详情查看弹窗 (只读, 仿照装备页) ================= -->
      <el-dialog v-model="detailVisible" title="人员档案概览" width="400px" class="cyber-dialog" :append-to-body="true"
        :destroy-on-close="true">
        <div class="detail-card-modal">
          <!-- 头部：头像与状态 -->
          <div class="detail-header-modal">
            <div style="display:flex; justify-content: space-between; align-items: flex-start;">
              <div class="big-name-modal">{{ viewingItem.real_name }}</div>
              <div class="status-tag-large" :class="getStatusClass(viewingItem.duty_status)">
                {{ getStatusLabel(viewingItem.duty_status) }}
              </div>
            </div>
            <div style="font-size:12px; color:var(--text-sec); margin-top:5px;">
              {{ viewingItem.rank }} · {{ viewingItem.department }}
            </div>
          </div>

          <!-- 内容表格 -->
          <div class="info-table">
            <div class="info-row">
              <span class="label">证件编号</span>
              <span class="value font-mono highlight">{{ viewingItem.service_no }}</span>
            </div>
            <div class="info-row">
              <span class="label">职务/岗位</span>
              <span class="value">{{ viewingItem.job_title || '无' }}</span>
            </div>
            <div class="info-row">
              <span class="label">系统权限</span>
              <span class="value">{{ viewingItem.role === 'admin' ? '管理员' : '普通用户' }}</span>
            </div>
            <div class="info-row">
              <span class="label">安全等级</span>
              <span class="value font-mono">Level {{ viewingItem.security_level }}</span>
            </div>
            <div class="info-row">
              <span class="label">联系电话</span>
              <span class="value font-mono">{{ viewingItem.phone || '-' }}</span>
            </div>
          </div>

          <!-- 底部只读头像展示 -->
          <div class="modal-photo-area">
            <el-avatar :size="80" :src="viewingItem.photo" shape="square"
              style="background:#2a3546; border:1px solid #4a5c76;">
              <span style="font-size: 28px;">{{ viewingItem.real_name ? viewingItem.real_name.charAt(0) : 'U' }}</span>
            </el-avatar>
            <div class="photo-hint">系统存档照片</div>
          </div>
        </div>
      </el-dialog>

      <!-- ================= 编辑/新增弹窗 (滚动条模式) ================= -->
      <el-dialog v-model="editDialogVisible" :title="isEditMode ? '编辑人员档案' : '录入新人员'" width="680px" class="cyber-dialog"
        :append-to-body="true" :close-on-click-modal="false" top="5vh">

        <!-- 使用 el-scrollbar 包裹表单，max-height 限制高度，超出自动滚动 -->
        <el-scrollbar max-height="60vh" class="dialog-scroll-area">
          <el-form :model="formData" label-position="top" class="cyber-form-content">

            <!-- 板块 1: 基础档案 -->
            <div class="cyber-section">
              <div class="section-header">
                <el-icon>
                  <Postcard />
                </el-icon>
                <span>基础档案</span>
                <div class="section-line"></div>
              </div>

              <div class="section-body">
                <el-row :gutter="20">
                  <!-- 左侧头像上传 -->
                  <el-col :span="8">
                    <div class="upload-placeholder small-mode" @click="handleUploadPhoto">
                      <div v-if="formData.photo" class="preview-img-box">
                        <img :src="formData.photo" />
                        <div class="overlay">
                          <el-icon>
                            <Edit />
                          </el-icon>
                        </div>
                      </div>
                      <div v-else class="upload-btn">
                        <el-icon :size="24">
                          <Camera />
                        </el-icon>
                        <span style="font-size:12px; margin-top:5px;">上传证件照</span>
                      </div>
                    </div>
                  </el-col>

                  <!-- 右侧主要字段 -->
                  <el-col :span="16">
                    <el-form-item label="真实姓名 (Real Name) *">
                      <el-input v-model="formData.real_name" placeholder="请输入姓名" class="cyber-input"
                        @focus="openKeyboard('default', 'group_type', -1)">
                        <template #prefix>
                          <el-icon>
                            <User />
                          </el-icon>
                        </template>
                      </el-input>
                    </el-form-item>
                    <el-form-item label="军人/警官证号 (Service No) *">
                      <el-input v-model="formData.service_no" placeholder="业务唯一标识" class="cyber-input" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20" class="mt-15">
                  <el-col :span="10">
                    <el-form-item label="所属单位 (Unit)">
                      <el-select v-model="formData.department" placeholder="选择编制" class="cyber-select"
                        popper-class="cyber-dropdown">
                        <el-option label="指挥中心" value="指挥中心" />
                        <el-option label="作训科" value="作训科" />
                        <el-option label="警卫排" value="警卫排" />
                        <el-option label="通信连" value="通信连" />
                        <el-option label="后勤处" value="后勤处" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="7">
                    <el-form-item label="军衔 (Rank)">
                      <el-select v-model="formData.rank" placeholder="选择军衔" class="cyber-select"
                        popper-class="cyber-dropdown">
                        <el-option label="上等兵" value="上等兵" />
                        <el-option label="下士" value="下士" />
                        <el-option label="中士" value="中士" />
                        <el-option label="少尉" value="少尉" />
                        <el-option label="中尉" value="中尉" />
                        <el-option label="少校" value="少校" />
                        <el-option label="中校" value="中校" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="7">
                    <el-form-item label="职务 (Job)">
                      <el-input v-model="formData.job_title" placeholder="如:连长" class="cyber-input" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
            </div>

            <!-- 板块 2: 账号管控 -->
            <div class="cyber-section">
              <div class="section-header">
                <el-icon>
                  <Key />
                </el-icon>
                <span>账号管控</span>
                <div class="section-line"></div>
              </div>

              <div class="section-body">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="系统登录账号 (Username)">
                      <el-input v-model="formData.username" placeholder="系统唯一账号" class="cyber-input" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="登录密码 (Password)">
                      <el-input v-model="formData.password" type="password" show-password
                        :placeholder="isEditMode ? '不修改请留空' : '设置初始密码'" class="cyber-input" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="系统角色 (Role)">
                      <el-radio-group v-model="formData.role" class="cyber-radio full-width-radio">
                        <el-radio-button label="user">普通用户</el-radio-button>
                        <el-radio-button label="admin">管理员</el-radio-button>
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="特殊权限">
                      <el-checkbox v-model="formData.is_approver" :true-label="1" :false-label="0" border
                        class="cyber-checkbox full-width-check">
                        具备审批资格
                      </el-checkbox>
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="密级权重 (Security Level 0-10)">
                  <div class="slider-box">
                    <el-slider v-model="formData.security_level" :min="0" :max="10" show-input size="small"
                      class="cyber-slider" />
                  </div>
                  <div class="form-tip">用于判定装备领取等级权限，等级越高权限越大</div>
                </el-form-item>
              </div>
            </div>

            <!-- 板块 3: 扩展信息 -->
            <div class="cyber-section">
              <div class="section-header">
                <el-icon>
                  <CreditCard />
                </el-icon>
                <span>扩展数据</span>
                <div class="section-line"></div>
              </div>

              <div class="section-body">
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="身份证号 (Bio-Key)">
                      <el-input v-model="formData.id_card" placeholder="关联生物识别" class="cyber-input" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="实体卡号 (IC Card)">
                      <el-input v-model="formData.ic_card_no" placeholder="门禁卡物理号" class="cyber-input" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="当前在岗状态">
                      <el-select v-model="formData.duty_status" class="cyber-select" popper-class="cyber-dropdown">
                        <el-option label="在位 (Active)" value="active" />
                        <el-option label="休假 (Leave)" value="leave" />
                        <el-option label="外出 (Out)" value="out" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="账号启用状态">
                      <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" active-text="启用"
                        inactive-text="禁用" style="--el-switch-on-color: var(--success); --el-switch-off-color: #555" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-form-item label="联系电话">
                  <el-input v-model="formData.phone" class="cyber-input" />
                </el-form-item>
              </div>
            </div>

          </el-form>
        </el-scrollbar>

        <template #footer>
          <div class="dialog-footer">
            <button class="btn-text-action" @click="editDialogVisible = false" style="margin-right: 15px;">取消</button>
            <button class="cyber-btn small" @click="savePerson">
              <span>保存档案</span>
            </button>
          </div>
        </template>
      </el-dialog>

    </div>

    <!-- 虚拟键盘容器 - 移动到表单内部以动态定位 -->
    <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition">
      <SimpleKeyboard v-model="currentInputValue" :defaultLayout="currentLayout" @onKeyPress="handleKeyPress"
        @onClose.stop="showKeyboard = false" keyboardClass="show-keyboard" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, reactive, onMounted, defineAsyncComponent } from 'vue'
import {
  UserFilled, SwitchButton, Check, Plus, Edit, Delete,
  List, Close, Camera, User, Postcard, Key, CreditCard, View // [修改点] 引入 View 图标
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'


const audioStore = useAudioStore()

const router = useRouter()

const showKeyboard = ref(false)
const activeField = ref('')
const currentInputValue = ref('')
const currentLayout = ref('number')
const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard.vue'))
// 新增：键盘位置信息
const keyboardPosition = ref({
  top: '0px',
  left: '0px',
  position: 'absolute',
})
//打开虚拟键盘
const openKeyboard = (layout, fieldName, index = -1) => {
  try {
    // 恢复父组件的样式
    const dialogBodies = document.querySelectorAll('.el-dialog__body')
    dialogBodies.forEach((body) => {
      body.style.height = '5.6rem'
    })

    if (index === -1) {
      // 修改装备公共信息
      currentInputValue.value = formData[fieldName]
    }
    // console.log('openKeyboard:', event.targetElement)
    activeField.value = fieldName
    showKeyboard.value = true

    // 设置数字键盘布局
    currentLayout.value = layout
    if (layout === 'default') {
      keyboardPosition.value = {
        bottom: '0px', // 确保不超出视口顶部
        width: '100%', // 宽度设置为100%
        left: `0px`, // 确保不超出视口左侧
        position: 'fixed',
        'z-index': 9999,
      }
      return
    }
  } catch (error) {
    console.log(error)
  }
  // 处理其他类型的键盘布局
}
const handleKeyPress = (button) => {
  // 处理关闭键盘等功能键
  if (button === '{close}') {
    setTimeout(() => {
      // 防止虚拟键盘的点击意外触发背景页面（父组件）的交互,所以延迟100毫秒关闭.这样手已经离开屏幕，父组件就不会误判成点击事件
      showKeyboard.value = false
      // 修改这里：使用标准的类选择器
      const dialogBodies = document.querySelectorAll('.el-dialog__body')
      dialogBodies.forEach((body) => {
        body.style.height = '10.8rem'
      })
    }, 200)
  }
  if (button === '{submit}') {
    submitForm()
  }
}
const submitForm = async (operationType) => {
  console.log('submitForm:', operationType)
}

// --- 数据 ---
const searchVal = ref('')
const currentFilter = ref('ALL')
const selectedIds = ref([])
const personList = ref([])

// [新增] 详情弹窗相关变量
const detailVisible = ref(false)
const viewingItem = ref({})

// 筛选逻辑
const filterOptions = [
  { label: '全部人员', value: 'ALL' },
  { label: '在位', value: 'active' },
  { label: '休假/外出', value: 'inactive' }
]

// --- 动画 Ref ---
const tabsContainer = ref(null)
const tabRefs = ref([])
const gliderStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 })

// --- 编辑/新增逻辑 ---
const editDialogVisible = ref(false)
const isEditMode = ref(false)

const formData = reactive({
  id: null,
  username: '',
  password: '',
  real_name: '',
  id_card: '',
  service_no: '',
  ic_card_no: '',
  rank: '',
  job_title: '',
  unit_code: '',
  department: '',
  role: 'user',
  is_approver: 0,
  security_level: 0,
  status: 1,
  duty_status: 'active',
  phone: '',
  photo: ''
})

// ================= 计算属性 =================
const filteredList = computed(() => {
  let list = personList.value
  if (searchVal.value) {
    const k = searchVal.value.toLowerCase()
    list = list.filter(p =>
      (p.real_name && p.real_name.includes(k)) ||
      (p.service_no && p.service_no.toLowerCase().includes(k))
    )
  }
  if (currentFilter.value === 'active') {
    list = list.filter(p => p.duty_status === 'active')
  } else if (currentFilter.value === 'inactive') {
    list = list.filter(p => p.duty_status !== 'active')
  }
  return list
})

const selectedItems = computed(() => {
  return personList.value.filter(p => selectedIds.value.includes(p.id))
})
const singleItem = computed(() => selectedItems.value[0])

// ================= 方法 =================

// [新增] 打开详情弹窗
const openDetailModal = (item) => {
  viewingItem.value = item
  detailVisible.value = true
}

const initData = () => {
  const depts = ['作训科', '通信连', '警卫排', '后勤处']
  const ranks = ['上等兵', '下士', '中士', '少尉', '中尉', '少校']
  const jobs = ['战士', '班长', '技师', '排长', '连长', '参谋']
  const dutyStates = ['active', 'active', 'active', 'leave', 'out']

  for (let i = 1; i <= 15; i++) {
    const rIdx = i % ranks.length;
    personList.value.push({
      id: i,
      username: `user_${i}`,
      real_name: `张伟${i}号`,
      service_no: `JW-${2024000 + i}`,
      department: depts[i % 4],
      rank: ranks[rIdx],
      job_title: jobs[rIdx],
      duty_status: dutyStates[i % 5],
      role: i % 10 === 0 ? 'admin' : 'user',
      is_approver: i % 5 === 0 ? 1 : 0,
      security_level: i % 5 === 0 ? 5 : 1,
      phone: '1880000' + String(i).padStart(4, '0'),
      photo: '',
      status: 1
    })
  }
  updateGlider()
}

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

const setFilter = (val) => {
  currentFilter.value = val
}

watch(currentFilter, updateGlider)

const toggleSelect = (id) => {
  audioStore.play(`/audio/按钮点击声.mp3`)
  const idx = selectedIds.value.indexOf(id)
  if (idx === -1) {
    selectedIds.value.push(id)
  } else {
    selectedIds.value.splice(idx, 1)
  }
}

const clearSelection = () => {
  selectedIds.value = []
}

const handleExit = () => {
  router.back()
}

const getStatusLabel = (status) => {
  const map = { 'active': '在位', 'leave': '休假', 'out': '外出' }
  return map[status] || status
}

const getStatusClass = (status) => {
  return status === 'active' ? 'st-in' : 'st-out'
}

const handleDelete = (ids) => {
  ElMessageBox.confirm(
    `<div style="color:#ccc;">确定要删除选中的 <span style="color:#ff4d4f;font-weight:bold;">${ids.length}</span> 名人员档案吗？<br/><span style="font-size:12px;color:#666">关联的生物特征数据也将被同步清除。</span></div>`,
    '删除确认',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      customClass: 'cyber-message-box error-mode',
      center: true
    }
  ).then(() => {
    personList.value = personList.value.filter(p => !ids.includes(p.id))
    selectedIds.value = []
    ElMessage.success('删除成功')
  }).catch(() => { })
}

const openEditDialog = (item) => {
  editDialogVisible.value = true

  if (item) {
    isEditMode.value = true
    Object.assign(formData, item)
    formData.password = ''
  } else {
    isEditMode.value = false
    Object.keys(formData).forEach(key => {
      if (['id', 'is_approver', 'security_level', 'status'].includes(key)) formData[key] = 0
      else formData[key] = ''
    })
    formData.status = 1
    formData.role = 'user'
    formData.duty_status = 'active'
    formData.security_level = 1
    formData.service_no = `JW-${new Date().getFullYear()}-`
  }
}

const savePerson = () => {
  if (!formData.real_name) {
    ElMessage.warning('真实姓名不能为空')
    return
  }
  if (!formData.service_no) {
    ElMessage.warning('证件号不能为空')
    return
  }

  if (isEditMode.value) {
    const idx = personList.value.findIndex(p => p.id === formData.id)
    if (idx !== -1) {
      Object.assign(personList.value[idx], { ...formData })
    }
  } else {
    const newId = personList.value.length > 0 ? Math.max(...personList.value.map(p => p.id)) + 1 : 1
    personList.value.unshift({
      ...formData,
      id: newId
    })
  }
  editDialogVisible.value = false
  ElMessage.success('档案保存成功')
}

const handleUploadPhoto = () => {
  ElMessage.info('功能演示：点击此处将调用摄像头或文件上传')
}

onMounted(() => {
  initData()
})
</script>

<style scoped>
/* 引入基础变量 */
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
}

.page-container {
  width: 100%;
  height: 100vh;
  background-color: var(--bg-dark);
  color: var(--text-main);
  font-family: 'Segoe UI', Roboto, sans-serif;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* ================= Header ================= */
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
}

.sub-title {
  color: var(--primary-dark);
  font-size: 11px;
  letter-spacing: 1px;
  font-weight: bold;
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

/* ================= Main Body ================= */
.main-body {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

/* --- Left List Section --- */
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

/* Tabs */
.filter-tabs {
  position: relative;
  display: inline-flex;
  background: rgba(0, 0, 0, 0.3);
  padding: 3px;
  border-radius: 4px;
  border: 1px solid var(--border);
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
  pointer-events: none;
}

.tab {
  position: relative;
  z-index: 2;
  padding: 5px 15px;
  font-size: 13px;
  color: var(--text-sec);
  cursor: pointer;
  transition: color 0.3s;
}

.tab.active {
  color: var(--primary);
  text-shadow: 0 0 0.5px currentColor;
}

.scroll-area {
  flex: 1;
  padding: 15px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 15px;
}

/* --- Person Card --- */
.person-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.person-card:hover {
  background: var(--active-bg);
  border-color: #4a5c76;
}

.person-card.active {
  background-color: rgba(0, 242, 255, 0.05);
  border: 1px solid var(--primary);
  box-shadow: inset 0 0 20px rgba(0, 242, 255, 0.1);
}

.person-card.active .active-bar {
  transform: scaleX(1);
}

/* Status Badges */
.card-status-badge {
  position: absolute;
  top: 6px;
  right: 6px;
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
  color: #aaa;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #444;
}

.person-card.status-out {
  opacity: 0.7;
}

.person-card.status-out .card-avatar-box {
  filter: grayscale(100%);
  border-color: #444;
}

/* Avatar */
.card-avatar-box {
  width: 64px;
  height: 64px;
  border-radius: 4px;
  border: 2px solid var(--border);
  padding: 2px;
  margin-bottom: 10px;
  transition: all 0.3s;
}

.card-avatar-box.glow-active {
  border-color: var(--primary);
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
}

.cyber-avatar {
  background: #2a3546;
  color: #fff;
  width: 100%;
  height: 100%;
}

/* Info */
.card-info {
  text-align: center;
  width: 100%;
}

.person-name {
  color: #fff;
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rank-mini-tag {
  display: inline-block;
  font-size: 10px;
  background: #333;
  color: #ccc;
  padding: 0 4px;
  border-radius: 2px;
  vertical-align: 1px;
  margin-right: 2px;
}

.person-dept {
  color: var(--primary-dark);
  font-size: 12px;
  margin-bottom: 4px;
}

.person-code {
  color: var(--text-sec);
  font-size: 11px;
}

/* Indicators */
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

.no-data-tip {
  grid-column: 1 / -1;
  text-align: center;
  color: var(--text-sec);
  padding: 40px;
  border: 1px dashed var(--border);
  border-radius: 8px;
}

/* --- Right Operation Section --- */
.operation-section {
  flex: 0 0 380px;
  width: 380px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Empty Panel */
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

.icon-circle.glow-animate {
  animation: pulse 3s infinite;
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

/* Detail Panel */
.detail-card,
.batch-card {
  display: flex;
  flex-direction: column;
  height: 100%;
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

.big-name {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary);
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
}

.sub-role {
  color: var(--text-sec);
  font-size: 13px;
  margin-top: 6px;
}

.role-badge {
  display: inline-block;
  background: var(--primary-dark);
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  margin-right: 5px;
}

.role-badge.outline {
  background: transparent;
  border: 1px solid var(--text-sec);
  color: var(--text-sec);
}

/* Profile Photo */
.profile-photo-area {
  padding: 20px;
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
}

.photo-frame {
  width: 120px;
  height: 150px;
  border: 1px solid var(--primary-dark);
  background: #000;
  position: relative;
}

.photo-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #111;
  color: #333;
}

.corner-tl,
.corner-br {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 2px solid var(--primary);
}

.corner-tl {
  top: -1px;
  left: -1px;
  border-right: none;
  border-bottom: none;
}

.corner-br {
  bottom: -1px;
  right: -1px;
  border-left: none;
  border-top: none;
}

/* Info Table */
.info-table {
  padding: 10px 20px;
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row .label {
  color: var(--text-sec);
  font-size: 13px;
}

.info-row .value {
  color: #fff;
  font-size: 14px;
}

.info-row .value.highlight {
  color: var(--primary);
  font-family: 'Consolas', monospace;
}

/* Buttons */
.action-footer {
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-top: 1px solid var(--border);
}

.grid-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.cyber-btn {
  height: 44px;
  background: linear-gradient(90deg, var(--primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--primary);
  color: #fff;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.cyber-btn:hover {
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
}

.cyber-btn.danger-gradient {
  background: linear-gradient(90deg, #a31d1d 0%, #5c0e0e 100%);
  border-color: #ff4d4f;
}

.cyber-btn.small {
  height: 32px;
  font-size: 13px;
  width: 100px;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  position: relative;
  z-index: 2;
}

.text-group {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  line-height: 1.2;
  margin-left: 8px;
  text-align: left;
}

.btn-main-text {
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 1px;
}

.btn-sub-text {
  font-size: 10px;
  opacity: 0.8;
  font-weight: normal;
  transform: scale(0.95);
  transform-origin: left center;
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

@keyframes pulse {
  0% {
    opacity: 0.3;
  }

  50% {
    opacity: 1;
  }

  100% {
    opacity: 0.3;
  }
}

.btn-text-action {
  background: none;
  border: 1px solid var(--primary-dark);
  color: var(--primary);
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  border-radius: 2px;
}

.btn-text-action.danger {
  border-color: var(--error);
  color: var(--error);
}

.full-width-btn {
  width: 100%;
}

/* Batch List */
.batch-title {
  font-size: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
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
}

.batch-list-scroll {
  flex: 1;
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
}

.b-name {
  color: #fff;
  font-size: 13px;
}

.mini-rank {
  font-size: 10px;
  color: var(--text-sec);
  margin-left: 4px;
}

.b-code {
  color: var(--text-sec);
  font-size: 11px;
  font-family: monospace;
}

.btn-icon-remove {
  background: none;
  border: none;
  color: var(--text-sec);
  cursor: pointer;
}

/* [新增] 查看详情按钮样式 */
.btn-icon-view {
  background: none;
  border: none;
  color: var(--primary-dark);
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  margin-right: 8px;
}

.btn-icon-view:hover {
  color: var(--primary);
  transform: scale(1.1);
}

.mini-tag {
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
  margin-right: 8px;
}


/* ================== New Form Styles (Scroll & Sections) ================== */
.dialog-scroll-area {
  padding-right: 10px;
}

.cyber-form-content {
  padding: 0 5px;
}

/* Section Card Style */
.cyber-section {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.section-header {
  padding: 10px 15px;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary);
  font-weight: bold;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, var(--primary-dark), transparent);
  margin-left: 10px;
  opacity: 0.5;
}

.section-body {
  padding: 15px;
}

/* Upload Placeholder */
.upload-placeholder {
  width: 100%;
  border: 2px dashed var(--border);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.2);
  transition: all 0.3s;
  overflow: hidden;
  height: 180px;
}

.upload-placeholder.small-mode {
  height: 135px;
  margin-bottom: 0;
}

.upload-placeholder:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.upload-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-sec);
}

.preview-img-box {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-img-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-img-box .overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
}

.preview-img-box:hover .overlay {
  opacity: 1;
}

.form-tip {
  font-size: 11px;
  color: var(--text-sec);
  margin-top: 5px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.mt-15 {
  margin-top: 15px;
}

/* Input Overrides for Cyber Theme */
:deep(.cyber-input .el-input__wrapper),
:deep(.cyber-select .el-select__wrapper) {
  background-color: rgba(20, 27, 45, 0.8);
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
}

:deep(.cyber-input .el-input__wrapper.is-focus),
:deep(.cyber-select .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--primary) inset !important;
}

:deep(.cyber-input .el-input__inner),
:deep(.cyber-select .el-select__inner) {
  color: #fff;
}

/* Radio & Checkbox */
:deep(.cyber-radio .el-radio-button__inner) {
  background: transparent;
  border-color: var(--border);
  color: var(--text-sec);
  box-shadow: none;
}

:deep(.cyber-radio .el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: rgba(0, 242, 255, 0.15);
  border-color: var(--primary);
  color: #fff;
  box-shadow: -1px 0 0 0 var(--primary);
}

:deep(.cyber-checkbox.is-bordered) {
  border-color: var(--border);
  background: transparent;
}

:deep(.cyber-checkbox.is-bordered.is-checked) {
  border-color: var(--primary);
  background-color: rgba(0, 242, 255, 0.1);
}

:deep(.cyber-checkbox .el-checkbox__label) {
  color: #fff;
}

:deep(.cyber-slider .el-slider__bar) {
  background-color: var(--primary);
}

:deep(.cyber-slider .el-slider__button) {
  border-color: var(--primary);
  background-color: #000;
}

/* Ensure controls take full width inside sections */
.full-width-radio {
  display: flex;
}

:deep(.full-width-radio .el-radio-button) {
  flex: 1;
}

:deep(.full-width-radio .el-radio-button__inner) {
  width: 100%;
}

.full-width-check {
  width: 100%;
}

/* ==========================================================
   [新增] 详情弹窗内部样式 (复用装备领用页面风格)
   ========================================================== */
.detail-card-modal {
  display: flex;
  flex-direction: column;
}

.detail-header-modal {
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid #2a3546;
}

.big-name-modal {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.status-tag-large {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.modal-photo-area {
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0a0e17;
  border-top: 1px solid #2a3546;
}

.photo-hint {
  font-size: 11px;
  color: var(--text-sec);
  margin-top: 8px;
}
</style>

<style>
/* 复用全局弹窗样式覆盖 */
.cyber-dialog.el-dialog {
  --primary: #00f2ff;
  --primary-dark: #0099a1;
  --bg-dark: #0a0e17;
  --card-bg: #141b2d;
  --border: #2a3546;

  background-color: var(--card-bg) !important;
  border: 1px solid var(--primary-dark) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8) !important;
  border-radius: 8px !important;
}

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

.cyber-dialog .el-dialog__headerbtn .el-dialog__close {
  color: #8899a6;
  font-size: 18px;
}

.cyber-dialog .el-dialog__headerbtn:hover .el-dialog__close {
  color: #ff4d4f;
}

.cyber-dialog .el-dialog__body {
  padding: 0 !important;
  color: #ffffff;
  background: transparent !important;
}
.keyboard-container {
  background: white;  /* 这里导致了白色背景 */
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 10px;      /* 这里导致了四周大约 10px-15px 的留白 */
}


:deep(.el-dialog) {
  margin-top: 0rem !important;
  padding-top: 0px;
  margin-bottom: 0;
}

:deep(.el-dialog__body) {
  height: 5.6rem;
  overflow-y: auto;
  margin-bottom: 0;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #dfdede;
  padding-bottom: 0px;
  margin-bottom: 10px;
}

:deep(.el-dialog__title) {
  color: #b1abab;
  font-weight: 600;
}
</style>
