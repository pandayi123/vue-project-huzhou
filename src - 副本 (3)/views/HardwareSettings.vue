<template>
  <div class="hardware-settings-container" v-loading="el_loading" element-loading-text="正在获取硬件地址...请稍后"
    element-loading-background="rgba(122, 122, 122, 0.8)" element-loading-custom-class="my-custom-loading">
    <el-row :gutter="30">
      <el-col :span="12">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">门锁设置</span>
              <el-icon class="card-icon">
                <Lock />
              </el-icon>
            </div>
          </template>

          <div class="settings-content">
            <el-form :model="form_lock" :rules="rules" ref="lockForm" label-position="right" label-width="2.5rem">
              <el-form-item label="扩展板地址：" label-width="2.1rem">
                <div class="address-container">
                  <template v-if="form_lock.expansion_board_addresses.length">
                    <div v-for="addr in form_lock.expansion_board_addresses" :key="addr" class="address-item">
                      <span class="address-value">{{ addr }}</span>
                    </div>
                  </template>

                  <div v-else class="address-item">
                    <span class="address-value">未发现扩展板</span>
                  </div>
                </div>
              </el-form-item>

              <div class="address-settings address-settings-compact">
                <el-form-item label="门锁初始地址：" prop="initialAddress">
                  <el-input-number v-model="form_lock.initialAddress" :min="0" :max="9999" style="width: 3rem"
                    @focus="openKeyboard('number', 'initialAddress', 'form_lock', $event)" />
                  <div class="form-tip">范围：1-9999</div>
                </el-form-item>
              </div>

              <div class="address-settings address-settings-compact">
                <el-form-item label="门锁个数：" prop="quantity">
                  <el-input-number v-model="form_lock.quantity" :min="0" :max="2" style="width: 3rem"
                    @focus="openKeyboard('number', 'quantity', 'form_lock', $event)" />
                  <div class="form-tip">范围：1-2，请填写实际数量</div>
                </el-form-item>
              </div>
            </el-form>

            <div class="action-buttons">
              <el-button size="large" :loading="isApplyingLock" @click="applySettings('lock')">
                {{ isApplyingLock ? '应用中...' : '应用新地址' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="settings-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">微动开关设置</span>
              <el-icon class="card-icon">
                <Setting />
              </el-icon>
            </div>
          </template>

          <div class="settings-content">
            <el-form :model="form_switch" :rules="form_switch_rules" label-position="right" label-width="2.5rem"
              ref="switchForm">
              <el-form-item label="扩展板地址：">
                <div class="address-container">
                  <template v-if="form_switch.expansion_board_addresses.length">
                    <div v-for="addr1 in form_switch.expansion_board_addresses" :key="addr1" class="address-item">
                      <span class="address-value">{{ addr1 }}</span>
                    </div>
                  </template>
                  <div v-else class="address-item">
                    <span class="address-value">未发现扩展板</span>
                  </div>
                </div>
              </el-form-item>

              <div class="address-settings address-settings-compact">
                <el-form-item label="开关初始地址：" prop="initialAddress">
                  <el-input-number v-model="form_switch.initialAddress" :min="0" :max="9999" style="width: 3rem"
                    @focus="openKeyboard('number', 'initialAddress', 'form_switch', $event)" />
                  <div class="form-tip">范围：1-9999</div>
                </el-form-item>
              </div>

              <div class="address-settings address-settings-compact">
                <el-form-item label="开关个数：" prop="quantity">
                  <el-input-number v-model="form_switch.quantity" :min="0" :max="300" style="width: 3rem"
                    @focus="openKeyboard('number', 'quantity', 'form_switch', $event)" />
                  <div class="form-tip">范围：1-300，请填写实际数量</div>
                </el-form-item>
              </div>
            </el-form>

            <div class="action-buttons">
              <el-button size="large" :loading="swith_is_applying" @click="applySettings('switch')"
                class="start-button">
                {{ swith_is_applying ? '应用中...' : '应用新地址' }}
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="button-container" style="margin-top: 0.5rem">
      <div class="button1" @click="goBack">退出返回</div>
    </div>
  </div>
  <div>
    <!-- 虚拟键盘容器 - 移动到表单内部以动态定位 -->
    <div v-if="showKeyboard" class="keyboard-container" :style="keyboardPosition">
      <SimpleKeyboard v-model="currentInputValue" :defaultLayout="currentLayout" @onKeyPress="handleKeyPress"
        @onClose.stop="showKeyboard = false" keyboardClass="num-keyboard" />
    </div>
  </div>
  <!-- 等待程序运行对话框 -->
  <el-dialog v-model="isApplying" :show-close="false" :close-on-click-modal="false" :close-on-press-escape="false"
    width="480px" custom-class="waiting-dialog" :modal="true" center>
    <div class="dialog-content">
      <!-- 加载指示器 -->
      <div class="loading-indicator">
        <div class="spinner"></div>
        <div class="pulse-effect"></div>
      </div>

      <!-- 主要内容 -->
      <div class="main-content">
        <h3 class="dialog-title">正在设置地址...</h3>
        <p class="setting-tip">设置完成前，请勿关闭页面或进行其他操作。</p>
        <div class="progress-indicator">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <span class="progress-text">处理中...</span>
        </div>
      </div>

      <div v-show="isApplyingLock" style="margin-bottom: 10px">
        <el-button @click="opendoor(10)" type="primary" size="large" class="opendoor-btn">开柜门(R10)</el-button>
        <el-button @click="opendoor(13)" type="primary" size="large" class="opendoor-btn"
          style="margin-left: 20px">开柜门(R13)</el-button>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button type="danger" size="large" class="exit-btn" @click="stop_settings()" :disabled="false">
          <span class="btn-text">中断设置</span>
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import {
  ref,
  reactive,
  nextTick,
  watch,
  toRaw,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
} from 'vue'
import { useRouter } from 'vue-router'
import { Lock, Setting } from '@element-plus/icons-vue'
import { useAudioStore } from '@/stores/audioStore'
import { useConfigStore } from '@/stores/configStore'
import { useTimerStore } from '@/stores/timerStore'
const timerStore = useTimerStore()
const configStore = useConfigStore()
const audioStore = useAudioStore()
const SimpleKeyboard = defineAsyncComponent(() => import('@/components/SimpleKeyboard.vue'))

const isApplying = ref(false)
const currentInputValue = ref('')
const showKeyboard = ref(false)
const currentLayout = ref('number')
const activateForm = ref('') // 当前激活的表单
const activeField = ref('') // 当前激活的字段名
const form_lock = reactive({
  expansion_board_addresses: [], //扩展板地址列表
  initialAddress: 1, // 门锁初始地址
  quantity: 1, // 门锁数量
  details: [
    {
      expansion_board_address: 0, // 所属扩展板地址
      channel_address: 0, // 开关通道地址(寄存器地址：0到10)
      self_address: 1, // 自定义地址，用于前端显示
      hardware_status: 0, // 硬件状态: "0"(断开)/"1"(导通)
      admin_status: 1, // 管理状态: "0"(禁用)/"1"(启用)，处于禁用状态时，装备出入库不受影响，但无法使用微动开关
      item_placed: false, // 是否放置物品 (true/false)
      faulty: false, // 是否硬件故障 (true/false)
    },
  ], // 门锁详情列表
})
// 微动开关表单
const form_switch = reactive({
  expansion_board_addresses: [], //扩展板地址列表
  initialAddress: 1, // 微动开关初始地址
  quantity: 0, // 微动开关数量
  details: [
    {
      expansion_board_address: 0, // 所属扩展板地址
      channel_address: 0, // 微动开关通道地址（寄存器地址）
      self_address: 1, // 自定义地址，用于前端显示
      hardware_status: 0, // 硬件状态: "0"(断开)/"1"(导通)
      admin_status: 1, // 管理状态: "0"(禁用)/"1"(启用)
      item_placed: false, // 是否放置物品 (true/false)
      faulty: false, // 是否硬件故障 (true/false)
    },
  ], // 微动开关列表详情
})
const form_switch_rules_validator = (rule, value, callback) => {
  if (value === null || value === undefined) {
    callback(new Error('请输入微动开关配置'))
  } else if (value === 0) {
    // 根据规则字段名判断是初始地址还是数量
    if (rule.field === 'initialAddress') {
      callback(new Error('初始地址不能为0'))
    } else if (rule.field === 'quantity') {
      callback(new Error('数量不能为0'))
    } else {
      callback(new Error('初始地址和数量不能为0'))
    }
  } else {
    callback()
  }
}
const form_switch_rules = {
  initialAddress: [
    { required: true, validator: form_switch_rules_validator, trigger: ['blur', 'change'] },
  ],
  quantity: [
    { required: true, validator: form_switch_rules_validator, trigger: ['blur', 'change'] },
  ],
}
// 新增：键盘位置信息
const keyboardPosition = ref({
  top: '0px',
  left: '0px',
  position: 'absolute',
})
const validateMainLockAddress = (rule, value, callback) => {
  // 校验一定要保证所有路径都有返回，否则调用函数无法catch到callback(new Error())
  if (value === null || value === undefined) {
    callback(new Error('请输入门锁配置'))
  } else if (value === 0) {
    // 根据规则字段名判断是初始地址还是数量
    if (rule.field === 'initialAddress') {
      callback(new Error('初始地址不能为0'))
    } else if (rule.field === 'quantity') {
      callback(new Error('数量不能为0'))
    } else {
      callback(new Error('初始地址和数量不能为0'))
    }
  } else {
    callback()
  }
}
const rules = {
  initialAddress: [
    { required: true, validator: validateMainLockAddress, trigger: ['blur', 'change'] },
  ],
  quantity: [{ required: true, validator: validateMainLockAddress, trigger: ['blur', 'change'] }],
}
const el_loading = ref(true)
const handleKeyPress = (button) => {
  // 处理关闭键盘等功能键
  if (button === '{close}') {
    setTimeout(() => {
      // 防止虚拟键盘的点击意外触发背景页面（父组件）的交互,所以延迟100毫秒关闭.这样手已经离开屏幕，父组件就不会误判成点击事件
      showKeyboard.value = false
    }, 200)
  }
}
// 监听子组件键盘输入的变化，更新父组件绑定的表单字段
watch(currentInputValue, (newValue /*oldValue*/) => {
  // console.log('currentInputValue 变化了.newValue:', newValue, 'oldValue:', oldValue)
  console.log('activeField.value:', activeField.value)
  if (activeField.value) {
    if (activateForm.value === 'form_lock') {
      // 将字符串转换为数字，如果为空则设为 null
      form_lock[activeField.value] = newValue ? Number(newValue) : 0
      console.log('form_lock[activeField.value]', form_lock[activeField.value])
    } else if (activateForm.value === 'form_switch') {
      // 将字符串转换为数字，如果为空则设为 null
      form_switch[activeField.value] = newValue ? Number(newValue) : 0
    }
  }
})
//打开虚拟键盘
const openKeyboard = (layout, fieldName, activateForm1, event) => {
  // console.log('openKeyboard:', event.targetElement)
  activeField.value = fieldName
  activateForm.value = activateForm1
  showKeyboard.value = true
  if (activateForm.value === 'form_lock') {
    currentInputValue.value = form_lock[fieldName]
    console.log('form_lock[fieldName]', form_lock[fieldName])
  } else if (activateForm.value === 'form_switch') {
    currentInputValue.value = form_switch[fieldName]
    console.log('form_switch[fieldName]', form_switch[fieldName])
  }

  // 设置数字键盘布局
  currentLayout.value = layout

  // 计算键盘位置（居中显示）
  // 保存当前激活的输入框元素。event.targetElement来自于子组件的IP段输入框，event.target来自于常规输入框
  calculateKeyboardPosition(event.targetElement || event.target)
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
      left: `${Math.max(10, rect.left - 180)}px`, // 确保不超出视口左侧
      position: 'fixed',
      'z-index': 1000,
      'max-width': '90vw', // 限制最大宽度
    }
  })
}

const swith_is_applying = ref(false)
const isApplyingLock = ref(false)

const router = useRouter()
const lockForm = ref(null)
const switchForm = ref(null)
const setting_flag = ref(false) //设置标志位,
const applySettings = async (type) => {
  // 获取表单引用
  console.log(type)
  let formRef
  switch (type) {
    case 'lock':
      formRef = lockForm.value
      break
    case 'switch':
      formRef = switchForm.value
      break
    default:
      console.error(`Unknown form type: ${type}`)
      return
  }
  // 先进行表单验证
  try {
    await formRef.validate()
  } catch (error) {
    console.log('表单验证失败:', error)
    audioStore.play(`/audio/校验失败请参考红色文字提示.mp3`)
    return
  }
  switch (type) {
    case 'lock':
      isApplyingLock.value = true
      await apply_lock_settings(form_lock)
      break
    case 'switch':
      swith_is_applying.value = true
      await apply_switch_settings()
      break
    default:
      console.error(`Unknown type: ${type}`)
      return
  }
  try {
    // 模拟异步操作
    // await new Promise((resolve) => setTimeout(resolve, 1500))
    // TODO: 实际的应用设置逻辑
  } catch (error) {
    console.error('Error applying settings:', error)
  } finally {
    // 无论成功失败都关闭加载状态
    isApplyingLock.value = false
    swith_is_applying.value = false
  }
}
const apply_switch_settings = async () => {
  setting_flag.value = true
  if (form_switch.expansion_board_addresses.length === 0) {
    audioStore.play(`/audio/未检测到硬件连接.mp3`)
    return
  }
  let max_quantity = form_switch.expansion_board_addresses.length * 10
  if (form_switch.quantity > max_quantity) {
    audioStore.play(`/audio/开关数量超过硬件上限.mp3`)
    return
  }
  // 设置微动开关前，确认所有开关处于断开状态，否则语音播报退出
  try {
    let allDisconnected = true // 默认所有开关都断开
    for (const address of form_switch.expansion_board_addresses) {
      /* 参数格式，解构传参：
        {
        deviceAddress, // 设备地址
        startAddress = 0x0000, // 起始地址
        registerCount = 10, // 寄存器数量
        }
        这种调整方式有以下优势：
        参数顺序无关：调用者不需要记住参数的顺序
        可读性更好：参数名明确表达了每个值的用途
        可选参数更灵活：可以只传递需要的参数，其他使用默认值
        扩展性更强：未来添加新参数不会破坏现有调用代码
        自文档化：参数名本身就是一种文档
        这种模式在JavaScript中非常常见，特别是在配置对象或选项对象的场景中。
        许多现代JavaScript库和框架都采用这种模式来处理多个参数的函数。
      */
      const result = await window.electronAPI.el_post({
        action: 'read_all_inputs',
        payload: { deviceAddress: address, startAddress: 0x0001, registerCount: 10 },
      })
      console.log('el_post调用返回的读取开关状态数据:', result)
      if (result?.success && result.data?.length) {
        // 检查返回的数据中是否有任何开关处于闭合状态（值不为0）
        for (const switchState of result.data) {
          if (switchState !== 0) {
            console.log('开关状态不为0，退出.address:', address)
            allDisconnected = false
            break
          }
        }
        if (!allDisconnected) {
          break
        }
      }
    }
    if (!allDisconnected) {
      audioStore.play(`/audio/请先确认所有开关处于断开状态.mp3`)
      return
    }
    isApplying.value = true
    await audioStore.play(`/audio/开始设置微动开关.mp3`)
    // 设置开关时，找到第一个状态为1的开关，并返回它的地址和下标。
    // 清空details数组，然后根据初始地址和数量，从扩展板地址数组中读取开关状态，并将结果存储在details数组中。
    let temp_details = []
    // 定义用于检测重复的辅助函数
    const isSwitchExists = (address, channel) => {
      return temp_details.some(
        (item) => item.expansion_board_address === address && item.channel_address === channel,
      )
    }

    // 添加超时配置
    const TIMEOUT_DURATION = 60000 // 60秒超时

    for (
      let i = form_switch.initialAddress;
      setting_flag.value && i < form_switch.initialAddress + form_switch.quantity;
      i++
    ) {
      console.log('正在等待设置开关地址:', i)
      let switchSet = false // 标记当前i的开关是否已设置
      let startTime = Date.now() // 记录开始时间

      // 阶段1：等待开关被按下（等待从0变为非0）
      while (!switchSet && setting_flag.value) {
        // 检查是否超时
        if (Date.now() - startTime > TIMEOUT_DURATION) {
          console.log(`设置开关 ${i} 超时，跳过`)
          audioStore.play(`/audio/设置超时.mp3`)
          break // 跳出while循环，继续下一个开关
        }

        let switchPressed = false
        let detectedAddress = null
        let detectedChannel = null
        let detectedState = null

        // 扫描所有扩展板，寻找状态变化的开关
        for (const address of form_switch.expansion_board_addresses) {
          const result = await window.electronAPI.el_post({
            action: 'read_all_inputs',
            payload: { deviceAddress: address, startAddress: 0x0001, registerCount: 10 },
          })

          if (result?.success && result.data?.length) {
            for (const [index, switchState] of result.data.entries()) {
              // 关键变化：只关注从“未设置”到“被按下”的开关
              if (switchState !== 0) {
                console.log(`检测到开关被按下！地址: ${address}, 通道: ${index}`)
                switchPressed = true
                detectedAddress = address
                detectedChannel = index
                detectedState = switchState
                break
              }
            }
            if (switchPressed) break
          }
        }

        if (switchPressed) {
          // 阶段2：开关被按下，这里可以添加一个短暂的确认延迟，防抖
          await new Promise((resolve) => setTimeout(resolve, 1000)) // 300ms防抖
          // 再次读取确认开关是否仍处于按下状态
          const confirmResult = await window.electronAPI.el_post({
            action: 'read_all_inputs',
            payload: { deviceAddress: detectedAddress, startAddress: 0x0001, registerCount: 10 },
          })
          if (confirmResult?.success && confirmResult.data[detectedChannel] !== 0) {
            // 检查是否已存在相同地址的开关
            if (isSwitchExists(detectedAddress, detectedChannel + 1)) {
              await audioStore.play(`/audio/开关重复设置.mp3`)
              continue // 跳过当前循环，继续下一个i
            }
            // 确认按下，记录这个开关
            let switch_one = {
              expansion_board_address: detectedAddress,
              channel_address: detectedChannel + 1,
              self_address: i, // 自定义地址，用于前端显示
              hardware_status: detectedState,
              admin_status: 1,
              item_placed: false,
              faulty: false,
            }
            temp_details.push(switch_one)
            switchSet = true // 标记当前i的开关已设置成功
            console.log(
              `开关 ${i} 设置完成。对应硬件地址: ${detectedAddress}, 通道: ${detectedChannel}`,
            )
            // 播放成功提示音
            await audioStore.play(`/audio/设置成功.mp3`)
          }
        } else {
          // 如果没有检测到开关被按下，等待一段时间再扫描，避免CPU占满
          await new Promise((resolve) => setTimeout(resolve, 500)) // 每500ms检查一次
        }
      } // end of while (!switchSet)
    } // end of for loop
    // 用户点击了中断设置按钮，结束上面的循环并且立即返回
    if (!setting_flag.value) {
      return
    }
    console.log('所有开关设置完成:', toRaw(temp_details))
    form_switch.details = temp_details
    Object.assign(config_blob.value.switch, form_switch)
    //更新stores的terminal的config_blob字段：
    configStore.terminal.config_blob = JSON.stringify(config_blob.value)
    // 更新数据库
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
    await audioStore.play(`/audio/微动开关设置完成.mp3`)
    isApplying.value = false
  } catch (error) {
    console.error('读取开关状态失败:', error)
  }
}
const apply_lock_settings = async (formData, type = 'lock') => {
  setting_flag.value = true
  // 寄存器和地址参数
  const startAddress = 0x0006
  const registerCount = 2
  const TIMEOUT_DURATION = 60000 // 60秒超时
  if (formData.expansion_board_addresses.length === 0) {
    audioStore.play(`/audio/未检测到硬件连接.mp3`)
    return
  }
  // 设置微动开关前，确认所有开关处于断开状态，否则语音播报退出
  try {
    let allDisconnected = true // 默认所有开关都断开
    for (const address of formData.expansion_board_addresses) {
      const result = await window.electronAPI.el_post({
        action: 'read_all_inputs',
        /*门控板输入寄存器2到7，共6个，其中2是市电，6是关到位，7是开到位*/
        payload: {
          deviceAddress: address,
          startAddress: startAddress,
          registerCount: registerCount,
        },
      })
      console.log('el_post调用返回的读取开关状态数据:', result)
      if (result?.success && result.data?.length) {
        // 检查返回的数据中是否有任何门锁处于打开状态（值不为1）
        // 一体柜，只有1个门锁
        if (formData.quantity == 1) {
          if (result.data[0] !== 1) {
            console.log('门锁状态不为1，退出.address:', address)
            allDisconnected = false
          }
        }
        //上下柜，有2个门锁
        if (formData.quantity == 2) {
          for (const switchState of result.data) {
            if (switchState !== 1) {
              console.log('门锁状态不为1，退出.address:', address)
              allDisconnected = false
              break
            }
          }
        }

        if (!allDisconnected) {
          break
        }
      }
    }
    if (!allDisconnected) {
      audioStore.play(`/audio/请先确认所有柜门处于关闭状态.mp3`)
      return
    }
    isApplying.value = true
    await audioStore.play(`/audio/开始设置门锁地址.mp3`)
    let temp_details = []
    // 定义一个检查重复的辅助函数
    const isSwitchExists = (address, channel) => {
      return temp_details.some(
        (item) => item.expansion_board_address === address && item.channel_address === channel,
      )
    }

    for (
      let i = formData.initialAddress;
      setting_flag.value && i < Number(formData.initialAddress) + Number(formData.quantity);
      i++
    ) {
      console.log('正在等待设置开关地址:', i)
      let switchSet = false
      let startTime = Date.now()

      while (!switchSet && setting_flag.value) {
        if (Date.now() - startTime > TIMEOUT_DURATION) {
          console.log(`设置开关 ${i} 超时，跳过`)
          audioStore.play(`/audio/设置超时.mp3`)
          break
        }

        let switchPressed = false
        let detectedAddress = null
        let detectedChannel = null
        let detectedState = null

        for (const address of formData.expansion_board_addresses) {
          const result = await window.electronAPI.el_post({
            action: 'read_all_inputs',
            payload: {
              deviceAddress: address,
              startAddress: startAddress,
              registerCount: registerCount,
            },
          })

          if (result?.success && result.data?.length) {
            for (const [index, switchState] of result.data.entries()) {
              if (switchState !== 1) {
                console.log(`检测到门锁被打开！地址: ${address}, 通道: ${index}`)
                switchPressed = true
                detectedAddress = address
                detectedChannel = index
                detectedState = switchState
                break
              }
            }
            if (switchPressed) break
          }
        }

        if (switchPressed) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
          const confirmResult = await window.electronAPI.el_post({
            action: 'read_all_inputs',
            payload: {
              deviceAddress: detectedAddress,
              startAddress: startAddress,
              registerCount: registerCount,
            },
          })
          if (confirmResult?.success && confirmResult.data[detectedChannel] !== 1) {
            if (isSwitchExists(detectedAddress, detectedChannel + 1)) {
              await audioStore.play(`/audio/开关重复设置.mp3`)
              continue
            }
            let switch_one = {
              expansion_board_address: detectedAddress,
              channel_address: detectedChannel + 1,
              open_lock_register_address: open_lock_register_address.value, // 开锁寄存器地址
              self_address: i,
              hardware_status: detectedState,
              admin_status: 1,
              item_placed: false,
              faulty: false,
            }
            temp_details.push(switch_one)
            switchSet = true
            console.log(
              `开关 ${i} 设置完成。对应硬件地址: ${detectedAddress}, 通道: ${detectedChannel}`,
            )
            await audioStore.play(`/audio/设置成功.mp3`)
          }
        } else {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
    }
    // 用户点击了中断设置按钮，结束上面的循环并且立即返回
    if (!setting_flag.value) {
      return
    }
    console.log('所有开关设置完成:', toRaw(temp_details))
    formData.details = temp_details
    /////////////////注意参数config_blob.value[type]里type的变更////////////*/
    Object.assign(config_blob.value[type], formData)
    configStore.terminal.config_blob = JSON.stringify(config_blob.value)
    // 更新timerStore.doorLockCount的值
    timerStore.doorLockCount = formData.quantity
    console.log('更新timerStore.doorLockCount的值:', timerStore.doorLockCount)
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
    await audioStore.play(`/audio/门锁地址设置完成.mp3`)
    isApplying.value = false
  } catch (error) {
    console.error('读取开关状态失败:', error)
  }
}

const stop_settings = () => {
  isApplying.value = false
  isApplyingLock.value = false
  swith_is_applying.value = false
  setting_flag.value = false
  audioStore.play(`/audio/设置已中断.mp3`)
}
const goBack = () => {
  router.go(-1)
}
const config_blob = ref(null) // 存储config_blob字段数据，用于blob字段整体读取-修改-写入
const fetchConfigData = async () => {
  try {
    // blob字段是序列化的字符串，需要转换为对象
    config_blob.value = JSON.parse(configStore.terminal.config_blob)
    // 先将数据库的值赋值给表单，后面会根据扩展板地址在线数据刷新表单值,数据库值，stores值。
    // 这样处理有一个问题，就是进入页面后，会显示旧的值，然后需要等待一段时间后再刷新。
    Object.assign(form_switch, config_blob.value.switch)
    Object.assign(form_lock, config_blob.value.lock)
    console.log('form_switch:', toRaw(form_switch)) // 打印表单数据
    console.log('form_lock:', toRaw(form_lock)) // 打印表单数据
    const response = await window.electronAPI.el_post({
      action: 'check_485_device_online',
      payload: {},
    })
    console.log('el_post调用返回的检测485扩展板在线数据:', response)
    /*response.data数据格式（485扩展板地址）：
       [
          { currentAddr: 1, protocol: 'modbus', response: '01030200d17818' },
          { currentAddr: 220, protocol: 'modbus', response: 'dc030200019597' }
        ]
    */
    if (response?.success && response.data?.length) {
      // audioStore.play(`/audio/扩展板地址已是最新.mp3`)
      // 更新表单数据
      form_switch.expansion_board_addresses = response.data
        .map((element) => Number(element.currentAddr))
        .filter((addr) => addr <= 7)
      form_lock.expansion_board_addresses = response.data
        .map((element) => Number(element.currentAddr))
        .filter((addr) => [201, 202].includes(addr))

      // 更新数据库terminal的config_blob字段：
      // 1.先修改config_blob.value.switch.expansion_board_addresses字段；
      // 2.将config_blob.value转换为JSON字符串，整体写入数据库terminal的config_blob字段
      config_blob.value.switch.expansion_board_addresses = form_switch.expansion_board_addresses
      config_blob.value.lock.expansion_board_addresses = form_lock.expansion_board_addresses
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
      //更新stores的terminal的config_blob字段：
      configStore.terminal.config_blob = JSON.stringify(config_blob.value)
    }
    return
  } catch (error) {
    console.error('[hardwareSettings]初始化获取数据失败:', error)
    return
  }
}
const open_lock_register_address = ref(10)
const opendoor = async (address) => {
  open_lock_register_address.value = address
  await window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201,
      registerAddress: address,
      value: 20,
      isWrite: true,
    },
  })
}
onMounted(async () => {
  // 停止定时器（仅在已启动时），app.vue的频繁轮询会导致读地址不准确
  console.log('onMounted,timerStore.isTimerActive:', timerStore.isTimerActive)
  if (timerStore.isTimerActive) {
    console.log('暂停定时器')
    timerStore.stopInterval()
  }
  await fetchConfigData()
  audioStore.play(`/audio/硬件地址已更新.mp3`)
  el_loading.value = false
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

.hardware-settings-container {
  padding: 30px;
  color: #fff;
  background-size: cover;
  background-position: center;
  height: 100%;
}

.settings-card {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  margin-bottom: 30px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.18);
  background-image: url(/src/assets/images/deskview4.png);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 7rem;
  display: flex;
  flex-direction: column;
}

:deep(.el-card__header) {
  background: linear-gradient(135deg, rgba(248, 249, 250, 0.2) 0%, rgba(241, 245, 249, 0.2) 100%);
  border-bottom: 1px solid rgba(230, 235, 245, 0.3);
  padding: 12px 20px;
  border-radius: 16px 16px 0 0;
}

:deep(.el-input) {
  height: 0.6rem;
  font-size: 0.25rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 0.3rem;
  font-weight: 700;
  color: #ffffff;
}

.card-icon {
  color: #66b1ff;
  font-size: 18px;
}

.settings-content {
  padding: 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 320px;
}

.address-settings-compact {
  padding: 12px 20px;
  margin-bottom: 15px;
}

.address-settings {
  background: rgba(102, 177, 255, 0.15);
  border-radius: 10px;
  border-left: 4px solid #66b1ff;
}

.form-tip {
  font-size: 13px;
  color: #d1d5db;
  margin-top: 8px;
  line-height: 1.4;
  width: 100%;
}

.action-buttons {
  display: flex;
  justify-content: center;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(235, 238, 245, 0.5);
}

:deep(.el-form-item__label) {
  color: #e5e7eb;
  font-weight: 600;
  font-size: 0.25rem;
}

:deep(.form-tip) {
  font-size: 0.23rem;
}

.address-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 8px;
}

.address-item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 177, 255, 0.15);
  padding: 4px 12px;
  border-radius: 6px;
  border-left: 2px solid #66b1ff;
  min-width: 36px;
  height: 28px;
}

.address-item:hover {
  background: rgba(102, 177, 255, 0.25);
  transform: translateY(-1px);
}

.address-value {
  color: #ffffff;
  font-weight: 600;
  font-size: 0.25rem;
}

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

.opendoor-btn {
  width: 160px;
  height: 44px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

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
}

/* 全局对话框样式优化 */
.waiting-dialog {
  border-radius: 12px !important;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(0, 0, 0, 0.05) !important;
  overflow: hidden;
}

.waiting-dialog .el-dialog__header {
  padding: 0 !important;
}

.waiting-dialog .el-dialog__body {
  padding: 0 !important;
}

/* 蒙层优化 */
.waiting-dialog .el-dialog__wrapper {
  background-color: rgba(0, 0, 0, 0.5) !important;
  backdrop-filter: blur(2px);
}

/* 居中显示优化 */
.waiting-dialog .el-dialog {
  margin: 0 !important;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

:deep(.el-form-item__error) {
  font-size: 0.23rem;
  /* 调整为你需要的字体大小 */
}

:deep(.el-loading-text) {
  font-size: 0.3rem;
  /* 设置你需要的字体大小 */
  /* 还可以设置其他样式，如颜色、字重等 */
  /* color: #1890ff;
       font-weight: bold; */
}
</style>
