<template>
  <div class="function-menu">
    <!-- 功能菜单网格 -->
    <div style="width:100%;height:auto;padding:0 0.6rem;">
      <a-row justify="center" :gutter="[32, 20]">
        <a-col v-for="(functionItem, index) in serviceMenu" :key="index" class="gutter-row" :span="5">
          <div class="gutter-box" :class="{ 'click-animation': activeButton === functionItem }"
            @click="handleFunctionClick(functionItem)">
            {{ functionItem }}
            <!-- 点击时的波纹效果 -->
            <span v-if="activeButton === functionItem" class="ripple-effect"></span>
          </div>
        </a-col>
      </a-row>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAudioStore } from '@/stores/audioStore';
import plugins from '../assets/js/plugin'
const audioStore = useAudioStore();
const router = useRouter()
const activeButton = ref('')
const isAnimating = ref(false)

const serviceMenu = ref(['领用', '归还', '盘点', '日志审计', /*'系统状态',*/ '系统设置', '反馈更新',/*'出厂测试'*/])
// === 新增：统一跳转到验证页面的函数 ===
const goToVerification = (targetPath, functionName) => {
  router.push({
    path: '/loginview', // 验证页面路由
    query: {
      redirect: targetPath,  // 告诉验证页，验证完后要去哪里
      actionName: functionName // 告诉验证页，当前要在做什么操作（用于显示标题）
    }
  })
}
const handleFunctionClick = async (functionName) => {
  // 防止重复点击
  if (isAnimating.value) return
  audioStore.play(`/audio/${functionName}.mp3`)
  isAnimating.value = true
  activeButton.value = functionName

  console.log(`用户点击了: ${functionName}`)
  plugins.logUserAction('点击事件', `点击'${functionName}'按钮`, {})

  // 等待动画效果完成（调整为0.2秒）
  setTimeout(() => {
    switch (functionName) {
      case '领用':
        goToVerification('/receive', '领用')
        break;
      case '归还':
        goToVerification('/return', '归还')
        break;
      case '日志审计':
        goToVerification('/logs', '日志审计')
        break;
      case '系统设置':
        router.push('/systemSettings')
        break;
      case '出厂测试':
        router.push('/factorytest')
        break;
      case '反馈更新':
        // 无需 goToVerification，直接跳转
        router.push('/feedbackupdate')
        break;
      default:
        console.warn(`未配置的功能: ${functionName}`)
    }

    // 动画完成后重置状态
    setTimeout(() => {
      activeButton.value = ''
      isAnimating.value = false
    }, 50) // 相应缩短重置延迟
  }, 200) // 与CSS动画时间保持一致（0.2秒）
}
</script>

<style scoped>
.function-menu {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.gutter-row {
  margin-bottom: 20px;
}

.gutter-box {
  background-image: url('@/assets/images/deskview6.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  font-size: 0.5rem;
  cursor: pointer;
  text-align: center;
  padding: 0.7rem 0;
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  /* 调整为0.2s */
  color: white;
  font-weight: 600;
  letter-spacing: 1px;

  position: relative;
  overflow: hidden;
  opacity: 0.8;

  /* === 原有样式 === */
  border: none;
  box-shadow:
    inset 0 0 10px rgba(0, 242, 255, 0.3),
    0 0 15px rgba(0, 208, 255, 0.5);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    width: 80%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00f2ff, transparent);
    border-radius: 50%;
    opacity: 0.7;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 10%;
    width: 80%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #00f2ff, transparent);
    border-radius: 50%;
    opacity: 0.7;
  }

  &:hover {
    opacity: 1;
    transform: scale(1.02);
    box-shadow:
      inset 0 0 15px rgba(0, 242, 255, 0.5),
      0 0 25px rgba(0, 208, 255, 0.8);
  }

  /* === 点击动画效果调整为0.2s === */
  &.click-animation {
    animation: clickEffect 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    /* 调整为0.2s */
  }
}

/* 点击动画关键帧 */
@keyframes clickEffect {
  0% {
    transform: scale(1);
    box-shadow:
      inset 0 0 10px rgba(0, 242, 255, 0.3),
      0 0 15px rgba(0, 208, 255, 0.5);
  }

  50% {
    transform: scale(0.95);
    box-shadow:
      inset 0 0 20px rgba(0, 242, 255, 0.8),
      0 0 30px rgba(0, 208, 255, 1),
      0 0 40px rgba(0, 208, 255, 0.6);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    box-shadow:
      inset 0 0 10px rgba(0, 242, 255, 0.3),
      0 0 15px rgba(0, 208, 255, 0.5);
  }
}

/* 波纹扩散效果调整为0.3s */
.ripple-effect {
  position: absolute;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 242, 255, 0.6) 0%, transparent 70%);
  transform: scale(0);
  animation: ripple 0.3s ease-out;
  /* 相应缩短 */
  width: 100px;
  height: 100px;
  top: 50%;
  left: 50%;
  margin-top: -50px;
  margin-left: -50px;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}

/* 可选：添加点击音效样式提示 */
.gutter-box:active {
  filter: brightness(1.2);
}

.keyboard-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 10px;
}
</style>
