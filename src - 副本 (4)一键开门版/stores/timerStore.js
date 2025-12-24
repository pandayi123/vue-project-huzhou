// src/stores/timerStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAudioStore } from '@/stores/audioStore'
import { useConfigStore } from '@/stores/configStore'
import plugins from '@/assets/js/plugin'

export const useTimerStore = defineStore('timer', () => {
  // 门锁数量，用于选择不同的处理逻辑，默认为1体柜，等于2时表示上下柜
  // 值等于terminal_settings表中的config_blob字段中lock.quantity的值
  // 在App.vue和HardwareSettings.vue中更新
  const doorLockCount = ref(1)
  // 定时器状态
  const intervalId = ref(null)
  const isTimerActive = ref(false)

  // 缓存未完成的网络测试请求
  const networkTestPromise = ref(null)
  const lastNetworkTestTime = ref(0) // 新增：记录最后一次测试时间

  // 是否已记录机械钥匙开门报警日志
  const isKeyOpenAlertLogged = ref(false)

  const doorOpenTime = ref(0) // 记录开门时间
  const isDoorOpenAlertTriggered = ref(false) // 是否已触发报警

  // 硬件状态相关变量
  const lightStatus = ref(false)
  const opendoor_play_once = ref(false)
  const closedoor_play_once = ref(false)
  const key_play_once = ref(false)
  const power_status = ref(false)
  const network_status = ref(false)
  const temperature = ref('')
  const humidity = ref('')

  // 报警
  const door_open_too_long = ref('报警7') // 柜门长时间未关报警
  const door_open_too_long_time = ref(20000) // 柜门长时间未关报警时间阈值（毫秒）
  const key_open_door = ref('报警7') // 机械钥匙开门报警
  const power_off_alert = ref('报警6') // 断电报警
  const network_test_fail_alert = ref('报警7') // 网络测试失败报警
  const temperature_alert = ref('报警7') // 温度报警
  const humidity_alert = ref('报警7') // 湿度报警
  const temperature_threshold = ref(60) // 温度报警阈值（摄氏度）
  const humidity_threshold = ref(80) // 湿度报警阈值（百分比）

  // 是否已记录温度报警日志
  const isTemperatureAlertLogged = ref(false)
  // 是否已记录湿度报警日志
  const isHumidityAlertLogged = ref(false)

  // 是否已记录网络测试失败报警日志
  const isNetworkTestFailAlertLogged = ref(false)

  // 是否已记录断电报警日志
  const isPowerOffAlertLogged = ref(false)

  // 依赖的 store
  const audioStore = useAudioStore()
  const configStore = useConfigStore()

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
  console.log('doorLockCount:', doorLockCount.value)
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
    console.log('doorLockCount:', doorLockCount.value)
    if (status_201?.success && status_201.data?.length) {
      // 一体柜
      if (doorLockCount.value == 1) {
        if (status_201.data[6] == 0) {
          lightStatus.value = true
          closedoor_play_once.value = false
          console.log('主柜门开门')
          if (opendoor_play_once.value == false) {
            audioStore.play('/audio/柜门已开.mp3')
          }
          opendoor_play_once.value = true
          toggleLight()

          // 记录开门时间
          if (doorOpenTime.value === 0) {
            doorOpenTime.value = Date.now()
          }

          // 检查是否超过30秒未关门
          const now = Date.now()
          if (now - doorOpenTime.value >= door_open_too_long_time.value) {
            audioStore.play('/audio/柜门长时间未关报警.mp3')
          }
          if (!isDoorOpenAlertTriggered.value) {
            isDoorOpenAlertTriggered.value = true
            plugins.logUserAction('报警事件', `柜门长时间未关报警`, {
              log_level: door_open_too_long.value,
            })
          }
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

          // 重置开门时间和报警状态
          doorOpenTime.value = 0
          isDoorOpenAlertTriggered.value = false
        }
        if (status_201.data[2] == 1) {
          console.log('通电')
          power_status.value = true
          isPowerOffAlertLogged.value = false
        }
        if (status_201.data[2] == 0) {
          console.log('断电')
          power_status.value = false
          if (!isPowerOffAlertLogged.value) {
            plugins.logUserAction('报警事件', `断电报警`, { log_level: power_off_alert.value })
            isPowerOffAlertLogged.value = true
          }
        }
        if (status_201.data[3] == 1) {
          if (key_play_once.value == false) {
            // key_play_once.value = true是为了防止播音未结束，又触发重复播音，导致覆盖播放不完整
            key_play_once.value = true
            if (!isKeyOpenAlertLogged.value) {
              plugins.logUserAction('报警事件', `机械钥匙开门报警`, {
                log_level: key_open_door.value,
              })
              isKeyOpenAlertLogged.value = true
            }
            await audioStore.play('/audio/机械钥匙开门报警.mp3')
            key_play_once.value = false
          } else {
            key_play_once.value = false
          }
        }
        if (status_201.data[3] == 0) {
          isKeyOpenAlertLogged.value = false
        }
      } else {
        // 上下柜
        console.log('上下柜')
        console.log('doorLockCount:', doorLockCount.value)
        if (status_201.data[6] == 0 || status_201.data[7] == 0) {
          lightStatus.value = true
          closedoor_play_once.value = false
          console.log('柜门已开')
          if (opendoor_play_once.value == false) {
            audioStore.play('/audio/柜门已开.mp3')
          }
          opendoor_play_once.value = true
          toggleLight()

          // 记录开门时间
          if (doorOpenTime.value === 0) {
            doorOpenTime.value = Date.now()
          }

          // 检查是否超过30秒未关门
          const now = Date.now()
          if (now - doorOpenTime.value >= door_open_too_long_time.value) {
            audioStore.play('/audio/柜门长时间未关报警.mp3')
          }
          if (!isDoorOpenAlertTriggered.value) {
            isDoorOpenAlertTriggered.value = true
            plugins.logUserAction('报警事件', `柜门长时间未关报警`, {
              log_level: door_open_too_long.value,
            })
          }
        }
        if (status_201.data[6] == 1 && status_201.data[7] == 1) {
          lightStatus.value = false
          console.log('主柜门关门')
          if (closedoor_play_once.value == false) {
            await new Promise((resolve) => setTimeout(resolve, 100))
            toggleLight()
            audioStore.play('/audio/柜门已锁.mp3')
          }
          opendoor_play_once.value = false
          closedoor_play_once.value = true

          // 重置开门时间和报警状态
          doorOpenTime.value = 0
          isDoorOpenAlertTriggered.value = false
        }
        if (status_201.data[2] == 1) {
          console.log('通电')
          power_status.value = true
          isPowerOffAlertLogged.value = false
        }
        if (status_201.data[2] == 0) {
          console.log('断电')
          power_status.value = false
          if (!isPowerOffAlertLogged.value) {
            plugins.logUserAction('报警事件', `断电报警`, { log_level: power_off_alert.value })
            isPowerOffAlertLogged.value = true
          }
        }
        if (status_201.data[3] == 1 || status_201.data[4] == 1) {
          if (key_play_once.value == false) {
            // key_play_once.value = true是为了防止播音未结束，又触发重复播音，导致覆盖播放不完整
            key_play_once.value = true
            if (!isKeyOpenAlertLogged.value) {
              plugins.logUserAction('报警事件', `机械钥匙开门报警`, {
                log_level: key_open_door.value,
              })
              isKeyOpenAlertLogged.value = true
            }
            await audioStore.play('/audio/机械钥匙开门报警.mp3')
            key_play_once.value = false
          } else {
            key_play_once.value = false
          }
        }
        if (status_201.data[3] == 0 && status_201.data[4] == 0) {
          isKeyOpenAlertLogged.value = false
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
      temperature.value = parseFloat(read_temperature_and_humidity.data.temperature).toFixed(1)
      humidity.value = parseFloat(read_temperature_and_humidity.data.humidity).toFixed(1)

      // 检查温度是否超过阈值
      if (
        parseFloat(temperature.value) > temperature_threshold.value &&
        !isTemperatureAlertLogged.value
      ) {
        plugins.logUserAction('报警事件', `温度过高报警`, { log_level: temperature_alert.value })
        isTemperatureAlertLogged.value = true
      } else if (parseFloat(temperature.value) <= temperature_threshold.value) {
        isTemperatureAlertLogged.value = false
      }

      // 检查湿度是否超过阈值
      if (parseFloat(humidity.value) > humidity_threshold.value && !isHumidityAlertLogged.value) {
        plugins.logUserAction('报警事件', `湿度过高报警`, { log_level: humidity_alert.value })
        isHumidityAlertLogged.value = true
      } else if (parseFloat(humidity.value) <= humidity_threshold.value) {
        isHumidityAlertLogged.value = false
      }
    }
    // console.log('温度湿度:', read_temperature_and_humidity)

    // 控制网络测试请求频率（每30秒最多一次）
    const now = Date.now()
    if (!networkTestPromise.value && now - lastNetworkTestTime.value >= 30000) {
      lastNetworkTestTime.value = now // 更新最后一次测试时间
      networkTestPromise.value = window.electronAPI
        .el_post({
          action: 'test_network',
          payload: {
            ip: configStore.network.local_ipv4,
            netmask: configStore.network.subnet_mask,
            gateway: configStore.network.default_gateway,
            server_ip: configStore.network.server_ip,
            server_port1: configStore.network.server_port1,
          },
        })
        .then((result) => {
          console.log('网络测试结果:', result)
          if (result?.success && result?.data) {
            const { serverStatus } = result.data.details
            if (serverStatus.server === true && serverStatus.port === true) {
              network_status.value = true
              isNetworkTestFailAlertLogged.value = false // 重置状态
            } else {
              network_status.value = false
              if (!isNetworkTestFailAlertLogged.value) {
                plugins.logUserAction('报警事件', `连接服务器失败报警`, {
                  log_level: network_test_fail_alert.value,
                })
                isNetworkTestFailAlertLogged.value = true
              }
            }
          }
        })
        .finally(() => {
          networkTestPromise.value = null // 请求完成后重置
        })
    }
  }

  // 启动定时器,不能少于2s，否则点灯时间不够，读取温湿度时间也不够
  const startInterval = (interval = 2200) => {
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

      // 清理未完成的网络测试
      if (networkTestPromise.value) {
        networkTestPromise.value = null
      }
    }
  }
  /*
为什么需要将属性加到 return 里？
访问控制：

只有通过 return 暴露的属性和方法才能在组件或其他 Store 中被访问和修改。
未暴露的属性和方法是私有的，只能在当前 Store 内部使用。
模块化与封装：

通过 return 明确区分哪些是公共接口（供外部使用），哪些是内部实现细节。
避免外部直接修改内部状态，确保状态变更的可控性。
响应式更新：

只有通过 return 暴露的响应式变量（如 ref 或 reactive ）才能在组件中触发视图更新。
*/
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
    doorLockCount, // 添加柜门锁定次数
  }
})
