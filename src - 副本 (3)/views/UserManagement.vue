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
          <span class="sub-title">身份识别 · 权限管控 · 操作留痕</span>
        </div>
      </div>

      <div class="header-right">
        <button class="btn-exit" @click="handleExit">
          <el-icon>
            <SwitchButton />
          </el-icon>
          退出返回
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
              :class="{ active: currentFilter === tab.value }" :ref="(el) => (tabRefs[index] = el)"
              @click="setFilter(tab.value)">
              {{ tab.label }}
            </span>
          </div>
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid">
            <div v-for="item in filteredList" :key="item.id" class="person-card" :class="{
              active: selectedIds.includes(item.id),
              'status-out': item.duty_status !== 'active',
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
                  <span style="font-size: 20px; font-weight: bold">{{
                    item.real_name ? item.real_name.charAt(0) : 'U'
                    }}</span>
                </el-avatar>
              </div>

              <!-- 信息区域 -->
              <div class="card-info">
                <div class="person-name" :title="item.real_name">
                  <span v-if="item.rank" class="rank-mini-tag">{{ item.rank }}</span>
                  {{ item.real_name }}
                </div>
                <div class="person-dept">
                  <!-- 将 role 转换为中文显示 -->
                  {{ getRoleLabel(item.role) }}
                </div>
                <div class="person-code">
                  <!-- 根据 status 值显示不同颜色和文字 -->
                  <span class="status-text" :class="item.status === 1 ? 'status-on' : 'status-off'">
                    {{ item.status === 1 ? '● 账号启用' : '● 账号已停用' }}
                  </span>
                </div>
              </div>

              <div class="active-bar"></div>
            </div>

            <!-- 空状态 -->
            <div v-if="filteredList.length === 0" class="no-data-tip">暂无匹配人员</div>
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

            <button class="cyber-btn mt-20" style="width: 80%; margin-top: 30px" @click="openEditDialog(null)">
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
                  <span class="role-badge outline" v-if="singleItem.job_title">{{
                    singleItem.job_title
                    }}</span>
                </div>
              </div>
              <button class="btn-text-action" @click="clearSelection">取消选择</button>
            </div>

            <!-- 个人大图展示区 -->
            <div class="profile-photo-area">
              <div class="photo-frame">
                <el-image :src="singleItem.photo" fit="cover" style="width: 100%; height: 100%">
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
              <!-- 1. 所属单位 -->
              <div class="info-row">
                <span class="label">所属单位</span>
                <span class="value">{{ singleItem.department || '未分配' }}</span>
              </div>

              <!-- 2. 系统角色：修正为使用 getRoleLabel 函数，支持所有角色显示 -->
              <div class="info-row">
                <span class="label">系统角色</span>
                <span class="value">{{ getRoleLabel(singleItem.role) }}</span>
              </div>

              <!-- 3. 账号状态：根据 status 显示颜色 -->
              <div class="info-row">
                <span class="label">账号状态</span>
                <span class="value">
                  <span v-if="singleItem.status === 1"
                    style="color: var(--success); display: flex; align-items: center; gap: 4px;">
                    <el-icon>
                      <Check />
                    </el-icon> 正常启用
                  </span>
                  <span v-else style="color: var(--error); display: flex; align-items: center; gap: 4px;">
                    <el-icon>
                      <Close />
                    </el-icon> 已停用
                  </span>
                </span>
              </div>

              <!-- 4. 在岗状态 -->
              <div class="info-row">
                <span class="label">在岗状态</span>
                <span class="value">
                  <span class="mini-tag" :class="getStatusClass(singleItem.duty_status)">
                    {{ getStatusLabel(singleItem.duty_status) }}
                  </span>
                </span>
              </div>

              <!-- 5. 电话 -->
              <div class="info-row">
                <span class="label">联系电话</span>
                <span class="value font-mono">{{ singleItem.phone || '-' }}</span>
              </div>

              <!-- 6. 最后登录时间 (假设后端字段为 last_login_time，如不同请修改字段名) -->
              <div class="info-row">
                <span class="label">最后登录</span>
                <span class="value font-mono" style="color: var(--text-sec); font-size: 13px;">
                  {{ singleItem.last_login_time || '暂无记录' }}
                </span>
              </div>
            </div>

            <div class="action-footer">
              <div class="grid-buttons">
                <button class="cyber-btn primary" @click="openEditDialog(singleItem, 'edit')">
                  <div class="btn-content">
                    <el-icon>
                      <Edit />
                    </el-icon>
                    <span>编辑档案</span>
                  </div>
                </button>
                <button class="cyber-btn danger-gradient" @click="handleDelete([singleItem.id])">
                  <div class="btn-content">
                    <el-icon>
                      <Delete />
                    </el-icon>
                    <span>删除人员</span>
                  </div>
                </button>
              </div>
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
                批量管理
              </div>
              <button class="btn-text-action danger" @click="clearSelection">清空已选</button>
            </div>

            <div class="batch-summary">
              <div class="summary-item">
                <span class="num">{{ selectedItems.length }}</span>
                <span class="txt">选中人数</span>
              </div>
              <div class="summary-item success">
                <span class="num">{{
                  selectedItems.filter((i) => i.duty_status === 'active').length
                  }}</span>
                <span class="txt">在位</span>
              </div>
            </div>

            <el-scrollbar class="batch-list-scroll">
              <div class="batch-list">
                <div v-for="item in selectedItems" :key="item.id" class="batch-item">
                  <div class="item-left">
                    <div class="b-name">
                      {{ item.real_name }} <span class="mini-rank">{{ item.rank }}</span>
                    </div>
                    <div class="b-code" title="身份证号">{{ maskIdCard(item.id_card) }}</div>
                  </div>
                  <div class="item-right">
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

      <!-- ================= 详情查看弹窗 (只读) ================= -->
      <!-- [修改] 类名更改为 cyber-dialog-person -->
      <el-dialog v-model="detailVisible" title="人员档案概览" width="400px" class="cyber-dialog-person" :append-to-body="true"
        :destroy-on-close="true">
        <div class="detail-card-modal">
          <div class="detail-header-modal">
            <div style="display: flex; justify-content: space-between; align-items: flex-start">
              <div class="big-name-modal">{{ viewingItem.real_name }}</div>
              <div class="status-tag-large" :class="getStatusClass(viewingItem.duty_status)">
                {{ getStatusLabel(viewingItem.duty_status) }}
              </div>
            </div>
            <div style="font-size: 12px; color: var(--text-sec); margin-top: 5px">
              {{ viewingItem.rank }} · {{ viewingItem.department }}
            </div>
          </div>

          <div class="info-table">
            <!-- 1. 所属单位 -->
            <div class="info-row">
              <span class="label">所属单位</span>
              <span class="value">{{ viewingItem.department || '未分配' }}</span>
            </div>

            <!-- 2. 系统角色：使用 getRoleLabel 函数 -->
            <div class="info-row">
              <span class="label">系统角色</span>
              <span class="value">{{ getRoleLabel(viewingItem.role) }}</span>
            </div>

            <!-- 3. 账号状态 -->
            <div class="info-row">
              <span class="label">账号状态</span>
              <span class="value">
                <span v-if="viewingItem.status == 1"
                  style="color: var(--success); display: flex; align-items: center; gap: 4px;">
                  <el-icon>
                    <Check />
                  </el-icon> 正常启用
                </span>
                <span v-else style="color: var(--error); display: flex; align-items: center; gap: 4px;">
                  <el-icon>
                    <Close />
                  </el-icon> 已停用
                </span>
              </span>
            </div>

            <!-- 4. 在岗状态 -->
            <div class="info-row">
              <span class="label">在岗状态</span>
              <span class="value">
                <span class="mini-tag" :class="getStatusClass(viewingItem.duty_status)">
                  {{ getStatusLabel(viewingItem.duty_status) }}
                </span>
              </span>
            </div>

            <!-- 5. 联系电话 -->
            <div class="info-row">
              <span class="label">联系电话</span>
              <span class="value font-mono">{{ viewingItem.phone || '-' }}</span>
            </div>

            <!-- 6. 最后登录时间 -->
            <div class="info-row">
              <span class="label">最后登录</span>
              <span class="value font-mono" style="color: var(--text-sec); font-size: 13px;">
                {{ viewingItem.last_login_time || '暂无记录' }}
              </span>
            </div>
          </div>

          <div class="modal-photo-area">
            <el-avatar :size="80" :src="viewingItem.photo" shape="square"
              style="background: #2a3546; border: 1px solid #4a5c76">
              <span style="font-size: 28px">{{
                viewingItem.real_name ? viewingItem.real_name.charAt(0) : 'U'
                }}</span>
            </el-avatar>
            <div class="photo-hint">系统存档照片</div>
          </div>
        </div>
      </el-dialog>

      <!-- ================= 编辑/新增弹窗 ================= -->
      <!-- [修改] 类名更改为 cyber-dialog-person -->
      <el-dialog v-model="editDialogVisible" :title="isEditMode ? '编辑人员档案' : '录入新人员'" width="680px"
        class="cyber-dialog-person" :append-to-body="true" :close-on-click-modal="false"
        :class="{ 'is-keyboard-open': showKeyboard }" @close="close_dialog">
        <div v-if="!isFormRendered" class="dialog-loading"
          style="height: 60vh; display: flex; align-items: center; justify-content: center">
          <el-icon class="is-loading" :size="30" color="var(--primary)">
            <Loading />
          </el-icon>
          <span style="margin-left: 10px; color: var(--text-sec)">正在加载表单...</span>
        </div>

        <el-scrollbar v-else ref="dialogScrollbar" :max-height="scrollAreaHeight" class="dialog-scroll-area">
          <el-form :model="formData" label-position="top" class="cyber-form-content" :rules="rules" ref="formRef">
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
                        <span style="font-size: 12px; margin-top: 5px">人脸照片</span>
                      </div>
                    </div>
                  </el-col>

                  <el-col :span="16">
                    <el-form-item label="真实姓名（必填）" prop="real_name">
                      <el-input v-model="formData.real_name" placeholder="请输入姓名" class="cyber-input"
                        @focus="openKeyboard('default', 'real_name', $event)" @click="updateCursorPos"
                        @keyup="updateCursorPos">
                        <template #prefix>
                          <el-icon>
                            <User />
                          </el-icon>
                        </template>
                      </el-input>
                    </el-form-item>
                    <el-form-item label="身份证号（必填）" prop="id_card">
                      <el-input v-model="formData.id_card" placeholder="业务唯一标识" class="cyber-input"
                        @focus="openKeyboard('default', 'id_card', $event)" @click="updateCursorPos"
                        @keyup="updateCursorPos" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20" class="mt-15">
                  <el-col :span="10">
                    <el-form-item label="所属单位 (系统自动获取)">
                      <!-- 添加 disabled，移除所有键盘事件 -->
                      <el-input v-model="formData.department" disabled placeholder="请在系统参数中配置"
                        class="cyber-input is-readonly">
                        <template #prefix>
                          <el-icon>
                            <OfficeBuilding />
                          </el-icon>
                          <!-- 需要引入 OfficeBuilding 图标 -->
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="7">
                    <el-form-item label="军衔">
                      <!-- [修改] popper-class 更改为 cyber-dropdown-person -->
                      <el-select v-model="formData.rank" placeholder="选择军衔" class="cyber-select"
                        popper-class="cyber-dropdown-person">
                        <el-option label="默认" value="默认" />
                        <el-option label="下士" value="下士" />
                        <el-option label="中士" value="中士" />
                        <el-option label="上士" value="上士" />
                        <el-option label="少尉" value="少尉" />
                        <el-option label="中尉" value="中尉" />
                        <el-option label="上尉" value="上尉" />
                        <el-option label="少校" value="少校" />
                        <el-option label="中校" value="中校" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="7">
                    <el-form-item label="职务">
                      <el-input v-model="formData.job_title" placeholder="默认" class="cyber-input"
                        @focus="openKeyboard('default', 'job_title', $event)" @click="updateCursorPos"
                        @keyup="updateCursorPos" />
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
                    <el-form-item label="系统登录账号 (自动分配)">
                      <!-- 修改：禁用输入，显示为只读状态 -->
                      <el-input v-model="formData.username" disabled placeholder="系统自动生成"
                        class="cyber-input is-readonly">
                        <template #prefix>
                          <el-icon>
                            <UserFilled />
                          </el-icon>
                        </template>
                      </el-input>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="登录密码 (8位数字)" prop="password">
                      <!-- 修改：限制maxlength，呼起数字键盘(number) -->
                      <el-input v-model="formData.password" type="password" show-password maxlength="8"
                        :placeholder="isEditMode ? '不修改请留空' : '请输入8位数字密码'" class="cyber-input"
                        @focus="openKeyboard('number', 'password', $event)" @click="updateCursorPos"
                        @keyup="updateCursorPos" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="系统角色">
                      <el-radio-group v-model="formData.role" class="cyber-radio full-width-radio">
                        <el-radio-button label="user">用户</el-radio-button>
                        <el-radio-button label="admin">管理员</el-radio-button>
                        <!--
                        <el-radio-button label="system_admin">系统维护员</el-radio-button>
                        -->
                      </el-radio-group>
                    </el-form-item>
                  </el-col>
                </el-row>
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
                <!--
                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="军人/警官证号">
                      <el-input v-model="formData.service_no" placeholder="关联生物识别" class="cyber-input"
                        @focus="openKeyboard('default', 'service_no', $event)" @click="updateCursorPos"
                        @keyup="updateCursorPos" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="实体卡号">
                      <el-input v-model="formData.ic_card_no" placeholder="门禁卡物理号" class="cyber-input"
                        @focus="openKeyboard('number', 'ic_card_no', $event)" @click="updateCursorPos"
                        @keyup="updateCursorPos" />
                    </el-form-item>
                  </el-col>
                </el-row>
                 -->

                <el-row :gutter="20">
                  <el-col :span="12">
                    <el-form-item label="当前在岗状态">
                      <!-- [修改] popper-class 更改为 cyber-dropdown-person -->
                      <el-select v-model="formData.duty_status" class="cyber-select"
                        popper-class="cyber-dropdown-person">
                        <el-option label="在位" value="active" />
                        <el-option label="休假" value="leave" />
                        <el-option label="外出" value="out" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="12">
                    <el-form-item label="联系电话">
                      <el-input v-model="formData.phone" class="cyber-input"
                        @focus="openKeyboard('number', 'phone', $event)" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-form-item label="账号启用状态" class="status-highlight-row">
                  <el-switch v-model="formData.status" :active-value="1" :inactive-value="0" active-text="启用"
                    inactive-text="禁用" />
                  <!-- 可选：添加一段辅助文字 -->
                  <span class="status-tip" v-if="formData.status === 0">
                    <el-icon>
                      <Warning />
                    </el-icon> 已禁止该账户登录系统
                  </span>
                </el-form-item>
              </div>
            </div>

            <!-- ==================生物特征识别板块 ================== -->
            <div class="cyber-section">
              <div class="section-header">
                <el-icon>
                  <Aim />
                </el-icon>
                <span>生物特征识别</span>
                <div class="section-line"></div>
              </div>

              <div class="section-body">
                <!-- 场景A：编辑模式（已存在人员），显示录入控件 -->
                <div v-if="isEditMode">
                  <el-row :gutter="20">
                    <!-- 人脸识别卡片 -->
                    <el-col :span="12">
                      <div class="bio-card" :class="{ 'is-recorded': formData.has_face === 1 }">
                        <div class="bio-icon">
                          <el-icon>
                            <FullScreen />
                          </el-icon>
                        </div>
                        <div class="bio-info">
                          <div class="bio-title">人脸识别数据</div>
                          <div class="bio-status">
                            <span v-if="formData.has_face === 1" class="status-green">● 已录入模型</span>
                            <span v-else class="status-gray">● 未采集数据</span>
                          </div>
                        </div>
                        <button class="bio-btn" @click.prevent="handleRecordFace">
                          {{ formData.has_face === 1 ? '更新人脸' : '采集人脸' }}
                        </button>
                      </div>
                    </el-col>

                    <!-- 指纹识别卡片 -->
                    <el-col :span="12">
                      <div class="bio-card" :class="{ 'is-recorded': formData.has_fingerprint === 1 }">
                        <div class="bio-icon">
                          <el-icon>
                            <Pointer />
                          </el-icon>
                        </div>
                        <div class="bio-info">
                          <div class="bio-title">指纹识别数据</div>
                          <div class="bio-status">
                            <span v-if="formData.has_fingerprint === 1" class="status-green">● 已录入指纹</span>
                            <span v-else class="status-gray">● 未采集数据</span>
                          </div>
                        </div>
                        <button class="bio-btn" @click.prevent="handleRecordFinger">
                          {{ formData.has_fingerprint === 1 ? '重新录入' : '采集指纹' }}
                        </button>
                      </div>
                    </el-col>
                  </el-row>
                </div>

                <!-- 场景B：新增模式，显示锁定提示 -->
                <div v-else class="bio-lock-mask">
                  <el-icon :size="24" class="lock-icon">
                    <Lock />
                  </el-icon>
                  <div class="lock-text">
                    <span>生物特征录入功能已锁定</span>
                    <span class="sub">请先完善基础信息并保存档案，系统生成记录后即可录入。</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- ================== 新增代码结束 ================== -->


          </el-form>
        </el-scrollbar>

        <template #footer>
          <div class="dialog-footer">
            <button class="btn-text-action" @click="close_dialog()" style="margin-right: 15px; width: 100px">
              关闭弹窗
            </button>
            <button class="cyber-btn small" @click="savePerson">
              <span>保存档案</span>
            </button>
          </div>
        </template>
      </el-dialog>
    </div>

    <!-- ================= 人脸采集弹窗组件 ================= -->
    <FaceRegisterModal v-model="faceDialogVisible" :person-name="currentFacePerson.name"
      :id-card="currentFacePerson.idCard" @success="onFaceRegistered" :is-update="formData.has_face === 1" />

    <!-- [新增] 指纹采集弹窗组件 -->
    <FingerprintRegisterModal v-model="fingerDialogVisible" :person-name="currentFacePerson.name"
      :terminal-id="systemTerminalId" :id-card="currentFacePerson.idCard" @success="onFingerRegistered"
      :is-update="formData.has_fingerprint === 1" />

    <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition" @mousedown.prevent>
      <SimpleKeyboard ref="keyboardRef" v-model="currentInputValue" :defaultLayout="currentLayout"
        @onKeyPress="handleKeyPress" @onClose.stop="showKeyboard = false" keyboardClass="show-keyboard"
        :maxLength="activeField === 'password' ? 8 : 0" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, reactive, onMounted, onUnmounted, defineAsyncComponent, toRaw } from 'vue'
import {
  UserFilled,
  SwitchButton,
  Check,
  Plus,
  Edit,
  Delete,
  List,
  Close,
  Camera,
  User,
  Postcard,
  Key,
  CreditCard,
  View,
  Loading,
  OfficeBuilding,
  Warning,
  Aim,
  FullScreen,
  Pointer,
  Lock,
} from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
import FaceRegisterModal from '@/components/FaceRegisterModal.vue'
import FingerprintRegisterModal from '@/components/FingerprintRegisterModal.vue'
import plugins from '../assets/js/plugin'
const generateSecureHash = plugins.generateSecureHash;
import { useTimerStore } from '@/stores/timerStore'
const timerStore = useTimerStore()

const audioStore = useAudioStore()
const router = useRouter()

// --- 新增人脸采集相关变量 ---
const faceDialogVisible = ref(false)
const currentFacePerson = reactive({
  name: '',
  idCard: ''
})
const fingerDialogVisible = ref(false) // 新增：控制指纹弹窗显示

const showKeyboard = ref(false)
const activeField = ref('')
const currentInputValue = ref('')
const scrollAreaHeight = ref('60vh')
const currentLayout = ref('number')
const isFormRendered = ref(false)
const cursorIndex = ref(0) // 记录光标位置
const activeInputDom = ref(null) // 记录当前获得焦点的 Input DOM
const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard_black.vue'))
const keyboardPosition = ref({
  top: '0px',
  left: '0px',
  position: 'absolute',
})
// 2. 新增：通用更新光标位置的方法 (绑定到 @click and @keyup)
const updateCursorPos = (event) => {
  // 确保获取的是 input 元素
  const inputEl =
    event.target.tagName === 'INPUT' ? event.target : event.target.querySelector('input')
  if (inputEl) {
    cursorIndex.value = inputEl.selectionStart
    activeInputDom.value = inputEl
    // console.log('当前光标位置更新为:', cursorIndex.value)
  }
}
// 打开键盘逻辑
const openKeyboard = (layout, fieldName, event) => {
  try {
    activeField.value = fieldName
    currentInputValue.value = formData[fieldName] || ''
    currentLayout.value = layout
    showKeyboard.value = true
    scrollAreaHeight.value = '35vh' // 键盘打开时，缩小滚动区域

    if (event && event.target) {
      activeInputDom.value = event.target

      // 关键：打开键盘时，立即记录一次当前光标位置
      cursorIndex.value = event.target.selectionStart || currentInputValue.value.length

      nextTick(() => {
        // 自动滚动到输入框
        const targetEl = event.target.closest('.el-form-item') || event.target
        targetEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })

        // 聚焦并恢复光标位置
        event.target.focus()
        event.target.setSelectionRange(cursorIndex.value, cursorIndex.value)
      })
    }

    keyboardPosition.value = {
      bottom: '0px',
      width: '100%',
      left: `0px`,
      position: 'fixed',
      'z-index': 9999,
    }

  } catch (error) {
    console.log(error)
  }
}
const keyboardRef = ref(null)
// 键盘输入监听
watch(currentInputValue, (newValue, oldValue) => {
  if (showKeyboard.value && activeField.value) {
    // console.log('Input changed:', newValue)
    // console.log('currentInputValue:', currentInputValue.value)

    // A. 更新数据
    formData[activeField.value] = newValue

    // B. 计算光标应该移动多少位
    const oldLength = (oldValue || '').length
    const newLength = (newValue || '').length
    const diff = newLength - oldLength

    // C. 更新记录的光标位置
    cursorIndex.value += diff

    // 边界处理
    if (cursorIndex.value < 0) cursorIndex.value = 0
    if (cursorIndex.value > newLength) cursorIndex.value = newLength

    // D. 强制设定 DOM 光标位置 (关键)
    nextTick(() => {
      if (activeInputDom.value) {
        activeInputDom.value.focus()
        activeInputDom.value.setSelectionRange(cursorIndex.value, cursorIndex.value)
      }
    })
  }
})

const handleKeyPress = (button) => {
  // 每次按键后尝试夺回焦点
  nextTick(() => {
    if (activeInputDom.value) activeInputDom.value.focus()
  })

  if (button === '{close}') {
    setTimeout(() => {
      closeKeyboard()
      // 主动让输入框失去焦点，以便下次点击能再次触发 focus
      if (activeInputDom.value) {
        activeInputDom.value.blur()
      }
    }, 200)
  }
  if (button === '{submit}') {
    submitForm() // 这里调用原本的提交逻辑
    if (activeInputDom.value) {
      activeInputDom.value.blur()
    }
  }
}
const closeKeyboard = () => {
  showKeyboard.value = false
  scrollAreaHeight.value = '60vh' // 恢复高度
}
const submitForm = async (operationType) => {
  console.log('submitForm:', operationType)
}

const searchVal = ref('')
const currentFilter = ref('ALL')
const selectedIds = ref([])
const personList = ref([])

const detailVisible = ref(false)
const viewingItem = ref({})

const filterOptions = [
  { label: '全部人员', value: 'ALL' },
  { label: '在位', value: 'active' },
  { label: '休假/外出', value: 'inactive' },
]

const tabsContainer = ref(null)
const tabRefs = ref([])
const gliderStyle = ref({ width: '0px', transform: 'translateX(0px)', opacity: 0 })

const editDialogVisible = ref(false)
const isEditMode = ref(false)

const formData = reactive({
  id: null,
  terminal_id: '',
  username: '',
  password: '',
  real_name: '',
  id_card: '',
  service_no: '',
  ic_card_no: '',
  rank: '默认',
  job_title: '',
  unit_code: '',
  department: '',
  role: 'user',
  is_approver: 0,
  security_level: 0,
  status: 1,
  duty_status: 'active',
  phone: '',
  photo: '',
  has_face: 0,        // 新增：是否存在人脸数据
  has_fingerprint: 0, // 新增：是否存在指纹数据
})
const formRef = ref(null)
// ================= 核心修改：密码强度与唯一性校验 =================
const validatePasswordRule = (rule, value, callback) => {
  // 1. 编辑模式下，如果为空则代表不修改密码，直接通过
  if (isEditMode.value && !value) {
    return callback()
  }

  // 2. 基础格式校验：必须是8位纯数字
  if (!/^\d{8}$/.test(value)) {
    return callback(new Error('密码必须是由8位数字组成'))
  }

  // 3. 弱密码逻辑校验
  for (let i = 0; i <= value.length - 4; i++) {
    const n1 = parseInt(value[i])
    const n2 = parseInt(value[i + 1])
    const n3 = parseInt(value[i + 2])
    const n4 = parseInt(value[i + 3])

    // A. 校验连续4个相同 (如 6666)
    if (n1 === n2 && n2 === n3 && n3 === n4) {
      return callback(new Error('密码太简单：不能包含4个连续相同的数字'))
    }

    // B. 校验连续递增 (如 1234)
    if (n1 + 1 === n2 && n2 + 1 === n3 && n3 + 1 === n4) {
      return callback(new Error('密码太简单：不能包含4个连续递增数字'))
    }

    // C. 校验连续递减 (如 9876)
    if (n1 - 1 === n2 && n2 - 1 === n3 && n3 - 1 === n4) {
      return callback(new Error('密码太简单：不能包含4个连续递减数字'))
    }
  }

  // 4. [关键] 全局唯一性校验
  // 因为你的登录界面只输密码，所以所有人的密码绝对不能重复！
  /*
  const isDuplicate = personList.value.some((p) => {
    // 排除自己（编辑模式下）
    if (isEditMode.value && p.id === formData.id) return false
    return p.password === value
  })

  if (isDuplicate) {
    // 当其他人的密码和当前密码重复时，废除其他人的密码，防止密码泄露
    return callback(new Error('该密码已被其他人员使用，请更换'))
  }
  */

  callback()
}
// 2. 自定义校验函数：检查唯一性（证件号、身份证、账号不能重复）+ 格式校验
const validateUniqueInfo = (rule, value, callback) => {
  // 确定当前校验的是哪个字段
  const field = rule.field

  // -----------------------
  // 1. 基础非空校验
  // -----------------------
  if (!value) {
    if (field === 'id_card') {
      return callback(new Error('身份证号不能为空'))
    }
    if (field === 'real_name') {
      return callback(new Error('真实姓名不能为空'))
    }
    return callback(new Error('该项不能为空'))
  }

  // -----------------------
  // 2. 身份证格式校验 (新增部分)
  // -----------------------
  if (field === 'id_card') {
    // 中国大陆居民身份证正则表达式 (18位)
    // 规则：
    // 1. 前6位地址码 (首位不为0)
    // 2. 年份 (18xx, 19xx, 20xx)
    // 3. 月份 (01-12)
    // 4. 日期 (01-31)
    // 5. 3位顺序码
    // 6. 1位校验码 (0-9 或 X/x)
    const idCardRegex =
      /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/

    if (!idCardRegex.test(value)) {
      return callback(new Error('身份证号格式不正确'))
    }
  }

  // -----------------------
  // 3. 唯一性校验
  // -----------------------
  // 在 personList 中查找是否存在相同值的记录
  const isDuplicate = personList.value.some((item) => {
    // 含义：检查列表中某个人（item）的某个字段（比如身份证号），是否等于用户刚才在输入框里填写的 value。
    // String(...)：为了保险起见，把两边都转成字符串再比对（避免出现 数字 123 和 字符串 '123' 比对不上这种情况）。
    // A. 值相同
    const isValueSame = String(item[field]) === String(value)
    // B. 不是当前正在编辑的这一条 (编辑模式下排除自己)
    const isNotSelf = isEditMode.value ? String(item.id) !== String(formData.id) : true

    return isValueSame && isNotSelf
  })

  if (isDuplicate) {
    const fieldMap = {
      service_no: '证件/警号',
      id_card: '身份证号',
      username: '登录账号',
    }
    callback(new Error(`${fieldMap[field] || '该字段'} 已被其他人员占用`))
  } else {
    // 所有检查都通过
    callback()
  }
}
const rules = {
  real_name: [{ required: true, trigger: ['blur', 'change'], validator: validateUniqueInfo }],
  id_card: [{ required: true, trigger: ['blur', 'change'], validator: validateUniqueInfo }],
  password: [{ required: true, trigger: ['blur', 'change'], validator: validatePasswordRule }],
}


const savePerson = async (autoClose = true) => {
  closeKeyboard();

  await formRef.value.validate(async (valid) => {
    if (valid) {
      // 如果是自动保存（人脸回调），使用静默加载或轻提示
      const loading = ElLoading.service({
        lock: true,
        text: autoClose ? '正在处理档案数据...' : '正在自动同步人脸数据...',
        background: 'rgba(0, 0, 0, 0.8)',
      })

      try {
        // ============================================================
        // [新增逻辑] 检查身份证号是否变更，如果变更则删除旧人脸数据
        // ============================================================
        if (isEditMode.value && originalFormDataSnapshot.value) {
          const oldData = JSON.parse(originalFormDataSnapshot.value)

          // 只有当身份证号确实发生了变化，且原账号有人脸数据时才执行清理
          if (oldData.id_card && oldData.id_card !== formData.id_card) {
            console.log(`检测到身份证号变更 (${oldData.id_card} -> ${formData.id_card})，正在清除旧人脸数据...`)

            try {
              // 调用后端删除接口
              await window.electronAPI.el_post({
                action: 'face_remove', // 确保后端有这个 action 且对应删除逻辑
                payload: {
                  tableName: 'TB_FaceInfo', // 假设这是你存储人脸特征的表
                  condition: `UserID = '${oldData.id_card}'`
                }
              })

              // [关键] 身份证变了，旧人脸删了，那么新人脸状态必须重置为 0
              formData.has_face = 0

            } catch (err) {
              console.warn('旧人脸数据清除失败或不存在:', err)
              // 这里选择不中断流程，继续保存档案，只是打印警告
            }
          }
        }
        // ============================================================


        const submitData = { ...toRaw(formData) };
        submitData.password_permissions = submitData.role;

        // 加密逻辑
        if (submitData.password) {
          const { hash, salt } = await generateSecureHash(submitData.password);
          submitData.password_hash = hash;
          submitData.salt = salt;
        }
        delete submitData.password;

        const currentId = submitData.id;
        delete submitData.id;

        let apiAction = isEditMode.value ? 'update' : 'insert';
        let apiPayload = {
          tableName: 'users',
          setValues: submitData,
          condition: isEditMode.value ? `id=${currentId}` : ''
        };

        const response = await window.electronAPI.el_post({
          action: apiAction,
          payload: apiPayload,
        });

        if (response.success) {
          // --- 关键修改：重新从数据库获取最新列表 ---
          await initData();

          // 如果是编辑，更新后可能需要刷新当前选中的详情展示
          if (isEditMode.value) {
            // 重新计算 selectedItems 会自动更新详情面板
          }

          setTimeout(() => {
            loading.close();

            if (autoClose) {
              // --- 场景 A: 点击保存按钮 ---
              audioStore.play('/audio/保存成功.mp3');
              editDialogVisible.value = false;
              if (!isEditMode.value) selectedIds.value = [];
            } else {
              // --- 场景 B: 人脸采集后自动保存 ---
              // 1. 不关闭弹窗
              // 2. [至关重要] 更新原始快照！
              //    否则后续用户手动点保存时，严格模式检查会因为 currentSnapshot !== original 而报错
              originalFormDataSnapshot.value = JSON.stringify(formData)

              // 3. 提示用户
              // ElMessage.success('人脸数据已自动同步至档案')
              // 可以不用播放声音，因为人脸组件里已经播报了“注册成功”
            }
          }, 500);
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        loading.close();
        ElMessage.error(`保存失败: ${error.message}`);
        // 只有手动保存才播报失败音效，避免自动保存时的干扰
        if (autoClose) audioStore.play('/audio/保存失败.mp3');
      }
    } else {
      if (autoClose) audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`);
    }
  });
};

const filteredList = computed(() => {
  let list = personList.value
  if (searchVal.value) {
    const k = searchVal.value.toLowerCase()
    list = list.filter(
      (p) =>
        (p.real_name && p.real_name.includes(k)) ||
        (p.service_no && p.service_no.toLowerCase().includes(k)),
    )
  }
  if (currentFilter.value === 'active') {
    list = list.filter((p) => p.duty_status === 'active')
  } else if (currentFilter.value === 'inactive') {
    list = list.filter((p) => p.duty_status !== 'active')
  }
  return list
})
const close_dialog = () => {
  editDialogVisible.value = false
  closeKeyboard()
  // 延迟重置，避免弹窗消失动画时内容突然变空
  setTimeout(() => {
    if (formRef.value) formRef.value.resetFields()
    // 手动重置非 prop 字段
    formData.photo = ''
    formData.id = null
    isEditMode.value = false
  }, 100)
}
const selectedItems = computed(() => {
  return personList.value.filter((p) => selectedIds.value.includes(p.id))
})
const singleItem = computed(() => selectedItems.value[0])

const openDetailModal = (item) => {
  viewingItem.value = item
  detailVisible.value = true
}

const initData = async () => {
  // 不要添加加载动画，因为在savePerson时已经有加载提示
  try {
    let allData = []
    let currentPage = 1
    let hasMoreData = true
    const pageSize = 50 // 每次拉取50条，减少请求次数

    while (hasMoreData) {
      // 调用分页查询接口
      const response = await window.electronAPI.el_post({
        action: 'queryPagination',
        payload: {
          tableName: 'users',
          page: currentPage,
          pageSize: pageSize,
          orderBy: 'id DESC' // 按创建时间倒序排列（后录入的在前）
        },
      })

      // 检查返回数据结构 (参考你的 getData 逻辑)
      if (response.success && response.data && response.data.data && response.data.data.length > 0) {
        const pageData = response.data.data
        allData = [...allData, ...pageData]

        // 如果当前页数据少于 pageSize，说明是最后一页
        if (pageData.length < pageSize) {
          hasMoreData = false
        } else {
          currentPage++
        }
      } else {
        // 没有数据或出错，停止循环
        hasMoreData = false
      }
    }

    // 数据后处理
    allData.forEach(user => {
      // 1. 处理头像: 如果数据库存的是 Blob Buffer，可能需要转 base64
      // 这里假设后端已经处理好或者是 base64 字符串，如果显示不出图片，可能需要加前缀
      // if (user.photo && !user.photo.startsWith('data:image')) {
      //    user.photo = 'data:image/png;base64,' + user.photo
      // }

      // 2. 确保数值字段类型正确，防止空值报错
      user.status = user.status !== undefined ? Number(user.status) : 1
      user.duty_status = user.duty_status || 'active'
    })

    // 赋值给列表
    personList.value = allData

    // 更新筛选滑块位置
    updateGlider()

  } catch (error) {
    console.error('获取人员数据失败:', error)
    ElMessage.error('人员名单加载失败')
  }
}
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
  const map = { active: '在位', leave: '休假', out: '外出' }
  return map[status] || status
}
const getRoleLabel = (role) => {
  const map = {
    user: '用户',
    admin: '管理员',
    system_admin: '系统维护员'
  }
  return map[role] || '未知角色'
}

const getStatusClass = (status) => {
  return status === 'active' ? 'st-in' : 'st-out'
}
// === 新增：身份证脱敏函数 (显示前4后4) ===
const maskIdCard = (val) => {
  if (!val) return ''
  // 如果长度不足8位，直接显示，避免报错
  if (val.length <= 8) return val
  // 截取前4位 + **** + 后4位
  return val.slice(0, 4) + '**********' + val.slice(-4)
}
const handleDelete = (ids) => {
  audioStore.play(`/audio/警告正在删除人员信息.mp3`)
  ElMessageBox.confirm(
    `<div style="color:#ccc;">确定要删除选中的 <span style="color:#ff4d4f;font-weight:bold;">${ids.length}</span> 名人员档案吗？<br/><span style="font-size:12px;color:#666">关联的生物特征(人脸/指纹)也将被同步清除。</span></div>`,
    '删除确认',
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      confirmButtonClass: 'el-button--danger',
      customClass: 'cyber-message-box-person error-mode',
      center: true,
    },
  )
    .then(async () => {
      try {
        // 1. 获取选中人员的身份证号 (过滤掉无效的)
        // 这里的逻辑是为了后续清理人脸和指纹表做准备
        const targetPersons = personList.value.filter(p => ids.includes(p.id) && p.id_card)
        const targetIdCardsRaw = targetPersons.map(p => p.id_card)

        // 构造 SQL 查询用的字符串: 'ID1', 'ID2'
        const idCardSqlString = targetIdCardsRaw.map(id => `'${id}'`).join(',')

        if (targetIdCardsRaw.length > 0) {
          // ==========================================================
          // [新增] 步骤 A: 清理指纹数据 (硬件 + 数据库)
          // ==========================================================
          console.log('正在检查关联指纹数据...')
          try {
            // A1. 先查询 biometrics 表，获取这些人的指纹对应的 硬件ID (bio_subtype)
            const bioQueryRes = await window.electronAPI.el_post({
              action: 'queryAll', // <--- 修改这里：使用 queryAll 获取所有匹配记录
              payload: {
                tableName: 'biometrics',
                // 查询条件：身份证号匹配 且 类型为指纹
                condition: `user_id_card IN (${idCardSqlString}) AND bio_type = 'fingerprint'`
              }
            })

            console.log('指纹查询结果：', toRaw(bioQueryRes))

            let bioRecords = []
            // 处理查询返回结果（可能是数组，也可能是单个对象，视后端封装而定）
            if (bioQueryRes.success && bioQueryRes.data) {
              if (Array.isArray(bioQueryRes.data)) {
                bioRecords = bioQueryRes.data
              }
            }

            // A2. 循环发送硬件删除指令 (清理指纹模块存储)
            if (bioRecords.length > 0) {
              console.log(`发现 ${bioRecords.length} 条指纹记录，正在从硬件移除...`)
              for (const record of bioRecords) {
                const hwIndex = Number(record.bio_subtype)
                // 确保硬件ID有效
                if (!isNaN(hwIndex) && hwIndex >= 0) {
                  await window.electronAPI.el_post({
                    action: 'delete_fingerprint_template',
                    payload: { id: hwIndex }
                  }).catch(err => {
                    // 硬件指令失败不应阻断主流程，打印日志即可
                    console.warn(`硬件指纹ID ${hwIndex} 删除指令发送失败(可能设备未连接):`, err)
                  })
                }
              }
            }

            // A3. 删除数据库 biometrics 表中的记录
            await window.electronAPI.el_post({
              action: 'remove',
              payload: {
                tableName: 'biometrics',
                condition: `user_id_card IN (${idCardSqlString})`
              },
            })
            console.log('数据库指纹记录已清理')

          } catch (fingerErr) {
            console.warn('指纹清理流程出现异常:', fingerErr)
          }

          // ==========================================================
          // [原有] 步骤 B: 清理人脸数据 (TB_FaceInfo)
          // ==========================================================
          const conditionStr = `UserID IN (${idCardSqlString})`
          console.log('正在清理人脸数据...')

          await window.electronAPI.el_post({
            action: 'face_remove',
            payload: {
              tableName: 'TB_FaceInfo',
              condition: conditionStr,
            },
          }).catch(err => {
            console.warn('人脸数据清理失败:', err)
          })
        }

        // ==========================================================
        // 步骤 C: 删除 users 表人员档案 (主数据)
        // ==========================================================
        const response = await window.electronAPI.el_post({
          action: 'remove',
          payload: {
            tableName: 'users',
            condition: `id IN (${ids.join(',')})`,
          },
        })

        if (response.success) {
          audioStore.play(`/audio/删除成功.mp3`)
          selectedIds.value = [] // 清空选中状态
          await initData()       // 刷新列表数据
        } else {
          throw new Error(response.message || '删除失败')
        }
      } catch (error) {
        console.error('删除出错:', error)
        ElMessage.error('删除操作异常')
      }
    })
    .catch(() => {
      // 用户取消
    })
}
// [新增] 用于存储打开弹窗时的原始数据快照，用于比对是否有修改
const originalFormDataSnapshot = ref('')
// 修改录入人脸操作
const handleRecordFace = () => {
  if (!isEditMode.value) return

  // 1. [关键] 强制关闭虚拟键盘
  closeKeyboard()

  // 2. [关键] 让当前活动的输入框失去焦点 (避免键盘关闭了但光标还在背景里闪)
  if (activeInputDom.value) {
    activeInputDom.value.blur()
    activeInputDom.value = null // 清空引用
  }
  // 3. [新增] 严格模式检查：对比当前数据与原始快照
  const currentSnapshot = JSON.stringify(formData)
  if (currentSnapshot !== originalFormDataSnapshot.value) {
    audioStore.play(`/audio/检到档案信息已修改.mp3`) // 或播放“请先保存档案.mp3”
    return
  }

  // 1. 校验是否有必要的基础信息
  if (!formData.id_card || !formData.real_name) {
    ElMessage.warning('请先完善并保存人员的姓名和身份证号')
    audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`)
    return
  }

  // 2. 准备传给子组件的数据
  currentFacePerson.name = formData.real_name
  currentFacePerson.idCard = formData.id_card

  // 3. 打开采集弹窗
  faceDialogVisible.value = true
  audioStore.play(`/audio/按钮点击声.mp3`) // 可选：播放提示音
}

// 新增：处理采集成功回调
const onFaceRegistered = async (imageData) => {
  console.log('父组件已接收到人脸图像数据');

  // 1. 更新 UI 状态
  formData.photo = imageData
  formData.has_face = 1

  // 2. 自动保存档案 (传入 false 表示不关闭弹窗)
  // 这会将 has_face=1 和 photo 字段写入数据库
  await savePerson(false)

  // 3. (可选) 更新列表数据中的状态，虽然 savePerson 里的 initData 已经刷新了列表
  // 但为了防止列表闪烁，保持本地状态一致也是好的
  const target = personList.value.find(p => p.id === formData.id)
  if (target) {
    target.has_face = 1
    // target.photo = imageData // 如果列表也显示头像，可以更新
  }
}
// 2. 新增：处理指纹采集成功回调
const onFingerRegistered = async () => {
  console.log('指纹采集成功回调')

  // 1. 更新 UI 状态
  formData.has_fingerprint = 1

  // 2. 自动保存档案 (不关闭编辑弹窗)
  // 后端保存时，你可以选择将 formData.has_fingerprint 字段更新进 users 表
  await savePerson(false)

  // 3. 更新列表数据 (虽然 savePerson 会做，但手动更新防止闪烁)
  const target = personList.value.find(p => p.id === formData.id)
  if (target) {
    target.has_fingerprint = 1
  }
}
const handleRecordFinger = () => {
  if (!isEditMode.value) return

  // 1. 关闭键盘，移除焦点
  closeKeyboard()
  if (activeInputDom.value) {
    activeInputDom.value.blur()
    activeInputDom.value = null
  }

  // 2. 检查数据是否有未保存的修改
  const currentSnapshot = JSON.stringify(formData)
  if (currentSnapshot !== originalFormDataSnapshot.value) {
    audioStore.play(`/audio/检到档案信息已修改.mp3`)
    // ElMessage.warning('档案信息有变更，请先保存后再录入生物特征')
    return
  }

  // 3. 校验基础信息
  if (!formData.id_card || !formData.real_name) {
    // ElMessage.warning('请先完善并保存人员的姓名和身份证号')
    // audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`)
    return
  }

  // 4. 准备数据并打开弹窗
  // 复用 currentFacePerson 对象，因为它刚好有 name 和 idCard
  currentFacePerson.name = formData.real_name
  currentFacePerson.idCard = formData.id_card

  fingerDialogVisible.value = true
  audioStore.play(`/audio/按钮点击声.mp3`)
}
const openEditDialog = (item, type = 'add') => {
  if (type == 'add') {
    audioStore.play(`/audio/添加人员.mp3`)
  } else {
    audioStore.play(`/audio/编辑信息.mp3`)
  }

  editDialogVisible.value = true

  // 这是一个好习惯：在下一次 DOM 更新后重置校验状态
  nextTick(() => {
    if (formRef.value) {
      formRef.value.clearValidate()
    }
  })

  if (item) {
    isEditMode.value = true
    Object.assign(formData, item)
    formData.password = '' // 编辑时不显示原密码，留空代表不修改
    // 【关键修改】编辑模式下，也强制修正为当前终端所属单位
    // 如果你想保留人员原有的单位（哪怕与当前终端不同），则注释掉下面这一行
    formData.department = systemUnitName.value

    // 【新增】根据后端返回的数据设置状态
    formData.has_face = item.has_face || 0;
    formData.has_fingerprint = item.has_fingerprint || 0;
  } else {
    isEditMode.value = false
    Object.keys(formData).forEach((key) => {
      if (['id', 'is_approver', 'security_level', 'status'].includes(key)) formData[key] = 0
      else formData[key] = ''
    })

    // ================= 修改点：自动生成账号 =================
    // 规则示例：AUTO + 年月日时分 + 2位随机数，确保唯一
    const timeStr = new Date().toISOString().replace(/\D/g, '').slice(2, 12) // YYMMDDHHMM
    const randomSuffix = Math.floor(Math.random() * 90 + 10) // 10-99
    formData.username = `U${timeStr}${randomSuffix}`
    // ======================================================

    // 【关键修改】新增模式下，自动填充单位
    formData.department = systemUnitName.value
    formData.terminal_id = systemTerminalId.value // 【新增】确保这一行存在

    // 【新增】新增模式下重置为 false
    formData.has_face = 0
    formData.has_fingerprint = 0

    formData.status = 1
    formData.role = 'user'
    formData.duty_status = 'active'
    formData.rank = '默认'
    formData.security_level = 1
    formData.service_no = `JW-${new Date().getFullYear()}-`
  }

  // [新增] 核心逻辑：记录当前的 formData 状态快照
  // 使用 setTimeout 确保上述所有同步赋值都已完成
  setTimeout(() => {
    originalFormDataSnapshot.value = JSON.stringify(formData)
  }, 0)

  isFormRendered.value = false
  editDialogVisible.value = true
  setTimeout(() => {
    isFormRendered.value = true
  }, 200)
}

const handleUploadPhoto = () => {
  // ElMessage.info('功能演示：点击此处将调用摄像头或文件上传')
}
// 1. 新增：定义一个变量存储从后端获取的单位名称
const systemUnitName = ref('')
const systemTerminalId = ref('')
const fetchConfigData = async () => {
  try {
    const response = await window.electronAPI.el_post({
      action: 'queryMultipleTables',
      payload: {
        arr: [{ tablename: 'terminal_settings', condition: '' }],
      },
    })

    if (response.success && response.data?.terminal_settings) {
      const data = response.data.terminal_settings
      // 保存到全局变量
      systemUnitName.value = data.unit_name || ''
      // 【新增】获取终端ID，如果没有则给一个默认值防止报错
      systemTerminalId.value = data.terminal_id || 'unknown_terminal'

      // 同时赋值给当前表单（防止页面刚加载未打开弹窗时的空值）
      formData.department = systemUnitName.value
    }
  } catch (error) {
    console.error('配置加载失败:', error)
  }
}
onMounted(async () => {
  if (timerStore.isTimerActive) timerStore.stopInterval()
  await fetchConfigData()
  initData()
})
onUnmounted(() => {
  if (!timerStore.isTimerActive) timerStore.startInterval()
})
</script>

<style scoped>
/* ================= 全局变量定义 ================= */
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

/* ================= 基础容器布局 ================= */
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

/* 通用工具类 */
.font-mono {
  font-family: 'Consolas', monospace;
  letter-spacing: 1px;
}

.text-glow {
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
}

/* ================= 顶部导航栏 ================= */
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

/* ================= 主体内容区 ================= */
.main-body {
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  overflow: hidden;
}

/* --- 左侧列表区域 --- */
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

/* 筛选 Tabs */
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
  padding: 5px 15px;
  font-size: 13px;
  color: var(--text-sec);
  cursor: pointer;
  border-radius: 2px;
  transition: color 0.3s;
  border: 1px solid transparent;
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
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  gap: 15px;
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

/* --- 人员卡片样式 (Person Card) --- */
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

/* 状态标签 */
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
  box-shadow: none;
}

/* 离岗状态变暗 */
.person-card.status-out {
  opacity: 0.7;
}

.person-card.status-out .card-avatar-box {
  filter: grayscale(100%);
  border-color: #444;
}

/* 头像框 */
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

/* 卡片信息文本 */
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

/* 选中装饰 */
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

/* --- 右侧操作面板 (Operation Section) --- */
.operation-section {
  flex: 0 0 380px;
  width: 380px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* 空状态占位 */
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

/* 详情面板/批量面板 */
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

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  margin-right: 15px;
}

.big-name {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary);
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.2);
  line-height: 1.2;
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

/* 个人照片展示 */
.profile-photo-area {
  padding: 20px;
  display: flex;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
}

.photo-frame {
  width: 213px;
  height: 160px;
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

/* 信息表格 */
.info-table {
  padding: 10px 20px;
  flex: 1;
  background-color: transparent;
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
  min-width: 70px;
}

.info-row .value {
  color: #fff;
  font-size: 14px;
  word-break: break-all;
}

.info-row .value.highlight {
  color: var(--primary);
  font-family: 'Consolas', monospace;
}

/* 按钮样式 */
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
  text-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.cyber-btn.danger-gradient {
  background: linear-gradient(90deg, #a31d1d 0%, #5c0e0e 100%);
  border-color: #ff4d4f;
}

.cyber-btn.danger-gradient:hover {
  box-shadow: 0 0 15px rgba(255, 77, 79, 0.4);
}

.cyber-btn.small {
  height: 32px;
  font-size: 13px;
  width: 100px;
}

.cyber-btn.full-width-btn {
  width: 100%;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  position: relative;
  z-index: 2;
  justify-content: center;
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

/* 按钮扫描动画 */
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

/* --- 批量列表 --- */
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

.summary-item.success .num {
  color: var(--success);
}

.summary-item .txt {
  font-size: 11px;
  color: var(--text-sec);
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
}

.item-left {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.b-name {
  color: #fff;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-rank {
  font-size: 12px;
  color: var(--text-sec);
  margin-left: 4px;
}

.b-code {
  color: var(--text-sec);
  font-size: 14px;
  font-family: monospace;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.mini-tag {
  font-size: 12px;
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

/* ================= 编辑弹窗/表单样式 ================= */
.dialog-scroll-area {
  padding-right: 10px;
}

.cyber-form-content {
  padding: 0 5px;
}

.cyber-section {
  background: rgba(0, 0, 0, 0.3);
  /* 加深背景 */
  border: 1px solid rgba(0, 242, 255, 0.15);
  /* 稍微亮一点的边框 */
  box-shadow: inset 0 0 15px rgba(0, 0, 0, 0.3);
  /* 内阴影增加凹陷感 */
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
  margin-top: 20px;
}

.section-header {
  padding: 10px 15px;
  background: rgba(255, 255, 255, 0.03);
  /* 头部稍微亮一点 */
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

/* 图片上传占位 */
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

.mt-20 {
  margin-top: 20px;
}

/* --- Element Plus 输入框组件深度覆盖 (Deep Override) --- */
:deep(.cyber-input .el-input__wrapper),
:deep(.cyber-select .el-select__wrapper) {
  background-color: rgba(20, 27, 45, 0.8) !important;
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  transition: all 0.3s;
}

:deep(.cyber-input .el-input__wrapper:hover),
:deep(.cyber-input .el-input__wrapper.is-focus),
:deep(.cyber-select .el-select__wrapper:hover),
:deep(.cyber-select .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 1px var(--primary) inset !important;
  background-color: rgba(0, 242, 255, 0.05) !important;
}

:deep(.cyber-input .el-input__inner),
:deep(.cyber-select .el-select__inner),
:deep(.cyber-select .el-select__selected-item) {
  color: #fff !important;
  font-family: 'Segoe UI', sans-serif;
}

:deep(.cyber-input .el-input__inner::placeholder),
:deep(.cyber-select .el-select__placeholder) {
  color: #8899a6 !important;
}

:deep(.el-form-item__label) {
  font-size: 14px !important;
  color: var(--text-sec) !important;
  padding-bottom: 2px !important;
  line-height: 1.4 !important;
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

/* Slider */
:deep(.cyber-slider .el-slider__bar) {
  background-color: var(--primary);
}

:deep(.cyber-slider .el-slider__button) {
  border-color: var(--primary);
  background-color: #000;
}

/* Full Width Controls */
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

/* ================= 详情弹窗内部样式 ================= */
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

/* ================= 移入 scoped 的部分 ================= */

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

:deep(::-webkit-scrollbar) {
  width: 6px;
  height: 6px;
}

:deep(::-webkit-scrollbar-track) {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

:deep(::-webkit-scrollbar-thumb) {
  background: #2a3546;
  border-radius: 3px;
  transition: all 0.3s;
}

:deep(::-webkit-scrollbar-thumb:hover) {
  background: #0099a1;
  box-shadow: 0 0 5px #00f2ff;
  cursor: pointer;
}

/* 针对只读输入框的特殊样式 */
:deep(.cyber-input.is-readonly .el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  /* 更深的背景 */
  box-shadow: none !important;
  border: 1px dashed #4a5c76 !important;
  /* 虚线边框表示系统自动填充 */
}

:deep(.cyber-input.is-readonly .el-input__inner) {
  color: #00f2ff !important;
  /* 使用主色调高亮显示，表明这是系统参数 */
  font-weight: bold;
  opacity: 0.8;
  -webkit-text-fill-color: #00f2ff !important;
  /* 强制覆盖浏览器默认的disabled灰色 */
  cursor: not-allowed;
}

:deep(.cyber-input.is-readonly .el-input__prefix) {
  color: #666 !important;
}


/* --- 新增样式：账号状态高亮行 --- */
/* --- 修正后的样式：账号状态高亮行 --- */
.status-highlight-row {
  /* 1. 修改背景轨道颜色 (Track) */
  --el-switch-on-color: rgb(17, 255, 0) !important;
  /* 启用颜色：绿色 */
  --el-switch-off-color: #555 !important;
  /* 禁用颜色：灰色 (你想要的颜色) */

  /* 保持之前的边框和背景样式 */
  background: rgba(0, 242, 255, 0.04);
  border: 1px dashed rgba(49, 166, 173, 0.3);
  border-radius: 6px;
  padding: 10px 20px;
  margin-top: 15px;
  transition: all 0.3s;
}

/* --- 如果你的意思是想修改中间那个圆点(Knob)的颜色 --- */
/* 添加这段代码可以将白色的圆点改成深色或其他颜色 */
.status-highlight-row :deep(.el-switch__action) {
  background-color: #fff !important;
  /* 默认是白色，想改深色可以填 #000 */
}

.status-highlight-row:has(.el-switch__input:not(:checked)) {
  background: rgba(255, 77, 79, 0.05);
  border-color: var(--error);
}

/* 如果你想让禁用状态显示红色背景，可以使用下面的代码（可选） */
/*

*/

/* 辅助文字样式 */
.status-tip {
  margin-left: 15px;
  font-size: 12px;
  color: var(--error);
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* --- 新增：卡片底部账号状态样式 --- */
.status-text {
  font-size: 11px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

/* 启用状态 - 绿色调 */
.status-on {
  color: #00ff9d;
  background: rgba(0, 255, 157, 0.1);
  border: 1px solid rgba(0, 255, 157, 0.2);
}

/* 停用状态 - 红色/灰色调 */
.status-off {
  color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.2);
}



/* ================= 生物特征板块样式 ================= */
.bio-card {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.bio-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: #4a5c76;
}

/* 已录入的高亮状态 */
.bio-card.is-recorded {
  background: rgba(0, 255, 157, 0.05);
  border-color: rgba(0, 255, 157, 0.3);
  box-shadow: inset 0 0 10px rgba(0, 255, 157, 0.1);
}

.bio-icon {
  width: 40px;
  height: 40px;
  background: #1c2538;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-sec);
  font-size: 20px;
  flex-shrink: 0;
}

.bio-card.is-recorded .bio-icon {
  background: rgba(0, 255, 157, 0.2);
  color: var(--success);
  text-shadow: 0 0 5px var(--success);
}

.bio-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bio-title {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.bio-status {
  font-size: 11px;
}

.status-green {
  color: var(--success);
}

.status-gray {
  color: var(--text-sec);
}

.bio-btn {
  background: transparent;
  border: 1px solid var(--primary-dark);
  color: var(--primary);
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.bio-btn:hover {
  background: var(--primary);
  color: #000;
}

.bio-card.is-recorded .bio-btn {
  border-color: var(--border);
  color: var(--text-sec);
}

.bio-card.is-recorded .bio-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: transparent;
}

/* 锁定状态遮罩 */
.bio-lock-mask {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 30px;
  border: 1px dashed var(--border);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.1);
  color: var(--text-sec);
}

.lock-icon {
  color: var(--error);
  font-size: 24px;
  opacity: 0.8;
}

.lock-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lock-text span {
  font-weight: bold;
  color: #ccc;
}

.lock-text .sub {
  font-size: 12px;
  color: #666;
  font-weight: normal;
}
</style>

<style>
/* ==========================================================
   全局组件样式覆盖 (Dialog, Message Box, Dropdown)
   [重要] 已全部重命名类名，防止与装备领用页面冲突 (Style Pollution Fix)
   ========================================================== */

/* 1. 赛博朋克风格 El-Dialog 覆盖 - [独立命名] */
.cyber-dialog-person.el-dialog {
  --primary: #00f2ff;
  --primary-dark: #0099a1;
  --bg-dark: #0a0e17;
  --card-bg: #141b2d;
  --border: #2a3546;
  --text-main: #ffffff;
  --text-sec: #8899a6;
  --error: #ff4d4f;
  --success: #00ff9d;

  background-color: var(--card-bg) !important;
  border: 1px solid var(--primary-dark) !important;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8) !important;
  border-radius: 8px !important;
  transition: margin-top 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  /* 默认垂直居中 */
  margin-top: 0 !important;
  top: 50%;
  transform: translateY(-50%);
}

/* 键盘打开时的特殊位置 (上移) */
.cyber-dialog-person.is-keyboard-open {
  margin-top: -22vh !important;
  margin-left: auto !important;
  margin-right: auto !important;
}

.cyber-dialog-person .el-dialog__header {
  border-bottom: 1px solid var(--border);
  padding: 15px 20px;
  margin-right: 0;
  background: rgba(0, 0, 0, 0.2);
}

.cyber-dialog-person .el-dialog__title {
  color: var(--primary);
  font-size: 16px;
  font-weight: bold;
}

.cyber-dialog-person .el-dialog__headerbtn .el-dialog__close {
  color: #8899a6;
  font-size: 18px;
}

.cyber-dialog-person .el-dialog__headerbtn:hover .el-dialog__close {
  color: var(--error);
}

.cyber-dialog-person .el-dialog__body {
  padding: 0 !important;
  color: #ffffff;
  background: transparent !important;
}

/* 2. 赛博朋克风格 ElMessageBox (消息提示框) - [独立命名] */
.cyber-message-box-person.el-message-box {
  background-color: #141b2d !important;
  border: 1px solid #0099a1 !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(0, 242, 255, 0.05) !important;
  border-radius: 8px !important;
  padding-bottom: 20px !important;
  width: 480px !important;
  /* 此处宽度与装备页不同，重命名后不会被覆盖 */
  max-width: 95vw;
}

.cyber-message-box-person.error-mode {
  border-color: #ff4d4f !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(255, 77, 79, 0.1) !important;
}

.cyber-message-box-person .el-message-box__header {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.cyber-message-box-person .el-message-box__title {
  color: #fff !important;
  font-weight: bold;
  letter-spacing: 1px;
}

.cyber-message-box-person .el-message-box__headerbtn .el-message-box__close {
  color: #8899a6 !important;
}

.cyber-message-box-person .el-message-box__headerbtn:hover .el-message-box__close {
  color: #00f2ff !important;
}

.cyber-message-box-person .el-message-box__content {
  color: #ccdbe8 !important;
  font-size: 14px;
  padding: 20px 25px !important;
  line-height: 1.6;
}

.cyber-message-box-person .el-message-box__btns {
  padding: 10px 20px 0;
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-direction: row !important;
  flex-wrap: nowrap !important;
}

.cyber-message-box-person .el-button--primary {
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%) !important;
  border: 1px solid #00f2ff !important;
  color: #fff !important;
  transition: all 0.3s;
}

.cyber-message-box-person .el-button--primary:hover {
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.4);
}

.cyber-message-box-person .el-button:not(.el-button--primary) {
  background: transparent !important;
  border: 1px solid #4a5c76 !important;
  color: #8899a6 !important;
}

.cyber-message-box-person .el-button:not(.el-button--primary):hover {
  color: #fff !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

.cyber-message-box-person.error-mode .el-button--primary {
  background: linear-gradient(90deg, #d32f2f 0%, #8b0000 100%) !important;
  border-color: #ff4d4f !important;
}

.cyber-message-box-person.error-mode .el-button--primary:hover {
  box-shadow: 0 0 15px rgba(255, 77, 79, 0.4);
}

/* 3. 赛博朋克风格下拉菜单 (Dropdown) - [独立命名] */
.el-popper.cyber-dropdown-person {
  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
}

.el-popper.cyber-dropdown-person .el-popper__arrow::before {
  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
}

.cyber-dropdown-person .el-select-dropdown__item {
  color: #ccc !important;
  background: transparent !important;
}

.cyber-dropdown-person .el-select-dropdown__item.hover,
.cyber-dropdown-person .el-select-dropdown__item:hover {
  background-color: rgba(0, 242, 255, 0.15) !important;
  color: #fff !important;
}

.cyber-dropdown-person .el-select-dropdown__item.selected {
  color: #00f2ff !important;
  background-color: rgba(0, 242, 255, 0.05) !important;
  font-weight: bold;
}
</style>

<style>
/* ==========================================================
   [保持] 覆盖选中状态：针对“休假/外出”人员的特殊暗色样式
   ========================================================== */

/* 1. 基础灰显状态修正 */
.person-card.status-out {
  opacity: 0.6;
  border-color: #333;
}

/* 2. [核心] 覆盖选中状态：当“非在位”人员被选中时，强制变暗 (去除青色光效) */
.person-card.active.status-out {
  border-color: #4a5c76 !important;
  box-shadow: none !important;
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* 3. 覆盖右上角选中角标颜色 */
.person-card.active.status-out .check-ribbon {
  border-top-color: #4a5c76 !important;
}

.person-card.active.status-out .check-ribbon .el-icon {
  color: #aaa !important;
}

/* 4. 确保头像框在选中时也不要发光 */
.person-card.active.status-out .card-avatar-box.glow-active {
  border-color: #4a5c76 !important;
  box-shadow: none !important;
}
</style>
