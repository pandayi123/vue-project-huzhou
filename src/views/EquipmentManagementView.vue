<template>
  <div ref="containerDiv" style="width: 100%; height: 100%">
    <div class="equip_operation_line">
      <div>
        <el-button type="primary" size="large" @click="add_equipment()">添加新装备</el-button>
        <el-button @click="editEquipment" type="primary" size="large">编辑查看</el-button>
        <el-button @click="switchView" type="primary" size="large">刷新开关列表</el-button>
      </div>
      <div>
        <el-button @click="goBack" size="large">退出返回</el-button>
        <el-button type="danger" size="large" @click="deleteSelectedEquipment">删除选中装备</el-button>
      </div>
    </div>
    <div style="
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        font-size: 0.28rem;
        color: #333;
        justify-content: center;
        background-color: #fff;
      " v-show="el_loading">
      更新数据...,请稍后...
    </div>
    <!--
      <vxe-grid v-bind="gridOptions" :height="tableHeight">
        <template #operationDefault="{ row, rowIndex }">
          <el-button link type="primary" @click="showEquipmentDetail(row)" style="font-size:0.23rem;">查看详情</el-button>
          <el-button link type="primary" @click="editEquipment(row)" style="font-size:0.23rem;">编辑</el-button>
        </template>
</vxe-grid>
-->
    <el-table ref="tableRef" stripe border :data="tableData" style="width: 100%; height: 100%; padding-bottom: 15px"
      :max-height="tableHeight">
      <el-table-column type="selection" />
      <el-table-column type="index" label="序号" width="60" />
      <el-table-column prop="group_type" label="装备类型" sortable />
      <el-table-column prop="group_name" label="装备名称" sortable />
      <el-table-column prop="group_code" label="装备编号" sortable />
      <el-table-column prop="group_distribution_time" label="配发时间" sortable />
      <el-table-column prop="group_chip_count" width="90" label="芯片数量" />
      <el-table-column prop="group_status" label="装备状态" sortable />
      <el-table-column prop="self_address" label="开关地址" sortable />
      <el-table-column prop="hardware_status" label="开关状态" width="90" />
      <el-table-column prop="admin_status" label="开关管理" width="90" />
      <!--
      <el-table-column prop="created_time" label="创建时间" width="100" />
      -->
      <el-table-column prop="last_modified" label="最近修改时间" />
      <!--
      <el-table-column fixed="right" label="操作" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click.prevent="deleteRow(scope.$index)">
            装备详情
          </el-button>
          <el-button link type="primary" @click.prevent="deleteRow(scope.$index)"> 编辑 </el-button>
        </template>
      </el-table-column>
    -->
    </el-table>
    <!-- 添加装备弹窗 -->
    <el-dialog :close-on-click-modal="false" :before-close="handleClose" @close="getData" v-model="showDialog"
      :title="isEditMode ? '编辑 / 复制装备' : '添加新装备'" width="1000px" style="color: #000">
      <el-form :inline="true" :model="form_add_new" :rules="rules" ref="formRef">
        <!--
        <el-row style="margin-bottom:20px;margin-top:20px;">
          <el-col :span="12">
            <el-button size="large" type="primary" @click="open_equip_info()">装备信息库</el-button>
          </el-col>
        </el-row>
        -->
        <el-row style="margin-top: 10px">
          <el-col :span="12">
            <el-form-item label="装备编号" prop="group_code">
              <el-input v-model="form_add_new.group_code" placeholder="请输入装备编号"
                @focus="openKeyboard('default', 'group_code', -1)" size="large"
                style="width: 5.6rem; font-size: 0.26rem" ref="groupCode"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装备名称" prop="group_name">
              <el-input v-model="form_add_new.group_name" placeholder="请输入装备名称"
                @focus="openKeyboard('default', 'group_name', -1)" size="large"
                style="width: 5.6rem; font-size: 0.26rem"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="装备类型">
              <el-input v-model="form_add_new.group_type" placeholder="请输入装备类型"
                @focus="openKeyboard('default', 'group_type', -1)" size="large"
                style="width: 5.6rem; font-size: 0.26rem"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="芯片数量">
              <el-input-number v-model="form_add_new.group_chip_count" :min="0" :max="99"
                style="width: 2.6rem; font-size: 0.26rem" @focus="openKeyboard('default', 'group_chip_count', -1)"
                size="large" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-col :span="10">
              <el-form-item label="配发时间">
                <el-date-picker placement="top" v-model="form_add_new.group_distribution_time" type="date"
                  placeholder="请选择配发时间" size="large" style="width: 4.6rem" />
              </el-form-item>
            </el-col>
          </el-col>
        </el-row>
        <el-row style="margin-bottom: 25px">
          <el-col :span="12">
            <el-form-item label="装备参数">
              <el-input v-model="form_add_new.group_remark"
                style="font-size: 0.26rem; width: 12rem; white-space: pre-wrap" :rows="6" ref="groupRemark"
                type="textarea" placeholder="请输入装备参数" @focus="openKeyboard('default', 'group_remark', -1)" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 找到“装备实照”所在的 el-row -->
        <el-row style="margin-bottom: 20px">
          <el-col :span="24">
            <el-form-item label="装备实照">
              <div style="display: flex; align-items: center">
                <!-- 1. 照片预览区域：将 120px 修改为 100px -->
                <div v-if="form_add_new.group_image" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-right: 15px;
                  ">
                  <!-- 这里修改了 width, height 和 border-radius(改为5px与芯片一致) -->
                  <el-image style="width: 100px; height: 100px; border-radius: 5px; border: 1px solid #ddd"
                    :src="form_add_new.group_image" :preview-src-list="[form_add_new.group_image]" fit="cover" />

                  <!-- 删除按钮样式已统一 -->
                  <el-button type="danger" :icon="Delete" circle style="margin-top: 10px"
                    @click="form_add_new.group_image = ''"></el-button>
                </div>

                <!-- 2. 拍照按钮：将 120px 修改为 100px -->
                <el-button v-if="!form_add_new.group_image" @click="startCameraForGroup"
                  style="width: 100px; height: 100px; border: 1px dashed #4b8fe1; color: #4b8fe1">
                  <div style="display: flex; flex-direction: column; align-items: center">
                    <span style="font-size: 30px">+</span>
                    <span>拍照上传</span>
                  </div>
                </el-button>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- === 芯片列表区域 (核心修改) === -->
        <div class="chip-list-container" style="
            border: 1px solid #ddd;
            padding: 10px;
            margin: 10px 0;
            background: #f3f0f0;
            border-radius: 5px;
          ">
          <div v-for="(chip, index) in form_add_new.chip_list" :key="index" class="chip-item"
            style="border-bottom: 2px dashed #eee; padding-bottom: 20px; margin-bottom: 20px">
            <!-- 标题行：序号 + 删除按钮 -->
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px">
              <el-tag effect="dark" size="large">芯片 #{{ index + 1 }}</el-tag>
              <el-button type="danger" link v-if="form_add_new.chip_list.length > 1"
                @click="removeChipSlot(index)">删除此芯片</el-button>
            </div>

            <el-row>
              <el-col :span="12">
                <!-- 注意：v-model 绑定的是 chip.xxx -->
                <!-- 注意：openKeyboard 传入 index -->
                <el-form-item label="芯片编号" :prop="'chip_list.' + index + '.chip_code'" :rules="{
                  required: true,
                  validator: validateMainLockAddress,
                  trigger: ['blur', 'change'],
                }">
                  <el-input v-model="chip.chip_code" size="large" placeholder="请输入芯片编号"
                    @focus="openKeyboard('default', 'chip_code', index)" style="width: 5.6rem; font-size: 0.26rem" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="芯片名称">
                  <el-input v-model="chip.chip_name" size="large" placeholder="请输入芯片名称"
                    @focus="openKeyboard('default', 'chip_name', index)" style="width: 5.6rem; font-size: 0.26rem" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row>
              <el-col :span="12">
                <el-form-item label="芯片类型">
                  <el-input v-model="chip.chip_type" placeholder="请输入芯片类型"
                    @focus="openKeyboard('default', 'chip_type', index)" size="large"
                    style="width: 5.6rem; font-size: 0.26rem"></el-input>
                </el-form-item>
              </el-col>
            </el-row>

            <el-row>
              <el-col :span="12">
                <el-form-item label="芯片参数">
                  <el-input v-model="chip.chip_remark" style="width: 12rem; white-space: pre-wrap; font-size: 0.26rem"
                    :rows="6" ref="groupRemark" type="textarea" placeholder="请输入芯片参数"
                    @focus="openKeyboard('default', 'chip_remark', index)" />
                </el-form-item>
              </el-col>
            </el-row>

            <!-- 芯片照片区域 -->
            <el-row style="margin-bottom: 10px">
              <el-col :span="24">
                <el-form-item label="芯片实照">
                  <div style="display: flex; flex-wrap: wrap">
                    <div v-for="(img, imgIndex) in chip.chip_image" :key="imgIndex" style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        margin-left: 15px;
                        margin-bottom: 20px;
                      ">
                      <el-image style="width: 100px; height: 100px; border-radius: 5px" :src="img" :zoom-rate="1.2"
                        :max-scale="7" :min-scale="0.2" :preview-src-list="chip.chip_image" show-progress
                        :initial-index="imgIndex" fit="cover" />
                      <el-button type="danger" style="margin-top: 10px" @click="deleteImage(index, imgIndex)"
                        :icon="Delete" circle></el-button>
                    </div>
                    <div style="display: flex; flex-direction: column; margin-left: 15px; height: 100%">
                      <el-button @click="startCameraForChip(index)" style="
                          width: 100px;
                          height: 100px;
                          display: flex;
                          justify-content: center;
                          align-items: center;
                          border: 1px solid #4b8fe1;
                          color: #4b8fe1;
                        ">
                        <span style="font-size: 50px">+</span>
                      </el-button>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </div>
          <!-- 底部添加按钮 -->
          <el-button type="primary" size="large" plain style="width: 100%" @click="addChipSlot">+ 添加下一个芯片</el-button>
        </div>

        <!-- 如果需要手动修正功能的代码 -->
        <!--
        <el-form-item label="强制修正状态">
          <el-select v-model="form_add_new.group_status" placeholder="仅用于数据修正" style="width: 3rem" size="large">
            <el-option label="未入柜" value="未入柜" />
            <el-option label="在位" value="在位" />
            <el-option label="已取出" value="已取出" />
          </el-select>
        </el-form-item>
        -->

        <!-- === 状态与操作区域 (修改后) === -->
        <div style="
            background-color: #f5f7fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            margin-top: 50px;
            border: 1px solid #e4e7ed;
          ">
          <el-row>
            <el-col :span="12">
              <el-form-item label="选择柜体">
                <el-button v-if="config_blob?.lock?.details?.length === 1" type="info" disabled
                  size="large">一体柜</el-button>
                <div v-else-if="config_blob?.lock?.details?.length === 2">
                  <el-button size="large" style="font-size: 0.26rem" @click="handleCabinetSelection(0)" :type="form_add_new.lock_self_address === config_blob.lock.details[0].self_address
                    ? 'primary'
                    : 'default'
                    ">上柜体</el-button>
                  <el-button size="large" style="font-size: 0.26rem" @click="handleCabinetSelection(1)" :type="form_add_new.lock_self_address === config_blob.lock.details[1].self_address
                    ? 'primary'
                    : 'default'
                    ">下柜体</el-button>
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row>
            <el-col :span="8">
              <el-form-item label="开关地址" prop="self_address">
                <el-select v-model="form_add_new.self_address" placeholder="请选择开关地址" style="width: 2.8rem" size="large"
                  @change="handleSwitchAddressChange">
                  <!-- 修改这里：遍历 availableOptions -->
                  <el-option v-for="(item, index) in availableOptions" :key="index" :label="item.self_address"
                    :value="item.self_address" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="开关状态">
                <el-tag :type="getStatusTagType(form_add_new.hardware_status)" size="large" effect="dark"
                  style="font-size: 0.26rem; width: 100%; text-align: center">
                  {{ form_add_new.hardware_status || '未知' }}
                </el-tag>
              </el-form-item>
            </el-col>
            <!-- === 修改开始：显示装备状态 === -->
            <el-col :span="8">
              <el-form-item label="装备状态">
                <!-- 使用 tag 显示更直观，或者用 input readonly -->
                <el-tag :type="getStatusTagType(form_add_new.group_status)" size="large" effect="dark"
                  style="font-size: 0.26rem; width: 100%; text-align: center">
                  {{ form_add_new.group_status || '未知' }}
                </el-tag>
              </el-form-item>
            </el-col>
            <!-- === 修改结束 === -->
            <!--
          <el-col :span="6">
            <el-form-item label="管理状态">
              <el-tag :type="getStatusTagType(form_add_new.admin_status)" size="large" effect="dark"
                style="font-size: 0.26rem; width: 100%; text-align: center;">
                {{ form_add_new.admin_status || '未知' }}
              </el-tag>
            </el-form-item>
          </el-col>
          -->
          </el-row>

          <!-- 3. 操作按钮区 (仅编辑模式显示) -->
          <div v-if="isEditMode" style="margin-top: 15px; border-top: 1px dashed #dcdfe6; padding-top: 15px">
            <div style="margin-bottom: 10px; color: #606266; font-size: 0.24rem; font-weight: bold">
              柜门控制与状态变更：
            </div>

            <el-row justify="space-around">
              <!-- 按钮A: 仅开门 -->
              <el-col :span="6">
                <el-button type="primary" plain size="large" style="width: 100%" @click="handleOpenDoorOnly">
                  仅打开柜门
                </el-button>
              </el-col>

              <!-- 按钮B: 执行入柜 (开门 + 修正状态) -->
              <!--虽然有微动开关，但微动开关只能告诉你“上面有没有东西”，它无法告诉“上面放的是不是正确的装备”。
                通过管理员点击“入柜”，我们是在做业务确认。
                -->
              <el-col :span="8">
                <el-button type="success" size="large" style="width: 100%" @click="handleOperation('entry')" :disabled="form_add_new.group_status === '在位' && form_add_new.hardware_status === '导通'
                  ">
                  执行入柜 (开门和入柜)
                </el-button>
              </el-col>

              <!-- 按钮C: 执行出柜 (开门 + 修正状态) -->
              <el-col :span="8">
                <el-button size="large" type="primary" style="width: 100%" @click="handleOperation('exit')" :disabled="form_add_new.group_status === '未入柜' || form_add_new.group_status === '已出柜'
                  ">
                  执行出柜 (开门和出柜)
                </el-button>
              </el-col>
            </el-row>

            <!-- 提示信息 -->
            <div style="margin-top: 10px; font-size: 0.22rem; color: #909399">
              *
              注意：微动开关状态应与入/出柜操作一致。如开关显示“断开（表示未检测到装备）”但强行“入柜”，可能导致数据不符。
            </div>
          </div>
        </div>
      </el-form>
      <!-- 原来的按钮代码被替换 -->
      <el-row style="margin-top: 30px; margin-bottom: 30px; justify-content: center">
        <!-- === 场景1：新增模式 (isEditMode === false) === -->
        <template v-if="!isEditMode">
          <el-button type="primary" size="large" @click="submitForm('insert')">立即创建</el-button>
          <el-button size="large" @click="clearForm">重置表单</el-button>
        </template>

        <!-- === 场景2：编辑模式 (isEditMode === true) === -->
        <template v-else>
          <el-button type="primary" size="large" @click="submitForm('update')">保存修改</el-button>
          <el-button type="success" size="large" @click="submitForm('copy')">另存为新装备(复制)</el-button>
        </template>
        <!-- 公共按钮 -->
        <el-button type="danger" size="large" @click="handleClose" style="margin-left: 12px">关闭退出</el-button>
      </el-row>
    </el-dialog>
    <!-- 虚拟键盘容器 - 移动到表单内部以动态定位 -->
    <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition">
      <SimpleKeyboard v-model="currentInputValue" :defaultLayout="currentLayout" @onKeyPress="handleKeyPress"
        @onClose.stop="showKeyboard = false" keyboardClass="num-keyboard" />
    </div>
    <!-- 装备信息库 -->
    <el-dialog v-model="equip_info" width="100%" style="height: 100%" title="装备信息库" v-if="open_equip_info_table">
      <el-table stripe border highlight-current-row :data="tableData" style="width: 100%; height: 100%"
        v-if="open_equip_info_table">
        <el-table-column type="index" label="序号" width="60" style="color: #333" />
        <el-table-column prop="equip_team" label="装备分组" width="100" />
        <el-table-column prop="equip_type" label="装备类型" width="110" />
        <el-table-column prop="equip_name" label="装备名称" width="120" />
        <el-table-column prop="equip_number" label="装备编号" width="120" />
        <el-table-column prop="equip_status" label="装备状态" width="100" />
      </el-table>
    </el-dialog>
    <!-- 拍照 -->
    <el-dialog :before-close="stopCamera" title="拍照" class="video-container" v-model="isCameraActive" width="640" style="
        margin-top: 60px;
        height: 550px;
        border: 2px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      ">
      <video ref="videoRef" autoplay muted class="camera-view"></video>
      <img v-show="show_photo" :src="photoDataUrl" class="captured-image" style="
          width: 100%;
          height: 400px;
          object-fit: cover;
          border-radius: 5px;
          margin-bottom: 15px;
        " />
      <div style="display: flex; justify-content: center; margin-top: 15px">
        <el-button size="large" @click="take_photo">拍照</el-button>
        <el-button size="large" style="margin-left: 15px" @click="delay_photo">延时3秒</el-button>
        <el-button size="large" style="margin-left: 15px" @click="retake_photo">重拍</el-button>
        <el-button size="large" style="margin-left: 15px" @click="confirm_use_photo">使用照片</el-button>
        <el-button size="large" style="margin-left: 15px" @click="stopCamera">退出</el-button>
      </div>
    </el-dialog>
    <!-- 开关列表 -->
    <el-dialog title="开关列表" v-model="switch_view" width="650" style="height: 100vh" :before-close="fleshData">
      <div class="switch-list-container">
        <!-- 表头 -->
        <div class="switch-header">
          <div class="switch-address">开关地址</div>
          <div class="switch-status">开关状态</div>
          <div class="switch-admin-status" style="min-width: 80px">管理状态</div>
          <div class="switch-placed-status" style="min-width: 60px">放置状态</div>
        </div>
        <!-- 内容 -->
        <template v-if="config_blob?.switch?.details">
          <div v-for="item in config_blob.switch.details" :key="item.address" class="switch-item">
            <div class="switch-address">{{ item.self_address }}</div>
            <div class="switch-status">
              <div class="custom-status-tag" :class="item.hardware_status === 1 ? 'success' : 'danger'">
                {{ item.hardware_status === 1 ? '导通' : '断开' }}
              </div>
            </div>
            <div class="switch-admin-status" style="min-width: 80px">
              <div class="custom-radio-group">
                <div class="custom-radio" :class="{ active: item.admin_status === 1 }"
                  @click="handleAdminStatusChange(item, 1)">
                  已启用
                </div>
                <div class="custom-radio" :class="{ danger: item.admin_status === 0 }"
                  @click="handleAdminStatusChange(item, 0)">
                  已禁用
                </div>
              </div>
            </div>
            <div class="switch-placed-status" style="min-width: 60px">
              {{ item.equip_status_display || '----' }}
            </div>
          </div>
        </template>
      </div>
    </el-dialog>
    <!-- ================== 新增：等待程序运行对话框 ================== -->
    <el-dialog v-model="isApplying" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false"
      width="480px" class="waiting-dialog" :modal="true" center>
      <div class="dialog-content">
        <!-- 加载指示器 -->
        <div class="loading-indicator">
          <div class="spinner"></div>
          <div class="pulse-effect"></div>
        </div>

        <!-- 主要内容 -->
        <div class="main-content">
          <!-- 动态标题 -->
          <h3 class="dialog-title">
            {{ currentOperationType === 'entry' ? '正在等待入柜...' : '正在等待出柜...' }}
          </h3>

          <p class="setting-tip">柜门已打开</p>

          <div class="progress-indicator">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>

            <!-- === 优化核心：直接在模板里写逻辑，清晰直观 === -->
            <div class="status-box" style="margin-top: 15px; font-size: 16px">
              <div v-if="currentOperationType === 'entry'">
                <div>请将装备放入指定位置</div>
                <div style="margin-top: 8px">
                  当前开关状态：
                  <!-- 根据 isSensorActive 变量变色 -->
                  <span :class="isSensorActive ? 'status-green' : 'status-red'">
                    {{ isSensorActive ? '【已检测到装备】' : '【未检测到装备】' }}
                  </span>
                </div>
                <div v-if="isSensorActive" style="color: #67c23a; font-size: 0.23rem; margin-top: 5px">
                  <i class="el-icon-loading"></i> 信号稳定确认中...
                </div>
              </div>

              <div v-else>
                <div>请将装备从柜中取出</div>
                <div style="margin-top: 8px">
                  当前开关状态：
                  <span :class="isSensorActive ? 'status-orange' : 'status-gray'">
                    {{ isSensorActive ? '【还有装备】' : '【已取走(空)】' }}
                  </span>
                </div>
              </div>
            </div>
            <!-- =========================================== -->
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button type="danger" size="large" class="exit-btn" @click="forceExecute" :loading="isForceExecuting">
            <span class="btn-text">
              {{ currentOperationType === 'entry' ? '未检测到？强制入柜' : '状态未变？强制出柜' }}
            </span>
          </el-button>
          <!-- 增加一个取消按钮，防止用户不想操作了只能强制执行 -->
          <el-button size="large" @click="stop_settings" style="margin-left: 10px">
            中断操作
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import {
  ref,
  onMounted,
  onUnmounted,
  nextTick,
  reactive,
  defineAsyncComponent,
  watch,
  toRaw,
} from 'vue'
import { useRouter } from 'vue-router'
import { useAudioStore } from '@/stores/audioStore'
import { Delete } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/configStore'
import { ElLoading, ElMessageBox } from 'element-plus'
const configStore = useConfigStore()
import { useAuthStore } from '@/stores/authStore'
const authStore = useAuthStore()
// import plugins from '../assets/js/plugin'
// ==========================================
// [修正版] 检测所有柜门状态 (基于锁控板 Device 201)
// ==========================================
const checkGlobalDoorStatus = async () => {
  // 1. 如果配置中没有锁的详细信息，直接放行 (视为无需检测)
  if (!config_blob.value?.lock?.details) return true

  // 2. 获取所有配置中涉及到的通道 (Channel)
  // 逻辑：不同的柜门对应锁控板上的不同通道 (如通道1对应索引6，通道2对应索引7)
  const usedChannels = new Set()
  config_blob.value.lock.details.forEach((lock) => {
    if (lock.channel_address) usedChannels.add(lock.channel_address)
  })

  // 如果没有配置任何通道，也放行
  if (usedChannels.size === 0) return true

  try {
    // 3. 读取锁控板 (Device 201) 的所有输入状态
    const res = await window.electronAPI.el_post({
      action: 'read_all_inputs',
      payload: {
        deviceAddress: 201, // 锁控板固定地址
        startAddress: 0x0000, // 起始寄存器
        registerCount: 10, // 读取数量
      },
    })

    // 4. 解析返回数据
    if (res && res.success && res.data && res.data.length >= 8) {
      // 遍历所有使用过的通道进行检查
      for (const channel of usedChannels) {
        let dataIndex = -1

        // --- 硬件映射规则 (根据参考代码) ---
        // 通道 1 -> 对应返回数组的下标 6
        // 通道 2 -> 对应返回数组的下标 7
        if (channel === 1) dataIndex = 6
        if (channel === 2) dataIndex = 7

        // 5. 判断状态: 0 = 门开着, 1 = 门关了
        if (dataIndex !== -1 && res.data[dataIndex] === 0) {
          console.warn(`检测到通道 ${channel} (Index ${dataIndex}) 的门未关闭`)
          return false // 只要发现一个门没关，立即返回 false
        }
      }
      return true // 所有门都关好了
    }

    // 如果读取数据失败或格式不对，为了安全起见，返回 false (阻止退出)
    console.error('读取门锁数据格式错误', res)
    return false
  } catch (e) {
    console.error('全局门锁状态读取异常', e)
    // 硬件通讯失败时，根据需求决定：
    // return true; // 放行 (防止卡死)
    return false // 阻断 (安全优先) -> 这里建议选 false，让用户通过"强制退出"按钮离开
  }
}
// 中断操作
const stop_settings = () => {
  isPolling.value = false
  isApplying.value = false
  audioStore.play(`/audio/设置已中断.mp3`)
}

const tableRef = ref(null) // 用于获取表格实例
// 1. 辅助函数：状态颜色（修改后，同时支持装备状态和开关状态）
const getStatusTagType = (status) => {
  // === 装备状态 ===
  if (status === '在位') return 'success' // 绿色
  if (status === '已出柜') return 'warning' // 橙色
  if (status === '未入柜' || status === '已取出') return 'info' // 灰色

  // === 开关硬件状态 ===
  if (status === '导通') return 'success' // 绿色
  if (status === '断开') return 'danger' // 红色 (或者用 info 灰色)

  // === 管理状态 (如果有用到) ===
  if (status === '已启用') return 'success'
  if (status === '已禁用') return 'danger'

  // === 默认/未知 ===
  return 'primary' // 蓝色
}
// 通用的行合并方法
// 这个函数的作用是检测当前行和下一行的 group_code 是否相同，如果相同则合并。
// 通用的行合并方法
/*
const mergeRowMethod = ({ row, _rowIndex, column, visibleData }) => {
  // 1. 定义哪些列需要“跟随” group_code 进行合并
  const fields = ['group_name', 'group_type', 'group_status', 'group_code', 'group_equipment_count']

  // 2. 如果当前列不在白名单里，或者没有字段名，直接不合并
  if (!column.field || !fields.includes(column.field)) {
    return { rowspan: 1, colspan: 1 }
  }

  // 3. 获取用于判断合并的“唯一主键”
  const currentKey = row.group_code

  // 安全检查：如果 group_code 是空的，不合并
  if (!currentKey) {
    return { rowspan: 1, colspan: 1 }
  }

  const prevRow = visibleData[_rowIndex - 1]

  // 4. 判断上一行
  if (prevRow && prevRow.group_code === currentKey) {
    // 如果上一行一样，当前行隐藏
    return { rowspan: 0, colspan: 0 }
  } else {
    // 5. 判断下一行 (修正后的逻辑)
    let countRowspan = 1

    // 【修正点】直接向后探测
    // 只要 "当前行索引 + 偏移量" 存在，且那个位置的数据 group_code 和我一样，就计数加一
    while (
      visibleData[_rowIndex + countRowspan] &&
      visibleData[_rowIndex + countRowspan].group_code === currentKey
    ) {
      countRowspan++
    }

    // 如果算出来大于1行，就合并；否则保持原样
    if (countRowspan > 1) {
      return { rowspan: countRowspan, colspan: 1 }
    } else {
      return { rowspan: 1, colspan: 1 }
    }
  }
}
*/
const el_loading = ref(true)
/*
const gridOptions = reactive({
  // 绑定合并方法
  spanMethod: mergeRowMethod,
  columns: [],
  data: [],
  // loading: true,
  border: true,
  rowConfig: {
    isCurrent: true, // 是否高亮当前行
    isHover: true,
  },
  cellClassName({ row, column }) {
    if (column.field === 'group_status') {
      if (row.group_status == '未入柜') {
        return 'status-not-installed'
      } else if (row.group_status == '在位') {
        return 'status-in-position'
      }
    }
    return null
  },
})
*/

const getData = async () => {
  el_loading.value = true

  // 修正列配置，匹配实际数据字段
  /*
  const request_columns = [
    {
      type: 'checkbox',
      width: 60,
      align: 'center',
      headerClassName: 'headerClass',
      className: 'cellClass',
    },
    {
      type: 'seq', width: 60, title: '序号',
      headerClassName: 'headerClass',
      className: 'cellClass',
    },
    {
      field: 'group_type',
      title: '装备类型',
      width: 120,
      showOverflow: true,
      headerClassName: 'headerClass',
      className: 'cellClass',
    },
    {
      field: 'group_name',
      title: '装备名称',
      width: 120,
      showOverflow: true,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'group_code',
      title: '装备编号',
      width: 120,
      showOverflow: true,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'group_equipment_count',
      title: '芯片数量',
      width: 100,
      showOverflow: true,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'group_status',
      title: '装备状态',
      width: 100,
      showOverflow: true,
      headerClassName: 'headerClass',
      className: 'cellClass',
    },
    {
      field: 'equipment_type',
      title: '芯片类型',
      width: 120,
      showOverflow: true,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'equipment_name',
      title: '芯片名称',
      width: 120,
      showOverflow: true,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'equipment_code',
      title: '芯片编号',
      width: 120,
      showOverflow: true,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'equip_status',
      title: '芯片状态',
      width: 120,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'self_address',
      title: '开关地址',
      width: 100,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'hardware_status',
      title: '开关状态',
      width: 100,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'admin_status',
      title: '管理状态',
      width: 100,
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
    {
      field: 'created_time',
      title: '创建时间',
      width: 120,
      headerClassName: 'headerClass',
      className: 'cellClass1'
    },
    {
      field: 'last_modified',
      title: '最后修改时间',
      width: 130,
      headerClassName: 'headerClass',
      className: 'cellClass1'
    },
    {
      field: 'operation',
      title: '操作',
      width: 150,
      fixed: 'right',
      slots: { default: 'operationDefault' },
      headerClassName: 'headerClass',
      className: 'cellClass'
    },
  ]
*/
  // gridOptions.columns = request_columns

  try {
    // 确保配置已加载才去读硬件，防止报错

    let allData = []
    let currentPage = 1
    let hasMoreData = true
    let pageSize = 5

    while (hasMoreData) {
      const response = await window.electronAPI.el_post({
        action: 'queryPagination',
        payload: {
          tableName: 'equipment',
          page: currentPage,
          pageSize: pageSize,
        },
      })

      console.log('第' + currentPage + '页数据:', response.data)

      // 确保正确获取数据数组
      if (response.data && response.data.data) {
        allData = [...allData, ...response.data.data]

        // 调试：检查数据结构和字段
        if (response.data.data.length > 0) {
          console.log('第一条数据的字段:', Object.keys(response.data.data[0]))
        }
      }

      // 判断是否还有更多数据
      if (!response.data.data || response.data.data.length < pageSize) {
        hasMoreData = false
      } else {
        currentPage++
      }
    }

    // 获取完所有数据库数据（allData）后，且在赋值给 tableData 之前，遍历数据并根据 self_address 去 config_blob 中匹配对应的实时状态。
    if (config_blob.value?.switch?.details) {
      const switchDetails = config_blob.value.switch.details
      console.log('switchDetails:', toRaw(switchDetails))

      allData.forEach((row) => {
        // 通过 self_address 查找对应的开关配置
        const targetSwitch = switchDetails.find((s) => s.self_address == row.self_address)

        if (targetSwitch) {
          console.log('找到开关配置:', targetSwitch)
          // 覆盖硬件状态 (1->导通, 0->断开)
          row.hardware_status = targetSwitch.hardware_status == 1 ? '导通' : '断开'
          console.log('覆盖硬件状态:', row.hardware_status)

          // 覆盖管理状态 (1->已启用, 0->已禁用)
          row.admin_status = targetSwitch.admin_status == 1 ? '已启用' : '已禁用'
        } else {
          // 可选：如果没有匹配到开关（可能是配置变了），可以标记为未知或保持原样
          // row.hardware_status = '未知/未配置';
        }

        // --- 新增：时间格式化逻辑 ---
        if (row.group_distribution_time) {
          // 将时间数据转换为 Date 对象
          const date = new Date(row.group_distribution_time)

          // 检查日期是否有效
          if (!isNaN(date.getTime())) {
            const y = date.getFullYear()
            // getMonth() 返回 0-11，所以需要 +1，padStart用于补零 (例如 1 -> 01)
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')

            // 重新赋值为格式化后的字符串
            row.group_distribution_time = `${y}-${m}-${d}`
          }
        }
      })
    } else {
      // 如果没有 config_blob，也需要格式化时间，防止显示数字
      allData.forEach((row) => {
        if (row.group_distribution_time) {
          const date = new Date(row.group_distribution_time)
          if (!isNaN(date.getTime())) {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            row.group_distribution_time = `${y}-${m}-${d}`
          }
        }
      })
    }

    // 【修正1】必须先排序，再赋值！
    /*
    allData.sort((a, b) => {
      // 确保 group_code 存在，防止 null 报错
      const codeA = a.group_code || ''
      const codeB = b.group_code || ''
      return codeA.localeCompare(codeB)
    })
    */

    // 【修正2】排序后再赋值给 gridOptions
    // gridOptions.data = allData
    tableData.splice(0, tableData.length, ...allData)
  } catch (error) {
    console.error('请求数据失败:', error)
  } finally {
    // 4. 【最佳实践】无论成功还是报错，都在这里关闭 Loading
    // 使用 nextTick 确保 DOM 更新后再关闭遮罩
    await nextTick()
    el_loading.value = false
  }
}
// 删除选中装备的逻辑
const deleteSelectedEquipment = async () => {
  // 1. 获取选中的行
  const selectedRows = tableRef.value.getSelectionRows()

  if (selectedRows.length === 0) {
    audioStore.play('/audio/请先勾选需要删除的装备.mp3') // 假设有这个音频，或者直接弹窗
    return
  }

  // 2. 检查是否存在“已取出”或“在位”的特殊状态
  // 这里的状态值需要和你数据库里的实际字符串匹配
  const riskyItems = selectedRows.filter(
    (item) => item.group_status === '已取出' || item.group_status === '在位',
  )
  // 提取所有不同的状态
  const statuses = [...new Set(riskyItems.map((item) => item.group_status))]
  const statusText = statuses.join('、')
  let confirmResult = false

  try {
    if (riskyItems.length > 0) {
      // === 场景A：包含敏感状态装备，进行强力提醒 ===
      audioStore.play('/audio/警告选中装备中包含在位或已取出.mp3') // 建议添加警告音效

      await ElMessageBox.confirm(
        `
        <div style="text-align: left; font-size: 0.25rem; color: #606266;">
          <div>
            检测到选中项中包含
            <span style="color: #F56C6C; font-weight: bold; margin: 0 4px;">${riskyItems.length}</span>
            个状态为
            <span style="color: #E6A23C; font-weight: bold;">“${statusText}”</span>
            的装备。
          </div>

          <div style="margin-top: 15px; padding: 12px; background-color: #FEF0F0; border: 1px solid #FDE2E2; border-radius: 6px; color: #C03639;">
            <div style="font-weight: bold; display: flex; align-items: center; margin-bottom: 5px;">
              <i class="el-icon-warning" style="margin-right: 5px;"></i> ⚠️ 风险警告
            </div>
            <div style="font-size: 0.23rem;">强制删除将永久抹除数据，可能导致系统记录与实物库存不符（数据失真）！</div>
          </div>

          <div style="margin-top: 20px; text-align: center; font-weight: bold; color: #303133;">
            是否确定要强制删除？
          </div>
        </div>
        `,
        '高风险操作确认', // 标题稍微修改得严肃一点
        {
          dangerouslyUseHTMLString: true, // 开启 HTML 解析
          confirmButtonText: '我已知晓，强制删除', // 修改按钮文案，增加心理确认门槛
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger', // 【关键】将确认按钮变为红色
          type: 'warning',
          center: true, // 内容居中布局
          closeOnClickModal: false,
          width: '420px', //稍微加宽一点点
        },
      )
      confirmResult = true
    } else {
      // === 场景B：普通装备，常规提醒 ===
      audioStore.play('/audio/确认删除选中装备吗.mp3')

      await ElMessageBox.confirm(
        `
        <div style="text-align: left; font-size: 0.25rem; color: #606266; ">
          <div>
            您已选中
            <span style="color: #409EFF; font-weight: bold; font-size: 18px; margin: 0 4px;">${selectedRows.length}</span>
            个装备准备删除。
          </div>

          <div style="margin-top: 15px; padding: 12px; background-color: #ECF5FF; border: 1px solid #D9ECFF; border-radius: 6px; color: #409EFF;">
            <div style="font-weight: bold; display: flex; align-items: center; margin-bottom: 5px;">
              ℹ️ 操作提示
            </div>
            <div style="font-size: 0.23rem;">此操作将永久移除选中的装备数据，执行后无法撤销。</div>
          </div>

          <div style="margin-top: 20px; text-align: center; font-weight: bold; color: #303133;">
            确认要执行删除吗？
          </div>
        </div>
        `,
        '删除确认',
        {
          dangerouslyUseHTMLString: true, // 开启 HTML 解析
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          confirmButtonClass: 'el-button--danger', // 保持红色按钮，表示这是删除操作
          type: 'info', // 使用 info 类型图标
          center: true,
          closeOnClickModal: false,
          width: '420px',
        },
      )
      confirmResult = true
    }
  } catch (error) {
    // 用户点击了取消
    console.log('用户取消删除', error)
    confirmResult = false
  }

  // 3. 执行删除操作
  if (confirmResult) {
    try {
      el_loading.value = true
      // 提取所有选中行的 ID（假设主键是 id，如果是 group_code 请自行替换）
      const ids = selectedRows.map((item) => item.id)

      // 调用后端接口
      const response = await window.electronAPI.el_post({
        action: 'remove',
        payload: {
          tableName: 'equipment',
          // SQL条件: WHERE id IN (1, 2, 3)
          condition: `id IN (${ids.join(',')})`,
        },
      })
      console.log('删除响应:', response)
      if (response.success) {

        // ==========================================================
        // === 【新增代码开始点】：记录出库日志 ===
        // ==========================================================
        try {
          const opName = authStore.verifiedUsers.length > 0
            ? authStore.verifiedUsers.map(u => u.real_name).join(',')
            : '系统管理员';
          const opId = authStore.verifiedUsers.length > 0
            ? authStore.verifiedUsers.map(u => u.id_card).join(',')
            : 'SYSTEM';

          // 循环记录每一件被删除的装备（因为删除后表中没数据了，所以必须在此时抓取row信息）
          for (const row of selectedRows) {
            // 在 deleteSelectedEquipment 的循环内
            await window.electronAPI.el_post({
              action: 'insert',
              payload: {
                tableName: 'logs',
                setValues: {
                  terminal_id: configStore.terminal.terminal_id,
                  action: '删除装备', // <--- 改为这个，更具辨识度
                  description: '执行装备删除操作，对应装备信息已移除',
                  username: opName,
                  id_card: opId,
                  equipment_id: row.id,
                  group_name: row.group_name,
                  group_code: row.group_code,
                  log_level: '普通'
                }
              }
            });
          }
        } catch (logError) {
          console.error('出库审计日志记录失败:', logError);
        }
        // ==========================================================
        // === 【新增代码结束点】 ===
        // ==========================================================

        audioStore.play('/audio/删除成功.mp3')
        // 刷新数据
        getData()
      } else {
        throw new Error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除操作出错:', error)
      audioStore.play('/audio/删除失败.mp3')
    } finally {
      el_loading.value = false
    }
  }
}
const switch_view = ref(false)
const handleAdminStatusChange = (item, status) => {
  item.admin_status = status // 更新状态
  console.log(`开关地址 ${item.self_address} 的管理状态已修改为: ${status}`)
  // 其他逻辑保持不变
  window.electronAPI.el_post({
    action: 'update',
    payload: {
      tableName: 'terminal_settings',
      setValues: {
        config_blob: JSON.stringify(config_blob.value),
      },
      condition: 'id = 1',
    },
  })
}
// 装备分组选项数据
/*
const group_name_array = ref([])
const group_code_array = ref([])
const group_type_array = ref([])
*/
// 其他原有代码保持不变
const audioStore = useAudioStore()
const showKeyboard = ref(false)
const activeField = ref('')
const currentInputValue = ref('')
const currentLayout = ref('number')

const groupRemark = ref('')

const equip_info = ref(false)

const isCameraActive = ref(false)
let mediaStream = null // 媒体流对象
const videoRef = ref(null)
const statusMessage = ref('准备就绪')
const photoDataUrl = ref('') // 存储照片的base64数据URL
const show_photo = ref(false)

const config_blob = ref(null)
const formRef = ref(null)
/*
const submitForm = async () => {
  // 先进行表单验证
  try {
    await formRef.value.validate()
  } catch (error) {
    console.log('表单验证失败:', error)
    audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`)
    return
  }
  console.log('待提交表单数据:', toRaw(form_add_new))

  // 2. 构造数据
  const payloadData = {
    // 基础字段
    group_code: form_add_new.group_code,
    group_name: form_add_new.group_name,
    group_type: form_add_new.group_type,
    group_remark: form_add_new.group_remark,
    group_status: '未入柜',
    group_chip_count: form_add_new.group_chip_count,
    group_distribution_time: form_add_new.group_distribution_time,

    // 【核心】将数组序列化为字符串存入数据库
    // 假设你的数据库表 equipment 中有一个字段叫 'chips_detail' 或者你复用 'equipment_remark'
    chip_list: JSON.stringify(form_add_new.chip_list),

    // === 硬件与开关信息 ===
    self_address: form_add_new.self_address,
    hardware_status: form_add_new.hardware_status,
    admin_status: form_add_new.admin_status,
    lock_self_address: form_add_new.lock_self_address,
    open_lock_register_address: form_add_new.open_lock_register_address,
    terminal_id: configStore.terminal.terminal_id,
  }
  console.log('payloadData:', payloadData)
  try {
    const response = await window.electronAPI.el_post({
      action: 'insert',
      payload: {
        tableName: 'equipment',
        setValues: payloadData,
      },
    })

    if (response.success) {
      audioStore.play(`/audio/保存成功.mp3`)
      console.log('已保存到本地数据库')
      getData()
      showDialog.value = false
      showKeyboard.value = false
    }
  } catch (error) {
    console.error('保存表单数据失败:', error)
  }
}
*/
// 修改 submitForm，接收操作类型参数
// ============================================================
// === 【关键修复】本地定义时间格式化函数 ===
// 作用：将 ElementPlus 的 Date 对象转换为 "YYYY-MM-DD" 字符串
// ============================================================
const formatTime = (val) => {
  // 1. 如果是空值 (null/undefined)，返回 null (数据库存为 NULL)
  if (!val) return null

  // 2. 如果已经是字符串 (例如没修改过，从后台读回来就是字符串)，直接返回
  if (typeof val === 'string') return val

  // 3. 如果是 Date 对象 (用户刚修改过)，提取年月日拼接
  if (val instanceof Date) {
    const y = val.getFullYear()
    const m = String(val.getMonth() + 1).padStart(2, '0')
    const d = String(val.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // 4. 其他情况返回 null
  return null
}
const submitForm = async (operationType) => {
  // 1. 表单验证
  try {
    await formRef.value.validate()
  } catch (error) {
    console.log('表单验证失败:', error)
    audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`)
    return
  }
  console.log('待提交表单数据:', toRaw(form_add_new))

  // 2. === 特殊校验：复制操作的防重复检查 ===
  // 解释：如果是"复制"操作，哪怕当前处于编辑模式，也不能使用原来的地址或编号。
  // 因为复制是创建新数据，必须保证唯一性。
  if (operationType === 'copy') {
    const isAddressDuplicate = tableData.some(
      (item) => String(item.self_address) === String(form_add_new.self_address),
    )
    //const isCodeDuplicate = tableData.some(item => String(item.group_code) === String(form_add_new.group_code))

    if (isAddressDuplicate /*|| isCodeDuplicate*/) {
      audioStore.play(`/audio/复制失败开关地址已存在.mp3`)
      return
    }
  }
  console.log('before group_distribution_time:', form_add_new.group_distribution_time)
  // 3. 构造通用数据
  const payloadData = {
    group_code: form_add_new.group_code,
    group_name: form_add_new.group_name,
    group_type: form_add_new.group_type,
    group_remark: form_add_new.group_remark,
    group_image: form_add_new.group_image, // 【新增】
    // 如果是复制或新增，状态重置为未入柜；如果是更新，保持原状态(或根据需求修改)
    group_status: operationType === 'update' ? undefined : '未入柜',
    group_chip_count: form_add_new.group_chip_count,
    group_distribution_time: formatTime(form_add_new.group_distribution_time),
    chip_list: JSON.stringify(form_add_new.chip_list),
    // === 硬件与开关信息 ===
    self_address: form_add_new.self_address,
    hardware_status: form_add_new.hardware_status,
    admin_status: form_add_new.admin_status,
    lock_self_address: form_add_new.lock_self_address,
    open_lock_register_address: form_add_new.open_lock_register_address,
    terminal_id: configStore.terminal.terminal_id,
  }
  console.log('after group_distribution_time:', form_add_new.group_distribution_time)
  console.log(
    'form_add_new.group_distribution_time=== undefined:',
    form_add_new.group_distribution_time === undefined,
  )

  // 清理 undefined 属性
  // 在**“编辑/更新”模式下，实现“只更新有值的字段，没值的字段保持原样”**。
  Object.keys(payloadData).forEach(
    (key) => payloadData[key] === undefined && delete payloadData[key],
  )

  console.log('')
  try {
    let response

    // 4. 根据操作类型调用不同接口
    if (operationType === 'update') {
      // --- 更新模式 ---
      console.log('执行更新, ID:', currentEditId.value)
      response = await window.electronAPI.el_post({
        action: 'update',
        payload: {
          tableName: 'equipment',
          setValues: payloadData,
          condition: `id = ${currentEditId.value}`,
        },
      })
    } else {
      // --- 新增 OR 复制模式 (都是 Insert) ---
      // 这里的逻辑是一样的，都是往数据库插一条新数据
      console.log('执行插入(新增或复制)')
      response = await window.electronAPI.el_post({
        action: 'insert',
        payload: {
          tableName: 'equipment',
          setValues: payloadData,
        },
      })
    }

    // 5. 处理结果
    if (response.success) {

      // 根据不同操作播放不同音频
      if (operationType === 'update') {
        audioStore.play('/audio/修改成功.mp3')
      } else if (operationType === 'copy') {
        audioStore.play('/audio/复制成功.mp3')
      } else {
        audioStore.play('/audio/添加成功.mp3')
      }

      showDialog.value = false
      showKeyboard.value = false
      getData() // 刷新表格
    }
  } catch (error) {
    console.error('操作失败:', error)
  }
}
const handleSwitchAddressChange = (value) => {
  const selectedSwitch = config_blob.value.switch.details.find(
    (item) => item.self_address === value,
  )
  if (selectedSwitch) {
    // 开关状态：1 为导通，0 为断开
    form_add_new.hardware_status = selectedSwitch.hardware_status === 1 ? '导通' : '断开'
    // 管理状态：1 为已启用，0 为已禁用
    form_add_new.admin_status = selectedSwitch.admin_status === 1 ? '已启用' : '已禁用'
  }
}

const updateSwitchDetails = async () => {
  if (import.meta.env.MODE !== 'development') {
    try {
      for (const address of config_blob.value.switch.expansion_board_addresses) {
        const result = await window.electronAPI.el_post({
          action: 'read_all_inputs',
          payload: { deviceAddress: address, startAddress: 0x0001, registerCount: 10 },
        })
        console.log('el_post调用返回的读取开关状态数据:', result)
        if (result?.success && result.data?.length) {
          result.data.forEach((state, index) => {
            const detailIndex = config_blob.value.switch.details.findIndex(
              (item) =>
                item.expansion_board_address === address && item.channel_address === index + 1,
            )
            if (detailIndex !== -1) {
              config_blob.value.switch.details[detailIndex].hardware_status = state
            }
          })
        } else {
          console.error('读取开关状态数据失败或返回数据为空 error:')
        }
      }
    } catch (error) {
      console.error('读取开关状态数据失败或返回数据为空 error:', error)
    }
  }
}

const switchView = async () => {
  try {
    // 1. 获取配置数据
    const response = await window.electronAPI.el_post({
      action: 'queryMultipleTables',
      payload: {
        arr: [{ tablename: 'terminal_settings', condition: '' }],
      },
    })

    // 2. 解析配置数据
    // console.log('el_post调用返回的数据:', toRaw(response.data.terminal_settings))
    config_blob.value = JSON.parse(response.data.terminal_settings.config_blob)
    // console.log('config_blob:', toRaw(config_blob.value))

    // 3. === 核心修改：直接使用 tableData 匹配装备状态 ===
    if (config_blob.value?.switch?.details) {
      config_blob.value.switch.details.forEach((switchItem) => {
        // 在 tableData 中查找 "self_address" 和当前开关一致的装备
        const targetEquip = tableData.find((equip) => equip.self_address == switchItem.self_address)

        if (targetEquip) {
          // 如果找到了装备，把它的 group_status (例如"在位"、"已取出") 赋值给新字段
          switchItem.equip_status_display = targetEquip.group_status
        } else {
          // 如果没找到装备（说明这个开关没绑定装备），显示为 ----
          switchItem.equip_status_display = '----'
        }
      })
    }

    // 4. 读取硬件状态 (保持原有逻辑)
    await updateSwitchDetails()

    audioStore.play(`/audio/开关列表已更新.mp3`)

    // 5. 显示弹窗
    switch_view.value = true
    setTimeout(() => {
      const dialogBodies = document.querySelectorAll('.el-dialog__body')
      dialogBodies.forEach((body) => {
        body.style.height = '10.8rem'
      })
    }, 50)
  } catch (error) {
    audioStore.play(`/audio/开关列表更新失败.mp3`)
    console.error('switchView error:', error)
  }
}

const delay_photo = async () => {
  if (!videoRef.value || !isCameraActive.value) {
    audioStore.play(`/audio/摄像头未就绪.mp3`)
    return
  }
  retake_photo()
  await audioStore.play(`/audio/延时3秒后自动拍照.mp3`)
  await audioStore.play(`/audio/3.mp3`)
  await audioStore.play(`/audio/2.mp3`)
  await audioStore.play(`/audio/1.mp3`)
  take_photo()
}

const take_photo = async () => {
  if (!videoRef.value || !isCameraActive.value) {
    audioStore.play(`/audio/摄像头未就绪.mp3`)
    return
  }
  audioStore.play(`/audio/拍照声音.mp3`)
  const canvas = document.createElement('canvas')
  const video = videoRef.value
  const context = canvas.getContext('2d')

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  context.drawImage(video, 0, 0, canvas.width, canvas.height)

  // 将 canvas 转换为 PNG 格式的 Data URL
  photoDataUrl.value = canvas.toDataURL('image/png')

  // 隐藏视频流，显示最后一张拍摄的图片
  video.style.display = 'none'
  show_photo.value = true
  // 显示最后拍摄的图片
  const capturedImage = document.querySelector('.captured-image')
  if (capturedImage) {
    capturedImage.src = photoDataUrl.value
  }

  // stopCamera()
}
// 约 955 行 附近
const startCameraForGroup = () => {
  currentChipIndex.value = -2 // 使用 -2 标记当前是给“装备分组”拍照
  startCamera()
}
// 修改约 938 行的 confirm_use_photo
const confirm_use_photo = async () => {
  if (!photoDataUrl.value) {
    await audioStore.play(`/audio/没有可用的照片数据.mp3`)
    return
  }

  if (currentChipIndex.value === -2) {
    // 【新增】处理装备整体照片
    form_add_new.group_image = photoDataUrl.value
  } else if (currentChipIndex.value !== -1) {
    // 原有的处理芯片照片逻辑
    form_add_new.chip_list[currentChipIndex.value].chip_image.push(photoDataUrl.value)
  }

  photoDataUrl.value = null
  stopCamera()
}

const retake_photo = () => {
  photoDataUrl.value = null
  if (videoRef.value) {
    videoRef.value.style.display = 'block'
    show_photo.value = false
    startCamera()
  }
}
// 3. 修改拍照
const startCameraForChip = (index) => {
  currentChipIndex.value = index // 标记当前是给哪个芯片拍照
  startCamera()
}
// 摄像头管理
const startCamera = async () => {
  try {
    showKeyboard.value = false
    statusMessage.value = '启动摄像头...'
    isCameraActive.value = true

    // 因为之前的dialog的body被设置为了5.6rem,所以这里需要重新设置一下，等待dialog渲染完成再设置
    setTimeout(() => {
      const dialogBodies = document.querySelectorAll('.el-dialog__body')
      dialogBodies.forEach((body) => {
        body.style.height = '10.8rem'
      })
    }, 50)

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: false,
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      isCameraActive.value = true
      statusMessage.value = '摄像头就绪'
    }
  } catch (error) {
    console.error('摄像头启动失败:', error)
    statusMessage.value = `摄像头错误: ${error.message}`
    isCameraActive.value = false
  }
}
const stopCamera = () => {
  if (videoRef.value) {
    videoRef.value.style.display = 'block'
    show_photo.value = false
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
  isCameraActive.value = false
  statusMessage.value = '摄像头已停止'
}

// 新增：键盘位置信息
const keyboardPosition = ref({
  top: '0px',
  left: '0px',
  position: 'absolute',
})

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

// ================== 新增状态变量 ==================
const isApplying = ref(false) // 弹框控制
const isPolling = ref(false) // 控制while循环的开关
const isForceExecuting = ref(false) // 是否强制执行
const currentOperationType = ref('') // 'entry' | 'exit' 出入柜操作类型
const isSensorActive = ref(false) // 绑定给界面显示的实时状态

// 配置项
const MAX_TIMEOUT = 60 * 1000 // 60秒超时
const POLL_INTERVAL = 800 // 800毫秒轮询一次
const STABILITY_COUNT = 3 // 需要连续检测到3次稳定状态才算成功

// 辅助函数：延时
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
// 2. 核心：入柜/出柜 处理函数
const handleOperation = async (type) => {
  if (!checkLockConfig()) return
  if (type === 'entry') {
    audioStore.play('/audio/开始执行入柜操作.mp3')
  } else {
    audioStore.play('/audio/开始执行出柜操作.mp3')
  }

  // 1. 初始化
  currentOperationType.value = type
  isApplying.value = true
  isPolling.value = true
  isForceExecuting.value = false
  isSensorActive.value = type === 'entry' ? false : true // 初始假设

  let startTime = Date.now()
  let stableCounter = 0 // 稳定性计数器

  // 2. 开门
  try {
    await sendOpenLockCommand()
  } catch (e) {
    console.error('开门指令发送异常', e)
  }

  // 3. 循环检测
  while (isPolling.value) {
    console.log('while')
    // --- A. 超时检查 ---
    if (Date.now() - startTime > MAX_TIMEOUT) {
      isPolling.value = false
      audioStore.play('/audio/操作超时.mp3')
      isApplying.value = false
      return
    }

    // --- B. 获取硬件状态 ---
    const currentStatus = await getRealTimeSensorStatus()
    isSensorActive.value = currentStatus // 更新 UI 显示

    // --- C. 业务判断 + 防抖动 ---
    const isEntry = type === 'entry'

    // 入库目标：检测到有物体 (currentStatus === true)
    // 出库目标：检测到无物体 (currentStatus === false)
    const targetConditionMet = isEntry ? currentStatus : !currentStatus

    if (targetConditionMet) {
      stableCounter++
      console.log(`状态符合条件，稳定性计数: ${stableCounter}/${STABILITY_COUNT}`)
    } else {
      stableCounter = 0 // 只要有一次不满足，计数器归零（防止手抖动）
    }

    // --- D. 达到稳定条件，自动完成 ---
    if (stableCounter >= STABILITY_COUNT) {
      const targetStatusStr = isEntry ? '在位' : '已出柜'
      const audio = isEntry ? '/audio/入柜成功.mp3' : '/audio/出柜成功.mp3'
      await finishOperation(targetStatusStr, audio)
      return
    }

    // --- E. 延时 ---
    await sleep(POLL_INTERVAL)
  }
}
// 获取传感器状态 (增加了容错)
const getRealTimeSensorStatus = async () => {
  try {
    const targetSwitch = config_blob.value?.switch?.details?.find(
      (item) => Number(item.self_address) === Number(form_add_new.self_address),
    )
    console.log('targetSwitch', toRaw(targetSwitch))
    if (!targetSwitch) return false

    const result = await window.electronAPI.el_post({
      action: 'read_all_inputs',
      payload: {
        deviceAddress: targetSwitch.expansion_board_address,
        startAddress: 0x0001,
        registerCount: 10,
      },
    })
    console.log('读取开关状态返回result:', result)
    if (result?.success && result.data?.length) {
      // 这里的逻辑根据你的硬件实际情况调整
      return result.data[targetSwitch.channel_address - 1] === 1
    }
    return false
  } catch (error) {
    console.warn('传感器读取失败，忽略本次错误', error)
    return isSensorActive.value // 读取失败时保持上一次的状态，避免UI闪烁
  }
}
// 强制执行
const forceExecute = async () => {
  if (isForceExecuting.value) return
  isForceExecuting.value = true
  isPolling.value = false // 立即停止轮询

  const isEntry = currentOperationType.value === 'entry'
  const targetStatus = isEntry ? '在位' : '已出柜'
  const audio = isEntry ? '/audio/入柜成功.mp3' : '/audio/出柜成功.mp3'

  await finishOperation(targetStatus, audio)
  isForceExecuting.value = false
}
// 统一收尾函数
const finishOperation = async (statusText, audioUrl) => {
  isPolling.value = false // 双重保险停止轮询

  // --- 【优化：获取变更前的旧状态】 ---
  const oldStatus = form_add_new.group_status;

  try {
    const updateRes = await window.electronAPI.el_post({
      action: 'update',
      payload: {
        tableName: 'equipment',
        setValues: {
          group_status: statusText,
          last_modified: new Date().toLocaleString(),
        },
        condition: `id = ${currentEditId.value}`,
      },
    })

    if (updateRes.success) {

      const opName = authStore.verifiedUsers.length > 0 ? authStore.verifiedUsers.map(u => u.real_name).join(',') : '系统管理员';
      const opId = authStore.verifiedUsers.length > 0 ? authStore.verifiedUsers.map(u => u.id_card).join(',') : 'SYSTEM';

      // --- 【精准日志逻辑】 ---
      // 只有状态真的发生变化了，才记录入/出库日志，否则只记操作轨迹
      let logAction = '操作轨迹';
      let logDesc = `管理员在编辑界面执行了状态确认: ${statusText}`;

      if (oldStatus !== '在位' && statusText === '在位') {
        logAction = '装备入库';
        logDesc = `装备入库成功 (位置:${form_add_new.self_address}号位)`;
      } else if (oldStatus === '在位' && statusText !== '在位') {
        logAction = '装备出库';
        logDesc = `装备出库成功 (移出柜体)`;
      }

      await window.electronAPI.el_post({
        action: 'insert',
        payload: {
          tableName: 'logs',
          setValues: {
            terminal_id: configStore.terminal.terminal_id,
            action: logAction,
            description: logDesc,
            username: opName,
            id_card: opId,
            equipment_id: currentEditId.value,
            group_name: form_add_new.group_name,
            group_code: form_add_new.group_code,
            log_level: '普通'
          }
        }
      });

      // 1. 先更新业务状态
      form_add_new.group_status = statusText
      const row = tableData.find((item) => item.id == currentEditId.value)
      if (row) row.group_status = statusText

      // 2. 关键：等待真实的硬件扫描完成
      // 确保硬件已经读取到了最新的物理状态
      await updateSwitchDetails()

      // 3. 从更新后的配置中同步最新的硬件状态到 UI
      const targetSwitch = config_blob.value?.switch?.details?.find(
        (s) => Number(s.self_address) === Number(form_add_new.self_address)
      )

      if (targetSwitch) {
        const realStatus = targetSwitch.hardware_status === 1 ? '导通' : '断开'
        form_add_new.hardware_status = realStatus
        if (row) row.hardware_status = realStatus
      }

      audioStore.play(audioUrl)
      isApplying.value = false
    }
  } catch (e) {
    console.error(e)
    ElMessageBox.alert('数据更新失败', '错误')
  }
}
// 监听子组件键盘输入的变化，更新父组件绑定的表单字段
watch(currentInputValue, (newValue /*oldValue*/) => {
  // console.log('currentInputValue 变化了.newValue:', newValue, 'oldValue:', oldValue)
  // console.log('activeField.value:', activeField.value)
  if (activeField.value) {
    // 特殊处理装备数量字段
    if (activeField.value === 'group_chip_count') {
      // 转换为数字，如果为空或无效值则设为0
      let numericValue = Number(newValue)
      // 确保不为空且为有效数字
      if (isNaN(numericValue) || newValue === '' || newValue === null) {
        numericValue = 0
      }
      form_add_new[activeField.value] = numericValue
    } else {
      if (currentChipIndex.value === -1) {
        // 更新主表
        form_add_new[activeField.value] = newValue
      } else {
        // 更新子表 (数组项)
        const chip = form_add_new.chip_list[currentChipIndex.value]
        if (chip) {
          chip[activeField.value] = newValue
        }
      }
    }
    console.log('curretInputValue变化了', newValue + 'a')
    // console.log('form_add_new[activeField.value]:', form_add_new[activeField.value] + 'a')
    // 确保 DOM 更新完成后重新定位光标
    // 使用 setTimeout 确保 DOM 完全渲染
    /*
    setTimeout(() => {
      let currentRef = null
      switch (activeField.value) {
        case 'group_remark':
          currentRef = groupRemark.value
          break
        case 'equip_name':
          currentRef = equipNameInput.value // 修正：应该是 equipNameInput
          break
      }

      if (currentRef && currentRef.$el) {
        // 获取实际的 input 或 textarea 元素
        const inputElement = currentRef.$el.querySelector('input, textarea') || currentRef.$el
        if (inputElement) {
          inputElement.focus()
          const length = inputElement.value?.length || 0
          if (inputElement.setSelectionRange) {
            inputElement.setSelectionRange(length, length)
          }
          console.log('焦点设置成功，光标位置:', length)
          console.log('form_add_new[activeField.value]:', form_add_new[activeField.value])
          console.log('currentInputValue.value:', currentInputValue.value)
        }
      }
    }, 100) // 100m
    */
  }
})
// 弹窗控制
const showDialog = ref(false)
const handleCabinetSelection = (index) => {
  form_add_new.lock_self_address = config_blob.value.lock.details[index].self_address
  form_add_new.open_lock_register_address =
    config_blob.value.lock.details[index].open_lock_register_address
}

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
      currentInputValue.value = form_add_new[fieldName]
    } else {
      // 修改数组里的芯片信息
      currentInputValue.value = form_add_new.chip_list[index][fieldName]
    }
    // console.log('openKeyboard:', event.targetElement)
    activeField.value = fieldName
    showKeyboard.value = true
    currentChipIndex.value = index // 记录index

    // 设置数字键盘布局
    showDialog.value = true
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

const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard.vue'))
const containerDiv = ref(null)

// 更新表格高度的方法
const updateTableHeight = () => {
  if (containerDiv.value) {
    // 获取容器div的实际高度
    const height = containerDiv.value.offsetHeight
    // 减去按钮的高度和其他预留空间
    tableHeight.value = height - 60
  }
}

const tableData = reactive([])
const validateMainLockAddress = (rule, value, callback) => {
  // console.log('value:', value, 'rule:', rule)
  // 校验一定要保证所有路径都有返回，否则调用函数无法catch到callback(new Error())
  // 1. 基础非空验证
  if (value === null || value === undefined || value === '') {
    if (rule.field === 'group_code') {
      callback(new Error('装备编号不能为空'))
    } else if (rule.field === 'group_name') { // <-- 新增这一行
      callback(new Error('装备名称不能为空'))  // <-- 新增这一行
    } else if (rule.field.includes('chip_code')) {
      callback(new Error('芯片编号不能为空'))
    } else if (rule.field === 'self_address') {
      callback(new Error('开关地址不能为空'))
    } else {
      callback(new Error('表单校验失败'))
    }
    return // 只要为空，直接返回，不再执行后续检查
  }

  // === 核心修改 4：验证时排除当前编辑的 ID ===
  if (rule.field === 'self_address') {
    // 查找是否存在【地址相同】且【ID不等于当前编辑ID】的记录
    const isAddressUsed = tableData.some((item) => {
      const isSameAddress = String(item.self_address) === String(value)
      // 如果是编辑模式，还需要判断 id 是否不同；如果是新增模式(id为null)，条件自然成立
      const isDifferentId = isEditMode.value ? item.id !== currentEditId.value : true
      return isSameAddress && isDifferentId
    })

    if (isAddressUsed) {
      callback(new Error(`地址 ${value} 已被占用`))
      return
    }
  }

  // 同理，如果 group_code 也需要唯一性校验，也要加上 isDifferentId 的判断

  // 验证通过
  callback()
}
const fleshData = async () => {
  getData()
  switch_view.value = false
}
// 修改 form_add_new 的定义
const form_add_new = reactive({
  // === 1. 装备公共信息 (Group Level) ===
  group_code: '', // 装备编号 (主键概念)
  group_name: '', // 装备名称
  group_type: '', // 装备类型
  group_remark: '', // 装备备注
  group_image: '', // 【新增】用于存储装备整体实照 (Base64字符串)
  group_chip_count: 1, // 芯片数量
  group_status: '未入柜', // 装备(芯片)状态 removed(已出柜) not_installed(未入柜) take_out(已取出) in_position(在位)
  group_distribution_time: null, // 装备分配时间

  // === 2. 核心差异：芯片列表 (Chip List) ===
  // 所有的芯片信息都放在这个数组里，不再散落在外层
  chip_list: [
    {
      chip_code: '', // 芯片编号
      chip_name: '', // 芯片名称
      chip_type: '', // 芯片类型
      chip_remark: '', // 芯片参数
      chip_image: [], // 芯片照片 (存 Base64 或 路径)
      chip_distribution_time: null, // 芯片分配时间,保留字段
      chip_status: '', //芯片状态，保留字段
    },
  ],

  // === 3. 硬件控制信息 (Switch/Lock) ===
  self_address: '', // 开关地址
  hardware_status: '', // 开关状态
  admin_status: '', // 管理状态
  lock_self_address: 1, // 门锁逻辑地址
  open_lock_register_address: 10, // 开锁寄存器地址
})
// 添加一个新芯片槽位
const addChipSlot = () => {
  form_add_new.chip_list.push({
    chip_code: '', // 修正为 chip_code
    chip_name: '', // 建议继承装备名称
    chip_type: '', // 建议继承装备类型
    chip_remark: '', // 修正为 chip_remark
    chip_image: [], // 修正为 chip_image (必须是空数组)
    chip_distribution_time: null,
    chip_status: '',
  })
}
// === 新增缺失的删除函数 ===
const removeChipSlot = (index) => {
  if (form_add_new.chip_list.length > 1) {
    form_add_new.chip_list.splice(index, 1)
    // 更新数量统计
    form_add_new.group_chip_count = form_add_new.chip_list.length
  }
}
// 辅助变量：记录当前正在操作哪一个芯片（用于键盘和拍照）
const currentChipIndex = ref(-1) // -1代表操作公共字段，0+代表操作具体芯片
// 定义编辑模式状态
const isEditMode = ref(false) // false=新增, true=编辑
const currentEditId = ref(null) // 存储正在编辑的行ID
const editEquipment = async () => {
  // 1. 获取选中行
  const selectedRows = tableRef.value.getSelectionRows()

  // 校验逻辑
  if (selectedRows.length === 0) {
    audioStore.play('/audio/请先勾选需要编辑的装备.mp3')
    return
  }
  if (selectedRows.length > 1) {
    return
  }

  const row = selectedRows[0]

  // === 核心修改 1：设置编辑模式 ===
  isEditMode.value = true
  currentEditId.value = row.id // 假设主键是 id
  // ============================

  // 2. 计算可用开关地址 (逻辑不变，保持你原来的)
  const allSwitches = config_blob.value?.switch?.details || []
  const otherUsedAddresses = tableData
    .filter((item) => item.id !== row.id)
    .map((item) => Number(item.self_address))

  availableOptions.value = allSwitches.filter(
    (item) => !otherUsedAddresses.includes(Number(item.self_address)),
  )

  // 3. 数据回显
  form_add_new.group_code = row.group_code
  form_add_new.group_name = row.group_name
  form_add_new.group_type = row.group_type
  form_add_new.group_remark = row.group_remark
  form_add_new.group_image = row.group_image // 【新增】回显图片
  form_add_new.group_chip_count = row.group_chip_count
  form_add_new.group_status = row.group_status

  // 处理日期格式：如果是字符串需转为 Date 对象给 DatePicker 使用
  form_add_new.group_distribution_time = row.group_distribution_time
    ? new Date(row.group_distribution_time)
    : null

  // 硬件状态回显
  form_add_new.self_address = row.self_address
  form_add_new.hardware_status = row.hardware_status
  form_add_new.admin_status = row.admin_status
  form_add_new.lock_self_address = row.lock_self_address
  form_add_new.open_lock_register_address = row.open_lock_register_address

  // 4. 解析 chip_list
  try {
    // 条件： row.chip_list 是一个非空字符串
    if (typeof row.chip_list === 'string' && row.chip_list.trim() !== '') {
      const parsedList = JSON.parse(row.chip_list)
      // 深拷贝解析后的数组，确保 form_add_new.chip_list 是一个全新的数组（避免引用问题）
      form_add_new.chip_list = JSON.parse(JSON.stringify(parsedList))
      // 检查 row.chip_list 是否为数组,直接深拷贝
    } else if (Array.isArray(row.chip_list)) {
      form_add_new.chip_list = JSON.parse(JSON.stringify(row.chip_list))
    } else {
      form_add_new.chip_list = []
      addChipSlot()
    }
  } catch (error) {
    console.error('解析芯片列表失败:', error)
    form_add_new.chip_list = []
    addChipSlot()
  }

  // 5. 打开弹窗
  audioStore.play('/audio/编辑查看.mp3')
  showDialog.value = true
  setTimeout(() => {
    const dialogBodies = document.querySelectorAll('.el-dialog__body')
    dialogBodies.forEach((body) => {
      body.style.height = '10.8rem'
    })
  }, 50)
  /*
    nextTick(() => {
      if (groupCode.value) {
        const inputElement = groupCode.value.$el.querySelector('input')
        setTimeout(() => { inputElement.focus() }, 10)
      }
    })
    */
}
const clearForm = async () => {
  // 1. 基础信息重置
  form_add_new.group_code = ''
  form_add_new.group_name = ''
  form_add_new.group_image = '' // 【新增】清空图片
  form_add_new.group_type = ''
  form_add_new.group_remark = ''
  form_add_new.group_chip_count = 1
  form_add_new.group_distribution_time = null
  form_add_new.group_status = '未入柜'

  // 2. 芯片列表重置 (保持结构与 addChipSlot 一致)
  form_add_new.chip_list = [
    {
      chip_code: '',
      chip_name: '',
      chip_type: '',
      chip_remark: '',
      chip_image: [],
      chip_distribution_time: null,
      chip_status: '',
    },
  ]

  // 3. 硬件状态重置
  form_add_new.self_address = ''
  form_add_new.hardware_status = ''
  form_add_new.admin_status = ''

  // === 修改点3：重置门锁选择 (恢复为配置中的第一个锁，防止残留) ===
  if (config_blob.value?.lock?.details?.length > 0) {
    form_add_new.lock_self_address = config_blob.value.lock.details[0].self_address
    form_add_new.open_lock_register_address =
      config_blob.value.lock.details[0].open_lock_register_address
  } else {
    // 兜底默认值
    form_add_new.lock_self_address = 1
    form_add_new.open_lock_register_address = 10
  }

  audioStore.play(`/audio/表单已清空.mp3`)
}
const rules = {
  group_code: [{ required: true, validator: validateMainLockAddress, trigger: ['blur', 'change'] }],
  // === 新增：装备名称校验规则 ===
  group_name: [{ required: true, validator: validateMainLockAddress, trigger: ['blur', 'change'] }],
  equipment_code: [
    { required: true, validator: validateMainLockAddress, trigger: ['blur', 'change'] },
  ],
  self_address: [
    { required: true, validator: validateMainLockAddress, trigger: ['blur', 'change'] },
  ],
}

const router = useRouter()
// 创建响应式变量来存储表格高度
const tableHeight = ref(1500) // 默认值

// 返回上一页功能
// ==========================================
// [重写] 退出返回逻辑 (集成安全检测)
// ==========================================
const goBack = async () => {
  // 1. 阻断：如果正在进行入柜/出柜等待流程 (可选，防止状态冲突)
  if (isApplying.value) {
    ElMessageBox.alert('当前正在执行出入柜操作，请先完成或中断操作。', '操作受限', {
      type: 'warning',
    })
    return
  }

  // 2. 初次检查 (显示 Loading，防止检测过程卡顿)
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
    // 如果检测报错，这里暂时设为 false 让用户决定是否强制退出，或者设为 true 直接放行
    isAllClosed = false
  }
  loading.close()

  // 场景 A: 门直接就是关的 -> 安全退出
  if (isAllClosed) {
    router.back() // 返回上一页
    return
  }

  // 场景 B: 门没关 -> 启动“智能等待”
  audioStore.play('/audio/安全警告检测到柜门未关闭.mp3') // 请确保有此音频

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
        console.log('后台轮询门状态:', closedNow)

        if (closedNow) {
          // ==========================================
          // [关键]: 用户在报警期间关上了门 -> 自动通过
          // ==========================================
          console.log('硬件检测通过，执行自动退出...')
          isAutoAction = true // 标记一下，告诉下面的 catch 别处理
          stopPolling = true

          // 1. 播放成功音效 (可选)
          // audioStore.play('/audio/柜门已关闭.mp3')

          // 2. 销毁弹窗
          ElMessageBox.close()

          // 3. 立即退出
          router.back()
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
             请关闭柜门，系统检测后将自动退出...
           </span>
        </div>
        <div style="color: #666; font-size: 12px;">
          如果传感器故障，可点击下方按钮强制退出
        </div>
      </div>
    `

    // 这里会挂起，等待用户点击按钮 OR 被代码自动关闭
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
    router.back() // 退出
  } catch (action) {
    console.log('弹窗被关闭', action)
    // 路径 2: 弹窗被关闭 (被上面的 ElMessageBox.close() 触发)
    stopPolling = true

    // 如果是我们的代码自动触发的关闭，这里什么都不用做
    if (isAutoAction) {
      console.log('捕获到自动关闭动作，catch 块无需处理')
      return
    }
  }
}

const handleClose = () => {
  showDialog.value = false
  showKeyboard.value = false
  /*
audioStore.play(`/audio/是否需要保存.mp3`)
ElMessageBox.confirm('确认不保存就直接退出吗?', {
confirmButtonText: '直接退出',
cancelButtonText: '取消',
})
.then(() => {
  showDialog.value = false
  showKeyboard.value = false
})
.catch(() => {
})
*/
}
// const groupType = ref('')
const groupCode = ref(null)
// 表单初始化状态函数
/*
const getInitialFormData = () => {
  return {
    group_code: '', // 分组编号
    group_name: '', // 分组名称
    group_type: '', // 分组类型
    group_equipment_count: 1, // 分组装备数量
    group_remark: '', // 分组参数
    group_status: '', // 分组状态
    equipment_code: '', // 装备(芯片)编号
    equipment_name: '', // 装备(芯片)名称
    equipment_type: '', // 装备(芯片)类型
    equipment_distribution_time: '', // 装备(芯片)配发时间
    equipment_remark: '', // 装备(芯片)参数
    equipment_image: [], // 装备(芯片)图片
    equip_status: '', // 装备(芯片)状态
    self_address: '', // 开关地址
    hardware_status: '', // 开关状态
    admin_status: '', // 开关管理
    faulty: false, // 禁用原因：true表示开关故障，false表示其他原因
    lock_self_address: 1, // 门锁逻辑地址
    open_lock_register_address: 10, // 门锁开门寄存器地址
  };
};
*/
// 1. 定义一个响应式变量，用来存筛选后的列表
const availableOptions = ref([])

// 2. 修改 add_equipment 函数
const add_equipment = () => {
  if (tableData.length >= 65) {
    audioStore.play(`/audio/装备数已达开关数上限.mp3`)
    return
  }

  // === 核心修改 2：重置为新增模式 ===
  isEditMode.value = false
  currentEditId.value = null
  // ============================

  // ============== 新增：计算可用地址逻辑 ==============
  // 1. 获取所有配置的开关
  const allSwitches = config_blob.value?.switch?.details || []

  // 2. 获取当前表格中已经占用的地址 (提取 self_address)
  // 统一类型：在比较前将类型统一为字符串或数字。
  const usedAddresses = tableData.map((item) => Number(item.self_address))
  console.log('已占用的地址:', usedAddresses)

  // 3. 过滤：只保留未被占用的
  availableOptions.value = allSwitches.filter(
    (item) => !usedAddresses.includes(Number(item.self_address)),
  )

  console.log('当前可用开关数量:', availableOptions.value.length)
  // ===================================================

  // 初始化门锁地址
  if (config_blob.value?.lock?.details?.length > 0) {
    form_add_new.lock_self_address = config_blob.value.lock.details[0].self_address
    form_add_new.open_lock_register_address =
      config_blob.value.lock.details[0].open_lock_register_address
  }

  audioStore.play(`/audio/添加新装备.mp3`)

  showDialog.value = true

  // 聚焦逻辑保持不变
  nextTick(() => {
    console.log('add_equipment')
    if (groupCode.value) {
      const inputElement = groupCode.value.$el.querySelector('input')
      setTimeout(() => {
        inputElement.focus()
      }, 10)
    }
  })
}
// 修改 deleteImage 方法
const deleteImage = (chipIndex, imgIndex) => {
  // 校验索引是否存在
  if (
    chipIndex >= 0 &&
    chipIndex < form_add_new.chip_list.length &&
    form_add_new.chip_list[chipIndex].chip_image
  ) {
    // 从对应芯片的图片数组中移除
    form_add_new.chip_list[chipIndex].chip_image.splice(imgIndex, 1)
  }
}

const open_equip_info_table = ref(false)

// 1. 仅开门操作
const handleOpenDoorOnly = async () => {
  if (!checkLockConfig()) return

  try {
    await sendOpenLockCommand()
    audioStore.play('/audio/开门指令已发送.mp3')
  } catch (error) {
    console.error(error)
  }
}
// 辅助：检查锁配置
const checkLockConfig = () => {
  if (!form_add_new.lock_self_address || !form_add_new.open_lock_register_address) {
    audioStore.play('/audio/未配置门锁地址.mp3')
    return false
  }
  return true
}
// 辅助：发送开锁指令的具体实现
const sendOpenLockCommand = async () => {
  await window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201, // 门控板地址
      registerAddress: form_add_new.open_lock_register_address, // 开门寄存器地址
      value: 50, //寄存器通电时间，80代表8s
      isWrite: true, // 是否为写操作
    },
  })
  // 开灯
  await window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201,
      registerAddress: 12,
      value: 9000000,
      isWrite: true,
    },
  })
}
/*
const open_equip_info = async () => {
  equip_info.value = true
  showKeyboard.value = false
  audioStore.play(`/audio/装备信息库.mp3`)
  // 因为之前的dialog的body被设置为了5.6rem,所以这里需要重新设置一下，等待dialog渲染完成再设置
  setTimeout(() => {
    const dialogBodies = document.querySelectorAll('.el-dialog__body')
    dialogBodies.forEach((body) => {
      body.style.height = '10.8rem'
    })
    open_equip_info_table.value = true
  }, 50)
}
*/
// 正确监听分组编号变化，自动填充相关信息
/*
watch(
  () => form_add_new.group_code,
  (newValue, oldValue) => {
    console.log('group_code 变化了 newValue:', newValue, 'oldValue:', oldValue)

    if (newValue && groupInfoMap.value[newValue]) {
      // 找到匹配的分组信息，自动填充所有相关字段
      const groupInfo = groupInfoMap.value[newValue]
      form_add_new.group_name = groupInfo.group_name
      form_add_new.group_type = groupInfo.group_type
      form_add_new.group_equipment_count = groupInfo.group_equipment_count
      form_add_new.group_remark = groupInfo.group_remark

      console.log('自动填充完成:', {
        分组名称: groupInfo.group_name,
        分组类型: groupInfo.group_type,
        装备数量: groupInfo.group_equipment_count,
        分组参数: groupInfo.group_remark,
      })
    } else if (!newValue) {
      // 清空选择时，重置所有相关字段
      form_add_new.group_name = ''
      form_add_new.group_type = ''
      form_add_new.group_equipment_count = 1 // 重置为默认值
      form_add_new.group_remark = ''
      console.log('已清空所有分组相关字段')
    }
  },
)
*/
// 修改：构建分组信息映射表（在 fetchConfigData 函数中添加）
// const groupInfoMap = ref({})
/*
const fetchConfigData = async () => {
  try {
    const response = await window.electronAPI.el_post({
      action: 'queryAll',
      payload: {
        tableName: 'equipment_info',
      },
    })
    if (response?.success && response.data?.length) {
      console.log('response.data:', toRaw(response.data))
      // 提取每个对象的 group_name 属性并去重
      group_name_array.value = [...new Set(response.data.map((item) => item.group_name))]
      group_code_array.value = [...new Set(response.data.map((item) => item.group_code))]
      group_type_array.value = [...new Set(response.data.map((item) => item.group_type))]

      // 构建分组信息映射表，以 group_code 为键
      groupInfoMap.value = {}
      response.data.forEach((item) => {
        if (item.group_code) {
          groupInfoMap.value[item.group_code] = {
            group_name: item.group_name,
            group_type: item.group_type,
            group_equipment_count: item.group_equipment_count || 1, // 装备数量，默认为1
            group_remark: item.group_remark || '', // 分组参数
          }
        }
      })
    }
  } catch (error) {
    console.error('[EquipmentManagementView]初始化获取数据失败:', error)
    return
  }
}
*/

import { useTimerStore } from '@/stores/timerStore'
const timerStore = useTimerStore()
// 组件挂载时添加窗口大小变化的监听
onMounted(async () => {
  if (timerStore.isTimerActive) {
    console.log('暂停定时器')
    timerStore.stopInterval()
  }
  // 先执行一次开关列表刷新硬件状态
  const response = await window.electronAPI.el_post({
    action: 'queryMultipleTables',
    payload: {
      arr: [{ tablename: 'terminal_settings', condition: '' }],
    },
  })
  console.log('el_post调用返回的数据:', toRaw(response.data.terminal_settings))
  config_blob.value = JSON.parse(response.data.terminal_settings.config_blob)
  console.log('config_blob:', toRaw(config_blob.value))
  console.log('switch.details:', toRaw(config_blob.value.switch.details))
  if (config_blob.value) {
    await updateSwitchDetails()
  }
  // fetchConfigData()
  getData()

  nextTick(() => {
    updateTableHeight()
  })
})
onUnmounted(async () => {
  isPolling.value = false
  // 启动定时器（仅在未启动时）
  if (!timerStore.isTimerActive) {
    console.log('重启定时器')
    timerStore.startInterval()
  }
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
})
</script>

<style scoped>
/*
@import '@/assets/css/vxe_grid.css';
*/

.el-table {
  font-size: 0.24rem;
  /* 调整表格字体大小 */
}

.el-table .el-button {
  font-size: 0.24rem;
  /* 调整按钮字体大小 */
}

.el-table .el-button .el-icon {
  font-size: 0.24rem;
  /* 调整图标大小 */
}

.el-table :deep(.el-checkbox__inner) {
  width: 0.35rem !important;
  height: 0.35rem !important;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

/*正常状态 */
.status-success {
  background-color: #52c41a;
  box-shadow: 0 0 8px rgba(82, 196, 26, 0.5);
}

/*受限/未知状态 */
.status-warning {
  background-color: #faad14;
  box-shadow: 0 0 8px rgba(250, 173, 20, 0.5);
}

/*错误状态 */
.status-error {
  background-color: #f5222d;
  box-shadow: 0 0 8px rgba(245, 34, 45, 0.5);
}

/* 自定义高亮当前行悬停颜色 */
.el-table :deep(.el-table__body tr.current-row > td) {
  background-color: #d3e3fb !important;
}

.equip_operation_line {
  width: 100%;
  height: 60px;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #e6e6e6;
}

:deep(.el-form-item__label) {
  color: #333;
  font-size: 0.25rem;
}

.keyboard-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 10px;
}

:deep(.el-dialog) {
  margin-top: 0rem;
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

:deep(.el-table td.el-table__cell div) {
  color: #000;
}

/* 确保文本域能正确显示换行 */
:deep(.el-textarea__inner) {
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  line-height: 1.5;
}

/*防止textarea高度塌陷*/
/* 为文本域容器设置最小高度 */
:deep(.el-textarea) {
  min-height: 120px !important;
}

/* 确保文本域本身有固定高度 */
:deep(.el-textarea__inner) {
  min-height: 120px !important;
  height: 120px !important;
  resize: vertical !important;
  /* 允许用户手动调整高度 */
  white-space: pre-wrap !important;
  word-wrap: break-word !important;
  line-height: 1.5;
}

.camera-view {
  width: 100%;
  height: 400px;
  object-fit: cover;
  border-radius: 5px;
}

.status-tag {
  font-size: 0.23rem;
}

.switch-list-container {
  overflow-y: auto;
  height: 100%;
}

.switch-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.switch-admin-status {
  flex: 1;
}

.switch-status {
  width: 130px;
}

.switch-address {
  width: 130px;
}

.switch-placed-status {
  width: 120px;
}

.switch-header {
  display: flex;
  align-items: center;
  padding: 8px;
  font-weight: bold;
  border-bottom: 1px solid #ddd;
  background-color: #f5f5f5;
}

.custom-radio-group {
  display: flex;
  gap: 10px;
  /* 控制两个选项之间的间距 */
}

.custom-radio {
  padding: 5px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.3s;
}

.custom-radio.active {
  background-color: #409eff;
  color: white;
  border-color: #409eff;
}

.custom-radio.danger {
  background-color: #f5222d;
  /* 红色背景 */
  color: white;
  border-color: #f5222d;
  /* 红色边框 */
}

.custom-status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.23rem;
  display: inline-block;
}

.custom-status-tag.success {
  background-color: #52c41a;
  /* 绿色背景 */
  color: white;
}

.custom-status-tag.danger {
  background-color: #f5222d;
  /* 红色背景 */
  color: white;
}

:deep(.el-form-item__error) {
  font-size: 0.23rem;
  /* 调整为你需要的字体大小 */
}

:deep(.el-select__selected-item) {
  font-size: 0.26rem;
}

:deep(.el-input__inner) {
  font-size: 0.26rem;
}

:deep(.el-loading-text) {
  font-size: 0.3rem;
}

/* ================== 新增：等待对话框样式 ================== */

/* 对话框内容容器 */
.dialog-content {
  text-align: center;
  padding: 40px 30px 30px;
}

/* 加载指示器 */
.loading-indicator {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 25px;
}

.spinner {
  width: 100%;
  height: 100%;
  border: 3px solid #f0f2f5;
  border-top: 3px solid #409eff;
  border-radius: 50%;
  animation: spin 1.2s linear infinite;
  position: relative;
  z-index: 2;
}

.pulse-effect {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border: 2px solid #409eff;
  border-radius: 50%;
  animation: pulse 2s ease-out infinite;
  opacity: 0.3;
}

/* 动画定义 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }

  50% {
    transform: scale(1.1);
    opacity: 0.3;
  }

  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

/* 主要内容区域 */
.main-content {
  margin-bottom: 25px;
}

.dialog-title {
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
  line-height: 1.4;
}

.setting-tip {
  color: #606266;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
}

/* 进度指示器 */
.progress-indicator {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background-color: #f0f2f5;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  width: 60%;
  background: linear-gradient(90deg, #409eff, #66b1ff);
  border-radius: 2px;
  animation: progressSlide 2s ease-in-out infinite;
}

.progress-text {
  color: #909399;
  font-size: 12px;
  display: block;
}

@keyframes progressSlide {
  0% {
    transform: translateX(-100%);
  }

  50% {
    transform: translateX(0%);
  }

  100% {
    transform: translateX(100%);
  }
}

/* 操作按钮 */
.action-buttons {
  text-align: center;
}

.opendoor-btn,
.exit-btn {
  width: 160px;
  height: 44px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.exit-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.exit-btn:hover::before {
  left: 100%;
}

.exit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

.btn-text {
  position: relative;
  z-index: 1;
  font-size: 0.23rem;
}

/* 全局对话框样式优化 (覆盖 Element Plus 默认样式) */
/* 注意：如果样式不生效，可能需要去掉 scoped 或使用 :deep() */
:deep(.waiting-dialog) {
  border-radius: 12px !important;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05) !important;
  overflow: hidden;
  margin-top: 100px;
}

:deep(.waiting-dialog .el-dialog__header) {
  padding: 0 !important;
  display: none;
  /* 隐藏默认标题栏 */
}

:deep(.waiting-dialog .el-dialog__body) {
  padding: 0 !important;
  height: auto !important;
  /* 覆盖你在其他地方设置的固定高度 */
}

.status-green {
  color: #67c23a;
  font-weight: bold;
}

.status-red {
  color: #f56c6c;
  font-weight: bold;
}

.status-orange {
  color: #e6a23c;
  font-weight: bold;
}

.status-gray {
  color: #909399;
  font-weight: bold;
}
</style>
