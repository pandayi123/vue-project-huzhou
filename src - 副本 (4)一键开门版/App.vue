<template>
  <div>
    <el-config-provider :locale="zhCn">
      <RouterView />
      <!-- 音频元素 全项目共享调用播放音频-->
      <audio ref="audioElement"></audio>
      <!-- 等待屏幕 全项目共享 ，防止屏保时候点击触发按键发音，：class中visibility不可交互-->
      <div class="wait_screen" :class="{ show: configStore.closeScreen }" @click="quit"></div>
    </el-config-provider>

  </div>
</template>

<script setup>
import { useAudioStore } from '@/stores/audioStore'
import { useConfigStore, setupScreenSaverWatcher } from '@/stores/configStore'
import { onMounted, ref, onUnmounted } from 'vue'
import plugins from '@/assets/js/plugin'
import { useTimerStore } from '@/stores/timerStore';
// 以下三项是引入element-plus的国际化配置，用于在中文环境下显示中文文本，中文时间需要单独导入：import 'dayjs/locale/zh-cn'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'dayjs/locale/zh-cn'
const timerStore = useTimerStore();
const configStore = useConfigStore()
const audioElement = ref(null)
const audioStore = useAudioStore()
onMounted(async () => {
  audioStore.setAudioElement(audioElement.value)
  await configStore.initializeConfig(fetchConfigData) // 初始化配置
  adjustFontSize()
  window.addEventListener('resize', adjustFontSize)
  // 启用 sleep_time 的监听
  setupScreenSaverWatcher(configStore)
  // 建立socket连接
  console.log(
    '开始建立socket连接,\n服务器ip地址：',
    configStore.network.server_ip,
    '\n服务器端口：',
    configStore.network.server_port1,
    '\n终端id:',
    configStore.terminal.terminal_id,
  )
  // 注意，需要等configStore.initializeConfig(fetchConfigData)完成后再执行，执行太快会导致socket初始化时读取不到configStore.network.server_ip和configStore.network.server_port1
  setTimeout(() => {
    plugins.createTerminal(
      'http://' + configStore.network.server_ip + ':' + configStore.network.server_port1,
      configStore.terminal.terminal_id,
    )
  }, 2000)

  // 监听屏幕点击事件，点亮屏幕
  /*不能写成configStore.setScreenSaver()，这是一个 函数调用，会立即执行 setScreenSaver 方法，并将它的返回值（如果有）作为回调函数传递给 addEventListener 。
如果 setScreenSaver 没有返回值（即返回 undefined ），则相当于 addEventListener 的回调函数是 undefined ，事件监听会失效。
configStore.setScreenSaver ：这是一个 函数引用， addEventListener 会在事件触发时调用 setScreenSaver 方法，并将事件对象 event 作为参数传递给它。
  */
  // document.addEventListener('click', configStore.setScreenSaver);
  // 监听屏幕触摸事件，点亮屏幕
  document.addEventListener('touchstart', configStore.setScreenSaver)
  // 下面代码的含义是：如果当前环境是开发环境，则添加一个名为 development 的类名到根元素上，否则添加一个名为 production 的类名到根元素上
  // 在common.css中，我们定义了 .development 和 .production 这两个类名，用于根据当前环境调整页面的样式
  // import.meta.env.MODE：获取当前环境模式。这是Vite推荐的环境变量访问方式，无需额外配置即可使用。
  // .development *含义：表示匹配所有 位于 .development 类元素内部 的子元素（包括直接子元素和嵌套子元素）
  const root = document.documentElement
  if (import.meta.env.MODE === 'development') {
    root.classList.add('development')
  } else {
    root.classList.add('production')
  }

  // 启动全局定时器（直接使用 store 中的固定回调函数）
  timerStore.startInterval();
})
onUnmounted(() => {
  document.removeEventListener('click', configStore.setScreenSaver)
  document.removeEventListener('touchstart', configStore.setScreenSaver)
  timerStore.stopInterval(); // 停止全局定时器
})

const adjustFontSize = () => {
  const html = document.documentElement
  html.style.fontSize = `${(window.innerWidth / 1920) * 100}px`
}
const quit = async () => {
  try {
    audioStore.play('/audio/退出屏保模式.mp3')
    configStore.setScreenSaver()
  } catch (error) {
    console.error('退出应用失败:', error)
  }
}
const fetchConfigData = async () => {
  try {
    const response = await window.electronAPI.el_post({
      action: 'queryMultipleTables',
      payload: {
        arr: [
          { tablename: 'screen_settings', condition: '' },
          { tablename: 'volume_settings', condition: '' },
          { tablename: 'network_settings', condition: '' },
          { tablename: 'terminal_settings', condition: '' },
        ],
      },
    })
    console.log('el_post调用返回的数据:', response)
    if (response?.success && response.data) {
      // 更新timerStore.doorLockCount的值
      timerStore.doorLockCount = JSON.parse(response.data.terminal_settings.config_blob).lock.quantity
      console.log('更新timerStore.doorLockCount的值:', timerStore.doorLockCount)
      return {
        volume: response.data.volume_settings.volume ?? 50, // 默认值 50
        sleep_time: response.data.screen_settings.sleep_time ?? 5, // 默认值 5分钟,??空值合并符仅当左侧是 null 或 undefined 时，才会使用右侧的值
        network: response.data.network_settings ?? {}, // 默认值为空对象
        terminal: response.data.terminal_settings ?? {}, // 默认值为空对象
      }
    } else {
      return {
        volume: 50,
        sleep_time: 5,
      }
    }
  } catch (error) {
    console.error('初始化获取数据失败:', error)
    // 返回默认值
    return {
      volume: 50,
      sleep_time: 5,
    }
  }
}
</script>

<style scoped>
.wait_screen {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  width: 100%;
  height: 100%;
  background-color: black;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  opacity: 0;
  /* 初始透明度为 0 */
  visibility: hidden;
  /* 初始不可见,不可交互 */
  transition:
    opacity 0.3s ease,
    visibility 0.3s ease;
  /* 过渡时间为 2 秒 */
}

.wait_screen.show {
  opacity: 1;
  /* 显示时透明度为 1 */
  visibility: visible;
  /* 显示时可见 */
}
</style>
