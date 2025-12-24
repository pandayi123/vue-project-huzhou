<template>
  <div>
    <!-- 新增加的返回按钮 -->
    <el-button @click="goBack" style="width:3rem;height:3rem;">返回</el-button>
    <el-button @click="opendoor10" style="width:3rem;height:3rem;">开主柜门(寄存器10)</el-button>
    <el-button @click="opendoor13" style="width:3rem;height:3rem;">开副柜门(寄存器13)</el-button>

    <!-- 修改为开关灯按钮，根据lightStatus显示不同文本 -->
    <el-button @click="toggleLight" style="width:3rem;height:3rem;">
      {{ lightStatus ? '关灯' : '开灯' }}
    </el-button>
    <el-button @click="set201" style="width:3rem;height:3rem;">门锁地址设置为201</el-button>
  </div>
</template>

<script setup>
// 1. 从 vue-router 导入 useRouter
import { useRouter } from 'vue-router'
// 导入 ref 创建响应式变量
import { ref, onMounted, toRaw } from 'vue'
// import { useAudioStore } from '@/stores/audioStore'
// const audioStore = useAudioStore()
// 2. 获取路由实例
const router = useRouter()

onMounted(async () => {
  const response = await window.electronAPI.el_post({
    action: 'query',
    payload: { tablename: 'terminal_settings', condition: '' },
  })
  console.log('el_post调用返回的terminal_settings:', response)
  if (response?.success && response.data?.length) {
    console.log('terminal_settings:', toRaw(response.data[0]))
  }
  // config_blob.value = JSON.parse(configStore.terminal.config_blob)
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
// 创建灯光状态响应式变量，默认关灯状态（false）
const lightStatus = ref(false)
// 修改为切换灯光函数
const toggleLight = () => {
  // 根据lightStatus的值决定发送的value参数
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

  // 切换灯光状态
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

// 3. 定义返回函数
const goBack = () => {
  router.go(-1)
}
</script>
