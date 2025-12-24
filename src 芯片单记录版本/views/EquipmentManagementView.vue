<template>
  <div ref="containerDiv" style="width: 100%; height: 100%">
    <div class="equip_operation_line">
      <el-button type="primary" size="large" @click="add_equipment()">添加新装备</el-button>
      <div>
        <el-button @click="goBack" size="large">退出返回</el-button>
        <el-button @click="switchView" size="large">开关列表</el-button>
        <el-button type="danger" size="large">删除选中装备</el-button>
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
      正在渲染数据...,请稍后...
    </div>
    <!--
    <vxe-grid v-bind="gridOptions" :height="tableHeight">
      <template #operationDefault="{ row, rowIndex }">
        <el-button link type="primary" @click="showEquipmentDetail(row)" style="font-size:0.23rem;">查看详情</el-button>
        <el-button link type="primary" @click="editEquipment(row)" style="font-size:0.23rem;">编辑</el-button>
      </template>
</vxe-grid>
-->
    <el-table stripe border highlight-current-row :data="tableData"
      style="width: 100%; height: 100%; padding-bottom: 15px" :max-height="tableHeight">
      <el-table-column type="selection" :selectable="selectable" width="55" />
      <el-table-column type="index" label="序号" width="60" style="color: #333" />
      <el-table-column prop="group_type" label="装备类型" width="100" show-overflow-tooltip />
      <el-table-column prop="group_name" label="装备名称" width="100" show-overflow-tooltip />
      <el-table-column prop="group_code" label="装备编号" width="100" show-overflow-tooltip />
      <el-table-column prop="group_equipment_count" label="芯片数量" width="100" />
      <el-table-column prop="group_status" label="装备状态" width="100" />
      <el-table-column prop="equipment_type" label="芯片类型" width="100" show-overflow-tooltip />
      <el-table-column prop="equipment_name" label="芯片名称" width="100" show-overflow-tooltip />
      <el-table-column prop="equipment_code" label="芯片编号" width="100" show-overflow-tooltip />
      <!--
      <el-table-column prop="equip_status" label="芯片状态" width="100" />
      -->
      <el-table-column prop="self_address" label="开关地址" width="100" />
      <el-table-column prop="hardware_status" label="开关状态" width="100" />
      <el-table-column prop="admin_status" label="管理状态" width="100" />
      <!--
      <el-table-column prop="created_time" label="创建时间" width="100" />
      -->
      <el-table-column prop="last_modified" label="最后修改时间" width="130" />
      <el-table-column fixed="right" label="操作" min-width="160">
        <template #default="scope">
          <el-button link type="primary" @click.prevent="deleteRow(scope.$index)">
            装备详情
          </el-button>
          <el-button link type="primary" @click.prevent="deleteRow(scope.$index)"> 编辑 </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 添加装备弹窗 -->
    <el-dialog :close-on-click-modal="false" :before-close="handleClose" v-model="showDialog" title="添加新装备"
      width="1000px" style="color: #000">
      <el-form :inline="true" :model="form_add_new" :rules="rules" ref="formRef">
        <!--
        <el-row style="margin-bottom:20px;margin-top:20px;">
          <el-col :span="12">
            <el-button size="large" type="primary" @click="open_equip_info()">装备信息库</el-button>
          </el-col>
        </el-row>
        -->

        <el-row>
          <el-col :span="12">
            <el-form-item label="装备编号" prop="group_code">
              <el-input v-model="form_add_new.group_code" placeholder="请输入装备编号"
                @focus="openKeyboard('default', 'group_code', $event)" size="large"
                style="width: 5.6rem; font-size: 0.26rem" ref="groupCode"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装备名称">
              <el-input v-model="form_add_new.group_name" placeholder="请输入装备名称"
                @focus="openKeyboard('default', 'group_name', $event)" size="large"
                style="width: 5.6rem; font-size: 0.26rem"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="装备类型">
              <el-input v-model="form_add_new.group_type" placeholder="请输入装备类型"
                @focus="openKeyboard('default', 'group_type', $event)" size="large"
                style="width: 5.6rem; font-size: 0.26rem"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="芯片数量">
              <el-input-number v-model="form_add_new.group_equipment_count" :min="0" :max="99"
                style="width: 2rem; font-size: 0.26rem"
                @focus="openKeyboard('default', 'group_equipment_count', $event)" size="large" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row style="margin-bottom: 25px">
          <el-col :span="12">
            <el-form-item label="装备参数">
              <el-input v-model="form_add_new.group_remark"
                style="font-size: 0.26rem; width: 12rem; white-space: pre-wrap" :rows="6" ref="groupRemark"
                type="textarea" placeholder="请输入装备参数" @focus="openKeyboard('default', 'group_remark', $event)" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="芯片编号" prop="equipment_code">
              <el-input v-model="form_add_new.equipment_code" placeholder="请输入芯片编号"
                @focus="openKeyboard('default', 'equipment_code', $event)" size="large"
                style="width: 5.6rem; font-size: 0.26rem"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="芯片名称">
              <el-input v-model="form_add_new.equipment_name" placeholder="请输入芯片名称"
                @focus="openKeyboard('default', 'equipment_name', $event)" size="large"
                style="width: 5.6rem; font-size: 0.26rem"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="芯片类型">
              <el-input v-model="form_add_new.equipment_type" placeholder="请输入芯片类型"
                @focus="openKeyboard('default', 'equipment_type', $event)" size="large"
                style="width: 5.6rem; font-size: 0.26rem"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配发时间">
              <el-date-picker placement="top" v-model="form_add_new.equipment_distribution_time" type="date"
                placeholder="请选择配发时间" size="large" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="芯片参数">
              <el-input v-model="form_add_new.equipment_remark"
                style="width: 12rem; white-space: pre-wrap; font-size: 0.26rem" :rows="6" ref="groupRemark"
                type="textarea" placeholder="请输入芯片参数" @focus="openKeyboard('default', 'equipment_remark', $event)" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row style="margin-bottom: 10px">
          <el-col :span="24">
            <el-form-item label="芯片实照">
              <div style="display: flex; flex-wrap: wrap">
                <div v-for="(img, index) in srcList" :key="index" style="
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-left: 15px;
                    margin-bottom: 20px;
                  ">
                  <el-image style="width: 100px; height: 100px; border-radius: 5px" :src="img" :zoom-rate="1.2"
                    :max-scale="7" :min-scale="0.2" :preview-src-list="srcList" show-progress :initial-index="index"
                    fit="cover" />
                  <el-button type="danger" style="margin-top: 10px" @click="deleteImage(index)" :icon="Delete"
                    circle></el-button>
                </div>
                <div style="display: flex; flex-direction: column; margin-left: 15px; height: 100%">
                  <el-button @click="startCamera" style="
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

              <!--
              <el-input v-model="form_add_new.equipment_image" style="width: 12rem;white-space: pre-wrap;" :rows="6"
                ref="groupRemark" type="textarea" placeholder="请输入装备参数"
                @focus="openKeyboard('default', 'equipment_remark', $event)" />
                -->
            </el-form-item>
          </el-col>
        </el-row>

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
              <el-select v-model="form_add_new.self_address" placeholder="请选择开关地址" style="width: 3rem" size="large"
                @change="handleSwitchAddressChange">
                <el-option v-for="(item, index) in config_blob?.switch?.details" :key="index" :label="item.self_address"
                  :value="item.self_address" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="开关状态">
              <el-input v-model="form_add_new.hardware_status" size="large" style="font-size: 0.26rem"
                placeholder="开关状态" readonly disabled />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="管理状态">
              <el-input v-model="form_add_new.admin_status" size="large" style="font-size: 0.26rem" placeholder="管理状态"
                readonly disabled />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-button type="primary" size="large" @click="submitForm"
        style="margin-top: 30px; margin-bottom: 30px">提交保存</el-button>
      <el-button type="danger" size="large" @click="handleClose"
        style="margin-top: 30px; margin-bottom: 30px">直接退出</el-button>
      <el-button size="large" @click="clearForm" style="margin-top: 30px; margin-bottom: 30px">全部清空</el-button>
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
      <img v-show="show_photo" :src="srcList[srcList.length - 1]" class="captured-image" style="
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
    <el-dialog title="开关列表" v-model="switch_view" width="650" style="height: 100vh">
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
              {{ item.item_placed ? '已放置' : '----' }}
            </div>
          </div>
        </template>
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
// import { ElMessageBox } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'
import { Delete } from '@element-plus/icons-vue'
import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()
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
    let allData = []
    let currentPage = 1
    let hasMoreData = true

    while (hasMoreData) {
      const response = await window.electronAPI.el_post({
        action: 'queryPagination',
        payload: {
          tableName: 'equipment',
          page: currentPage,
          pageSize: 10,
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
      if (!response.data.data || response.data.data.length < 10) {
        hasMoreData = false
      } else {
        currentPage++
      }
    }

    // 【修正1】必须先排序，再赋值！
    allData.sort((a, b) => {
      // 确保 group_code 存在，防止 null 报错
      const codeA = a.group_code || ''
      const codeB = b.group_code || ''
      return codeA.localeCompare(codeB)
    })

    // 【修正2】排序后再赋值给 gridOptions
    // gridOptions.data = allData
    tableData.splice(0, tableData.length, ...allData)

    // 使用 nextTick 确保 vxe table渲染完成后执行 el_loading.value = false
    await nextTick()
    el_loading.value = false
  } catch (error) {
    console.error('请求数据失败:', error)
    el_loading.value = false
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
const srcList = ref([])
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
const submitForm = async () => {
  // 先进行表单验证
  try {
    await formRef.value.validate()
  } catch (error) {
    console.log('表单验证失败:', error)
    audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`)
    return
  }
  console.log('表单数据:', toRaw(form_add_new))
  console.log('srcList:', toRaw(srcList.value))
  // 创建表单数据的深度克隆
  const formData = JSON.parse(
    JSON.stringify({
      ...form_add_new,
      terminal_id: configStore.terminal.terminal_id,
    }),
  )
  const payload = {
    tableName: 'equipment',
    setValues: { ...formData, equipment_image: JSON.stringify(srcList.value) },
  }
  console.log('payload:', payload)
  try {
    const response = await window.electronAPI.el_post({
      action: 'insert',
      payload: payload,
    })

    if (response.success) {
      audioStore.play(`/audio/保存成功.mp3`)
      console.log('已保存到本地数据库')
      showDialog.value = false
      showKeyboard.value = false
    }
  } catch (error) {
    console.error('保存表单数据失败:', error)
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
    audioStore.play(`/audio/开关列表已更新.mp3`)
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

    await updateSwitchDetails()

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

  console.log('照片拍摄成功，当前图片数量:', srcList.value.length)
  // stopCamera()
}

const confirm_use_photo = async () => {
  if (!photoDataUrl.value) {
    console.error('没有可用的照片数据')
    await audioStore.play(`/audio/没有可用的照片数据.mp3`)
    return
  }
  srcList.value.push(photoDataUrl.value)
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
// 监听子组件键盘输入的变化，更新父组件绑定的表单字段
watch(currentInputValue, (newValue /*oldValue*/) => {
  // console.log('currentInputValue 变化了.newValue:', newValue, 'oldValue:', oldValue)
  // console.log('activeField.value:', activeField.value)
  if (activeField.value) {
    // 特殊处理装备数量字段
    if (activeField.value === 'group_equipment_count') {
      // 转换为数字，如果为空或无效值则设为0
      let numericValue = Number(newValue)
      // 确保不为空且为有效数字
      if (isNaN(numericValue) || newValue === '' || newValue === null) {
        numericValue = 0
      }
      form_add_new[activeField.value] = numericValue
    } else {
      form_add_new[activeField.value] = newValue
    }
    console.log('curretInputValue变化了', newValue + 'a')
    console.log('form_add_new[activeField.value]:', form_add_new[activeField.value] + 'a')
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
const openKeyboard = (layout, fieldName /*event*/) => {
  // 恢复父组件的样式
  const dialogBodies = document.querySelectorAll('.el-dialog__body')
  dialogBodies.forEach((body) => {
    body.style.height = '5.6rem'
  })
  // console.log('openKeyboard:', event.targetElement)
  currentInputValue.value = form_add_new[fieldName]
  activeField.value = fieldName
  showKeyboard.value = true

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
  // 校验一定要保证所有路径都有返回，否则调用函数无法catch到callback(new Error())
  console.log('value:', value, 'rule:', rule)
  if (value === null || value === undefined || value === '') {
    if (rule.field === 'group_code') {
      callback(new Error('装备编号不能为空'))
    }
    if (rule.field === 'equipment_code') {
      callback(new Error('芯片编号不能为空'))
    }
    if (rule.field === 'self_address') {
      callback(new Error('开关地址不能为空'))
    }
    callback(new Error('表单校验失败'))
  } else {
    // 校验成功
    callback()
  }
}
const form_add_new = reactive({
  group_code: '', // 分组编号
  group_name: '', // 分组名称
  group_type: '', // 分组类型
  group_equipment_count: 1, // 分组装备数量
  group_remark: '', // 分组参数
  group_status: '未入柜', // 分组状态
  equipment_code: '', // 装备(芯片)编号
  equipment_name: '', // 装备(芯片)名称
  equipment_type: '', // 装备(芯片)类型
  equipment_distribution_time: '', // 装备(芯片)配发时间
  equipment_remark: '', //装备(芯片)参数
  equipment_image: [], //装备(芯片)图片
  equip_status: '未入柜', // 装备(芯片)状态 removed(已出柜) not_installed(未入柜) take_out(已取出) in_position(在位)
  self_address: '', // 开关地址
  hardware_status: '', // 开关状态
  admin_status: '', // 开关管理
  faulty: false, // 禁用原因：true表示开关故障，false表示其他原因
  lock_self_address: 1, // 门锁逻辑地址
  open_lock_register_address: 10, // 门锁开门寄存器地址
})
const clearForm = async () => {
  form_add_new.group_code = ''
  form_add_new.group_name = ''
  form_add_new.group_type = ''
  form_add_new.group_equipment_count = 1
  form_add_new.group_remark = ''
  form_add_new.equipment_code = ''
  form_add_new.equipment_name = ''
  form_add_new.equipment_type = ''
  form_add_new.equipment_distribution_time = ''
  form_add_new.equipment_remark = ''
  form_add_new.equipment_image = []
  form_add_new.self_address = ''
  form_add_new.hardware_status = ''
  form_add_new.admin_status = ''
  srcList.value = []
  audioStore.play(`/audio/表单已清空.mp3`)
}
const rules = {
  group_code: [{ required: true, validator: validateMainLockAddress, trigger: ['blur', 'change'] }],
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
const goBack = () => {
  router.back()
}

// 定义 selectable 方法
const selectable = (row) => ![1, 2].includes(row.id)

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
const add_equipment = () => {
  // 初始化门锁地址
  form_add_new.lock_self_address = config_blob.value.lock.details[0].self_address
  form_add_new.open_lock_register_address =
    config_blob.value.lock.details[0].open_lock_register_address
  // 清空表单数据 - 方案一：使用 Object.assign
  // Object.assign(form_add_new, getInitialFormData())
  audioStore.play(`/audio/添加新装备.mp3`)
  // 设置数字键盘布局
  showDialog.value = true
  // 使用 nextTick 确保 DOM 更新完成
  nextTick(() => {
    console.log('add_equipment')
    if (groupCode.value) {
      // 对于 Element Plus 的 el-input，需要获取内部的 input 元素
      const inputElement = groupCode.value.$el.querySelector('input')
      // 设置选择范围以显示光标
      setTimeout(() => {
        inputElement.focus()
        /*
        if (inputElement.setSelectionRange) {
          const currentValue1 = inputElement.value || ''
          // inputElement.setSelectionRange(currentValue1.length, currentValue1.length) // 光标在末尾
        }
        */
      }, 10)
    }
  })
}
const deleteImage = (index) => {
  if (index >= 0 && index < srcList.value.length) {
    srcList.value.splice(index, 1)
  } else {
    console.error('Invalid index for image deletion')
  }
}

const open_equip_info_table = ref(false)
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
// 修改：构建分组信息映射表（在 fetchConfigData 函数中添加）
const groupInfoMap = ref({})
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
  await updateSwitchDetails()

  // fetchConfigData()
  getData()

  nextTick(() => {
    updateTableHeight()
  })
})
onUnmounted(async () => {
  // 启动定时器（仅在未启动时）
  if (!timerStore.isTimerActive) {
    console.log('重启定时器')
    timerStore.startInterval()
  }
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
</style>
