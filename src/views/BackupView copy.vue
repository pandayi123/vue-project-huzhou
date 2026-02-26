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

      <!-- 修改后：增加并排的盘点历史按钮 -->
      <div class="header-right">
        <button class="history-link-btn header-btn" @click="goToHistory">
          <el-icon>
            <HistoryIcon />
          </el-icon>
          盘点记录
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
      <div class="list-section" v-loading="isLoading" element-loading-text="正在校对装备数据..."
        element-loading-background="rgba(10, 14, 23, 0.8)">
        <div class="section-title">
          <!-- 修改后：只保留下拉筛选框 -->
          <div class="title-left">
            <div class="select-wrapper">
              <el-select v-model="selectedName" placeholder="选择装备名称筛选" class="cyber-select"
                popper-class="cyber-select-popper" size="large">
                <el-option label="全部装备名称" value="ALL" />
                <el-option v-for="name in (uniqueNameOptions || []).filter((n) => n !== 'ALL')" :key="name"
                  :label="name" :value="name" />
              </el-select>
            </div>
          </div>

          <!-- 右侧：过滤器标签 -->
          <div class="title-right-actions">
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
        </div>

        <el-scrollbar class="scroll-area">
          <div class="card-grid" v-if="filteredList.length > 0">
            <!-- 定位到 <div class="card-grid"> 内部 -->
            <div v-for="item in filteredList" :key="item.id" class="equip-card"
              :class="{ 'is-active': selectedId === item.id }" @click="handleSelectCard(item)">
              <!-- 顶部：装备图片 -->
              <div class="equip-image-preview">
                <!-- 新增：状态浮层标签 -->
                <div class="status-overlay-tag" :class="item.cachedStatus?.class">
                  {{ item.cachedStatus?.text || '检测中...' }}
                </div>
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
                    <span class="c-label1">系统账面</span>
                    <span class="c-tag" :class="item.group_status === '在位' ? 'st-in' : 'st-out'">
                      {{ item.group_status }}
                    </span>
                  </div>
                  <div class="compare-item">
                    <span class="c-label1">柜内感知</span>
                    <!-- 修改 class 和显示逻辑 -->
                    <!-- 2. 修改柜内感知标签 -->
                    <span class="c-tag" :class="{
                      'st-in': item.actualStatusText === '在位',
                      'st-out': item.actualStatusText === '不在位',
                      'st-loading': item.actualStatusText === '检测中',
                      'st-disabled': item.actualStatusText === '已禁用',
                    }">
                      {{ item.actualStatusText || '检测中' }}
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
            </div>
          </div>
          <div v-else class="no-data-placeholder">
            <el-icon :size="64">
              <Search />
              <!-- 注意：需要在 script 中引入 Search 图标 -->
            </el-icon>
            <p>{{ currentFilter === 'ERROR' ? '当前暂无账实不符项' : '暂无装备数据' }}</p>
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧：盘点数据报告面板 -->
      <div class="operation-section">
        <div class="report-panel">
          <div class="report-header">
            <div class="report-main-title">装备统计信息</div>
            <div class="report-time">实时状态刷新：{{ currentTime }}</div>
          </div>

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
            <div class="analysis-row info-text">
              <span class="a-label"><i class="dot info"></i> 正常借出</span>
              <span class="a-value">{{ stats.outPlace }} 件</span>
            </div>
            <!-- 【新增：账面报失行】 -->
            <!-- 使用特殊的淡红色，区别于异常离位的亮红色 -->
            <div class="analysis-row" v-if="stats.lostCount > 0" style="color: #ff7875; font-weight: bold;">
              <span class="a-label"><i class="dot danger" style="background: #ff7875;"></i> 账面报失</span>
              <span class="a-value">{{ stats.lostCount }} 件</span>
            </div>
            <div class="analysis-row danger-text" v-if="stats.missing > 0">
              <span class="a-label"><i class="dot danger"></i> 异常离位 (账在实不在)</span>
              <span class="a-value">{{ stats.missing }} 件</span>
            </div>
            <div class="analysis-row warning-text" v-if="stats.unregistered > 0">
              <span class="a-label"><i class="dot warning"></i> 异常占用 (实在账不在)</span>
              <span class="a-value">{{ stats.unregistered }} 件</span>
            </div>
            <!-- 【新增：在这里插入 传感屏蔽/待核 统计】 -->
            <div class="analysis-row warning-text" v-if="stats.faultPending > 0" style="color: #ff9800">
              <span class="a-label">
                <i class="dot warning" style="background: #ff9800; box-shadow: 0 0 5px #ff9800"></i>
                传感屏蔽 (待肉眼核实)
              </span>
              <span class="a-value">{{ stats.faultPending }} 件</span>
            </div>
            <div class="analysis-row warning-text" v-if="stats.unmonitored > 0">
              <span class="a-label">
                <i class="dot warning blink"></i>
                人工授信 (当前不受监控)
              </span>
              <span class="a-value">{{ stats.unmonitored }} 件</span>
            </div>
          </div>

          <div class="flex-spacer">
            <el-icon :size="60" class="spacer-icon">
              <Monitor />
            </el-icon>
            <div class="spacer-text">装备状态实时自动更新</div>
          </div>

          <!-- 找到这一块 -->
          <div class="action-footer">
            <button class="cyber-btn" @click="handleOpenSummary">
              <div class="btn-content">
                <el-icon :size="20">
                  <Monitor />
                  <!-- 改为监控图标或盘点图标 -->
                </el-icon>
                <span class="btn-main-text">开始盘点 </span>
              </div>
              <div class="scan-line"></div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 异常核对弹窗 -->
    <el-dialog v-model="summaryVisible" title="装备盘点" destroy-on-close width="1250px" class="inventory-dialog-unique"
      :class="{ 'is-keyboard-open': showKeyboard }" @close="closeKeyboard" :before-close="handleBeforeClose">
      <div class="summary-dialog-content" v-loading="isSummaryLoading" element-loading-text="正在执行账实校对..."
        element-loading-background="rgba(10, 14, 23, 0.9)">
        <div v-if="isSummaryRendering" class="abnormal-table-container custom-scroll" ref="inventoryScrollBody"
          :style="{ maxHeight: scrollAreaHeight }">
          <table class="cyber-table">
            <thead>
              <tr>
                <!-- 1. 实照列宽由 80 增加到 110，适配 4:3 -->
                <th width="110">装备实照</th>
                <!-- 2. 基础信息列保持 180 -->
                <th width="140">装备名称/编号/位置</th>
                <th width="100">装备流转记录</th>
                <!-- 3. 账实对比列由 200 压缩至 160 -->
                <th width="130">账实核对</th>
                <!-- 4. 异常类型列保持 100 -->
                <th width="100">实时状态判定</th>
                <!-- 5. 备注列不设限，自动撑开剩余空间 -->
                <th>盘点备注</th>
                <!-- 6. 快速处置方案列宽保持 280 (按钮变大后需要此空间) -->
                <th width="200">操作选择</th>
              </tr>
            </thead>
            <tbody>
              <!-- 修改 <tr> 的 class -->
              <tr v-for="item in inventoryWorkList" :key="item.id" :class="{
                'is-processed-row':
                  item.manual_checked ||
                  item.manualVerified ||
                  (item.isProcessed && !isAdminDisabled(item)),
              }">
                <!-- 1. 装备实照 -->
                <td>
                  <el-image :src="item.group_image" class="table-thumb" :preview-src-list="[item.group_image]"
                    fit="cover">
                    <template #error>
                      <div class="thumb-err">
                        <span>暂无实照</span>
                        <!-- 新增文字提示 -->
                        <el-icon :size="20">
                          <Picture />
                        </el-icon>
                      </div>
                    </template>
                  </el-image>
                </td>

                <!-- 2. 基础信息 + 物理地址 -->
                <td>
                  <div class="t-name">{{ item.group_name }}</div>
                  <div class="t-code">{{ item.group_code }}</div>
                  <div class="t-pos">{{ item.self_address }}号柜位</div>
                </td>

                <!-- 3. 新增：流转记录按钮 -->
                <td>
                  <button class="mini-action-btn plain-btn" @click="handleCheckHistory(item)">
                    查看记录
                  </button>
                </td>

                <!-- 4. 账实对比 (视觉强化版) -->
                <td>
                  <div class="compare-row">
                    <span class="dot-label">系统账面:</span>
                    <span class="mini-tag" :class="item.group_status === '在位' ? 'st-in' : 'st-out'">
                      {{ item.group_status }}
                    </span>
                  </div>
                  <div class="compare-row" style="margin-top: 8px">
                    <span class="dot-label">柜内感知:</span>
                    <span class="mini-tag" :class="{
                      'st-in': getActualStatus(item) === '在位',
                      'st-out': getActualStatus(item) === '不在位',
                      'st-disabled': getActualStatus(item) === '已禁用', // <--- 新增
                    }">
                      {{ getActualStatus(item) }}
                    </span>
                  </div>
                </td>

                <!-- 5. 判定状态 -->
                <td>
                  <span class="mini-tag" :class="item.cachedStatus?.class" style="font-size: 13px">
                    {{ item.cachedStatus?.text || '检测中...' }}
                  </span>
                </td>

                <!-- 找到以下位置 -->
                <td>
                  <el-input v-model="item.inventory_remark" type="textarea" :rows="2" placeholder="请输入盘点备注..."
                    class="table-textarea" resize="none"
                    @focus="openKeyboard('default', 'inventory_remark', $event, item)" @click="updateCursorPos"
                    @keyup="updateCursorPos" />
                </td>

                <!-- 6. 重点：核实操作列 -->
                <td>
                  <div class="action-btns">
                    <!-- 状态锁定：已经核实过的行 -->
                    <span v-if="
                      item.manual_checked ||
                      item.manualVerified ||
                      (item.isProcessed && !isAdminDisabled(item))
                    " class="status-resolved">
                      <el-icon>
                        <CircleCheck />
                      </el-icon>已核实
                    </span>

                    <!-- 未核实状态下的智能首选项 -->
                    <template v-else>
                      <!-- 1. 异常离位 (账在实不在) -->
                      <template v-if="getDetailedStatus(item).text === '异常离位'">
                        <button class="mini-action-btn success" @click="fixByBorrow(item)">
                          补录领用
                        </button>
                        <el-popover placement="top" :width="160" trigger="click" popper-class="cyber-popover">
                          <template #reference>
                            <button class="mini-action-btn more-btn">更多操作</button>
                          </template>
                          <div class="popover-actions">
                            <div class="pop-item danger" @click="handleReportLoss(item)">
                              装备报失
                            </div>
                            <div class="pop-item" @click="fixByDisableSensor(item)">屏蔽传感</div>
                          </div>
                        </el-popover>
                      </template>

                      <!-- 2. 异常占用 (实在账不在) -->
                      <template v-else-if="getDetailedStatus(item).text === '异常占用'">
                        <button class="mini-action-btn success" @click="fixByReturn(item)">
                          补录归还
                        </button>
                        <button class="mini-action-btn warning" @click="fixByDisableSensor(item)">
                          屏蔽传感
                        </button>
                      </template>

                      <!-- 找到这一块并替换：针对报失状态的统一精准处理 -->
                      <template v-else-if="item.group_status === '报失'">
                        <!-- 统一逻辑：无论是 在位、不在位 还是 已禁用，操作选项都保持一致 -->
                        <template v-if="getActualStatus(item) === '在位' || getActualStatus(item) === '不在位'">
                          <button class="mini-action-btn success" @click="handleConfirmNormal(item)">
                            确认报失
                          </button>
                          <button class="mini-action-btn warning" @click="fixByCancelLoss(item)">
                            恢复在位
                          </button>
                        </template>

                        <!-- 情况 C：传感器已被禁用 -->
                        <template v-else-if="getActualStatus(item) === '已禁用'">
                          <button class="mini-action-btn success" @click="handleManualVerifyLost(item)">
                            核实报失
                          </button>
                          <el-popover placement="top" :width="160" trigger="click" popper-class="cyber-popover">
                            <template #reference>
                              <button class="mini-action-btn more-btn">更多操作</button>
                            </template>
                            <div class="popover-actions">
                              <div class="pop-item" @click="fixByCancelLoss(item)">恢复在位</div>
                              <div class="pop-item" @click="handleEnableSensor(item)">恢复感应</div>
                            </div>
                          </el-popover>
                        </template>
                      </template>

                      <!-- 3. 正常借出 -->
                      <template v-else-if="getDetailedStatus(item).text === '正常借出'">
                        <button class="mini-action-btn success" @click="handleConfirmNormal(item)">
                          确认借出
                        </button>
                        <button class="mini-action-btn warning" @click="fixByDisableSensor(item)">
                          屏蔽传感
                        </button>
                      </template>

                      <!-- 4. 正常在位 -->
                      <template v-else-if="getDetailedStatus(item).text === '正常在位'">
                        <button class="mini-action-btn success" @click="handleConfirmNormal(item)">
                          确认在位
                        </button>
                        <el-popover placement="top" :width="160" trigger="click" popper-class="cyber-popover">
                          <template #reference>
                            <button class="mini-action-btn more-btn">更多操作</button>
                          </template>
                          <div class="popover-actions">
                            <div class="pop-item danger" @click="handleReportLoss(item)">
                              装备报失
                            </div>
                            <div class="pop-item" @click="fixByDisableSensor(item)">屏蔽传感</div>
                          </div>
                        </el-popover>
                      </template>

                      <!-- 5. 传感屏蔽/待核 (isAdminDisabled) -->
                      <template v-else-if="getDetailedStatus(item).text === '传感屏蔽/待核'">
                        <!-- 账面在位 -->
                        <template v-if="item.group_status === '在位'">
                          <button class="mini-action-btn success" @click="handleManualVerify(item)">
                            确认在位
                          </button>
                          <el-popover placement="top" :width="160" trigger="click" popper-class="cyber-popover">
                            <template #reference>
                              <button class="mini-action-btn more-btn">更多操作</button>
                            </template>
                            <div class="popover-actions">
                              <div class="pop-item" @click="handleEnableSensor(item)">恢复感应</div>
                              <div class="pop-item danger" @click="handleReportLoss(item)">
                                装备报失
                              </div>
                            </div>
                          </el-popover>
                        </template>
                        <!-- 账面已取出 -->
                        <template v-else>
                          <button class="mini-action-btn success" @click="handleManualVerify(item)">
                            确认取出
                          </button>
                          <button class="mini-action-btn success" @click="handleEnableSensor(item)">
                            恢复感应
                          </button>
                        </template>
                      </template>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else style="height: 500px"></div>
      </div>
      <!-- 【修改后的页脚部分】 -->
      <template #footer>
        <div class="dialog-footer">
          <div class="footer-left-tip">
            <!-- 进度显示保持不变 -->
            <div class="inventory-progress-bar">
              <span class="p-text">盘点核实进度：</span>
              <span class="p-num">{{ verifiedCount }} / {{ equipmentList.length }}</span>
              <div class="p-track">
                <div class="p-fill" :style="{ width: (verifiedCount / equipmentList.length) * 100 + '%' }"></div>
              </div>
            </div>
          </div>

          <div class="footer-right-btns">
            <!-- 【新增：重新盘点按钮】 -->
            <!-- 只有当已有核实项时才显示，样式使用 cancel 以示区别 -->
            <button class="footer-btn cancel" v-if="verifiedCount > 0" @click="handleResetInventory">
              <el-icon>
                <Refresh />
              </el-icon>
              重新盘点
            </button>
            <!-- 【新增：移到这里的批量核实按钮】 -->
            <!-- 只有当还有未确认的正常项时才显示，或者始终显示 -->
            <button class="footer-btn history-btn" v-if="verifiedCount < equipmentList.length"
              @click="handleBatchVerifyHealthy">
              <el-icon>
                <Check />
              </el-icon>
              一键确认正常项
            </button>

            <!-- 提交按钮 -->
            <button class="footer-btn confirm" :class="{ 'is-disabled': verifiedCount < equipmentList.length }"
              :disabled="verifiedCount < equipmentList.length" @click="finalSubmit">
              生成盘点报告
            </button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- ================= 装备档案详情弹窗 (新增) ================= -->
    <el-dialog v-model="detailVisible" destroy-on-close width="1100px" class="inventory-dialog-unique detail-dialog"
      :show-close="true">
      <template #header>
        <div class="detail-header">
          <div class="header-title-wrapper">
            <span class="main-title">{{ selectedDetail?.group_name }}</span>
            <span class="sub-code">{{ selectedDetail?.group_code }}</span>
          </div>
        </div>
      </template>

      <div class="detail-container custom-scroll" ref="detailScrollBody">
        <!-- 第一行：基础展示区 -->
        <div class="detail-row top-row">
          <!-- 左侧：装备实照与物理状态 -->
          <div class="detail-left-col">
            <div class="image-box">
              <el-image :src="selectedDetail?.group_image" fit="contain"
                :preview-src-list="[selectedDetail?.group_image]">
                <!-- 新增：加载中的占位图 -->
                <template #placeholder>
                  <div class="img-loading-placeholder">
                    <el-icon class="is-loading" :size="30">
                      <Loading />
                    </el-icon>
                    <span>加载中...</span>
                  </div>
                </template>
                <template #error>
                  <div class="img-err">
                    <el-icon :size="40">
                      <Picture />
                    </el-icon><span>暂无实照</span>
                  </div>
                </template>
              </el-image>
              <div class="image-label">装备主视图</div>
            </div>
            <!-- 修改后 -->
            <!-- 修改后：三段式感知对比面板 -->
            <div class="live-monitor-panel">
              <div class="panel-title">
                <el-icon>
                  <Monitor />
                </el-icon>
                实时感知状态对比
              </div>

              <!-- 第一部分：数据源对比层 -->
              <div class="monitor-compare-row">
                <div class="m-compare-box">
                  <span class="m-label">系统账面</span>
                  <span class="m-val" :class="selectedDetail?.group_status === '在位' ? 'text-success' : 'text-sec'">
                    {{ selectedDetail?.group_status }}
                  </span>
                </div>
                <div class="m-divider"></div>
                <!-- 视觉分隔线 -->
                <div class="m-compare-box">
                  <span class="m-label">物理感应</span>
                  <span class="m-val" :class="getActualStatus(selectedDetail) === '在位' ? 'text-success' : 'text-error'
                    ">
                    {{ getActualStatus(selectedDetail) }}
                  </span>
                </div>
              </div>

              <!-- 第二部分：通栏结论层 -->
              <div class="conclusion-bar" :class="getDetailedStatus(selectedDetail).class">
                <span class="c-dot"></span>
                <span class="c-label">状态判定：</span>
                <span class="c-text">{{ getDetailedStatus(selectedDetail).text }}</span>
              </div>
            </div>
          </div>

          <!-- 右侧：核心账面参数 -->
          <div class="detail-right-col">
            <div class="info-group">
              <!-- 标题已修改为 装备详情 -->
              <div class="group-title">基本信息</div>
              <div class="info-grid">
                <!-- 新增：装备名称 -->
                <div class="grid-cell">
                  <span class="label">装备名称</span>
                  <span class="val">{{ selectedDetail?.group_name || '--' }}</span>
                </div>
                <!-- 新增：装备编号 -->
                <div class="grid-cell">
                  <span class="label">装备编号</span>
                  <span class="val">{{ selectedDetail?.group_code || '--' }}</span>
                </div>
                <!-- 原有：装备类型 -->
                <div class="grid-cell">
                  <span class="label">装备类型</span>
                  <span class="val">{{ selectedDetail?.group_type || '--' }}</span>
                </div>
                <!-- 原有：配发时间 -->
                <div class="grid-cell">
                  <span class="label">配发时间</span>
                  <span class="val">{{ selectedDetail?.group_distribution_time || '--' }}</span>
                </div>
                <!-- 原有：芯片数量 -->
                <div class="grid-cell">
                  <span class="label">芯片数量</span>
                  <span class="val">{{ selectedDetail?.group_chip_count }} 枚</span>
                </div>
                <!-- 原有：芯片数量 -->
                <div class="grid-cell">
                  <span class="label">质量分级</span>
                  <span class="val">堪用品</span>
                </div>
                <!-- 原有：芯片数量 -->
                <div class="grid-cell">
                  <span class="label">柜位编号</span>
                  <span class="val">{{ selectedDetail?.self_address }}号柜位</span>
                </div>
                <!-- 空 -->
                <div class="grid-cell">
                  <span class="label"></span>
                  <span class="val"></span>
                </div>
              </div>
            </div>

            <div class="info-group remark-group">
              <div class="group-title">装备参数</div>
              <div class="remark-content">
                {{ selectedDetail?.group_remark || '暂无详细描述参数' }}
              </div>
            </div>
          </div>
        </div>

        <!-- 第二行：芯片清单 (Chip List) -->
        <div class="detail-row chip-row">
          <div class="group-title">绑定芯片列表 ({{ parsedChips.length }} 枚)</div>
          <div class="chip-cards-container">
            <div v-for="(chip, index) in parsedChips" :key="index" class="chip-detail-card">
              <!-- 头部：仅显示序号 -->
              <div class="chip-card-header">
                <span class="chip-idx">芯片 #{{ index + 1 }}</span>
              </div>

              <div class="chip-card-body">
                <!-- 1. 图片展示区：强制 4:3 比例 -->
                <div class="chip-image-zone">
                  <div v-if="chip.chip_image && chip.chip_image.length > 0" class="chip-img-grid">
                    <el-image v-for="(img, i) in chip.chip_image" :key="i" :src="img" class="standard-chip-img"
                      :preview-src-list="chip.chip_image" :initial-index="i" fit="cover" />
                  </div>
                  <div v-else class="chip-no-img">
                    <el-icon>
                      <Picture />
                    </el-icon>
                    <span>无芯片实照</span>
                  </div>
                </div>

                <!-- 2. 芯片信息列表：参考管理页面字段 -->
                <div class="chip-params-list">
                  <div class="param-item">
                    <span class="p-label">芯片名称</span>
                    <span class="p-value">{{ chip.chip_name || '--' }}</span>
                  </div>
                  <div class="param-item">
                    <span class="p-label">芯片编号</span>
                    <span class="p-value">{{ chip.chip_code || '--' }}</span>
                  </div>
                  <div class="param-item">
                    <span class="p-label">芯片类型</span>
                    <span class="p-value">{{ chip.chip_type || '--' }}</span>
                  </div>
                  <div class="param-item vertical">
                    <span class="p-label">芯片参数</span>
                    <div class="p-content" :title="chip.chip_remark">
                      {{ chip.chip_remark || '暂无参数描述' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 修改后 -->
      <template #footer>
        <div class="detail-footer">
          <!-- 🚩 新增操作历史按钮 -->
          <button class="footer-btn history-btn" @click="handleCheckHistory(selectedDetail)">
            <el-icon>
              <HistoryIcon />
            </el-icon>
            装备流转记录
          </button>
          <button class="footer-btn confirm" @click="detailVisible = false">关闭弹窗</button>
        </div>
      </template>
    </el-dialog>

    <!-- 自定义批量核实确认弹窗 -->
    <el-dialog v-model="batchConfirmVisible" title="批量核实确认" width="480px"
      class="inventory-dialog-unique mini-confirm-dialog" :show-close="false">
      <div class="batch-confirm-body">
        <div class="confirm-icon-area">
          <el-icon :size="50" color="#00f2ff">
            <CircleCheck />
          </el-icon>
        </div>

        <div class="confirm-message">
          确定要一键核实当前
          <span class="highlight">{{ batchConfirmStats.total }}</span> 项账实相符装备吗？
        </div>

        <div class="confirm-stats-grid">
          <div class="stats-item">
            <span class="s-label"><i class="dot success"></i> 正常在位装备</span>
            <span class="s-value">{{ batchConfirmStats.inPlace }} 件</span>
          </div>
          <div class="stats-item">
            <span class="s-label"><i class="dot info"></i> 正常借出装备</span>
            <span class="s-value">{{ batchConfirmStats.outPlace }} 件</span>
          </div>
        </div>

        <div class="confirm_tip">
          <el-icon>
            <Warning />
          </el-icon>
          请确保您已视觉确认柜内实物状态与系统一致
        </div>
      </div>

      <template #footer>
        <div class="confirm-footer">
          <button class="footer-btn cancel" @click="batchConfirmVisible = false">取消</button>
          <button class="footer-btn confirm" @click="executeBatchVerify">确定核实</button>
        </div>
      </template>
    </el-dialog>

    <!-- 虚拟键盘组件 -->
    <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition" @mousedown.prevent>
      <SimpleKeyboard v-model="currentInputValue" :defaultLayout="currentLayout" @onKeyPress="handleKeyPress"
        @onClose="closeKeyboard" keyboardClass="show-keyboard" />
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUnmounted,
  reactive,
  defineAsyncComponent,
  nextTick,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'
import {
  Files,
  Box,
  SwitchButton,
  Monitor,
  CircleCheck,
  Location,
  Check,
  Timer as HistoryIcon,
  Search,
  Refresh,
} from '@element-plus/icons-vue'
import { /*ElMessage,*/ ElLoading, ElMessageBox } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
import { useTimerStore } from '@/stores/timerStore'
const timerStore = useTimerStore()

// 1. 定义新变量
const detailVisible = ref(false)
const selectedDetail = ref(null)

// import plugins from '../assets/js/plugin'
// --- 1. 定义选中状态变量 ---
const selectedId = ref(null)

const router = useRouter()
const audioStore = useAudioStore()

// --- 弹窗渲染优化变量 ---
const isSummaryRendering = ref(false) // 标志位：是否开始渲染表格内容
const isSummaryLoading = ref(false) // 【新增】控制弹窗内部的加载动画

// --- 过滤器配置 ---
const filterOptions = [
  { label: '所有项', value: 'ALL' },
  { label: '正常项', value: 'NORMAL' },
  { label: '异常项', value: 'ERROR' },
]

// --- 核心状态变量 ---
const equipmentList = ref([]) // 真实装备列表
const config_blob = ref(null) // 硬件配置信息
const realtimeSwitchMap = reactive({}) // 硬件感知映射表 { self_address: status }
const isPolling = ref(false) // 轮询开关
const isLoading = ref(false) // 新增：控制列表加载状态
const summaryVisible = ref(false)
const currentFilter = ref('ALL')
const selectedName = ref('ALL') // 【新增：记录选中的装备名称】

// --- 虚拟键盘相关核心逻辑 ---
const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard_black.vue'))
const showKeyboard = ref(false)
const activeField = ref('')
const currentInputValue = ref('')
const activeItem = ref(null) // 关键：记录当前正在编辑的装备项
const activeInputDom = ref(null)
const cursorIndex = ref(0)
const scrollAreaHeight = ref('70vh') // 对应异常表格容器的初始高度
const currentLayout = ref('default')

const keyboardPosition = ref({
  bottom: '0px',
  width: '100%',
  left: `0px`,
  position: 'fixed',
  'z-index': 9999,
})

// 更新光标位置
const updateCursorPos = (event) => {
  const inputEl =
    event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT'
      ? event.target
      : event.target.querySelector('textarea, input')
  if (inputEl) {
    cursorIndex.value = inputEl.selectionStart
    activeInputDom.value = inputEl
  }
}

// 打开键盘
const openKeyboard = (layout, fieldName, event, item) => {
  activeField.value = fieldName
  activeItem.value = item
  currentInputValue.value = item[fieldName] || ''
  currentLayout.value = layout
  showKeyboard.value = true

  // 修改：由 25vh 改为 35vh。25vh 太小了，扣除表头后内容区几乎不可见
  scrollAreaHeight.value = '35vh'

  if (event && event.target) {
    activeInputDom.value = event.target
    cursorIndex.value = event.target.selectionStart || currentInputValue.value.length

    nextTick(() => {
      // 这里的 scrollIntoView 很重要，确保输入行不被键盘遮挡
      event.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      event.target.focus()
      event.target.setSelectionRange(cursorIndex.value, cursorIndex.value)
    })
  }
}

// 关闭键盘
const closeKeyboard = () => {
  showKeyboard.value = false
  scrollAreaHeight.value = '70vh' // 恢复表格区域高度

  // 强制让当前活跃的 DOM 失去焦点
  if (activeInputDom.value) {
    activeInputDom.value.blur()
  }
}

const handleKeyPress = (button) => {
  // 关键：如果点击的是关闭或提交，绝对不能再执行 focus()，否则会重新触发 input 的 @focus 事件再次打开键盘
  if (button === '{close}' || button === '{submit}') {
    // 先强制让输入框失去焦点，切断聚焦循环
    if (activeInputDom.value) {
      activeInputDom.value.blur()
    }
    // 延迟一小会儿执行关闭，确保失去焦点动作已完成
    setTimeout(() => {
      closeKeyboard()
    }, 100)
    return // 直接返回，不再执行下面的 focus()
  }

  // 其他按键（如字母、数字）才需要保持聚焦
  nextTick(() => {
    if (activeInputDom.value) activeInputDom.value.focus()
  })
}

/**
 * 处置方案：取消报失并恢复在位 (针对：账面报失，但现在找回了或补录)
 */
const fixByCancelLoss = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要取消装备 ${item.group_name} 的报失状态并恢复为“在位”吗？`,
      '纠正平账', // 修改标题，使其更符合“纠错”语义
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'success',
        customClass: 'cyber-message-box',
      },
    )

    // 1. 更新数据库状态为 在位
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'equipment',
        setValues: { group_status: '在位' },
        condition: `id = ${item.id}`,
      },
    })

    // 2. 更新前端视图：仅修改状态，不标记为已处置完成
    item.group_status = '在位'

    // 【关键修改点】
    // item.isProcessed = true  <-- 删掉这一行！

    item.inventory_remark = '系统账面已由“报失”调整为“在位”。'

    // 【新增】立即触发一次状态判定刷新
    refreshItemStatus(item)

    audioStore.play('/audio/保存成功.mp3')
    // ElMessage.success(`${item.group_name} 账务已恢复，请进行最终确认`)
  } catch (e) {
    console.log('取消恢复操作', e)
  }
}

// 监听键盘输入并回填到对应的列表项
watch(currentInputValue, (newValue, oldValue) => {
  if (showKeyboard.value && activeItem.value && activeField.value) {
    // 同步修改 abnormalItems 中对应项的数据
    activeItem.value[activeField.value] = newValue

    const diff = (newValue || '').length - (oldValue || '').length
    cursorIndex.value += diff

    nextTick(() => {
      if (activeInputDom.value) {
        activeInputDom.value.setSelectionRange(cursorIndex.value, cursorIndex.value)
      }
    })
  }
})

// --- 新增：计算不重复的装备名称列表 ---
const uniqueNameOptions = computed(() => {
  // 增加安全检查，防止数据加载前报错
  if (!equipmentList.value || equipmentList.value.length === 0) return ['ALL']

  const names = equipmentList.value.map((item) => item.group_name)
  // 去重并排序
  const uniqueNames = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'zh-CN'))
  return ['ALL', ...uniqueNames]
})

const handleSelectCard = (item) => {
  selectedId.value = item.id
  selectedDetail.value = item
  detailVisible.value = true
  audioStore.play('/audio/按钮点击声.mp3')
}

// 1. 定义一个用于快速查找的 Map
const switchConfigMap = computed(() => {
  const map = new Map()
  if (config_blob.value?.switch?.details) {
    config_blob.value.switch.details.forEach((d) => {
      map.set(String(d.self_address), d)
    })
  }
  return map
})

// 新增：专门负责更新单个装备的缓存状态
const refreshItemStatus = (item) => {
  // 1. 快速获取实际状态
  const config = switchConfigMap.value.get(String(item.self_address))
  const isDisabled = config && Number(config.admin_status) === 0

  let actual = '检测中'
  if (Object.keys(realtimeSwitchMap).length > 0) {
    if (isDisabled) {
      actual = '已禁用'
    } else {
      const status = realtimeSwitchMap[item.self_address]
      actual = status === undefined ? '检测中' : status === 1 ? '在位' : '不在位'
    }
  }

  // 2. 判定结果逻辑 ( assessResult )
  let result = 'LOADING'
  if (actual !== '检测中') {
    // 修改后的代码：增加对“报失”等不在位状态的兼容
    if (!isDisabled) {
      if (actual === '在位') {
        // 物理在位时，账面必须也是“在位”才算正常
        result = item.group_status === '在位' ? 'HEALTHY' : 'MISMATCH';
      } else {
        // 物理不在位时，账面只要不是“在位”就算正常（包含已取出、报失、待维修等）
        result = item.group_status !== '在位' ? 'HEALTHY' : 'MISMATCH';
      }
    } else {
      result = item.manualVerified ? 'UNMONITORED' : 'SENSOR_FAULT'
    }
  }

  // 3. 构造缓存对象 ( cachedStatus )
  let statusInfo = { text: '检测中...', class: 'tag-loading' }
  if (result === 'MISMATCH') {
    if (item.group_status === '在位') {
      statusInfo = { text: '异常离位', class: 'tag-error-missing' }
    }
    // 【新增/修改点】
    else if (item.group_status === '报失') {
      statusInfo = { text: '报失', class: 'tag-normal-out' } // 统一为青色
    }
    else {
      statusInfo = { text: '异常占用', class: 'tag-error-occupied' }
    }
  } else if (result === 'SENSOR_FAULT') {
    statusInfo = { text: '传感屏蔽/待核', class: 'tag-maintenance-pending' }
  } else if (result === 'UNMONITORED') {
    statusInfo = { text: '人工授信', class: 'tag-unmonitored' }
  } else if (result === 'HEALTHY') {
    if (item.group_status === '在位') {
      statusInfo = { text: '正常在位', class: 'tag-normal-in' }
    } else if (item.group_status === '已取出') {
      statusInfo = { text: '正常借出', class: 'tag-normal-out' }
    } else {
      // 如果是报失、待维修等其他不在位状态
      statusInfo = { text: item.group_status, class: 'tag-normal-out' }
    }
  }

  // 挂载到 item 上（Vue3 会自动追踪这个新属性）
  item.cachedStatus = statusInfo
  item.actualStatusText = actual // 顺便把感知文本也存了
  item.isAbnormal = result === 'MISMATCH' || result === 'SENSOR_FAULT'
}

// --- 新增：跳转历史方法 ---
const goToHistory = () => {
  audioStore.play('/audio/按钮点击声.mp3')
  router.push('/inventory-history') // 请确保你的路由中有这个路径
}

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
  isLoading.value = true
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
    equipmentList.value = allData.map((item) => ({
      ...item,
      inventory_remark: '',
      manual_checked: false, // 新增：是否经过人工点击核实
      showAdvanced: false, // <-- 新增：控制每一行的高级选项展开状态
    }))

    // 【新增性能优化点】数据回来后立即初始化一遍状态缓存
    equipmentList.value.forEach((item) => refreshItemStatus(item))
  } catch (error) {
    console.error('数据获取失败:', error)
  } finally {
    isLoading.value = false // 结束加载
  }
}

// 修改判定函数：细化状态分类
const getAssessmentResult = (item) => {
  const actual = getActualStatus(item)
  if (actual === '检测中') return 'LOADING'

  const isDisabled = isAdminDisabled(item)

  // 场景 A：传感器正常开启
  // 修改后的代码
  if (!isDisabled) {
    if (actual === '在位') {
      return item.group_status === '在位' ? 'HEALTHY' : 'MISMATCH';
    } else {
      return item.group_status !== '在位' ? 'HEALTHY' : 'MISMATCH';
    }
  }

  // 场景 B：传感器已禁用
  else {
    // 如果还没人工核实 -> 属于“待办异常”
    if (!item.manualVerified) return 'SENSOR_FAULT'
    // 如果已人工核实 -> 属于“人工授信/脱离监管” (这就是安全盲区)
    return 'UNMONITORED'
  }
}

// 新增：获取详细盘点结论
const getDetailedStatus = (item) => {
  const result = getAssessmentResult(item)

  if (result === 'LOADING') return { text: '检测中...', class: 'tag-loading' }
  // 修改后的代码
  if (result === 'MISMATCH') {
    if (item.group_status === '在位') {
      return { text: '异常离位', class: 'tag-error-missing' };
    }
    // 【新增/修改点】如果账面是报失，物理却在位，不要叫异常占用
    else if (item.group_status === '报失') {
      return { text: '报失', class: 'tag-normal-out' }; // 赋予一个独特的文本
    }
    else {
      return { text: '异常占用', class: 'tag-error-occupied' };
    }
  }
  if (result === 'SENSOR_FAULT') return { text: '传感屏蔽/待核', class: 'tag-maintenance-pending' }

  // 关键修改：人工核实后的视觉表现
  if (result === 'UNMONITORED') return { text: '人工授信', class: 'tag-unmonitored' }

  if (item.group_status === '在位') {
    return { text: '正常在位', class: 'tag-normal-in' };
  } else if (item.group_status === '已取出') {
    return { text: '正常借出', class: 'tag-normal-out' };
  } else {
    // 关键：直接返回账面实际状态（如“报失”），确保后续逻辑能精准匹配
    return { text: item.group_status, class: 'tag-normal-out' };
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

/**
 * 处置方案：人工核实通过
 */
const handleManualVerify = (item) => {
  item.manualVerified = true
  item.isProcessed = true
  item.inventory_remark = '传感器故障，肉眼核实实物在位'
  audioStore.play('/audio/核实成功.mp3')
  // ElMessage.success(`${item.group_name} 已通过人工核实`)
}
/**
 * 处置方案：人工核实报失项确实不在位 (针对：传感器屏蔽中，肉眼确认没东西)
 */
const handleManualVerifyLost = (item) => {
  item.manualVerified = true;
  item.isProcessed = true;
  // 自动填充备注，减轻管理员输入负担
  item.inventory_remark = '传感器已屏蔽，经肉眼视觉核对，实物确实不在位，与报失账面一致。';
  audioStore.play('/audio/核实成功.mp3');
  // ElMessage.success(`${item.group_name} 报失状态已人工核实一致`);
}

/**
 * 处置方案：开启/恢复传感器
 */
const handleEnableSensor = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复 ${item.self_address} 号柜位的传感器感知吗？恢复后将以传感器实时监测为准。`,
      '恢复确认',
      {
        confirmButtonText: '确定恢复',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'cyber-message-box',
      },
    )

    const newConfig = JSON.parse(JSON.stringify(config_blob.value))
    const switchDetail = newConfig.switch.details.find((d) => d.self_address == item.self_address)

    if (switchDetail) {
      switchDetail.admin_status = 1 // 开启硬件感知

      await window.electronAPI.el_post({
        action: 'update',
        payload: {
          tableName: 'terminal_settings',
          setValues: { config_blob: JSON.stringify(newConfig) },
          condition: `id > 0`,
        },
      })

      // --- 关键修复代码 ---
      config_blob.value = newConfig

      // 重置所有处置状态，让系统重新计算该项是否异常
      item.manualVerified = false // 清除人工核实标记
      item.isProcessed = false // 清除已处置标记（重要！）
      item.inventory_remark = '' // 可选：清除备注
      // ------------------

      // ElMessage.success('传感器感应已恢复，系统将重新实时判定状态')

      // 如果恢复后账实相符，abnormalItems 计算属性会自动将其从弹窗列表中移除
    }
  } catch (e) {
    console.log('用户取消了恢复', e)
  }
}
const lastMismatchCount = ref(-1) // 记录上一次的异常数量，初始为-1用于识别初次加载
const startMonitorLoop = async () => {
  isPolling.value = true
  while (isPolling.value) {
    await updateAllHardwareStatus()
    currentTime.value = formatTime()

    // 性能优化点：在 JS 循环里计算，不要在 HTML 里计算
    equipmentList.value.forEach((item) => {
      refreshItemStatus(item)
    })

    // --- [新增：实时语音提示逻辑] ---
    const currentMismatch = stats.value.mismatch // 获取当前最新的异常总数

    // 只有当不是初次扫描（lastMismatchCount !== -1）且数量发生变化时才触发
    if (lastMismatchCount.value !== -1) {
      if (currentMismatch > lastMismatchCount.value) {
        // 场景：异常增加了（比如有人私自拿走了装备）
        audioStore.play('/audio/拿错提示音.mp3') // 建议使用急促、警示性的音效
        // ElMessage.warning('检测到新的账务不符项！')
      } else if (currentMismatch < lastMismatchCount.value) {
        // 场景：异常减少了（比如错拿的放回去了，或者缺失的补回来了）
        audioStore.play('/audio/拿对提示音.mp3') // 建议使用清脆、正向的音效
        // ElMessage.success('异常项已消除，状态恢复正常')
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
  // 1. 先判断数据是否就绪
  if (Object.keys(realtimeSwitchMap).length === 0) return '检测中'
  // === 新增：优先判断是否禁用 ===
  const detail = config_blob.value?.switch?.details?.find(
    (d) => String(d.self_address) === String(item.self_address),
  )
  if (detail && Number(detail.admin_status) === 0) {
    return '已禁用'
  }

  const status = realtimeSwitchMap[item.self_address]
  if (status === undefined) return '检测中'
  return status === 1 ? '在位' : '不在位'
}

// 新增辅助：判断开关是否被禁用
const isAdminDisabled = (item) => {
  const detail = config_blob.value?.switch?.details?.find(
    (d) => String(d.self_address) === String(item.self_address),
  )
  return detail && Number(detail.admin_status) === 0
}

// 2. 解析芯片列表的计算属性
const parsedChips = computed(() => {
  if (!selectedDetail.value?.chip_list) return []
  try {
    const list = selectedDetail.value.chip_list
    return typeof list === 'string' ? JSON.parse(list) : list
  } catch {
    return []
  }
})

// 统计逻辑修正版：彻底区分“账实相符”与“人工授信风险”
const stats = computed(() => {
  const list = equipmentList.value || []

  // 1. 核心状态预筛选
  // 账实不符项 (系统在实不在，或实在线不在)
  const mismatchItems = list.filter((i) => getAssessmentResult(i) === 'MISMATCH')
  // 故障待办项 (传感器坏了，管理员还没去看)
  const faultPendingItems = list.filter((i) => getAssessmentResult(i) === 'SENSOR_FAULT')
  // 人工授信项 (传感器坏了，管理员点过核实了 —— 这是安全盲区，风险点)
  const unmonitoredItems = list.filter((i) => getAssessmentResult(i) === 'UNMONITORED')
  // 绝对健康项 (传感器开启且账实完全吻合)
  const healthyItems = list.filter((i) => getAssessmentResult(i) === 'HEALTHY')

  return {
    // --- 顶部三个大卡片的数据源 ---
    total: list.length,

    // 账实相符：仅包含传感器监控下的健康项 (如果你希望“人工授信”也算进相符，就把 unmonitoredItems 加上)
    // 建议：此处只计入 HEALTHY，让管理员看到虽然平账了，但“相符率”并不到 100%
    match: healthyItems.length,

    // 异常数量：包含“明确的账实不符”和“传感器故障但还没去核实”的项
    // 这两类会阻塞“确认结果并同步”按钮
    mismatch: mismatchItems.length + faultPendingItems.length,

    // --- 内部明细行的数据源 ---

    // 正常在位：账面在位 且 物理感应在位 且 监控正常
    inPlace: healthyItems.filter((i) => i.group_status === '在位').length,

    // 正常借出：账面已取 且 物理感应不在 且 监控正常
    outPlace: healthyItems.filter((i) => i.group_status === '已取出').length,

    // 【新增】账面报失统计 (无论物理感应如何，只要账面是报失)
    lostCount: list.filter((i) => i.group_status === '报失').length,

    // 异常离位：账面在位，但感应不在 (不含报修项)
    missing: mismatchItems.filter((i) => i.group_status === '在位').length,

    // 异常占用：账面不在，但感应在位 (不含报修项)
    unregistered: mismatchItems.filter((i) => i.group_status === '已取出').length,

    faultPending: faultPendingItems.length, // 新增：传感屏蔽但还没肉眼核实的

    // 安全盲区统计：传感器被屏蔽且已通过人工核实的数量
    unmonitored: unmonitoredItems.length,
  }
})

// --- 修改：filteredList 逻辑（整合标签过滤和名称过滤） ---
const filteredList = computed(() => {
  let list = equipmentList.value || []

  // 1. 标签状态过滤 (全部/异常/正常)
  if (currentFilter.value === 'NORMAL') {
    list = list.filter((i) => !i.isAbnormal) // 直接读取缓存
  } else if (currentFilter.value === 'ERROR') {
    list = list.filter((i) => i.isAbnormal) // 直接读取缓存
  }

  // 2. 下拉框名称过滤 (如果选了特定名称，则进一步过滤)
  if (selectedName.value !== 'ALL') {
    list = list.filter((item) => item.group_name === selectedName.value)
  }

  return list
})

// 【新增】全量盘点工作列表：严格按物理柜位排序
const inventoryWorkList = computed(() => {
  return [...equipmentList.value].sort((a, b) => {
    return (Number(a.self_address) || 0) - (Number(b.self_address) || 0)
  })
})
// 【新增】已核实数量统计 (包括人工确认正常的 + 已处理平账的)
const verifiedCount = computed(() => {
  return equipmentList.value.filter(
    (item) =>
      item.manual_checked || item.manualVerified || (item.isProcessed && !isAdminDisabled(item)),
  ).length
})
// 【新增】确认正常项无误
const handleConfirmNormal = (item) => {
  item.manual_checked = true
  let statusLabel = item.group_status // 可能是 '在位', '已取出', '报失'

  // 智能备注逻辑
  if (statusLabel === '报失') {
    item.inventory_remark = item.inventory_remark || `经核对，实物状态与账面“报失”一致`
  } else {
    const label = statusLabel === '在位' ? '在位' : '借出'
    item.inventory_remark = item.inventory_remark || `经实物核对，确认${label}状态无误`
  }

  audioStore.play('/audio/按钮点击声.mp3')
  // ElMessage.success(`${item.group_name} 核实成功`)
}

// --- 新增：批量核实二次确认弹窗控制 ---
const batchConfirmVisible = ref(false)
const batchConfirmStats = reactive({
  inPlace: 0,
  outPlace: 0,
  total: 0,
})

// 【新增】一键核实所有账实相符项 (提高效率)
// 修改后的 handleBatchVerifyHealthy 函数
const handleBatchVerifyHealthy = () => {
  // 找出所有符合条件且未核实的项
  const healthyAndUnchecked = equipmentList.value.filter(
    (item) => getAssessmentResult(item) === 'HEALTHY' && !item.manual_checked,
  )

  if (healthyAndUnchecked.length === 0) {
    // ElMessage.info('当前无可核实的正常项')
    return
  }

  // 预计算统计信息
  batchConfirmStats.total = healthyAndUnchecked.length
  batchConfirmStats.inPlace = healthyAndUnchecked.filter((i) => i.group_status === '在位').length
  batchConfirmStats.outPlace = healthyAndUnchecked.filter((i) => i.group_status !== '在位').length

  audioStore.play('/audio/按钮点击声.mp3')
  batchConfirmVisible.value = true // 打开自定义确认框
}

// 执行最终的批量核实
const executeBatchVerify = () => {
  const healthyAndUnchecked = equipmentList.value.filter(
    (item) => getAssessmentResult(item) === 'HEALTHY' && !item.manual_checked,
  )

  healthyAndUnchecked.forEach((item) => {
    item.manual_checked = true
    item.inventory_remark = '系统判定相符，人工批量核对一致'
  })

  batchConfirmVisible.value = false
  // ElMessage.success(`已成功批量核实 ${healthyAndUnchecked.length} 项装备`)
  audioStore.play('/audio/保存成功.mp3')
}
/**
 * 核心功能：重新盘点 (清空当前所有核实状态)
 */
const handleResetInventory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空当前所有已核实的记录并重新盘点吗？此操作将重置备注并撤销人工核实状态。',
      '重新盘点确认',
      {
        confirmButtonText: '确定重置',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'cyber-message-box',
      }
    )

    equipmentList.value.forEach((item) => {
      // 1. 清空人工点击的核实标记
      item.manual_checked = false

      // 2. 清空针对传感器故障的肉眼核实标记
      item.manualVerified = false

      // 3. 清空处置完成标记 (针对 补录领用/归还/纠错 后的锁定状态)
      item.isProcessed = false

      // 4. 清空备注
      item.inventory_remark = ''
    })

    audioStore.play('/audio/按钮点击声.mp3')
    // ElMessage.success('已清空核实记录，请重新开始盘点')
  } catch {
    console.log('取消重置')
  }
}

//在过滤器切换时重置选中项：
const setFilter = (type) => {
  audioStore.play('/audio/按钮点击声.mp3')
  currentFilter.value = type
  selectedId.value = null // 切换分类时取消选中
}

const handleOpenSummary = () => {
  audioStore.play('/audio/按钮点击声.mp3')

  // 1. 立即打开弹窗
  summaryVisible.value = true
  isSummaryRendering.value = false
  isSummaryLoading.value = true // 【新增】开启加载动画

  // 2. 延迟渲染表格并关闭加载动画
  setTimeout(() => {
    isSummaryRendering.value = true
    // 稍微给一点延迟感（如 500ms），让用户看到加载过程，体验更像在“扫描数据”
    setTimeout(() => {
      isSummaryLoading.value = false // 【新增】关闭加载动画
    }, 500)
  }, 300)
}

const finalSubmit = async () => {
  // 1. 再次双重校验：是否还有未处理的异常
  // 【修改】校验逻辑：必须全部核对完成（已核实数 === 总数）
  if (verifiedCount.value < equipmentList.value.length) {
    audioStore.play('/audio/校验失败请参考红色文字提示.mp3')
    /*
    ElMessage.error(
      `盘点未完成！尚有 ${equipmentList.value.length - verifiedCount.value} 项装备未核实。`,
    )
    */
    return
  }

  const loading = ElLoading.service({
    text: '正在加密并同步盘点报告...',
    background: 'rgba(0,0,0,0.8)',
  })

  try {
    // 2. 构造盘点报告详单 (全量数据快照)
    const reportDetails = equipmentList.value.map((item) => ({
      group_name: item.group_name,
      group_code: item.group_code,
      self_address: item.self_address,
      system_status: item.group_status, // 账面
      actual_status: getActualStatus(item), // 实物
      assessment: getDetailedStatus(item).text, // 判定结论
      remark: item.inventory_remark || '系统自动核对一致',
      operator: '管理员', // 如果有登录信息请替换
    }))

    // 3. 写入盘点日志表 (inventory_logs)
    const response = await window.electronAPI.el_post({
      action: 'insert',
      payload: {
        tableName: 'inventory_logs',
        setValues: {
          inventory_time: formatTime(),
          total_count: equipmentList.value.length,
          abnormal_count: 0, // 既然能提交，说明此时异常已全部处置清零
          details_json: JSON.stringify(reportDetails),
          operator: '当前终端管理员',
        },
      },
    })

    if (response.success) {
      audioStore.play('/audio/保存成功.mp3')
      /*
      ElMessage({
        type: 'success',
        message: '盘点报告已生成并成功存入盘点历史记录。',
        duration: 3000,
      })
      */

      // 4. 清理状态并关闭
      summaryVisible.value = false
      // 可选：盘点结束后跳转回首页或刷新数据
      await getRealData()
    } else {
      throw new Error(response.message)
    }
  } catch (error) {
    console.error('提交盘点失败:', error)
    // ElMessage.error('报告同步失败，请检查网络或数据库连接')
  } finally {
    loading.close()
  }
}

// --- [核心功能：快速处置逻辑] ---

/**
 * 处置方案1：补录领用 (针对：账面在，实物不在)
 */
const fixByBorrow = async (item) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '检测到紧急领用，请输入领用用途',
      '补录领用登记',
      {
        confirmButtonText: '确认补录',
        cancelButtonText: '取消',
        inputPlaceholder: '例如：紧急领用、演训调拨...',
        customClass: 'cyber-message-box',
      },
    )

    if (reason) {
      // 1. 插入领用记录
      await window.electronAPI.el_post({
        action: 'insert',
        payload: {
          tableName: 'borrow_records',
          setValues: {
            equipment_id: item.id,
            group_code: item.group_code,
            group_name: item.group_name,
            username: '系统核对补录',
            borrow_time: formatTime(),
            status: 0,
            remark: `盘点补录：${reason}`,
          },
        },
      })
      // 2. 更新装备状态
      await window.electronAPI.el_post({
        action: 'update',
        payload: {
          tableName: 'equipment',
          setValues: { group_status: '已取出' },
          condition: `id = ${item.id}`,
        },
      })

      item.group_status = '已取出' // 同步前端视图
      item.isProcessed = true // 新增这一行
      item.inventory_remark = '已完成补录登记'
      audioStore.play('/audio/领用完成数据已保存.mp3')
      // ElMessage.success(`${item.group_name} 领用记录已补齐`)
    }
  } catch {
    console.log('取消补录')
  }
}

const handleCheckHistory = (/*item*/) => {
  audioStore.play('/audio/按钮点击声.mp3')
  // 这里可以跳转到历史页面并带上参数，或者弹出另一个记录弹窗
  // router.push({ path: '/borrow-history', query: { code: item.group_code } })
  // ElMessage.info(`正在查询 ${item.group_name} 的流转记录...`)
}

/**
 * 处置方案：装备报失
 */
const handleReportLoss = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确定将装备 ${item.group_name} (${item.group_code}) 标记为“报失”吗？此操作将记录入库并更新装备状态。`,
      '装备报失确认',
      {
        confirmButtonText: '确定报失',
        cancelButtonText: '取消',
        type: 'error',
        customClass: 'cyber-message-box',
      },
    )

    // 更新数据库状态为报失（假设状态码或文字是 报失）
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'equipment',
        setValues: { group_status: '报失' },
        condition: `id = ${item.id}`,
      },
    })

    item.group_status = '报失'
    item.isProcessed = true
    item.inventory_remark = '盘点发现异常，已执行报失处理'
    audioStore.play('/audio/保存成功.mp3')
    // ElMessage.error(`${item.group_name} 已标记为报失状态`)
  } catch {
    console.log('取消报失')
  }
}

/**
 * 处置方案2：补录归还 (针对：实物在位，但系统显示已取出/维修中)
 * 逻辑：1. 将装备状态设为“在位”
 *      2. 将借用记录表中该装备对应的“未归还”记录标记为“已归还”并记录归还时间
 */
const fixByReturn = async (item) => {
  try {
    await ElMessageBox.confirm(
      `确认为该装备已归还？系统将自动销毁对应的未归还记录，完成账务平齐。`,
      '补录归还确认',
      {
        confirmButtonText: '确认归还',
        cancelButtonText: '取消',
        type: 'success',
        customClass: 'cyber-message-box',
      },
    )

    // 1. 更新装备表：恢复为“在位”
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'equipment',
        setValues: { group_status: '在位' },
        condition: `id = ${item.id}`,
      },
    })

    // 2. 核心：平账逻辑。关闭 borrow_records 表中该装备所有未归还(status=0)的记录
    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'borrow_records',
        setValues: {
          status: 1, // 状态改为已归还
          return_time: formatTime(), // 记录盘点核对时间为归还时间
        },
        // 匹配该装备 ID 且 状态为未归还的记录
        condition: `equipment_id = ${item.id} AND status = 0`,
      },
    })

    // 3. 更新前端状态同步 UI
    item.group_status = '在位'
    item.isProcessed = true // 新增这一行
    item.inventory_remark = '手动核对实物在位，已完成补录归还及平账处理'

    // 【新增性能优化点】立即刷新该项的缓存状态，无需等待下一秒轮询
    // refreshItemStatus(item)

    // ElMessage.success(`${item.group_name} 已完成补录归还`)
    audioStore.play('/audio/按钮点击声.mp3')
  } catch (e) {
    console.log('取消归还补录', e)
  }
}

// 【新增】优化后的关闭方法：解决关闭卡顿
const handleBeforeClose = (/*done*/) => {
  // 1. 关键：先让沉重的表格 DOM 消失 (v-if)
  // 销毁一个被隐藏的 DOM 片段比销毁一个可见的 Dialog 效率高很多
  isSummaryRendering.value = false

  // 2. 等待 DOM 卸载完成后的下一帧再关闭弹窗
  nextTick(() => {
    summaryVisible.value = false
    // 如果需要执行 done() 则调用，这里我们直接控变量
  })
}
/**
 * 处置方案3：禁用故障传感器
 */
const fixByDisableSensor = async (item) => {
  await ElMessageBox.confirm(
    `确定禁用 ${item.self_address} 号柜位的传感器感知吗？禁用后系统将不再自动检测该位置的实时状态。`,
    '传感器屏蔽/报修',
    { confirmButtonText: '确认禁用', type: 'error', customClass: 'cyber-message-box' },
  )

  const newConfig = JSON.parse(JSON.stringify(config_blob.value))
  const switchDetail = newConfig.switch.details.find((d) => d.self_address == item.self_address)
  if (switchDetail) {
    switchDetail.admin_status = 0 // 标记为禁用

    await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'terminal_settings',
        setValues: { config_blob: JSON.stringify(newConfig) },
        condition: `id > 0`,
      },
    })

    config_blob.value = newConfig
    item.isProcessed = true
    // 修改备注，明确这只是硬件层面的操作
    item.inventory_remark = '传感器故障，已执行物理屏蔽'
    // ElMessage.warning('传感器已禁用，请继续执行肉眼核实以完成盘点')
  }
}

onMounted(async () => {
  if (timerStore.isTimerActive) timerStore.stopInterval()
  await fetchConfigData()
  await getRealData()
  startMonitorLoop()
})

onUnmounted(() => {
  isPolling.value = false
  // 4. 恢复全局定时器（如果有）
  if (!timerStore.isTimerActive) timerStore.startInterval()
})
</script>

<style scoped>
/* ==========================================================
   1. 基础变量与全局布局
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

/* ==========================================================
   2. 顶部导航栏 (Header)
   ========================================================== */
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

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 盘点历史按钮合并后的样式 */
.history-link-btn {
  background: rgba(0, 242, 255, 0.05);
  border: 1px solid var(--primary-dark);
  color: var(--primary);
  padding: 0 18px;
  height: 36px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.history-link-btn:hover {
  background: rgba(0, 242, 255, 0.15);
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
  border-color: var(--primary);
}

.btn-exit {
  background: transparent;
  border: 1px solid var(--error);
  color: var(--error);
  padding: 8px 18px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ==========================================================
   3. 主体布局与列表展示区
   ========================================================== */
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
  overflow: hidden;
  position: relative;
}

.section-title {
  padding: 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border);
}

.title-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.select-wrapper {
  width: 160px;
}

.title-right-actions {
  display: flex;
  align-items: center;
  gap: 15px;
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

/* ==========================================================
   4. 装备卡片网格 (Card Grid)
   ========================================================== */
.scroll-area {
  flex: 1;
  padding: 15px;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

/* --- 修改 .equip-card 基础样式并增加 .is-active 效果 --- */
.equip-card {
  position: relative;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 6px;
  height: auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  /* 让过渡更丝滑 */
  /* 增加手型，提示可点击 */
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
}

/* 统一的悬停效果 */
.equip-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(0, 242, 255, 0.4);
  transform: translateY(-2px);
  /* 悬停微动 */
}

/* --- 统一的【选中/激活】样式 --- */
.equip-card.is-active {
  background: rgba(0, 242, 255, 0.08);
  /* 整体背景微亮 */
  border-color: var(--primary);
  /* 青色边框 */
  box-shadow:
    0 0 15px rgba(0, 242, 255, 0.2),
    inset 0 0 15px rgba(0, 242, 255, 0.1);
  /* 内外发光 */
}

/* 选中时，让内部的柜位图标和文字也变亮 */
.equip-card.is-active .card-footer-pos {
  background: rgba(0, 242, 255, 0.1);
  color: #fff;
  text-shadow: 0 0 5px var(--primary);
}

/* --- 1. 状态浮层基础样式（所有标签共用） --- */
.status-overlay-tag {
  position: absolute;
  top: 6px;
  left: 6px;
  z-index: 10;
  padding: 2px 10px;
  /* 稍微加宽一点，更显精致 */
  border-radius: 4px;
  font-size: 11px;
  font-weight: 900;
  /* 极粗字体，增强赛博感 */
  letter-spacing: 1px;
  /* 字符间距，更有科技感 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  transition: all 0.3s ease;
}

/* --- 2. 浅色背景组：统一用黑色文字 --- */

/* 正常在位：亮绿色 */
.tag-normal-in {
  background: rgba(0, 255, 157, 0.95) !important;
  color: #000 !important;
  text-shadow: none;
  /* 浅色底不需要文字阴影 */
}

/* 异常占用：橙黄色 */
.tag-error-occupied {
  background: rgba(230, 162, 60, 0.95) !important;
  color: #000 !important;
}

/* 传感屏蔽/待核实：警告橙 */
.tag-maintenance-pending {
  background: #ff9800 !important;
  color: #000 !important;
  box-shadow: 0 0 12px rgba(255, 152, 0, 0.3);
}

/* --- 3. 深色背景组：统一用白色文字 --- */

/* 正常借出：青蓝色 */
.tag-normal-out {
  background: rgba(0, 153, 161, 0.9) !important;
  color: #fff !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  /* 深色底加微弱阴影托出文字 */
}

/* 异常离位：亮红色 */
.tag-error-missing {
  background: rgba(255, 77, 79, 0.9) !important;
  color: #fff !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* 异常项呼吸动画 */
@keyframes tagPulse {
  0% {
    box-shadow: 0 0 0px rgba(255, 77, 79, 0);
  }

  50% {
    box-shadow: 0 0 10px rgba(255, 77, 79, 0.5);
  }

  100% {
    box-shadow: 0 0 0px rgba(255, 77, 79, 0);
  }
}

/* 检测中 */
.tag-loading {
  background: rgba(0, 0, 0, 0.7) !important;
  color: #aaa !important;
}

/* 约 395 行附近 */
.equip-image-preview {
  width: 100%;
  height: 100px;
  background: #000;
  border-bottom: 1px solid var(--border);
  position: relative;
  /* <--- 关键补充：让标签相对于图片容器定位 */
  overflow: hidden;
  /* 确保圆角和边缘对齐 */
}

.image-placeholder,
.image-error-slot {
  background: #0d121c;
  width: 100%;
  height: 100%;
}

.image-error-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #334155;
}

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
}

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
  font-size: 13px;
  color: #292e32;
}

.c-label1 {
  font-size: 13px;
  color: #66788a;
}

.c-tag {
  font-size: 12px;
  padding: 1px 6px;
  border-radius: 2px;
  font-weight: bold;
}

.st-in {
  background: rgba(0, 255, 157, 0.15);
  color: var(--success);
  border: 1px solid rgba(0, 255, 157, 0.2);
}

.st-out {
  background: rgba(255, 255, 255, 0.05);
  color: #8899a6;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.st-loading {
  background: rgba(255, 255, 255, 0.05);
  color: #555;
  border: 1px solid #333;
}

.card-footer-pos {
  padding: 8px 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--primary);
  font-size: 12px;
}

/* ==========================================================
   5. 右侧报告面板 (Operation Section)
   ========================================================== */
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

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  padding: 15px 5px;
  text-align: center;
  border-radius: 4px;
  transition: 0.3s;
}

.stat-card:hover {
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

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  background: #4a5c76;
  /* 默认灰色 */
  margin-right: 8px;
  vertical-align: middle;
}

/* 正常借出行的文字颜色 (统一为青蓝色) */
.info-text {
  color: #00c2cc;
  /* 采用比 tag-normal-out 稍微亮一点的颜色，保证文字清晰 */
  font-weight: bold;
}

/* 正常借出行的小圆点颜色 */
.dot.info {
  background: #0099a1;
  box-shadow: 0 0 5px rgba(0, 153, 161, 0.8);
}

.dot.success {
  background: var(--success);
  box-shadow: 0 0 5px var(--success);
}

.dot.danger {
  background: var(--error);
  box-shadow: 0 0 5px var(--error);
}

.success-text {
  color: var(--success);
  font-weight: bold;
}

.danger-text {
  color: var(--error);
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

/* ==========================================================
   6. 按钮与交互 (Buttons & Cyber Effects)
   ========================================================= */
.cyber-btn {
  width: 100%;
  height: 45px;
  background: linear-gradient(90deg, var(--primary-dark) 0%, #005f66 100%);
  border: 1px solid var(--primary);
  color: #fff;
  position: relative;
  overflow: hidden;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
}

.btn-main-text {
  font-size: 16px;
  font-weight: bold;
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

/* ==========================================================
   7. 组件穿透覆盖 (Element Plus Scoped) - 同步系统参数页样式
   ========================================================== */

/* 1. 下拉框本体背景与边框 (兼容新旧版 Element Plus) */
.cyber-select :deep(.el-select__wrapper),
.cyber-select :deep(.el-input__wrapper) {
  background-color: rgba(20, 27, 45, 0.8) !important;
  /* 深蓝半透明 */
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  /* 默认边框 */
  transition: all 0.3s;
}

/* 2. 鼠标悬停 或 聚焦时的样式 (青色微光与边框) */
.cyber-select :deep(.el-select__wrapper:hover),
.cyber-select :deep(.el-select__wrapper.is-focused),
.cyber-select :deep(.el-input__wrapper:hover),
.cyber-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary) inset !important;
  /* 青色高亮边框 */
  background-color: rgba(0, 242, 255, 0.05) !important;
  /* 青色微光背景 */
}

/* 3. 选中文本的颜色 */
.cyber-select :deep(.el-select__selected-item),
.cyber-select :deep(.el-input__inner) {
  color: #fff !important;
  font-family: 'Segoe UI', sans-serif;
  font-weight: bold;
}

/* 4. 占位符颜色 (提示文字) */
.cyber-select :deep(.el-select__placeholder) {
  color: var(--text-sec) !important;
}

/* 5. 右侧小图标颜色 */
.cyber-select :deep(.el-icon) {
  color: var(--primary-dark);
}

/* 处置按钮样式 */
.action-btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 统一所有按钮的基础尺寸和文字 */
.mini-action-btn {
  /* 关键：固定高度 */
  height: 32px !important;
  /* 关键：统一内边距 */
  padding: 0 15px !important;
  font-size: 13px !important;
  font-weight: bold !important;

  /* 基础布局 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 4px;
  white-space: nowrap;
  transition: all 0.2s;
  box-sizing: border-box;
  /* 确保边框不撑开高度 */
}

/* 悬停效果同步强化 */
.mini-action-btn:hover {
  background: var(--primary-dark);
  color: #000;
  box-shadow: 0 0 10px rgba(0, 242, 255, 0.3);
}

.mini-action-btn.success {
  border-color: var(--success);
  color: var(--success);
  background: rgba(0, 255, 157, 0.05);
}

.mini-action-btn.warning {
  border-color: var(--warning);
  color: var(--warning);
  background: rgba(230, 162, 60, 0.05);
}

/* 修正：传感已屏蔽状态标签 - 让它和按钮看起来一样大 */
.disposal-step-group .mini-tag.st-disabled {
  height: 32px;
  /* 与按钮高度完全一致 */
  padding: 0 12px;
  /* 保持一致的水平内边距 */
  font-size: 13px;
  /* 字体大小一致 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(255, 77, 79, 0.15) !important;
  color: #ff4d4f !important;
  border: 1px solid rgba(255, 77, 79, 0.4) !important;
  margin: 0;
  /* 清除默认 margin */
}

/* 表格缩略图 */
/* 修改后的表格缩略图：适配 4:3 比例 */
.table-thumb {
  width: 96px;
  /* 宽度增加 */
  height: 72px;
  /* 按照 4:3 比例计算 */
  border-radius: 4px;
  border: 1px solid var(--border);
  background: #000;
  display: block;
  /* 消除间隙 */
}

.thumb-err {
  width: 96px;
  height: 72px;
  background: #0d121c;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #4a5c76;
  border: 1px dashed #2a3546;
  gap: 2px;
  /* 1. 缩小间距，让视觉更紧凑 */
  font-size: 13px;
  line-height: 1;
  /* 2. 关键：强制行高为1，消除文字底部多余间隙 */
}

/* 3. 针对图标进行微调，确保图标本身没有额外占位 */
.thumb-err .el-icon {
  margin-bottom: 0;
  /* 确保没有下边距 */
  display: flex;
  /* 消除行内元素的基线对齐问题 */
}

.thumb-err span {
  letter-spacing: 1px;
  margin-top: 22px;
  /* 4. 手动微调文字位置，补偿视觉重心 */
}

/* 位置信息 */
.t-pos {
  font-size: 12px;
  color: var(--primary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}

/* 账实对比行 */
.compare-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
}

.dot-label {
  font-size: 13px;
  color: #8899a6;
}

/* 已核实/数据已平 状态标签的高度对齐 */
.status-resolved {
  color: var(--success);
  font-weight: bold;
  font-size: 14px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

/* 已禁用状态：深红背景，亮红文字 */
.st-disabled {
  background: rgba(255, 77, 79, 0.15) !important;
  color: #ff4d4f !important;
  border: 1px solid rgba(255, 77, 79, 0.3) !important;
}

/* 警告文字颜色（橙黄色） */
.warning-text {
  color: var(--warning);
  /* 对应 #e6a23c */
  font-weight: bold;
}

/* 警告小圆点 */
.dot.warning {
  background: var(--warning);
  box-shadow: 0 0 5px var(--warning);
}

/* ================= 详情弹窗专项样式 ================= */

/* 头部样式 */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-title-wrapper {
  display: flex;
  flex-direction: column;
}

.header-title-wrapper .main-title {
  font-size: 20px;
  color: var(--primary);
  font-weight: bold;
}

.header-title-wrapper .sub-code {
  font-size: 13px;
  color: var(--text-sec);
  font-family: monospace;
}

/* 内容区域 */
.detail-container {
  max-height: 70vh;
  padding-right: 10px;
}

.detail-row {
  margin-bottom: 25px;
}

.top-row {
  display: flex;
  gap: 20px;
}

/* 左列：影像与监控 */
.detail-left-col {
  flex: 0 0 320px;
}

.image-box {
  width: 100%;
  height: 240px;
  background: #000;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.image-label {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.6);
  color: var(--text-sec);
  text-align: center;
  font-size: 12px;
  padding: 4px 0;
}

.live-monitor-panel {
  margin-top: 15px;
  background: rgba(0, 242, 255, 0.05);
  border: 1px solid var(--primary-dark);
  border-radius: 6px;
  padding: 12px;
}

.panel-title {
  font-size: 13px;
  color: var(--primary);
  font-weight: bold;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* --- 重新设计的实时感知面板样式 --- */
.live-monitor-panel {
  margin-top: 15px;
  background: rgba(0, 0, 0, 0.25);
  /* 稍微加深背景 */
  border: 1px solid var(--border);
  border-left: 3px solid var(--primary);
  /* 侧边高亮条 */
  border-radius: 4px;
  padding: 12px;
}

.monitor-compare-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 0;
  border-radius: 4px;
}

.m-compare-box {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.m-divider {
  width: 1px;
  height: 25px;
  background: rgba(255, 255, 255, 0.1);
}

.m-label {
  font-size: 13px;
  color: #66788a;
  margin-bottom: 4px;
}

.m-val {
  font-size: 14px;
  font-weight: bold;
}

/* 结论通栏 */

.c-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 8px;
  background: currentColor;
  box-shadow: 0 0 8px currentColor;
}

.c-label {
  opacity: 0.7;
  font-size: 12px;
  margin-right: 4px;
}

/* --- 1. 强化结论通栏的基础样式 --- */
.conclusion-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  /* 统一高度的关键：固定内边距和行高 */
  padding: 12px 10px !important;
  height: 46px;
  /* 强制所有结论栏高度一致 */
  box-sizing: border-box;

  border-radius: 4px;
  font-size: 15px;
  font-weight: 900;
  letter-spacing: 2px;
  margin-top: 15px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

/* --- 2. 统一各状态的色彩 (确保与左侧逻辑一致) --- */

/* 正常在位：亮绿色 + 黑色字 */
.conclusion-bar.tag-normal-in {
  background: #00ff9d !important;
  color: #000 !important;
}

/* 正常借出：修复蓝色为灰蓝色，与左侧 st-out 逻辑统一 */
.conclusion-bar.tag-normal-out {
  background: rgba(0, 153, 161, 0.9) !important;
  /* 深灰蓝，表示正常但不在位 */
  color: #fff !important;
}

/* 异常离位：亮红色 + 白色字 */
.conclusion-bar.tag-error-missing {
  background: rgba(255, 77, 79, 0.9) !important;
  color: #fff !important;
}

/* 异常占用：橙黄色 + 黑色字 */
.conclusion-bar.tag-error-occupied {
  background: rgba(230, 162, 60, 0.95) !important;
  color: #000 !important;
}

/* 传感屏蔽/待核：修正高度坍塌 + 统一橙色 */
/* 使用具体类名组合，确保优先级高于 .mini-tag 的定义 */
.conclusion-bar.tag-maintenance-pending {
  background: #ff9800 !important;
  color: #000 !important;
  padding: 12px 10px !important;
  /* 强制恢复内边距 */
  display: flex !important;
  align-items: center !important;
  height: 46px !important;
}

/* 人工授信：淡橙色 */
.conclusion-bar.tag-unmonitored {
  background: rgba(255, 170, 0, 0.2) !important;
  color: #ffaa00 !important;
  border: 1px solid #ffaa00 !important;
}

/* --- 3. 内部元素微调 --- */
.conclusion-bar .c-label {
  opacity: 0.8;
  font-size: 13px;
  margin-right: 4px;
  font-weight: normal;
}

.conclusion-bar .c-text {
  /* 确保文字垂直居中 */
  line-height: 1;
}

/* 结论栏内部的小点同步隐藏或改色（因为背景已经是实色了） */
.c-dot {
  display: none;
  /* 实色背景下不需要小圆点 */
}

/* 辅助颜色 */
.text-success {
  color: #00ff9d;
}

.text-error {
  color: #ff4d4f;
}

.text-sec {
  color: #8899a6;
}

/* 右列：参数展示 */
.detail-right-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.group-title {
  font-size: 14px;
  color: var(--primary);
  border-left: 3px solid var(--primary);
  padding-left: 10px;
  margin-bottom: 12px;
  font-weight: bold;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
}

.grid-cell {
  background: var(--card-bg);
  padding: 12px;
  display: flex;
  justify-content: space-between;
}

.grid-cell .label {
  color: var(--text-sec);
  font-size: 14px;
}

/* 优化：如果装备名称或编号过长，防止挤压 */
.grid-cell .val {
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  margin-left: 10px;
  text-align: right;
  word-break: break-all;
  /* 允许长编号换行 */
}

.remark-group {
  flex: 1;
  background: rgba(0, 0, 0, 0.2);
  padding: 15px;
  border-radius: 6px;
}

.remark-content {
  font-size: 13px;
  line-height: 1.6;
  color: #cdd9e5;
  white-space: pre-wrap;
  /* 关键：保留换行 */
}

/* 找到 .img-err 并修改为以下内容 */
.img-err {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0d121c;
  /* 统一使用最深色 */
  color: #334155;
  gap: 10px;
}

/* 确保 el-image 撑满父容器，否则居中参照物不对 */
.image-box :deep(.el-image) {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 如果你想让文字也带点发光感（可选） */
.img-err span {
  font-size: 14px;
  letter-spacing: 1px;
}

/* 1. 强制 el-image 及其内部所有容器背景为深色 */
.image-box :deep(.el-image) {
  width: 100%;
  height: 100%;
  background-color: #0d121c !important;
  /* 核心：防止白光闪烁 */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 2. 针对 el-image 内部图片容器的背景也进行覆盖 */
.image-box :deep(.el-image__wrapper),
.image-box :deep(.el-image__placeholder),
.image-box :deep(.el-image__error) {
  background-color: #0d121c !important;
}

/* 3. 加载中占位符样式 (仿赛博风格) */
.img-loading-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #0d121c;
  color: var(--primary);
  /* 青色文字 */
  gap: 12px;
}

/* 让加载图标转起来 */
.img-loading-placeholder .is-loading {
  animation: rotating 2s linear infinite;
  filter: drop-shadow(0 0 5px var(--primary));
}

.img-loading-placeholder span {
  font-size: 13px;
  letter-spacing: 1px;
  opacity: 0.8;
}

/* 4. 图片加载后的淡入效果（可选，能让过渡更平滑） */
.image-box :deep(.el-image__inner) {
  animation: fadeIn 0.4s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.detail-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  /* 关键：确保内部组件垂直居中 */
  gap: 16px;
  /* 稍微加大按钮间距，显得更大气 */
  width: 100%;
}

/* 同时建议修改详情弹窗里的显示逻辑（约 1139 行附近） */
.live-monitor-panel .tag-maintenance-pending {
  background: #e6a23c;
  color: #000;
  padding: 2px 8px;
  border-radius: 4px;
}

/* 报修已核实：淡青色 */
.tag-maintenance-ok {
  background: rgba(0, 242, 255, 0.15);
  color: #00f2ff;
  border: 1px solid rgba(0, 242, 255, 0.3);
}

.text-muted {
  opacity: 0.6;
}

/* --- 芯片卡片容器网格 --- */
.chip-cards-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  /* 依然保持一行 3 个 */
  gap: 16px;
  padding-bottom: 20px;
}

.chip-detail-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s;
}

.chip-detail-card:hover {
  border-color: var(--primary-dark);
  background: rgba(0, 242, 255, 0.02);
}

/* --- 头部：仅序号 --- */
.chip-card-header {
  background: rgba(0, 242, 255, 0.08);
  padding: 10px 15px;
  border-bottom: 1px solid var(--border);
}

.chip-idx {
  color: var(--primary);
  font-weight: bold;
  font-size: 14px;
  letter-spacing: 1px;
}

/* --- 内容区布局 --- */
.chip-card-body {
  display: flex;
  flex-direction: column;
}

/* --- 图片：4:3 比例适配 --- */
.chip-image-zone {
  padding: 15px 15px 0 15px;
}

.chip-img-grid {
  display: grid;
  grid-template-columns: 1fr;
  /* 详情里默认大图展示，如果有多个芯片图会自动撑开 */
  gap: 8px;
}

.standard-chip-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  /* 对应拍照的 640x480 */
  border-radius: 4px;
  border: 1px solid var(--border);
  background: #000;
}

.chip-no-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: rgba(0, 0, 0, 0.2);
  border: 1px dashed var(--border);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #334155;
  font-size: 12px;
  gap: 8px;
}

/* --- 信息列表：模仿管理页面布局 --- */
.chip-params-list {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  padding-bottom: 8px;
}

.param-item.vertical {
  flex-direction: column;
  align-items: flex-start;
  border-bottom: none;
}

.p-label {
  color: var(--text-sec);
  flex-shrink: 0;
}

.p-value {
  color: #fff;
  font-weight: 500;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-left: 10px;
}

/* 参数内容区 */
.p-content {
  margin-top: 6px;
  width: 100%;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #cdd9e5;
  line-height: 1.5;
  min-height: 50px;
  max-height: 80px;
  overflow-y: auto;
  white-space: pre-wrap;
  /* 保留参数换行 */
}

/* 人工授信/非受控状态：醒目的警告色 */
.tag-unmonitored {
  background: rgba(255, 170, 0, 0.2) !important;
  color: #ffaa00 !important;
  border: 1px solid #ffaa00;
  box-shadow: 0 0 8px rgba(255, 170, 0, 0.3);
}

/* 在卡片上增加一个“非受控”标志 */
.equip-card.is-unmonitored {
  border-color: #ffaa00 !important;
  background: rgba(255, 170, 0, 0.05) !important;
}

/* 闪烁动画提示该位置不可靠 */
.equip-card.is-unmonitored::after {
  content: 'UNGUARDED';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 24px;
  font-weight: 900;
  color: rgba(255, 170, 0, 0.15);
  pointer-events: none;
  border: 4px solid rgba(255, 170, 0, 0.15);
  padding: 5px 10px;
}

.disposal-step-group {
  display: flex;
  align-items: center;
  gap: 10px;
  /* 增大元素间的间距 */
}

/* 强制让“传感已屏蔽”标签在弹窗表格里显得更小巧一点 */
.mini-tag.st-disabled {
  border: 1px solid rgba(255, 77, 79, 0.4);
  background: rgba(255, 77, 79, 0.1);
}

/* 针对“屏蔽但未核实”的中间状态 */
.mini-tag.st-unreg {
  background: #e6a23c !important;
  /* 强制使用不透明橙色 */
  color: #000 !important;
  /* 强制使用黑色文字 */
  border: none !important;
  /* 不透明背景下通常不需要边框 */
  font-weight: bold;
}

/* 只有真正处理完的行才变淡 */
.is-processed-row {
  background: rgba(0, 255, 157, 0.05) !important;
  opacity: 0.8;
  border-left: 4px solid var(--success);
  /* 增加左侧绿色条，表示彻底完成 */
}

/* 仅针对弹窗表格中“异常类型”列的标签字体进行放大 */
.type-cell .mini-tag {
  font-size: 13px !important;
  padding: 3px 8px;
  /* 稍微增加一点内边距让文字不拥挤 */
}

/* 针对查看记录按钮的弱化样式 */
.mini-action-btn.plain-btn {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
  color: #8899a6;
}

.mini-action-btn.plain-btn:hover {
  background: rgba(0, 242, 255, 0.1);
  border-color: var(--primary);
  color: var(--primary);
}

/* --- 找到并替换这部分代码 --- */
.table-textarea :deep(.el-textarea__inner) {
  background-color: rgba(0, 0, 0, 0.3) !important;
  /* 稍微调暗背景 */
  /* 关键修改：使用更淡的颜色，并彻底移除阴影 */
  border: 1px solid var(--border) !important;
  box-shadow: none !important;

  color: #cdd9e5 !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  padding: 2px 10px !important;
  height: 52px !important;
  min-height: 52px !important;
  max-height: 52px !important;
  overflow-y: auto !important;
  transition: all 0.3s;
  border-radius: 4px;
}

/* 选中后的样式保持青色，增加识别度 */
.table-textarea :deep(.el-textarea__inner:focus) {
  border-color: var(--primary) !important;
  background-color: rgba(0, 242, 255, 0.05) !important;
  /* 聚焦时稍微亮一点 */
  box-shadow: 0 0 0 1px var(--primary) inset !important;
  /* 使用内阴影代替外发光，更硬核 */
}

/* 占位符颜色 */
.table-textarea :deep(.el-textarea__inner::placeholder) {
  color: #4a5c76 !important;
}

/* 针对 Textarea 内部滚动条的赛博朋克化定制 */
.table-textarea :deep(.el-textarea__inner)::-webkit-scrollbar {
  width: 4px !important;
}

.table-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-track {
  background: transparent !important;
}

.table-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-thumb {
  background: #2a3546 !important;
  border-radius: 10px !important;
}

.table-textarea :deep(.el-textarea__inner)::-webkit-scrollbar-thumb:hover {
  background: var(--primary-dark) !important;
}

:deep(.el-dialog.inventory-dialog-unique) {
  /* 默认状态下增加过渡动画 */
  transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
}

/* --- 修改：优化键盘唤起时弹窗的定位 --- */
:deep(.el-dialog.inventory-dialog-unique.is-keyboard-open) {
  /* 强制将弹窗顶部固定在距离屏幕顶部 2vh 的位置，不再使用 top:50% */
  top: 2px !important;
  /* 只处理水平居中，垂直方向不再偏移 */
  transform: translate(-50%, 0) !important;
  margin-top: 0 !important;
}

/* --- 补充：防止双重滚动条导致的布局闪烁 --- */
:deep(.is-keyboard-open .el-dialog__body) {
  overflow: hidden !important;
  /* 键盘打开时，禁用弹窗外层的滚动，只允许表格内部滚动 */
}

/* 键盘容器样式 */
.keyboard-container {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  width: 100% !important;
  z-index: 9999 !important;
  background-color: #141b2d !important;
  border-top: 1px solid #00f2ff;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.6);
  padding: 5px 0 20px 0 !important;
}

/* 确保 SimpleKeyboard 样式正确渲染 */
:deep(.show-keyboard) {
  background-color: transparent !important;
}

:deep(.show-keyboard .hg-button) {
  background: #2a3546 !important;
  color: #fff !important;
  border-bottom: 2px solid #151a23 !important;
}

:deep(.show-keyboard .hg-button:active) {
  background: #00f2ff !important;
  color: #000 !important;
}

/* 修改：弹窗底部布局 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  /* 左右分布 */
  align-items: center;
  width: 100%;
}

.footer-left-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  /* 确保文字颜色和图标对齐 */
  line-height: 1;
}

.footer-right-btns {
  display: flex;
  gap: 15px;
}

/* 修改：禁用状态下的提交按钮 */
.footer-btn.confirm.is-disabled {
  background: #2a3546 !important;
  border-color: #4a5c76 !important;
  color: #666 !important;
  cursor: not-allowed;
  filter: grayscale(1);
  opacity: 0.6;
}

.footer-btn.confirm.is-disabled:hover {
  transform: none;
  box-shadow: none;
}

/* 进度条样式 */
.inventory-progress-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.p-text {
  color: var(--text-sec);
  font-size: 14px;
}

.p-num {
  color: var(--primary);
  font-family: 'Consolas';
  font-weight: bold;
  font-size: 18px;
  min-width: 60px;
}

.p-track {
  width: 240px;
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid rgba(0, 242, 255, 0.1);
}

.p-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-dark), var(--primary));
  box-shadow: 0 0 10px var(--primary-dark);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 之前已处理行的样式微调，让它更明显一点 */
.is-processed-row {
  background: rgba(0, 255, 157, 0.04) !important;
  opacity: 0.85;
  /* 不要太淡，保证文字清晰 */
}

/* 确保页脚右侧按钮有足够的间距 */
.footer-right-btns {
  display: flex;
  gap: 15px;
  /* 增加按钮之间的距离 */
  align-items: center;
}

/* 调整批量核实按钮的样式，使其看起来像次级按钮 */
.footer-btn.history-btn {
  background: rgba(0, 242, 255, 0.05);
  border: 1px solid rgba(0, 242, 255, 0.3);
  color: var(--primary);
  min-width: 180px;
  /* 稍微宽一点，因为文字较长 */
}

/* 修改或添加以下样式 */
.no-data-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  /* 给一个最小高度，确保在中间 */
  color: var(--text-sec);
  width: 100%;
}

.no-data-placeholder .el-icon {
  margin-bottom: 20px;
  opacity: 0.2;
  /* 图标半透明，显得更高级 */
}

.no-data-placeholder p {
  font-size: 16px;
  opacity: 0.6;
}

/* 确保 scroll-area 内部是 Flex 布局，支持子元素垂直居中 */
.scroll-area :deep(.el-scrollbar__view) {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}
</style>

<style>
/* ==========================================================
   8. 全局与弹窗样式 (Non-Scoped) - 终极修复滚动条
   ========================================================== */

/* 1. 强制覆盖 Dialog 核心背景及边框 */
.inventory-dialog-unique.el-dialog {
  background-color: #141b2d !important;
  background-image: linear-gradient(135deg, rgba(0, 242, 255, 0.05) 0%, transparent 100%);
  border: 1px solid #0099a1 !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(0, 242, 255, 0.05) !important;
  border-radius: 8px !important;
  margin: 0 auto !important;
  position: absolute !important;
  left: 50% !important;
  top: 50% !important;
  transform: translate(-50%, -50%) !important;
  max-height: 90vh !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

.inventory-dialog-unique .el-dialog__header {
  padding: 20px 20px 10px;
  border-bottom: 1px solid rgba(0, 242, 255, 0.1);
}

.inventory-dialog-unique .el-dialog__title {
  color: #00f2ff !important;
  font-weight: bold;
  letter-spacing: 1px;
}

/* 2. 弹窗主体区 - 统一滚动条风格 */
/* ==========================================================
   8. 弹窗滚动条精准控制
   ========================================================== */

/* 1. 基础设置：两个弹窗共用的 Body 样式 */
.inventory-dialog-unique .el-dialog__body {
  flex: 1 !important;
  background-color: transparent !important;
  color: #ffffff !important;
  padding: 15px 20px !important;
  display: flex !important;
  flex-direction: column !important;
}

/* 2. 【核心修改】针对“盘点全量表格”弹窗（无 detail-dialog 类名时） */
/* 逻辑：禁用 Body 滚动，强制使用内部表格滚动，消除双滚动条 */
.inventory-dialog-unique:not(.detail-dialog) .el-dialog__body {
  overflow: hidden !important;
}

/* 3. 【核心修改】针对“装备详情”弹窗（有 detail-dialog 类名时） */
/* 逻辑：允许 Body 滚动，确保档案内容（基本信息、芯片列表）能完整显示 */
.inventory-dialog-unique.detail-dialog .el-dialog__body {
  overflow-y: auto !important;
}

/* 针对详情弹窗内部滚动条的美化（可选） */
.inventory-dialog-unique.detail-dialog .el-dialog__body::-webkit-scrollbar {
  width: 6px !important;
}

.inventory-dialog-unique.detail-dialog .el-dialog__body::-webkit-scrollbar-thumb {
  background: #2a3546 !important;
  border-radius: 10px !important;
}

/* 确保内部容器能自适应剩余空间 */
.summary-dialog-content {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
}

/* 确保弹窗内的加载圆圈也是青色 */
.summary-dialog-content :deep(.el-loading-spinner .path) {
  stroke: #00f2ff !important;
}

/* 确保加载文字也是青色 */
.summary-dialog-content :deep(.el-loading-text) {
  color: #00f2ff !important;
  font-size: 14px;
  letter-spacing: 1px;
  margin-top: 10px;
}

/* === 核心修复：针对弹窗 Body 和内部 custom-scroll 统一滚动条样式 === */
.inventory-dialog-unique .el-dialog__body::-webkit-scrollbar,
.custom-scroll::-webkit-scrollbar {
  width: 6px !important;
  height: 6px !important;
}

.inventory-dialog-unique .el-dialog__body::-webkit-scrollbar-track,
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2) !important;
  border-radius: 10px !important;
}

.inventory-dialog-unique .el-dialog__body::-webkit-scrollbar-thumb,
.custom-scroll::-webkit-scrollbar-thumb {
  background: #2a3546 !important;
  /* 深灰蓝滑块 */
  border-radius: 10px !important;
  border: 1px solid rgba(0, 242, 255, 0.1) !important;
}

.inventory-dialog-unique .el-dialog__body::-webkit-scrollbar-thumb:hover,
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #0099a1 !important;
  /* 悬停变青色 */
}

/* 3. 其他弹窗组件适配 */
.inventory-dialog-unique .el-dialog__footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.inventory-dialog-unique .el-dialog__headerbtn .el-dialog__close {
  color: #00f2ff !important;
}

/* 快捷处置表格容器（保持原有改好的部分） */
.abnormal-table-container {
  max-height: 70vh;
  overflow-y: auto !important;
  border: 1px solid #2a3546;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.cyber-table {
  width: 100%;
  border-collapse: collapse;
}

.cyber-table th {
  background: #0d121c;
  padding: 12px;
  font-size: 14px;
  color: #00f2ff;
  border-bottom: 1px solid #2a3546;
  text-align: left;
}

.cyber-table td {
  padding: 15px 12px;
  /* 增加上下间距，缓解拥挤感 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  vertical-align: middle;
}

/* 异常标记 */
.mini-tag {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 11px;
  font-weight: bold;
}

.st-out-warn {
  background: #ff4d4f !important;
  color: #0d121c !important;
  /* 红色背景配白色字 */
  border: none !important;
}

.st-unreg {
  background: rgba(230, 162, 60, 0.2);
  color: #e6a23c;
  border: 1px solid #e6a23c;
}

.st-other {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid #8899a6;
}

/* 备注输入框深度优化 */
.table-input .el-input__wrapper {
  background-color: rgba(0, 0, 0, 0.4) !important;
  box-shadow: none !important;
  border: 1px solid #2a3546 !important;
  padding: 4px 12px !important;
}

.table-input .el-input__inner {
  font-size: 13px !important;
  color: #cdd9e5 !important;
}

/* 选中的行高亮，更易聚焦 */
.cyber-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}

/* 2. 修复按钮左右 padding 缺失问题 */
.footer-btn {
  min-width: 130px;
  max-width: 170px;
  /* 稍微加宽 */
  padding: 0 24px;
  height: 42px;
  /* 稍微增高 */
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
  /* 新增：轻微的投影让按钮不那么死板 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.footer-btn:hover {
  transform: translateY(-1px);
  /* 悬停微动 */
  box-shadow: 0 4px 12px rgba(0, 242, 255, 0.2);
}

/* 3. 新增的操作历史按钮样式 */
.footer-btn.history-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  color: var(--text-sec);
}

.footer-btn.history-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--primary);
  border-color: var(--primary-dark);
}

.footer-btn.cancel {
  background: #1c2538;
  border: 1px solid #2a3546;
  color: #8899a6;
}

.footer-btn.confirm {
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%);
  border: 1px solid #00f2ff;
  color: #fff;
}

/* ==========================================================
   8. 全局下拉框样式 - 终极修复版 (覆盖内部变量)
   ========================================================== */

.el-popper.cyber-select-popper {
  /* 1. 必须覆盖这个变量，Element内部列表背景色引用的就是它 */
  --el-bg-color-overlay: #141b2d !important;

  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
}

/* 2. 隐藏小箭头背景 */
.el-popper.cyber-select-popper .el-popper__arrow::before {
  background: #141b2d !important;
  border: 1px solid #0099a1 !important;
}

/* 3. 下拉选项基础样式 - 强制透明 */
.cyber-select-popper .el-select-dropdown__item {
  color: #ccc !important;
  background: transparent !important;
  font-family: 'Segoe UI', sans-serif;
  height: 40px !important;
  line-height: 40px !important;
}

/* 4. 鼠标悬停 (Hover) */
.cyber-select-popper .el-select-dropdown__item.hover,
.cyber-select-popper .el-select-dropdown__item:hover {
  background-color: rgba(0, 242, 255, 0.15) !important;
  color: #fff !important;
}

/* 5. 选中项 (Selected) */
.cyber-select-popper .el-select-dropdown__item.selected {
  color: #00f2ff !important;
  background-color: rgba(0, 242, 255, 0.1) !important;
  font-weight: bold;
}

/* 6. 强制清除内部 List 的背景 */
.cyber-select-popper .el-select-dropdown__list,
.cyber-select-popper .el-scrollbar__view {
  background: transparent !important;
  padding: 5px 0 !important;
}

/* ==========================================================
   自定义深色滚动条样式 (修复白色滑动条)
   ========================================================== */

/* 1. 针对 Webkit 浏览器 (Chrome, Electron, Edge) */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
  /* 纵向滚动条宽度 */
  height: 6px;
  /* 横向滚动条高度 */
}

/* 滚动条轨道 (背景) */
.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  /* 深色透明背景 */
  border-radius: 10px;
}

/* 滚动条滑块 (也就是你说的那个白色条) */
.custom-scroll::-webkit-scrollbar-thumb {
  background: #2a3546;
  /* 滑块基础颜色：深灰蓝 */
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.1);
  /* 淡淡的青色边框 */
  transition: all 0.3s;
}

/* 鼠标悬停滑块时变亮 */
.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: #0099a1;
  /* 悬停时变为青暗色 */
  box-shadow: 0 0 5px rgba(0, 242, 255, 0.2);
}

/* 鼠标点击滑块时 */
.custom-scroll::-webkit-scrollbar-thumb:active {
  background: #00f2ff;
  /* 激活时变为亮青色 */
}

/* 2. 针对 Firefox 浏览器 (兼容性补丁) */
.custom-scroll {
  scrollbar-width: thin;
  scrollbar-color: #2a3546 rgba(0, 0, 0, 0.2);
}

/* 3. 针对 Element Plus el-scrollbar 的统一覆盖 (如果弹窗内使用了该组件) */
.inventory-dialog-unique .el-scrollbar__bar.is-vertical {
  width: 6px;
}

.inventory-dialog-unique .el-scrollbar__thumb {
  background-color: #2a3546 !important;
  opacity: 1;
  /* 默认是透明的，改为常亮或半透明 */
}

/* 已处理行的背景变淡 */
.is-processed-row {
  background: rgba(0, 255, 157, 0.03) !important;
  opacity: 0.8;
}

/* 已处置绿色标签 */
.mini-tag.st-resolved {
  background: rgba(0, 255, 157, 0.2);
  color: #00ff9d;
  border: 1px solid #00ff9d;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ==========================================================
   快速处置列按钮布局优化
   ========================================================== */
.disposal-step-group {
  display: flex;
  align-items: center;
  gap: 12px;
  /* 增大按钮间距 */
}

/* --- 2. 批量确认弹窗专属样式 --- */
.batch-confirm-body {
  text-align: center;
  padding: 10px 20px;
}

.confirm-icon-area {
  margin-bottom: 20px;
  filter: drop-shadow(0 0 10px rgba(0, 242, 255, 0.4));
}

.confirm-message {
  font-size: 16px;
  color: #fff;
  margin-bottom: 25px;
  line-height: 1.5;
}

.confirm-message .highlight {
  color: var(--primary);
  font-size: 24px;
  font-weight: bold;
  font-family: 'Consolas';
  margin: 0 5px;
}

.confirm-stats-grid {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stats-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-item .s-label {
  font-size: 14px;
  color: var(--text-sec);
}

.stats-item .s-value {
  font-weight: bold;
  color: #fff;
}

.confirm_tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 13px;
  color: #ffaa00;
  opacity: 0.8;
}

.confirm-footer {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding-bottom: 10px;
}
</style>

<style>
/* ==========================================================
   [同步修正版] 赛博朋克风格 ElMessageBox 全局样式覆盖
   修复：同步领用页面的 530px 宽度及间距逻辑
   ========================================================== */

/* 1. 弹窗容器 */
.cyber-message-box.el-message-box {
  background-color: #141b2d !important;
  border: 1px solid #0099a1 !important;
  box-shadow:
    0 0 30px rgba(0, 0, 0, 0.8),
    inset 0 0 20px rgba(0, 242, 255, 0.05) !important;
  border-radius: 8px !important;
  /* 同步领用页面的大留白感 */
  padding-bottom: 40px !important;
  /* 同步领用页面的宽度 */
  width: 530px !important;
  max-width: 95vw;
}

/* 2. 标题区 */
.cyber-message-box .el-message-box__header {
  background: rgba(0, 0, 0, 0.2);
  padding: 15px 25px;
  /* 增加左右内边距 */
  border-bottom: 1px solid rgba(0, 242, 255, 0.1);
}

.cyber-message-box .el-message-box__title {
  color: #fff !important;
  /* 同步领用页纯白标题 */
  font-weight: bold;
  letter-spacing: 1px;
}

/* 3. 内容区 */
.cyber-message-box .el-message-box__content {
  color: #ccdbe8 !important;
  padding: 35px 30px !important;
  /* 增加内边距，显得更宽敞 */
  font-size: 14px;
  line-height: 1.6;
}

/* 4. 底部按钮容器 */
.cyber-message-box .el-message-box__btns {
  padding: 10px 30px 0 !important;
  /* 左右间距对齐内容区 */
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  flex-direction: row-reverse !important;
  gap: 20px !important;
}

/* 5. 统一按钮尺寸 */
.cyber-message-box .el-message-box__btns .el-button {
  margin: 0 !important;
  min-width: 130px !important;
  /* 稍微加宽按钮，适配 530px 的大框 */
  height: 40px !important;
  /* 稍微加高，增加点击感 */
  font-size: 14px !important;
  font-weight: bold !important;
  border-radius: 4px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  transition: all 0.3s !important;
  padding: 0 20px !important;
}

/* 6. 确认按钮 (Primary) */
.cyber-message-box .el-button--primary {
  background: linear-gradient(90deg, #0099a1 0%, #005f66 100%) !important;
  border: 1px solid #00f2ff !important;
  color: #fff !important;
}

.cyber-message-box .el-button--primary:hover {
  box-shadow: 0 0 15px rgba(0, 242, 255, 0.4) !important;
}

/* 7. 取消按钮 (Default) */
.cyber-message-box .el-button:not(.el-button--primary) {
  background: transparent !important;
  /* 同步领用页面的透明背景 */
  border: 1px solid #4a5c76 !important;
  color: #8899a6 !important;
}

.cyber-message-box .el-button:not(.el-button--primary):hover {
  color: #fff !important;
  border-color: #8899a6 !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

/* 8. 针对 Prompt 输入框样式 */
.cyber-message-box .el-input__wrapper {
  background-color: rgba(20, 27, 45, 0.9) !important;
  box-shadow: 0 0 0 1px #4a5c76 inset !important;
  height: 40px;
}

.cyber-message-box .el-input__inner {
  color: #fff !important;
}
</style>

<style>
/* 更多操作按钮样式 */
.more-btn {
  /* 移除这里的 padding 和高度设置 */
  background: rgba(255, 255, 255, 0.05) !important;
  color: #8899a6 !important;
  /* 宽度可以稍微固定，显得稳重 */
}

/* 气泡浮窗深度定制 */
/* 气泡浮窗深度定制 */
.el-popper.cyber-popover {
  background: #1a2234 !important;
  border: 1px solid #00f2ff !important;
  padding: 4px 0 !important;
  /* 减小内边距，让菜单更紧凑 */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8) !important;
}

/* 气泡内部选项高度也统一 */
.pop-item {
  padding: 8px 15px;
  /* 稍微减小一点，适配整体紧凑感 */
  line-height: 1.4;
}

.el-popper.cyber-popover .el-popper__arrow::before {
  background: #1a2234 !important;
  border: 1px solid #00f2ff !important;
}

.popover-actions {
  display: flex;
  flex-direction: column;
}

.pop-item {
  padding: 10px 15px;
  color: #cdd9e5;
  font-size: 13px;
  transition: all 0.2s;
  font-weight: bold;
  text-align: center;
}

.pop-item:hover {
  background: rgba(0, 242, 255, 0.1);
  color: #00f2ff;
}

.pop-item.danger {
  color: #ff4d4f;
}

.pop-item.danger:hover {
  background: rgba(255, 77, 79, 0.1);
  color: #ff7875;
}
</style>

<style>
/* 让旋转的圆圈变成你的主题青色 */
.list-section .el-loading-spinner .path {
  stroke: #00f2ff !important;
}

/* 让加载文字也变成青色 */
.list-section .el-loading-text {
  color: #00f2ff !important;
  font-size: 16px;
  letter-spacing: 2px;
}
</style>

<style>
/* 解决图片加载前后的闪白问题 */
.equip-image-preview,
.table-thumb,
.image-box,
.el-image {
  background-color: #0d121c !important;
  /* 强制所有图片容器背景为深黑色 */
}

/* 深度穿透 Element Plus 内部占位符 */
.el-image__placeholder,
.el-image__wrapper,
.el-image__error {
  background-color: #0d121c !important;
}

/* 修改图片加载中的占位背景 */
.image-placeholder {
  background: #0d121c !important;
}
</style>
