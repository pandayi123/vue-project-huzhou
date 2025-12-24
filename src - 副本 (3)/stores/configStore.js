// 系统设置参数
/*使用示例
import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()
configStore.volume = 60
*/
import { defineStore } from 'pinia'
import { watch } from 'vue' // 添加这一行
export const useConfigStore = defineStore('config', {
  state: () => ({
    volume: 50, // 音量
    sleep_time: 5, // 单位分钟
    screenSaverTimeout: null, // 屏保定时器
    closeScreen: false, // 屏幕是否关闭
    network: {
      local_ipv4: '192.168.3.200', // 本机IPv4地址
      local_ipv6: 'fe80::1', // 本机IPv6地址
      subnet_mask: '255.255.255.0', // 子网掩码
      default_gateway: '192.168.3.1', // 默认网关
      preferred_dns: '8.8.8.8', // 首选DNS
      alternate_dns: '8.8.4.4', // 备用DNS
      hostname: 'my_device', // 设备主机名
      dhcp_enabled: 0, // 是否启用DHCP (0=禁用, 1=启用)
      mtu: 1500, // MTU大小
      network_timeout: 30, // 网络超时时间（秒）
      server_ip: '192.168.3.104', // 服务器IP地址
      server_port1: 8080, // 服务器端口1
      server_port2: 8081, // 服务器端口2
      server_port3: 8082, // 服务器端口3
      server_port4: 8083, // 服务器端口4
      server_port5: 8084, // 服务器端口5
      server_port6: 8085, // 服务器端口6
      server_port7: 8086, // 服务器端口7
      server_port8: 8087, // 服务器端口8
      server_port9: 8088, // 服务器端口9
      server_port10: 8089, // 服务器端口10
      nic_address1: '00:1A:2B:3C:4D:5E', // 网卡地址1
      nic_address2: '00:1A:2B:3C:4D:5F', // 网卡地址2
      nic_address3: '00:1A:2B:3C:4D:60', // 网卡地址3
      last_modified: new Date().toISOString(), // 最后修改时间
    },
    terminal: {
      terminal_id: 'set_none', // 终端ID
      connection_status: 'disconnected', // 服务器连接状态 (connected/disconnected)
      last_connected_time:new Date().toISOString(),  // 上一次建立连接的时间（本地时间）
      last_disconnected_time:new Date().toISOString()  // 上一次检测到的断开时间（本地时间）
    },
  }),
  actions: {
    async initializeConfig(fetchConfigData) {
      const { volume, sleep_time, network, terminal } = await fetchConfigData()
      this.volume = volume
      this.sleep_time = sleep_time
      this.network = network
      this.terminal = terminal
      this.closeScreen = false // 显式初始化
      console.log('Config initialized:', { volume, sleep_time, network, terminal })
      // 初始化后立即设置屏保
      this.setScreenSaver()
      // 第一次启动系统，都会先从数据库读取配置数据，然后更新ubuntu系统网络配置文件，初始化网络，使得网卡配置和数据库配置保持一致。或者第一次启动系统，直接设置配置点击保存。
      // 如果不运行this.setNetwork()，在系统第一次初始化时，实际应用的配置参数可能会和数据库的参数不一致。因为系统不是我做的镜像。
      // this.setNetwork()
    },
    // 设置屏保定时器
    setScreenSaver() {
      // 清除旧定时器
      if (this.screenSaverTimeout) clearTimeout(this.screenSaverTimeout)
      // 点击屏幕任何地方，如果此时屏幕关闭，则重新打开
      if (this.sleep_time == 0) {
        console.log('不设置屏保')
        return
      }
      if (this.closeScreen) {
        console.log('重新打开屏幕')
        this.closeScreen = false
        console.log('closeScreen:', this.closeScreen)
        window.electronAPI.el_post({ action: 'turnOnScreen', payload: {} })
      }
      // 设置新定时器（使用 sleep_time）
      this.screenSaverTimeout = setTimeout(
        () => {
          this.closeScreen = true
          // 在这里执行屏保操作
          window.electronAPI.el_post({ action: 'turnOffScreen', payload: {} })
          console.log('Screen saver activated')
        },
        this.sleep_time * 60 * 1000,
      ) // sleep_time 单位是秒，转换为毫秒
    },
    // 设置网络
    setNetwork() {
      window.electronAPI.el_post({
        action: 'set_network',
        payload: {
          ip: this.network.local_ipv4,
          gateway: this.network.default_gateway,
          dns: this.network.preferred_dns,
          netmask: this.network.subnet_mask,
        },
      })
    },
    // 清除屏保定时器
    clearScreenSaver() {
      if (this.screenSaverTimeout) clearTimeout(this.screenSaverTimeout)
      this.screenSaverTimeout = null
    },
  },
})

// 在组件中监听 sleep_time 变化
export function setupScreenSaverWatcher(store) {
  watch(
    () => store.sleep_time,
    (newVal, oldVal) => {
      if (newVal !== oldVal) {
        store.setScreenSaver() // 自动刷新定时器
      }
    },
    { immediate: true }, // 初始化时立即执行一次
  )
}
