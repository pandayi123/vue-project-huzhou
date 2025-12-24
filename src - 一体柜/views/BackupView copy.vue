// src/stores/timerStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAudioStore } from '@/stores/audioStore'

export const useTimerStore = defineStore('timer', () => {
  // 定时器状态
  const intervalId = ref(null)
  const isTimerActive = ref(false)

  // 硬件状态相关变量
  const lightStatus = ref(false)
  const opendoor_play_once = ref(false)
  const closedoor_play_once = ref(false)
  const key_play_once = ref(false)
  const power_status = ref(false)
  const network_status = ref(false)
  const temperature = ref('')
  const humidity = ref('')

  // 依赖的 store
  const audioStore = useAudioStore()

  // 切换灯光状态
  const toggleLight = async () => {
    const value = lightStatus.value ? 100000 : 0
    window.electronAPI.el_post({
      action: 'control_register',
      payload: {
        deviceAddress: 201,
        registerAddress: 12,
        value: value,
        isWrite: true,
      },
    })
  }

  // 固定的回调函数
  const executeEverySecond = async () => {
    console.log('每2秒执行')
    let status_201 = await window.electronAPI.el_post({
      action: 'read_all_inputs',
      payload: {
        deviceAddress: 201,
        startAddress: 0x0000,
        registerCount: 10,
      },
    })
    console.log('status_201:', status_201.data)
    if (status_201?.success && status_201.data?.length) {
      if (status_201.data[6] == 0) {
        lightStatus.value = true
        closedoor_play_once.value = false
        console.log('主柜门开门')
        if (opendoor_play_once.value == false) {
          audioStore.play('/audio/柜门已开.mp3')
        }
        opendoor_play_once.value = true
        toggleLight()
      }
      if (status_201.data[6] == 1) {
        lightStatus.value = false
        console.log('主柜门关门')
        if (closedoor_play_once.value == false) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          toggleLight()
          audioStore.play('/audio/柜门已锁.mp3')
        }
        opendoor_play_once.value = false
        closedoor_play_once.value = true
      }
      if (status_201.data[2] == 1) {
        console.log('通电')
        power_status.value = true
      }
      if (status_201.data[2] == 0) {
        console.log('断电')
        power_status.value = false
      }
      if (status_201.data[3] == 1) {
        if (key_play_once.value == false) {
          key_play_once.value = true
          await audioStore.play('/audio/机械钥匙开门报警.mp3')
          key_play_once.value = false
        } else {
          key_play_once.value = false
        }
      }
    }
    // 插入200ms延时,不能少，保证前面的命令执行完毕
    await new Promise((resolve) => setTimeout(resolve, 200))
    let read_temperature_and_humidity = await window.electronAPI.el_post({
      action: 'read_temperature_and_humidity',
      payload: {},
    })
    if (read_temperature_and_humidity?.success && read_temperature_and_humidity.data) {
      temperature.value = read_temperature_and_humidity.data.temperature
      humidity.value = read_temperature_and_humidity.data.humidity
    }
    console.log('温度湿度:', read_temperature_and_humidity)
    window.electronAPI.el_post({
      action: 'test_network',
      payload: {},
    })
  }

  // 启动定时器,不能少于2s，否则点灯时间不够，读取温湿度时间也不够
  const startInterval = (interval = 2000) => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
    }
    intervalId.value = setInterval(executeEverySecond, interval)
    isTimerActive.value = true
    console.log('定时器已启动')
  }

  // 停止定时器
  const stopInterval = () => {
    if (intervalId.value) {
      clearInterval(intervalId.value)
      intervalId.value = null
      isTimerActive.value = false
      console.log('定时器已停止')
    }
  }

  return {
    intervalId,
    isTimerActive,
    lightStatus,
    startInterval,
    stopInterval,
    power_status, // 添加通电状态
    network_status, // 添加网络状态
    temperature, // 添加温度
    humidity, // 添加湿度
  }
})
