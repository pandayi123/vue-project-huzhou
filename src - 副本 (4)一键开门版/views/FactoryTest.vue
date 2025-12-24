<template>
  <div class="factory_test">
    <!-- 新增加的返回按钮 -->
    <el-row>
      <el-col>
        <el-button @click="set201" style="width:3rem;height:1rem;">门锁地址设置为201</el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="5">
        <el-button @click="toggleLight" style="width:3rem;height:1rem;">
          {{ lightStatus ? '关灯(地址12)' : '开灯(地址12)' }}
        </el-button>
      </el-col>
      <el-col :span="5">
        <el-button @click="opendoor10" style="width:3rem;height:1rem;">开柜门(地址10)</el-button>
      </el-col>
      <el-col :span="5">
        <el-button @click="opendoor13" style="width:3rem;height:1rem;">开柜门(地址13)</el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-col :span="5">
        <el-button @click="requet_safe" style="width:3rem;height:1rem;">模拟门禁访问密码柜</el-button>
      </el-col>
      <el-col :span="5">
        <el-button @click="open_door" style="width:3rem;height:1rem;">打开门禁锁</el-button>
      </el-col>
      <el-col :span="5">
        <!-- 修改点1：绑定新函数，根据状态改变文字和颜色 -->
        <el-button @click="toggle_monitor_loop" :type="isListening ? 'danger' : ''" style="width:3rem;height:1rem;">
          {{ isListening ? '停止监听(运行中...)' : '模拟库室内按钮开门' }}
        </el-button>
      </el-col>
    </el-row>
     <el-row>
      <el-col>
        <el-button @click="clear_borrow_records" style="width:3rem;height:1rem;">清空领用归还记录表</el-button>
      </el-col>
    </el-row>
    <el-row>
      <el-col>
        <el-button @click="goBack" style="width:3rem;height:1rem;">返回上页</el-button>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 1. 从 vue-router 导入 useRouter
import { useRouter } from 'vue-router'
// 导入 ref 创建响应式变量
import { ref, onMounted, toRaw, onUnmounted } from 'vue'
import axios from '../assets/js/axios'
import { useTimerStore } from '@/stores/timerStore'

const timerStore = useTimerStore()
const router = useRouter()
const door_lock_array = ref([])

// --- 新增状态控制变量 ---
const isListening = ref(false) // 是否正在监听

// --- 辅助函数：延时器 ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

onUnmounted(() => {
  if (!timerStore.isTimerActive) timerStore.startInterval()
  // 页面销毁时，强制停止循环
  isListening.value = false
})

onMounted(async () => {
  if (timerStore.isTimerActive) timerStore.stopInterval()
  const response = await window.electronAPI.el_post({
    action: 'queryAll',
    payload: { tableName: 'terminal_settings', condition: '' },
  })
  if (response?.success && response.data?.length) {
    console.log('terminal_settings:', toRaw(response.data[0]))
    door_lock_array.value = JSON.parse(response.data[0].config_blob).lock.details
    console.log('door_lock_array:', toRaw(door_lock_array.value))
  }
})

const opendoor10 = async () => {
  await window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201,
      registerAddress: 10,
      value: 20,
      isWrite: true,
    },
  })
}

const requet_safe = async () => {
  console.log('requet_safe')
  axios.request_data('/api/borrow-records', {
    tableName: 'equipment',
    condition: "group_status = '在位'"
  })
}

const opendoor13 = async () => {
  await window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201,
      registerAddress: 13,
      value: 20,
      isWrite: true,
    },
  })
}

const open_door = async () => {
  console.log('执行开门动作')
  await window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201,
      registerAddress: 11,
      value: 100,
      isWrite: true,
    },
  })
}

// --- 修改点2：基于 while 循环的监听控制函数 ---
const toggle_monitor_loop = async () => {
  // 1. 如果当前正在监听，点击按钮意味着停止
  if (isListening.value) {
    isListening.value = false
    console.log('停止监听指令已发出，循环将在本轮结束后停止。')
    return
  }

  // 2. 如果当前未监听，点击按钮意味着开始
  isListening.value = true
  console.log('开始循环监听...')

  // 3. 进入 while 循环 (非递归)
  while (isListening.value) {
    try {
      // 发送请求读取状态
      const res = await window.electronAPI.el_post({
        action: 'read_all_inputs',
        payload: {
          deviceAddress: 201,
          startAddress: 0x0000,
          registerCount: 10,
        },
      })

      // 检查返回数据
      if (res && res.success && res.data && res.data.length > 6) {
        console.log('res.data:', res.data)
        const buttonStatus = res.data[7]
        if (buttonStatus === 1) {
          console.log('检测到按钮按下 (Index 6 == 1)，执行开门！')
          await open_door()
          // 如果开门后不希望停止监听，保留此处逻辑
          // 如果开门后希望自动停止，可以加上: isListening.value = false
        }
      } else {
        console.warn('读取失败或数据异常', res)

      }
    } catch (error) {
      console.error('监听循环发生错误:', error)
    }

    // 4. 只有当还在监听状态时，才进行延时等待 (避免停止后多等500ms)
    if (isListening.value) {
      await sleep(500) // 等待 500 毫秒
    }
  }

  console.log('监听循环已彻底结束')
}

// 创建灯光状态响应式变量
const lightStatus = ref(false)
const toggleLight = () => {
  const value = lightStatus.value ? 0 : 1000
  window.electronAPI.el_post({
    action: 'control_register',
    payload: {
      deviceAddress: 201,
      registerAddress: 12,
      value: value,
      isWrite: true,
    },
  })
  lightStatus.value = !lightStatus.value
}

const set201 = () => {
  window.electronAPI.el_post({
    action: 'set_door_address',
    payload: {
      newAddress: 201
    },
  })
}

const goBack = () => {
  router.go(-1)
}
const clear_borrow_records=async()=>{
 let response=await window.electronAPI.el_post({
    action: 'clearTable',
    payload: {
      tableName: 'borrow_records'
    },
  })
  console.log('response:', toRaw(response))
}
</script>

<style scoped>
.el-row {
  margin: 20px;
  padding: 10px;
}
</style>
