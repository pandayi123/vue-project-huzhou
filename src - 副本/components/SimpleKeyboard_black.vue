<template>
  <!-- 包装容器：用于隔离样式并作为定位基准 -->
  <div class="simple-keyboard-internal-wrapper">
    <div :class="keyboardClass"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import chineseLayout from 'simple-keyboard-layouts/build/layouts/chinese'
import { useAudioStore } from '@/stores/audioStore'
import { debounce, throttle } from 'lodash'

const audioStore = useAudioStore()
const props = defineProps({
  keyboardClass: {
    type: String,
    default: 'simple-keyboard',
  },
  modelValue: [String, Number],
  defaultLayout: {
    type: String,
    default: 'default',
  },
  // --- 新增：最大长度限制，默认为 0 (不限制) ---
  maxLength: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue', 'onKeyPress'])
let keyboard = ref(null)

// --- 防抖按键处理 ---
const debounceOnKeyPress = ref(
  debounce((button) => {
    emit('onKeyPress', button)
    switch (button) {
      case '{close}':
        audioStore.play(`/audio/关闭键盘.mp3`)
        break
      case '{clear}':
        keyboard.value.setInput('')
        emit('update:modelValue', '')
        audioStore.play('/audio/清空.mp3')
        break
      case '{bksp}':
        audioStore.play(`/audio/回退.mp3`)
        break
      case '{enter}':
        audioStore.play(`/audio/换行.mp3`)
        break
      case '{change}':
        audioStore.play(`/audio/敲键盘通用声音.mp3`)
        toggleChineseInput()
        break
      default:
        audioStore.play(`/audio/敲键盘通用声音.mp3`)
    }
    if (button === '{shift}' || button === '{lock}') handleShift()
  }, 100),
)

// --- 中英文切换 ---
const toggleChineseInput = () => {
  if (!keyboard.value) return
  const currentLayoutCandidates = keyboard.value.options.layoutCandidates !== null

  if (currentLayoutCandidates) {
    // 切英文
    keyboard.value.setOptions({
      layoutCandidates: null,
      display: {
        ...keyboard.value.options.display,
        '{change}': '中/英文（英语）'
      }
    })
  } else {
    // 切中文
    keyboard.value.setOptions({
      layoutCandidates: chineseLayout.layoutCandidates,
      display: {
        ...keyboard.value.options.display,
        '{change}': '中/英文（中文）'
      }
    })
  }
}

// --- 输入节流与同步 ---
let lastProcessedInput = ''
const throttleOnChange = ref(
  throttle(() => {
    let input = keyboard.value.getInput()
    // console.log('throttleOnChange', input)
    emit('update:modelValue', input)
    lastProcessedInput = input
  }, 200),
)

const checkAndClearUnprocessedInput = () => {
  if (keyboard.value) {
    const currentInput = keyboard.value.getInput()
    if (currentInput !== lastProcessedInput) {
      keyboard.value.setInput(lastProcessedInput)
      emit('update:modelValue', lastProcessedInput)
    }
  }
}

const handleShift = () => {
  const currentLayout = keyboard.value.options.layoutName
  const shiftToggle = currentLayout === 'default' ? 'shift' : 'default'
  keyboard.value.setOptions({ layoutName: shiftToggle })
}

onMounted(() => {
  keyboard.value = new Keyboard(props.keyboardClass, {
    newLineOnEnter: true,
    onChange: () => {
      throttleOnChange.value()
      setTimeout(checkAndClearUnprocessedInput, 50)
    },
    onKeyPress: (button) => {
      debounceOnKeyPress.value(button)
    },
    layoutName: props.defaultLayout,
    layoutCandidates: chineseLayout.layoutCandidates,
    layoutCandidatesPageSize: 22,
    layout: {
      number: ['5 6 7 8 9', '1 2 3 4', '0 {bksp} {clear} {close}'],
      default: [
        '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
        '{tab} q w e r t y u i o p [ ] \\',
        "{lock} a s d f g h j k l ; ' {enter}",
        '{close} z x c v b n m , . / {submit}',
        '{clear} {space} {change}',
      ],
      shift: [
        '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
        '{tab} Q W E R T Y U I O P { } |',
        '{lock} A S D F G H J K L : " {enter}',
        '{close} Z X C V B N M < > ? {submit}',
        '{clear} {space} {change}',
      ],
    },
    display: {
      '{bksp}': '回退',
      '{tab}': 'Tab',
      '{enter}': '换行',
      '{space}': '空格',
      '{shift}': 'Shift',
      '{lock}': '大/小写',
      '{close}': '关闭键盘',
      '{clear}': '清空',
      '{change}': '中/英文（中文）',
      '{submit}': '提交保存',
    },
  })

  // 监听物理键盘输入
  const inputElement = document.querySelector(`.${props.keyboardClass} .hg-input`)
  if (inputElement) {
    let isComposing = false
    inputElement.addEventListener('compositionstart', () => { isComposing = true })
    inputElement.addEventListener('compositionend', (e) => {
      isComposing = false
      keyboard.value.setInput(e.target.value)
      emit('update:modelValue', e.target.value)
    })
    inputElement.addEventListener('input', (e) => {
      if (!isComposing) {
        keyboard.value.setInput(e.target.value)
        emit('update:modelValue', e.target.value)
      }
    })
  }

  // 初始化赋值
  nextTick(() => {
    if (props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== '') {
      keyboard.value.setInput(props.modelValue.toString())
    }
  })
})

watch(
  () => props.modelValue,
  (newValue) => {
    keyboard.value.setInput(newValue)
    // 2. 【核心修复】同步更新 lastProcessedInput
    // 告诉内部逻辑："这个新值是合法的最新状态，请以它为准，不要用旧值覆盖它"
    lastProcessedInput = newValue
  },
)

watch(
  () => props.defaultLayout,
  (newLayout) => {
    if (keyboard.value) {
      keyboard.value.setOptions({ layoutName: newLayout })
    }
  },
)

// 【新增】定义一个专门给父组件调用的方法
// ==========================================
const setInput = (input) => {
  if (keyboard.value) {
    // 1. 修改键盘内部的值
    keyboard.value.setInput(input)

    // 2. 【关键】同步内部状态，防止键盘内部的 checkAndClearUnprocessedInput 把旧值复活
    lastProcessedInput = input
  }
}

// ==========================================
// 【新增】显式暴露给父组件
// ==========================================
defineExpose({
  setInput
})
</script>

<style>
/* =========================================
   1. 键盘基础按键样式
   ========================================= */

/* 确保包裹层是相对定位，作为候选词绝对定位的基准 */
.simple-keyboard-internal-wrapper {
  position: relative;
  width: 100%;
}

.simple-keyboard-internal-wrapper .hg-theme-default .hg-button {
  height: 0.7rem;
  font-size: 0.3rem;
  /* 颜色由父组件控制，这里不写死 color */
}

/* 单独调整数字0按键的宽度 */
/*
.simple-keyboard-internal-wrapper .hg-theme-default .hg-button[data-skbtn="0"] {
  min-width: 1rem;
  flex-grow: 2;
}
*/

/* =========================================
   【新增】数字键盘(number) 专用样式
   当布局为 number 时，库会自动添加 .hg-layout-number 类
   ========================================= */
.simple-keyboard-internal-wrapper .hg-theme-default.hg-layout-number .hg-button {
  height: 1.3rem !important;  /* 修改这里：设置你想要的高度，例如 1.2rem */
  font-size: 0.35rem;          /* 可选：数字通常可以大一点 */
  font-weight: bold;
}

/* 数字键盘下的特殊功能键 (回退、清空等) 可以稍微小一点或保持一致，看需求 */
.simple-keyboard-internal-wrapper .hg-theme-default.hg-layout-number .hg-functionBtn {
  font-size: 0.3rem; /* 功能键文字改小一点，避免撑开 */
}

/* =========================================
   2. 中文候选词区域适配 - 修复间隙与深色模式
   ========================================= */

/* 候选词容器 */
.simple-keyboard-internal-wrapper .hg-candidate-box {
  position: absolute !important;

  /* [核心修复] 使用 Top + Transform 定位 */
  top: 0 !important;
  transform: translateY(-100%) !important;

  /* [核心修复] 消除父组件 padding-top: 5px 带来的间隙 */
  margin-top: -5px !important;

  left: 0 !important;
  width: 100% !important;

  /* 深色背景适配 */
  background: #1c2538 !important;
  border-top: 2px solid #00f2ff;
  box-shadow: 0 -5px 15px rgba(0, 0, 0, 0.5);

  height: 0.8rem;
  z-index: 10000 !important;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

/* 候选词列表 */
.simple-keyboard-internal-wrapper .hg-candidate-box-list {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  flex: 1;
  align-items: center;
  height: 100%;
}

/* 单个候选词 */
.simple-keyboard-internal-wrapper .hg-candidate-box-list-item {
  background: transparent;
  border: 1px solid transparent;
  color: #fff;
  /* 白字 */

  font-size: 0.25rem;
  margin: 0 5px;
  padding: 0 10px;
  height: 80%;
  display: flex;
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

/* 候选词悬停/选中 */
.simple-keyboard-internal-wrapper .hg-candidate-box-list-item:hover,
.simple-keyboard-internal-wrapper .hg-candidate-box-list-item:active {
  background: rgba(0, 242, 255, 0.15);
  border-color: #00f2ff;
  color: #00f2ff;
}

/* 分页按钮 (上一页/下一页) */
.simple-keyboard-internal-wrapper .hg-candidate-box-prev,
.simple-keyboard-internal-wrapper .hg-candidate-box-next {
  background: #2a3546;
  border: 1px solid #4a5c76;
  color: #fff;

  border-radius: 4px;
  padding: 0 10px;
  margin: 0 5px;
  height: 60%;
  display: flex;
  align-items: center;
  font-size: 0.2rem;
  cursor: pointer;
  transition: all 0.2s;
}

.simple-keyboard-internal-wrapper .hg-candidate-box-prev:hover,
.simple-keyboard-internal-wrapper .hg-candidate-box-next:hover {
  background: #00f2ff;
  color: #000;
  border-color: #00f2ff;
}

/* 隐藏横向滚动条 */
.simple-keyboard-internal-wrapper .hg-candidate-box-list::-webkit-scrollbar {
  height: 0px;
  background: transparent;
}
</style>
