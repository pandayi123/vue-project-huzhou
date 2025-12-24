<template>
  <div class="network">
    <div class="network-config-form">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="auto" size="large">
        <!-- 本机IP地址 -->
        <el-form-item label="本机IP地址:" prop="localIp" style="color: white">
          <SegmentInput ref="localIpInputRef" id="localIp" v-model="form.localIp"
            @focus="handleSegmentInputFocus('localIp', localIpInputRef, $event)" />
        </el-form-item>

        <!-- 子网掩码 -->
        <el-form-item label="子网掩码:" prop="subnetMask">
          <SegmentInput ref="subnetMaskInputRef" id="subnetMask" v-model="form.subnetMask"
            @focus="handleSegmentInputFocus('subnetMask', subnetMaskInputRef, $event)" />
        </el-form-item>

        <!-- 网关 -->
        <el-form-item label="网关:" prop="gateway">
          <SegmentInput ref="gatewayInputRef" id="gateway" v-model="form.gateway"
            @focus="handleSegmentInputFocus('gateway', gatewayInputRef, $event)" />
        </el-form-item>

        <!-- 服务器IP地址 -->
        <el-form-item label="服务器IP地址:" prop="serverIp">
          <SegmentInput ref="serverIpInputRef" id="serverIp" v-model="form.serverIp"
            @focus="handleSegmentInputFocus('serverIp', serverIpInputRef, $event)" />
        </el-form-item>

        <!-- 服务器端口号 -->
        <el-form-item label="服务器端口号:" prop="serverPort">
          <el-input maxlength="4" minlength="4" @focus="activateKeyboard('number', 'serverPort', $event)"
            style="width: 2rem; font-size: 0.28rem" v-model="form.serverPort" />
        </el-form-item>

        <el-form-item style="text-align: right" class="network-config-buttons">
          <el-button ref="submitBtn" @click="handleSubmit" :loading="button_loading">{{
            button_loading ? '保存中...' : '保存更改'
            }}</el-button>
          <el-button ref="resetBtn" @click="handleReset">全部重置</el-button>
          <el-button ref="connectBtn" @click="handleConnect">测试</el-button>
        </el-form-item>
        <!-- 虚拟键盘容器 - 移动到表单内部以动态定位 -->
        <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition">
          <SimpleKeyboard v-model="currentInputValue" :defaultLayout="currentLayout" @onKeyPress="handleKeyPress"
            @onClose.stop="showKeyboard = false" keyboardClass="num-keyboard" />
        </div>
      </el-form>
    </div>
    <div class="button-container" style="margin-top: 1.3rem">
      <div class="button1" @click="goBack">退出返回</div>
    </div>

    <el-dialog v-model="test_dialogTableVisible" title="测试网络连接" width="1200" class="custom-dialog"
      :destroy-on-close="false">
      <el-row :gutter="20">
        <el-col v-for="(item, index) in testItems" :key="index" :xs="24" :sm="8" :md="8">
          <div class="test-item" :class="{ pulse: isTesting }">
            <div class="item-header">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-status">
                <div class="status-dot" :class="'status-' + item.status"></div>
                <span class="status-text">{{ item.statusText }}</span>
              </div>
            </div>
            <div class="item-value">{{ item.value }}</div>
            <div class="item-desc">{{ item.desc }}</div>
          </div>
        </el-col>
      </el-row>
      <template #footer>
        <div style="width: 100%; display: flex; justify-content: space-between">
          <div style="font-size: 0.24rem; display: flex; align-items: center; color: #aeb3c8">
            测试时间：{{ test_time }}
          </div>
          <div class="dialog-footer">
            <el-button @click="network_test_again" size="large" :loading="network_test_loading">
              {{ network_test_loading ? '测试中' : '重新测试' }}
            </el-button>
            <el-button @click="quit_test" size="large">退出返回</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import SimpleKeyboard from '@/components/SimpleKeyboard.vue'
// import { ElMessage } from 'element-plus'
import SegmentInput from '@/components/SegmentInput.vue'
import { useRouter } from 'vue-router'
import { ref, reactive, watch, nextTick, onMounted } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useAudioStore } from '@/stores/audioStore'
import plugins from '../assets/js/plugin'
const button_loading = ref(false)
const isTesting = ref(false)
const testItems = ref([
  {
    title: '网卡状态',
    status: 'warning',
    statusText: '未知',
    value: '...',
    desc: '测试中，请稍后', //'连接模式: 全双工\n接口状态: 正常',
  },
  {
    title: '网关连通',
    status: 'warning',
    statusText: '未知',
    value: '...',
    desc: '测试中，请稍后', //'网关响应时间: 3ms\n连接状态: 稳定',
  },
  {
    title: '服务器端口',
    status: 'warning',
    statusText: '未知',
    value: '...',
    desc: '测试中，请稍后', //'防火墙限制访问\n建议: 检查防火墙设置',
  },
  {
    title: '延时稳定性',
    status: 'warning',
    statusText: '未知',
    value: '...',
    desc: '测试中，请稍后',
  },
  {
    title: '平均延时',
    status: 'warning',
    statusText: '未知',
    value: '...',
    desc: '测试中，请稍后',
  },
  {
    title: '丢包率',
    status: 'warning',
    statusText: '未知',
    value: '...',
    desc: '测试中，请稍后',
  },
])

// 测试网络连接的弹窗
const test_dialogTableVisible = ref(false)
const network_test_loading = ref(false)

// 新增按钮的 ref
const submitBtn = ref(null)
const resetBtn = ref(null)
const connectBtn = ref(null)

const configStore = useConfigStore()
const localIpInputRef = ref(null) // 对应“本机IP地址”
const subnetMaskInputRef = ref(null) // 对应“子网掩码”
const gatewayInputRef = ref(null) // 对应“网关”
const serverIpInputRef = ref(null) // 对应“服务器IP地址”
const activeSegmentInputRef = ref(null) // 用于存储当前激活的SegmentInput组件实例

const audioStore = useAudioStore()
const currentInputValue = ref('')
const showKeyboard = ref(false)
const currentLayout = ref('number')
const activeField = ref('') // 当前激活的字段名
const activeElement = ref(null) // 新增：存储当前激活的输入框元素
const activeInputType = ref('') // 当前激活的输入框类型标识：'ipSegment' 或 'regular'
// 增加一个 ref 来直接存储当前激活的输入框 DOM 元素,以便在键盘弹出时重新聚焦输入框，显示光标
// const activeInputElement = ref(null);
// 表单数据
const form = reactive({
  localIp: '',
  subnetMask: '', // 默认子网掩码
  gateway: '',
  serverIp: '',
  serverPort: '',
})
//键盘位置信息
const keyboardPosition = ref({
  top: '0px',
  left: '0px',
  position: 'absolute',
})

const updateTestItemStatus = (title, newData) => {
  // 在 testItems 数组中查找标题匹配的项
  const targetItem = testItems.value.find((item) => item.title === title)

  if (!targetItem) {
    console.warn(`未找到标题为 "${title}" 的测试项`)
    return false
  }

  // 使用 Object.assign 批量更新对象的属性
  // 这相当于：targetItem.status = newData.status; targetItem.statusText = newData.statusText; ...
  Object.assign(targetItem, newData)
  return true
}

// inputType参数，默认为'regular'，表示来自常规输入框，'ipSegment'表示来自子组件的IP段输入框
const activateKeyboard = (layout, fieldName, event, inputType = 'regular', componentRef = null) => {
  if (activeField.value && inputType == 'regular') {
    // 如果直接从ip输入框点击切换到常规输入框，需要重置ip输入框的选中样式
    // 处理键盘关闭后的逻辑，取消最后一个聚焦输入框的样式
    const allInputRefs = {
      localIp: localIpInputRef,
      subnetMask: subnetMaskInputRef,
      gateway: gatewayInputRef,
      serverIp: serverIpInputRef,
    }
    allInputRefs[activeComponentId.value].value.setActiveSegment(-1)
  }
  // console.log('激活键盘，字段:', fieldName, '输入类型:', inputType, 'event:', event)
  showKeyboard.value = true
  currentLayout.value = layout
  activeField.value = fieldName
  activeInputType.value = inputType

  // 保存当前激活的子组件实例的引用
  if (inputType === 'ipSegment' && componentRef) {
    activeSegmentInputRef.value = componentRef // 存起来,来自子组件的IP段输入框
    currentInputValue.value = event.currentValue || '' // 使用子组件传来的特定输入框的值
  } else {
    currentInputValue.value = form[fieldName] // 常规输入框，直接赋值
  }
  // 保存当前激活的输入框元素。event.targetElement来自于子组件的IP段输入框，event.target来自于常规输入框
  activeElement.value = event.targetElement || event.target
  calculateKeyboardPosition(activeElement.value)

  //保存当前激活的输入框DOM元素，重新聚焦
  // 对于IP段输入框，从子组件传递的事件对象中获取；对于常规输入框，直接使用event.target
  // activeInputElement.value = event.targetElement || event.target;
  // console.log('当前激活的输入框元素:', activeInputElement.value);

  // 可选：立即尝试重新聚焦，确保键盘弹出时输入框有焦点
}

// 修改：计算键盘位置函数，增加边界检测
const calculateKeyboardPosition = (targetElement) => {
  if (!targetElement) return

  nextTick(() => {
    const rect = targetElement.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const keyboardHeight = 300 // 预估键盘高度

    // 检测是否会在视口下方超出
    let topPosition = rect.bottom + 20
    if (topPosition + keyboardHeight > viewportHeight) {
      // 如果超出，显示在输入框上方
      topPosition = rect.top - keyboardHeight - 10
    }

    keyboardPosition.value = {
      top: `${Math.max(20, topPosition)}px`, // 确保不超出视口顶部
      left: `${Math.max(10, rect.left - 14 - 200)}px`, // 确保不超出视口左侧
      position: 'fixed',
      'z-index': 1000,
      'max-width': '90vw', // 限制最大宽度
    }
  })
}

// 监听子组件键盘输入的变化，更新父组件绑定的表单字段
watch(currentInputValue, (newValue /*oldValue*/) => {
  // console.log('currentInputValue 变化了.newValue:', newValue, 'oldValue:', oldValue)
  if (activeField.value) {
    // 端口号不能超过4位数字，超过后截取前4位，不然实际上currentInputValue.value是超过的，虽然没显示
    if (activeField.value == 'serverPort' && newValue.length > 4) {
      // currentInputValue.value = newValue.slice(0, 4)
      // console.log('currentInputValue.value:', currentInputValue.value)
      // ElMessage.warning('端口号不能超过4个数字')
      return
    }
    if (activeInputType.value === 'ipSegment') {
      if (activeSegmentInputRef.value) {
        // 直接调用子组件的方法，将键盘输入值传递给它
        activeSegmentInputRef.value.updateActiveSegment(newValue)
      }
    } else {
      // 常规输入框，直接赋值
      form[activeField.value] = newValue // 更新对应的表单字段
    }
  }
})
const activeComponentId = ref('')
const handleKeyPress = (button) => {
  // 处理关闭键盘等功能键
  if (button === '{close}') {
    setTimeout(() => {
      // 防止虚拟键盘的点击意外触发背景页面（父组件）的交互,所以延迟100毫秒关闭.这样手已经离开屏幕，父组件就不会误判成点击事件
      showKeyboard.value = false
      if (activeField.value) {
        // 处理键盘关闭后的逻辑，取消最后一个聚焦输入框的样式
        const allInputRefs = {
          localIp: localIpInputRef,
          subnetMask: subnetMaskInputRef,
          gateway: gatewayInputRef,
          serverIp: serverIpInputRef,
        }
        allInputRefs[activeComponentId.value].value.setActiveSegment(-1)
      }
    }, 100)
  }
}

const formRef = ref()
const router = useRouter()

// 表单验证规则
const rules = {
  localIp: [
    { required: true, message: '请输入本机IP地址', trigger: 'blur' },
    { validator: validateIpAddress, trigger: 'blur' },
  ],
  subnetMask: [
    { required: true, message: '请输入子网掩码', trigger: 'blur' },
    { validator: validateIpAddress, trigger: 'blur' },
  ],
  gateway: [
    { required: true, message: '请输入网关地址', trigger: 'blur' },
    { validator: validateIpAddress, trigger: 'blur' },
  ],
  serverIp: [
    { required: true, message: '请输入服务器IP地址', trigger: 'blur' },
    { validator: validateIpAddress, trigger: 'blur' },
  ],
  serverPort: [
    { required: true, message: '请输入服务器端口号', trigger: 'blur' },
    { validator: validatePort, trigger: ['blur', 'change'] }, // 在失去焦点和值改变时都进行验证
  ],
}
const goBack = () => {
  router.back()
  // 也可以使用 router.go(-1)
}
// IP地址验证函数
function validateIpAddress(rule, value, callback) {
  if (!value) {
    callback(new Error('IP地址不能为空'))
    return
  }

  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (!ipRegex.test(value)) {
    callback(new Error('IP地址格式不正确'))
    return
  }

  const segments = value.split('.')
  for (let segment of segments) {
    const num = parseInt(segment, 10)
    if (isNaN(num) || num < 0 || num > 255) {
      callback(new Error('每个IP段必须在0-255之间'))
      return
    }
  }
  callback()
}
// ✅ 自定义验证函数，确保端口号为4位数字
function validatePort(rule, value, callback) {
  if (!value) {
    return callback(new Error('端口号不能为空'))
  }

  // 检查是否为字符串且长度恰好为4
  if (typeof value !== 'string' || value.length !== 4) {
    form.serverPort = value.slice(0, 4)
    callback(new Error('端口号必须包含4个数字'))
  } else {
    callback()
  }
}

// 处理SegmentInput组件的焦点事件
const handleSegmentInputFocus = async (fieldName, componentRef, focusEvent) => {
  // 添加100ms延迟,作用和函数handleKeyPress里的延迟一样，切换输入框时，等待触摸结束在关闭键盘，避免误判成点击事件
  await new Promise((resolve) => setTimeout(resolve, 100))
  //console.log(`SegmentInput聚焦: ${fieldName}`, componentRef, focusEvent)
  // 1. 从事件参数中知道是哪个组件的哪个输入框被点击了
  activeComponentId.value = focusEvent.componentId // 例如 'localIp'
  const activeIndex = focusEvent.segmentIndex // 例如 0 (第一个输入框)
  //console.log('\nactiveComponentId:', activeComponentId.value, '\nactiveIndex:', activeIndex)
  // 2. 获取所有 SegmentInput 组件的引用
  const allInputRefs = {
    localIp: localIpInputRef,
    subnetMask: subnetMaskInputRef,
    gateway: gatewayInputRef,
    serverIp: serverIpInputRef,
  }
  // 3. 遍历所有输入组件，只点亮当前被点击的那个输入框
  Object.entries(allInputRefs).forEach(([componentId, ref]) => {
    if (ref.value && ref.value.setActiveSegment) {
      if (componentId === activeComponentId.value) {
        // 如果是当前被点击的组件，就告诉它"点亮第n个输入框"
        ref.value.setActiveSegment(activeIndex)
      } else {
        // 如果是其他组件，就告诉它们"都不要点亮（-1）"
        ref.value.setActiveSegment(-1)
      }
    }
  })
  activateKeyboard('number', fieldName, focusEvent, 'ipSegment', componentRef)
}
// 保存更改
const handleSubmit = async () => {
  // 没起作用，暂时不管
  /*
  if (submitBtn.value?.$el?.blur) {
    submitBtn.value.$el.blur()
  }
  */
  if (!formRef.value) return //如果 formRef 的值为 null 或 undefined，就立即终止当前函数的执行
  try {
    try {
      await formRef.value.validate()
    } catch {
      // 表单验证失败单独处理
      console.log('表单验证失败')
      audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`)
      return
    }
    console.log('表单数据:', form)
    let payload = {
      ip: form.localIp,
      gateway: form.gateway,
      netmask: form.subnetMask,
    }
    audioStore.play('/audio/正在保存请稍后.mp3')
    button_loading.value = true
    const response = await window.electronAPI.el_post({
      action: 'set_network',
      payload: payload,
    })
    console.log('el_post调用返回的数据:', { ...response })
    if (response?.success && response?.data) {
      console.log('新网络配置已应用生效，开始写入数据库')
      // 更新数据库
      let payload_sql = {
        tableName: 'network_settings',
        setValues: {
          local_ipv4: form.localIp,
          subnet_mask: form.subnetMask,
          default_gateway: form.gateway,
          server_ip: form.serverIp,
          server_port1: form.serverPort,
        },
        condition: 'id=1',
      }
      const response_sql = await window.electronAPI.el_post({
        action: 'update',
        payload: payload_sql,
      })
      if (response_sql?.success && response_sql?.data) {
        console.log('网络配置已成功写入数据库')
        audioStore.play('/audio/保存成功请测试网络连接.mp3')
        // 刷新pinia状态
        configStore.network.local_ipv4 = form.localIp
        configStore.network.subnet_mask = form.subnetMask
        configStore.network.default_gateway = form.gateway
        configStore.network.server_ip = form.serverIp
        configStore.network.server_port1 = form.serverPort
        plugins.updateServerUrl("http://" + configStore.network.server_ip + ':' + configStore.network.server_port1)
      } else {
        console.log('网络配置修改失败，写入数据库失败')
        audioStore.play('/audio/网络配置写入数据库失败.mp3')
      }
    } else {
      audioStore.play(`/audio/网络配置应用失败.mp3`)
    }
  } catch (error) {
    console.log('catch error:', error)
    // 延迟2秒后播放音频，避免报错后覆盖正在保存的音频
    setTimeout(() => {
      audioStore.play(`/audio/保存失败.mp3`)
    }, 3000)
  } finally {
    button_loading.value = false
  }
}
// 重新测试网络连接
const network_test_again = async () => {
  network_test_loading.value = true
  testItems.value.forEach(item => {
    updateTestItemStatus(item.title, {
      status: 'warning',
      statusText: '未知',
      value: '...',
      desc: '测试中，请稍后'
    })
  })
  handleConnect()
}
// 网络连接测试
const test_time = ref('')
const handleConnect = async () => {
  try {
    console.log('开始测试网络连接')
    try {
      await formRef.value.validate()
    } catch {
      // 表单验证失败的报错单独处理，和其他报错区别开
      console.log('表单验证失败')
      audioStore.play(`/audio/请先正确填写网络配置.mp3`)
      return
    }
    // 先检查是否修改了配置并且没有保存，如果是，需要提醒用户先保存修改的配置再测试网络连接
    // 检查的逻辑就是用form值匹配pinia值，如果不一样说明修改了配置但没保存。如果一样说明没有修改，或者修改了并且保存了。
    if (
      !(
        configStore.network.local_ipv4 === form.localIp &&
        configStore.network.subnet_mask === form.subnetMask &&
        configStore.network.default_gateway === form.gateway &&
        configStore.network.server_ip === form.serverIp &&
        configStore.network.server_port1?.toString() === form.serverPort?.toString()
      )
    ) {
      audioStore.play(`/audio/配置已发生更改请先点击保存.mp3`)
      return
    }
    audioStore.play(`/audio/测试网络连接请稍后.mp3`)
    test_dialogTableVisible.value = true
    network_test_loading.value = true
    /**
     * 设置静态IP和服务器配置
     * @param {Object} config - 网络配置对象
     * @param {string} config.ip - 本机IP地址
     * @param {string} config.netmask - 子网掩码
     * @param {string} config.gateway - 网关地址
     * @param {string} config.dns - DNS服务器地址
     * @param {string} config.server_ip - 服务器IP地址
     * @param {string} config.server_port1 - 服务器端口号1
     */
    let payload = {
      ip: form.localIp,
      netmask: form.subnetMask,
      gateway: form.gateway,
      server_ip: form.serverIp,
      server_port1: form.serverPort,
    }
    const response = await window.electronAPI.el_post({
      action: 'test_network',
      payload: payload,
    })
    console.log('el_post调用返回的数据:', { ...response })
    if (response?.success && response?.data) {
      console.log('网络连接测试成功1')
      test_time.value = plugins.getFormattedTime()
      const { cableStatus, gatewayStatus, serverStatus } = response.data.details
      if (cableStatus[0].connected === true) {
        // 更新“网卡状态”项
        updateTestItemStatus('网卡状态', {
          status: 'success',
          statusText: '正常',
          value: form.localIp,
          desc: '连接状态：正常' + '\n' + '接口名称：' + cableStatus[0].interface,
        })
      } else {
        updateTestItemStatus('网卡状态', {
          status: 'error',
          statusText: '异常',
          value: form.localIp,
          desc: '连接状态：异常\n请优先检查网线是否连接正常',
        })
      }
      if (serverStatus.server === true) {
        if (serverStatus.port === true) {
          updateTestItemStatus('服务器端口', {
            status: 'success',
            statusText: '正常',
            value: form.serverIp,
            desc: '服务器连接状态：正常' + '\n' + '端口连接状态：正常',
          })
        } else {
          updateTestItemStatus('服务器端口', {
            status: 'warning',
            statusText: '端口异常',
            value: form.serverIp,
            desc: '服务器连接状态：正常' + '\n' + '端口连接状态：异常',
          })
        }
      } else {
        updateTestItemStatus('服务器端口', {
          status: 'error',
          statusText: '异常',
          value: form.serverIp,
          desc: '连接状态：异常',
        })
      }
      if (gatewayStatus.reachable === true) {
        // 更新“网关连通”项
        updateTestItemStatus('网关连通', {
          status: 'success',
          statusText: '正常',
          value: form.gateway,
          desc: '连接状态：已连接\n最大延时：' + gatewayStatus.maxRtt.toFixed(0) + 'ms',
        })

        updateTestItemStatus('延时稳定性', {
          status: gatewayStatus.mdev < 30 ? 'success' : 'warning',
          statusText:
            gatewayStatus.mdev < 10
              ? '优秀'
              : gatewayStatus.mdev < 30
                ? '良好'
                : gatewayStatus.mdev < 50
                  ? '一般'
                  : '较差',
          value: gatewayStatus.mdev.toFixed(0) + 'ms',
          desc:
            gatewayStatus.mdev < 10
              ? '网络稳定性高'
              : gatewayStatus.mdev < 30
                ? '网络比较稳定'
                : gatewayStatus.mdev < 50
                  ? '网络有轻微抖动'
                  : '网络稳定性较差',
        })
        updateTestItemStatus('平均延时', {
          status: gatewayStatus.avgRtt < 100 ? 'success' : 'warning',
          statusText:
            gatewayStatus.avgRtt < 30
              ? '优秀'
              : gatewayStatus.avgRtt < 100
                ? '良好'
                : gatewayStatus.avgRtt < 200
                  ? '一般'
                  : '较差',
          value: gatewayStatus.avgRtt.toFixed(0) + 'ms',
          desc:
            gatewayStatus.avgRtt < 30
              ? '网络延迟低'
              : gatewayStatus.avgRtt < 100
                ? '网络延迟较低'
                : gatewayStatus.avgRtt < 200
                  ? '网络延迟明显'
                  : '网络延迟较高',
        })
        updateTestItemStatus('丢包率', {
          status: gatewayStatus.packetLoss < 60 ? 'success' : 'warning',
          statusText:
            gatewayStatus.packetLoss < 60
              ? '优秀'
              : '较差',
          value: gatewayStatus.packetLoss.toFixed(0) + '%',
          desc:
            gatewayStatus.packetLoss < 60
              ? '网络可靠性高'
              : '网络可靠性较高，视频通话可能会受到轻微影响'
        })
      } else {
        updateTestItemStatus('网关连通', {
          status: 'error',
          statusText: '异常',
          value: form.gateway,
          desc: '连接状态：异常',
        })
        updateTestItemStatus('延时稳定性', {
          status: 'error',
          statusText: '异常',
          value: '--',
          desc: '状态异常',
        })
        updateTestItemStatus('平均延时', {
          status: 'error',
          statusText: '异常',
          value: '--',
          desc: '状态异常',
        })
        updateTestItemStatus('丢包率', {
          status: 'error',
          statusText: '异常',
          value: '--',
          desc: '状态异常',
        })
      }
      // test_dialogTableVisible.value = false
      network_test_loading.value = false
      audioStore.play(`/audio/网络测试完成.mp3`)
      return
    } else {
      console.log('网络连接测试失败1')
      audioStore.play(`/audio/网络测试完成.mp3`)
      network_test_loading.value = false
      return
    }
  } catch (error) {
    console.log('网络连接测试失败2:', error)
    audioStore.play(`/audio/网络测试完成.mp3`)
    network_test_loading.value = false
  }
}
// 重置表单
const handleReset = () => {
  //保存更改的时候禁止重置
  if (button_loading.value == true) {
    return
  }
  audioStore.play(`/audio/全部重置.mp3`)
  formRef.value?.resetFields()
  // 重置后恢复默认子网掩码
  form.subnetMask = '255.255.255.0'
  form.serverPort = '8080'
}
/*
const updateKeyboardPosition = () => {
  if (activeElement.value && showKeyboard.value) {
    calculateKeyboardPosition(activeElement.value)
  }
}

// 监听窗口滚动和大小变化，重新计算位置，其实也不需要，
window.addEventListener('scroll', updateKeyboardPosition)
window.addEventListener('resize', updateKeyboardPosition)

// 组件卸载时移除事件监听，也可以去掉
onUnmounted(() => {
  window.removeEventListener('scroll', updateKeyboardPosition)
  window.removeEventListener('resize', updateKeyboardPosition)
})
*/
// 🔧 新增：初始化网络配置函数
const initializeNetworkConfig = () => {
  console.log('开始初始化网络配置...')

  // 从 configStore.network 中获取网络配置
  const networkConfig = { ...configStore.network }
  console.log('从store获取的网络配置:', networkConfig)

  // 初始化表单数据
  form.localIp = networkConfig.local_ipv4 || ''
  form.subnetMask = networkConfig.subnet_mask || '255.255.255.0'
  form.gateway = networkConfig.default_gateway || ''
  form.serverIp = networkConfig.server_ip || ''

  // 初始化服务器端口号（使用第一个端口）
  form.serverPort = networkConfig.server_port1?.toString() || '8080'

  console.log('初始化后的表单数据:', form)
}
const quit_test = () => {
  testItems.value.forEach(item => {
    updateTestItemStatus(item.title, {
      status: 'warning',
      statusText: '未知',
      value: '...',
      desc: '测试中，请稍后'
    })
    network_test_loading.value = false
    test_dialogTableVisible.value = false
  })
}
onMounted(async () => {
  console.log('network:', { ...configStore.network })
  initializeNetworkConfig() // 调用初始化函数
})
</script>

<style scoped>
.network-config-form {
  padding-top: 1rem;
  display: flex;
  justify-content: center;
}

.keyboard-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 10px;
}

/*deep使得子组件的样式生效 */
:deep(.num-keyboard) {
  /*键盘组件包裹在form里，所以width: 100%;表示宽度为form的宽度 */
  width: 7rem;
  font-size: 0.25rem;
  background-color: #f0f0f0;
}

/*弹窗样式*/

.test-content {
  padding: 25px 30px;
}

.test-item {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 14px;
  padding: 22px;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.15);
  height: 100%;
  margin-bottom: 20px;
  padding-bottom: 0;
}

.test-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-title {
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.28rem;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.item-status {
  display: flex;
  align-items: center;
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

.status-text {
  color: white;
  font-size: 14px;
  font-weight: 500;
}

.item-value {
  color: white;
  font-size: 0.35rem;
  font-weight: 600;
  padding: 0.2rem 0;
  min-height: 0.9rem;
}

.item-desc {
  color: #fff;
  font-size: 0.24rem;
  line-height: 1.5;
  white-space: pre-line;
  letter-spacing: 0;
  min-height: 0.8rem;
}

.test-time {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.25rem;
  font-family: monospace;
}

.pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.6;
  }

  100% {
    opacity: 1;
  }
}

.el-row {
  margin: 0 !important;
}

.el-col {
  padding: 10px !important;
}

@media (max-width: 768px) {
  .test-header {
    padding: 20px;
  }

  .test-content {
    padding: 20px;
  }

  .test-item {
    padding: 18px;
    margin-bottom: 15px;
  }

  .test-footer {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
}
:deep(.el-form-item__error) {
  font-size: 0.23rem;
  /* 调整为你需要的字体大小 */
}
</style>
