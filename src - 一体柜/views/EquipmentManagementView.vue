<template>
  <div ref="containerDiv" style="width: 100%;height:100%;" class="'equipment'">
    <div class="equip_operation_line">
      <el-button type="primary" size="large" @click="add_equipment()">添加新装备</el-button>
      <div>
        <el-button @click="goBack" size="large">退出返回</el-button>
        <el-button type="danger" size="large">删除选中装备</el-button>
      </div>
    </div>
    <el-table stripe border highlight-current-row :data="tableData" style="width: 100%;height:100%;"
      :max-height="tableHeight">
      <el-table-column type="selection" :selectable="selectable" width="55" />
      <el-table-column type="index" label="序号" width="60" style="color:#333;" />
      <el-table-column prop="equip_team" label="装备分组" width="100" />
      <el-table-column prop="equip_type" label="装备类型" width="110" />
      <el-table-column prop="equip_name" label="装备名称" width="120" />
      <el-table-column prop="equip_number" label="装备编号" width="120" />
      <el-table-column prop="equip_status" label="装备状态" width="100" />
      <el-table-column prop="self_address" label="开关地址" width="100" />
      <el-table-column prop="hardware_status" label="开关状态" width="100" />
      <el-table-column prop="admin_status" label="开关管理" width="100" />
      <el-table-column prop="faulty" label="禁用原因" width="120" />
      <el-table-column fixed="right" label="操作" min-width="120">
        <template #default="scope">
          <el-button link type="primary" @click.prevent="deleteRow(scope.$index)">
            装备详情
          </el-button>
          <el-button link type="primary" @click.prevent="deleteRow(scope.$index)">
            编辑
          </el-button>
          <el-button link type="danger" @click.prevent="deleteRow(scope.$index)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    <!-- 添加装备弹窗 -->
    <el-dialog :close-on-click-modal=false :before-close="handleClose" v-model="showDialog" title="添加新装备" width="1000px"
      style="color:#000;">
      <el-form :inline="true" :model="form_add_new">
        <el-row>
          <el-col :span="12">
            <el-form-item label="分组编号">
              <el-select v-model="form_add_new.group_code" placeholder="请选择或输入装备分组编号" filterable allow-create
                style="width: 5.6rem;" @focus="openKeyboard('default', 'group_code', $event)" ref="groupCode">
                <el-option v-for="(group, index) in group_code_array" :key="index" :label="group" :value="group" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分组名称">
              <el-select v-model="form_add_new.group_name" placeholder="请选择或输入分组名称" filterable allow-create
                style="width: 5.6rem;" @focus="openKeyboard('default', 'group_name', $event)" ref="groupName">
                <el-option v-for="(group, index) in group_name_array" :key="index" :label="group" :value="group" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="分组类型">
              <el-select v-model="form_add_new.group_type" placeholder="请选择或输入分组类型" filterable allow-create
                style="width: 5.6rem;" @focus="openKeyboard('default', 'group_type', $event)">
                <el-option v-for="(group, index) in group_type_array" :key="index" :label="group" :value="group" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装备数量">
              <el-input-number v-model="form_add_new.group_equipment_count" :min="0" :max="99" style="width: 2rem;"
                @focus="openKeyboard('default', 'group_equipment_count', $event)" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="分组参数">
              <el-input v-model="form_add_new.group_remark" style="width: 12rem;white-space: pre-wrap;" :rows="6"
                ref="groupRemark" type="textarea" placeholder="请输入分组参数"
                @focus="openKeyboard('default', 'group_remark', $event)" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="装备编号">
              <el-select v-model="form_add_new.equipment_code" placeholder="请选择或输入装备编号" filterable allow-create
                style="width: 5.6rem;" @focus="openKeyboard('default', 'equipment_code', $event)">
                <el-option v-for="(group, index) in group_code_array" :key="index" :label="group" :value="group" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="装备名称">
              <el-select v-model="form_add_new.equipment_name" placeholder="请选择或输入装备名称" filterable allow-create
                style="width: 5.6rem;" @focus="openKeyboard('default', 'equipment_name', $event)">
                <el-option v-for="(group, index) in group_name_array" :key="index" :label="group" :value="group" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="装备类型">
              <el-select v-model="form_add_new.equipment_type" placeholder="请选择或输入装备类型" filterable allow-create
                style="width: 5.6rem;" @focus="openKeyboard('default', 'equipment_type', $event)">
                <el-option v-for="(group, index) in group_type_array" :key="index" :label="group" :value="group" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="配发时间">
              <el-date-picker v-model="form_add_new.equipment_distribution_time" type="date" placeholder="请选择配发时间"
                size="large" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="装备参数">
              <el-input v-model="form_add_new.equipment_remark" style="width: 12rem;white-space: pre-wrap;" :rows="6"
                ref="groupRemark" type="textarea" placeholder="请输入装备参数"
                @focus="openKeyboard('default', 'equipment_remark', $event)" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="12">
            <el-form-item label="装备图片">
              <el-input v-model="form_add_new.equipment_remark" style="width: 12rem;white-space: pre-wrap;" :rows="6"
                ref="groupRemark" type="textarea" placeholder="请输入装备参数"
                @focus="openKeyboard('default', 'equipment_remark', $event)" />
            </el-form-item>
          </el-col>
        </el-row>


        <el-form-item label="装备状态">
          <el-input v-model="form_add_new.equip_status" placeholder="请输入装备状态" clearable />
        </el-form-item>
        <el-form-item label="开关地址">
          <el-input v-model="form_add_new.self_address" placeholder="请输入开关地址" clearable />
        </el-form-item>
        <el-form-item label="开关状态">
          <el-input v-model="form_add_new.hardware_status" placeholder="请输入开关状态" clearable />
        </el-form-item>
        <el-form-item label="开关管理">
          <el-input v-model="form_add_new.admin_status" placeholder="请输入开关管理" clearable />
        </el-form-item>
        <el-form-item label="禁用原因">
          <el-input v-model="form_add_new.admin_status" placeholder="请输入禁用原因" clearable />
        </el-form-item>
        <el-form-item label="最后编辑时间">
          <el-input v-model="form_add_new.admin_status" placeholder="请输入禁用原因" clearable />
        </el-form-item>
        <el-form-item label="首次编辑时间">
          <el-input v-model="form_add_new.admin_status" placeholder="请输入禁用原因" clearable />
        </el-form-item>
      </el-form>
    </el-dialog>
    <!-- 虚拟键盘容器 - 移动到表单内部以动态定位 -->
    <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition">
      <SimpleKeyboard v-model="currentInputValue" :defaultLayout="currentLayout" @onKeyPress="handleKeyPress"
        @onClose.stop="showKeyboard = false" keyboardClass="num-keyboard" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, reactive, defineAsyncComponent, watch, toRaw } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAudioStore } from '@/stores/audioStore'


// 装备分组选项数据
const group_name_array = ref([])
const group_code_array = ref([])
const group_type_array = ref([])

// 其他原有代码保持不变
const audioStore = useAudioStore()
const showKeyboard = ref(false)
const activeField = ref('')
const currentInputValue = ref('')
const currentLayout = ref('number')

const groupRemark = ref('')

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
      const dialogBodies = document.querySelectorAll('.el-dialog__body');
      dialogBodies.forEach(body => {
        body.style.height = '10.8rem';
      });
    }, 200)
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

//打开虚拟键盘
const openKeyboard = (layout, fieldName, /*event*/) => {
  // 恢复父组件的样式
  const dialogBodies = document.querySelectorAll('.el-dialog__body');
  dialogBodies.forEach(body => {
    body.style.height = '5.6rem';
  });
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

const tableData = [
  {
    equip_type: '类型一',
    equip_name: '装备A',
    equip_team: '1组',
    equip_number: 'CX-001',
    equip_status: '在位',
    hardware_status: '断开',
    self_address: '3（主柜）',
    admin_status: '已启用',
    faulty: ''
  },
  {
    equip_type: '类型一',
    equip_name: '装备B',
    equip_team: '1组',
    equip_number: 'CX-032',
    equip_status: '在位',
    hardware_status: '导通',
    self_address: '4（副柜）',
    admin_status: '已禁用',
    faulty: '开关故障'
  },
  {
    equip_type: '类型一',
    equip_name: '装备C',
    equip_team: '2组',
    equip_number: 'CX-001',
    equip_status: '取出',
    hardware_status: '断开',
    self_address: '3（主柜）',
    admin_status: '已启用',
    faulty: ''
  },
  {
    equip_type: '类型一',
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  },
  {
    equip_type: '类型一',
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  },
  {
    equip_type: '类型二',
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  },
  {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  },
  {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  },
  {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  },
  {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  }, {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  }, {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  }, {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  }, {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  }, {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  }, {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  }, {
    equip_name: '装备一',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  }, {
    equip_name: '装备三1',
    equip_number: 'CX-001',
    equip_status: '未入柜',
    hardware_status: '断开',
    self_address: '12345',
    admin_status: '启用'
  },
]
const form_add_new = reactive({
  group_code: '', // 分组编号
  group_name: '', // 分组名称
  group_type: '', // 分组类型
  group_equipment_count: 1, // 分组装备数量
  group_remark: '', // 分组参数
  equipment_code: '', // 装备编号
  equipment_name: '', // 装备名称
  equipment_type: '', // 装备类型
  equipment_distribution_time: '', // 装备配发时间
  equipment_remark: '', //装备参数
  equipment_image: '', //装备图片
  equip_status: '', // 装备状态
  self_address: '', // 开关地址
  hardware_status: '', // 开关状态
  admin_status: '', // 开关管理
  faulty: false, // 禁用原因：true表示开关故障，false表示其他原因
})

const router = useRouter()
// 创建响应式变量来存储表格高度
const tableHeight = ref(650) // 默认值

// 返回上一页功能
const goBack = () => {
  router.back()
}

// 定义 selectable 方法
const selectable = (row) => ![1, 2].includes(row.id)

const handleClose = () => {
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
      // catch error
    })
}
const groupName = ref('')
// const groupType = ref('')
const groupCode = ref('')
// 创建表单初始状态函数
const getInitialFormData = () => ({
  group_code: '', // 分组编号
  group_name: '', // 分组名称
  group_type: '', // 分组类型
  group_equipment_count: 1, // 分组装备数量，默认为1
  group_remark: '', // 分组参数
  equipment_code: '', // 装备编号
  equip_type: '', // 装备类型
  equip_name: '', // 装备名称
  equip_team: '', // 装备分组名称
  equip_number: '', // 装备编号
  equip_status: '', // 装备状态
  self_address: '', // 开关地址
  hardware_status: '', // 开关状态
  admin_status: '', // 开关管理
  faulty: false, // 禁用原因
})
const add_equipment = () => {
  // 清空表单数据 - 方案一：使用 Object.assign
  Object.assign(form_add_new, getInitialFormData())
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
// 正确监听分组编号变化，自动填充相关信息
watch(() => form_add_new.group_code, (newValue, oldValue) => {
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
      分组参数: groupInfo.group_remark
    })
  } else if (!newValue) {
    // 清空选择时，重置所有相关字段
    form_add_new.group_name = ''
    form_add_new.group_type = ''
    form_add_new.group_equipment_count = 1 // 重置为默认值
    form_add_new.group_remark = ''
    console.log('已清空所有分组相关字段')
  }
})
// 修改：构建分组信息映射表（在 fetchConfigData 函数中添加）
const groupInfoMap = ref({})
const fetchConfigData = async () => {
  try {
    const response = await window.electronAPI.el_post({
      action: 'queryAll',
      payload: {
        tableName: 'equipment_info',
      },
    });
    if (response?.success && response.data?.length) {
      console.log('response.data:', toRaw(response.data));
      // 提取每个对象的 group_name 属性并去重
      group_name_array.value = [...new Set(response.data.map(item => item.group_name))];
      group_code_array.value = [...new Set(response.data.map(item => item.group_code))];
      group_type_array.value = [...new Set(response.data.map(item => item.group_type))];

      // 构建分组信息映射表，以 group_code 为键
      groupInfoMap.value = {}
      response.data.forEach(item => {
        if (item.group_code) {
          groupInfoMap.value[item.group_code] = {
            group_name: item.group_name,
            group_type: item.group_type,
            group_equipment_count: item.group_equipment_count || 1, // 装备数量，默认为1
            group_remark: item.group_remark || '' // 分组参数
          }
        }
      })
    }
  } catch (error) {
    console.error('[EquipmentManagementView]初始化获取数据失败:', error);
    return;
  }
};


// 组件挂载时添加窗口大小变化的监听
onMounted(async () => {
  fetchConfigData()
  nextTick(() => {
    updateTableHeight()
  })
})
</script>

<style scoped>
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
</style>
