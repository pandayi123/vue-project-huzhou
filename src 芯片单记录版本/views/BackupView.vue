<template>
  <div class="home">
    <div class="background_image">
      <div class="header-section">
        <div class="time-display">
          {{ currentTime }}
        </div>
        <div class="title">
          <img class="logo" src="@/assets/images/deskview2.png" alt="系统Logo" />智能物柜管理系统1.0
        </div>
        <div class="wendu_shidu">
          <div class="status-item" style="display: flex; align-items: center; gap: 0.08rem">
            <svg class="icon" viewBox="0 0 1024 1024" width="0.3rem" height="0.3rem" style="flex-shrink: 0">
              <path
                d="M543.096963 630.338444V355.665267c0-16.698369-13.598672-30.297041-30.297041-30.297041h-2.399766c-16.298408 0-29.397129 13.198711-29.397129 29.397129v275.573089c-45.195586 13.098721-78.292354 53.494776-78.292354 101.690069 0 58.894249 48.895225 106.589591 109.389317 106.589591 60.394102 0 109.289327-47.795332 109.289327-106.589591-0.09999-48.195293-33.196758-88.491358-78.292354-101.690069zM703.981252 508.650327c-6.799336-5.599453-10.798945-13.198711-10.798946-20.997949V177.082707C693.182306 79.392247 611.890245 0 512 0c-99.890245 0-181.182306 79.392247-181.182306 177.082707v301.77053c0 13.098721-5.399473 25.197539-14.698565 33.096768-65.493604 55.2946-102.989942 135.586759-102.989942 220.178498 0 160.884289 134.086906 291.871497 298.970803 291.871497s298.970804-130.887218 298.970804-291.871497C810.970804 645.536959 771.974612 564.044917 703.981252 508.650327zM512 931.309052c-112.988966 0-204.780002-89.39127-204.780002-199.280539 0-68.493311 35.796504-131.487159 95.690655-168.383556l14.498584-8.899131c4.699541-2.899717 7.599258-8.099209 7.599258-13.598672V177.082707c0-46.59545 39.096182-84.491749 87.091495-84.491749 47.995313 0 87.091495 37.896299 87.091495 84.491749v364.064447c0 5.499463 2.899717 10.698955 7.599258 13.598672l14.498584 8.899131c59.894151 36.896397 95.590665 99.790255 95.590665 168.383556-0.09999 109.889269-91.991017 199.280539-204.879992 199.280539z"
                fill="#ffffff"></path>
            </svg>
            <span style="font-weight: 500">26.5℃</span>
          </div>
          <div class="separator" style="width: 1px; height: 0.3rem; background: rgba(255, 255, 255, 0.3)"></div>
          <div class="status-item" style="display: flex; align-items: center; gap: 0.08rem">
            <svg class="icon" viewBox="0 0 1024 1024" width="0.3rem" height="0.3rem" style="flex-shrink: 0">
              <path
                d="M738.844 841.58c-113.108 0-204.8-91.692-204.8-204.8 0-163.161 143.268-310.37 190.135-354.163 0.137 0.137 0.289 0.259 0.431 0.393a19.936 19.936 0 0 1 29.2-0.292C800.981 326.287 943.644 471.7 943.644 636.78c0 113.108-91.692 204.8-204.8 204.8z m14.076-476.424c-0.021 0.02-0.044 0.036-0.065 0.056a16.955 16.955 0 0 0-27.02 0c-0.15-0.138-0.311-0.264-0.457-0.406C689.331 404.651 593.349 521.52 593.349 636.2c0 80.244 65.141 145.294 145.5 145.294S884.344 716.443 884.344 636.2c0-116.98-94.925-231.377-131.424-271.044z m5.424 367.344h-4a110 110 0 0 1-105.54-141h0.471a29.5 29.5 0 0 1 57.069 10.5c0 2.724-2 9.086-2 20.5a50 50 0 0 0 50 50c1.348 0 2.679-0.069 4-0.174v0.174a30 30 0 0 1 0 60z m-358 43a140.354 140.354 0 0 0 29-3.033v0.184c0.987-0.1 1.987-0.151 3-0.151a29.984 29.984 0 0 1 4 59.7v0.059a201.146 201.146 0 0 1-36 3.241c-110.457 0-200-89.543-200-200a200.472 200.472 0 0 1 5.225-45.528 29.982 29.982 0 1 1 59.325 8.528h0.4a140.077 140.077 0 0 0 135.05 177z m173-443a29.95 29.95 0 0 1-25.286-13.9c-0.121 0.157-0.255 0.3-0.368 0.466-51.356-75.812-106.381-131.477-132.256-156.466-0.14 0.161-0.3-0.695-0.445-0.538a17.964 17.964 0 0 0-29.292 0c-0.088-0.095-0.187-0.18-0.274-0.278C330.176 216.364 140.344 419.6 140.344 635.5c0 143.594 116.406 260 260 260a258.778 258.778 0 0 0 147.6-45.952 29.972 29.972 0 1 1 38.88 45.552c0.069 0.094 0.131 0.193 0.2 0.285a318.466 318.466 0 0 1-186.68 60.115c-176.731 0-320-143.269-320-320 0-264.941 241.8-503 305.017-560.713 0.08 0.078 0.169 0.145 0.249 0.222a19.931 19.931 0 0 1 28.46-1.029c0.085-0.093 0.181-0.177 0.265-0.272 31.707 28.469 111.748 104.84 182.017 209.046l-0.22 0.266a29.977 29.977 0 0 1-22.788 49.48z"
                fill="#ffffff" />
            </svg>
            <span style="font-weight: 500">50%</span>
          </div>
        </div>
        <div class="voice" @click="debouncedShowDrawer">
          <svg class="icon" viewBox="0 0 1024 1024" width="0.4rem" height="0.4rem">
            <path
              d="M438.048 107.744l-192.256 182.4h-118.4c-34.432 0-59.072 29.6-59.072 73.92V659.84a67.392 67.392 0 0 0 59.168 73.952h118.4l192.16 177.472c24.64 24.64 49.312 9.856 49.312-29.568V137.344c0-39.424-24.64-54.24-49.312-29.568z m384.512 4.928a46.208 46.208 0 0 0-73.952 0 73.952 73.952 0 0 0 0 88.736 517.632 517.632 0 0 1 0 621.152 73.952 73.952 0 0 0 0 88.736 46.208 46.208 0 0 0 73.952 0c177.472-221.824 177.472-581.696 0-798.624z"
              fill="#ffffff"></path>
            <path
              d="M674.688 290.144a46.208 46.208 0 0 0-73.952 0 73.92 73.92 0 0 0 0 88.736 221.856 221.856 0 0 1 0 266.208 73.92 73.92 0 0 0 0 88.736 46.208 46.208 0 0 0 73.952 0 355.744 355.744 0 0 0 0-443.68z"
              fill="#ffffff"></path>
          </svg>
        </div>
      </div>
      <!-- 动态内容区域：包含功能菜单和功能页面 -->
      <div class="main-content">
        <router-view />
      </div>
    </div>
    <!-- 声音控制（后面也可以增加其他功能，比如屏幕亮度，屏幕保护时间等）抽屉组件 -->
    <template v-if="false">
      <a-drawer :width="500" placement="right" :open="wendu_shidu_control" @close="wendu_shidu_onClose"
        @afterOpenChange="onDrawerOpened">
        <template #extra>
          <a-button type="primary" size="large" @click="debouncedOnClose">关闭</a-button>
        </template>
        <!--slider放在抽屉里加载的时候，打开抽屉会有各种小问题。解决方法，将slider包裹在if里，设置延迟打开。-->
        <template v-if="wendu_shidu_delay">
          <div class="voice_volumn">声音音量</div>
          <a-slider v-model:value="wendu_shidu_value" :tooltip-open="wendu_shidu_tooltip" :marks="wendu_shidu_marks"
            @blur="handleBlur" />
        </template>
      </a-drawer>
    </template>
    <el-drawer v-model="wendu_shidu_control" :show-close="false">
      <template #header="{ close }">
        <div>
          <div class="button" @click="close">退出返回</div>
        </div>
      </template>
      <div class="voice_volumn">声音音量</div>
      <el-slider v-model="wendu_shidu_value" :marks="wendu_shidu_marks" :show-tooltip="true" @change="handleBlur"
        style="padding: 0 15px" />
      <div class="voice_volumn" style="margin-top: 1.5rem">自动关闭屏幕</div>
      <div style="font-size: 0.22rem; color: rgb(204 206 217)">闲置以下时间后关闭屏幕：</div>
      <el-select v-model="screen_sleep_time_value" :options="screen_sleep_time_options" size="large"
        style="width: 240px" @change="change_screen_sleep_time" />
    </el-drawer>
  </div>
</template>

<script setup>
import { useAudioStore } from '@/stores/audioStore'
import { useConfigStore } from '@/stores/configStore'
import { ref, onMounted, onUnmounted } from 'vue'
import plugins from '../assets/js/plugin'
const configStore = useConfigStore()
// 在 script setup 顶部添加图片导入
import deskview4 from '@/assets/images/deskview4.png'
import { debounce } from 'lodash' // 导入Lodash的debounce函数,防抖
// import audioFile from '@/assets/audio/volume_set.mp3'; // 假设WAV文件在此路径
const screen_sleep_time_value = ref(configStore.sleep_time)
const change_screen_sleep_time = async () => {
  // 当滑块失去焦点时，检查是否有改变的值
  if (screen_sleep_time_value.value !== configStore.sleep_time) {
    try {
      let payload = {
        tableName: 'screen_settings',
        setValues: { sleep_time: screen_sleep_time_value.value },
        condition: 'id=1',
      }
      const response = await window.electronAPI.el_post({ action: 'update', payload: payload })
      console.log('el_post调用返回的数据:', response)
      if (response?.success && response?.data) {
        configStore.sleep_time = screen_sleep_time_value.value
        audioStore.play('/audio/screen_sleep_time_set.mp3')
      }
    } catch (error) {
      console.error('screen_settings操作失败:', error)
    }
  }
}
const screen_sleep_time_options = [
  {
    value: 0.1,
    label: '6秒',
  },
  {
    value: 0.15,
    label: '8秒',
  },
  {
    value: 1,
    label: '1分钟',
  },
  {
    value: 2,
    label: '2分钟',
  },
  {
    value: 3,
    label: '3分钟',
  },
  {
    value: 5,
    label: '5分钟',
  },
  {
    value: 10,
    label: '10分钟',
  },
  {
    value: 15,
    label: '15分钟',
  },
  {
    value: 30,
    label: '30分钟',
  },
  {
    value: 45,
    label: '45分钟',
  },
  {
    value: 60,
    label: '1小时',
  },
  {
    value: 120,
    label: '2小时',
  },
  {
    value: 180,
    label: '3小时',
  },
  {
    value: 300,
    label: '5小时',
  },
  {
    value: 480,
    label: '8小时',
  },
  {
    value: 720,
    label: '12小时',
  },
  {
    value: 0,
    label: '从不',
  },
]
const audioStore = useAudioStore()
// 音量设置
const handleBlur = async () => {
  // 当滑块失去焦点时，检查是否有改变的值
  if (wendu_shidu_value.value !== configStore.volume) {
    try {
      let payload = {
        volume: wendu_shidu_value.value
      }
      const response = await window.electronAPI.el_post({
        action: 'set_volume',
        payload: payload,
      })
      console.log('el_post调用返回的数据:', response)
      if (response?.success && response?.data) {
        audioStore.play('/audio/volume_set.mp3')
        console.log(`音量已设置为: ${wendu_shidu_value.value}%`)
        configStore.volume = wendu_shidu_value.value
        // 更新数据库
        let payload = {
          tableName: 'volume_settings',
          setValues: { volume: wendu_shidu_value.value },
          condition: 'id=1',
        }
        window.electronAPI.el_post({ action: 'update', payload: payload })
      }
    } catch (error) {
      console.error('操作失败:', error)
    }
  }
}
// 500毫秒虽然不能完全防抖，但可以减少频繁调用和大部分bug，再多延迟台严重，这已经是最好的了
const debouncedShowDrawer = debounce(() => {
  wendu_shidu_showDrawer()
}, 50)
// 创建关闭抽屉的防抖函数,其实可以取消，因为关闭抽屉不需要防抖
const debouncedOnClose = debounce(() => {
  wendu_shidu_onClose()
}, 50)
const wendu_shidu_marks = ref({
  0: {
    style: {
      color: 'white',
      fontSize: '0.25rem',
    },
    label: '0%',
  },
  100: {
    style: {
      color: 'white',
      fontSize: '0.25rem',
    },
    label: '100%',
  },
})
const preloadBackgroundImage = () => {
  const img = new Image()
  img.onload = () => {
    console.log('抽屉背景图片预加载成功')
  }
  img.onerror = () => {
    console.error('抽屉背景图片预加载失败')
  }
  img.src = deskview4
}
const onDrawerOpened = () => {
  // 抽屉完全打开后，再显示 slider 组件
  wendu_shidu_delay.value = !wendu_shidu_delay.value
  wendu_shidu_tooltip.value = true
}
const wendu_shidu_value = ref(configStore.volume)
const wendu_shidu_tooltip = ref(true)
const wendu_shidu_control = ref(false)
const wendu_shidu_delay = ref(false)
const wendu_shidu_showDrawer = () => {
  wendu_shidu_control.value = true
}
const wendu_shidu_onClose = () => {
  wendu_shidu_control.value = false
  wendu_shidu_tooltip.value = false // 不关闭，数字会一直显示，所以关闭抽屉就需要立马关闭数字显示，然后在onDrawerOpened = ()>中重新打开，但是因为此时抽屉已经关闭，所以打开也不会渲染。
}
const currentTime = ref('')
// 定义定时器
let timer
onMounted(async () => {
  // 预加载抽屉的背景图片，能有效避免抽屉打开时背景图片加载可能带来的短暂空白
  preloadBackgroundImage()
  // 初始化时间
  currentTime.value = plugins.getBeijingTime()
  // 每秒刷新一次时间
  timer = setInterval(() => {
    currentTime.value = plugins.getBeijingTime()
  }, 1000)
})

// 组件卸载时清除定时器
onUnmounted(() => {
  clearInterval(timer)
  debouncedShowDrawer.cancel() // 取消防抖函数,避免内存泄漏
  debouncedOnClose.cancel() // 取消关闭抽屉的防抖函数
})
</script>

<style scoped>
.background_image {
  background-image: url('@/assets/images/deskview1.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #02153d;
  padding: 0.2rem;
  position: relative;
  min-height: 1rem;
}

.logo {
  width: 0.8rem;
  height: auto;
}

.title {
  color: white;
  font-size: 0.46rem;
  background-color: #02153d;
  text-align: center;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
}

.time-display {
  color: white;
  font-size: 0.25rem;
  min-width: 3rem;
}

/* 返回按钮样式 */
.back-button {
  color: white;
  font-size: 0.3rem;
  background-color: #1e3a8a;
  border: 1px solid #3b82f6;
  border-radius: 0.1rem;
  padding: 0.15rem 0.4rem;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 1.2rem;
}

.back-button:hover {
  background-color: #3b82f6;
  transform: translateY(-1px);
}

.back-button:active {
  transform: translateY(0);
}

.back-placeholder {
  min-width: 1.2rem;
  height: 0.5rem;
  visibility: hidden;
}

.main-content {
  flex: 1;
  font-size: 0.5rem;
  overflow: hidden;
}

.wendu_shidu {
  margin-right: 0.8rem;
  font-size: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.2rem;
  border-radius: 0.2rem;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.voice {
  position: absolute;
  right: 0px;
  top: 0px;
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.voice_volumn {
  font-size: 0.25rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1rem 0.2rem;
  border-radius: 0.2rem;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  width: fit-content;
  margin-bottom: 0.6rem;
}
</style>
