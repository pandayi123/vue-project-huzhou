<template>
  <!-- 可以在这里添加一个包装容器以便更好地控制样式 -->
  <div class="keyboard-container">
    <div :class="keyboardClass">
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import chineseLayout from 'simple-keyboard-layouts/build/layouts/chinese'; // 导入中文布局
import { useAudioStore } from '@/stores/audioStore'
import { debounce, throttle } from 'lodash' // 导入Lodash的debounce函数,防抖
const audioStore = useAudioStore()
const props = defineProps({
  keyboardClass: {
    type: String,
    default: 'simple-keyboard',
  },
  modelValue: [String, Number], // 修改这里：允许 String 或 Number 类型
  defaultLayout: {
    // 新增：控制默认布局
    type: String,
    default: 'default', // 可选：'default', 'number', 'shift'
  },
})

const emit = defineEmits(['update:modelValue', 'onKeyPress'])

let keyboard = ref(null)
// 防抖函数，防止短时间内多次触发
const debounceOnKeyPress = ref(
  debounce((button) => {
    emit('onKeyPress', button)
    switch (button) {
      case '{close}':
        audioStore.play(`/audio/关闭键盘.mp3`)
        break
      case '{clear}':
        keyboard.value.setInput('') // 清空输入框
        emit('update:modelValue', '') // 通知父组件
        audioStore.play('/audio/清空.mp3') // 播放清空音效
        break
      case '{bksp}':
        audioStore.play(`/audio/回退.mp3`)
        break
      case '{enter}':
        audioStore.play(`/audio/换行.mp3`)
        break
      case '{change}':
        // 中英文切换功能
        audioStore.play(`/audio/敲键盘通用声音.mp3`)
        toggleChineseInput()
        break
      default:
        // 仅当 button 是数字 0-9 时播放音频
        /*
        if (/^[0-9]$/.test(button)) {
          audioStore.play(`/audio/${button}.mp3`);
        } else {
          audioStore.play(`/audio/敲键盘通用声音.mp3`)
        }
        */
        audioStore.play(`/audio/敲键盘通用声音.mp3`)
    }
    if (button === '{shift}' || button === '{lock}') handleShift()
  }, 100),
)
const toggleChineseInput = () => {
  if (!keyboard.value) return

  const currentLayoutCandidates = keyboard.value.options.layoutCandidates !== null

  if (currentLayoutCandidates) {
    // 切换到英文
    keyboard.value.setOptions({
      layoutCandidates: null,
      display: {
        ...keyboard.value.options.display,
        '{change}': '中/英文（英语）'
      }
    })
    // audioStore.play('/audio/切换到英文.mp3')
  } else {
    // 切换到中文 - 使用直接导入的chineseLayout
    keyboard.value.setOptions({
      layoutCandidates: chineseLayout.layoutCandidates,
      display: {
        ...keyboard.value.options.display,
        '{change}': '中/英文（中文）'
      }
    })
    // audioStore.play('/audio/切换到中文.mp3')
  }
}
let lastProcessedInput = '' // 记录最后一次被节流函数处理的输入值
const throttleOnChange = ref(
  throttle(() => {
    let input = keyboard.value.getInput()
    console.log('throttleOnChange', input)
    emit('update:modelValue', input)
    lastProcessedInput = input // 更新最后一次处理的输入值
    // console.log('lastProcessedInput', lastProcessedInput)
  }, 200), // 每 200 毫秒最多输入一个字符，防止短时间内多次触发
)
// 检查并删除未被节流函数处理的字符
const checkAndClearUnprocessedInput = () => {
  if (keyboard.value) {
    const currentInput = keyboard.value.getInput()
    /*console.log(
      'checkAndClearUnprocessedInput,当前值：',
      currentInput,
      '前值：',
      lastProcessedInput,
    )
      */
    if (currentInput !== lastProcessedInput) {
      // 如果当前输入未被节流函数处理，则回退到上一次处理的输入值
      keyboard.value.setInput(lastProcessedInput)
      //console.log('回退到上一次处理的输入值后键盘的值：', keyboard.value.getInput())
      emit('update:modelValue', lastProcessedInput)
    }
  }
}

// 切换大小写布局
const handleShift = () => {
  const currentLayout = keyboard.value.options.layoutName
  const shiftToggle = currentLayout === 'default' ? 'shift' : 'default'
  keyboard.value.setOptions({ layoutName: shiftToggle })
}

onMounted(() => {
  // 初始化键盘实例
  keyboard.value = new Keyboard(props.keyboardClass, {
    newLineOnEnter: true,
    onChange: () => {
      throttleOnChange.value() // 触发节流函数

      // 延迟50检查，确保节流函数有机会处理输入,对于任何输入，都保证至少50毫秒的延迟执行checkAndClearUnprocessedInput
      setTimeout(checkAndClearUnprocessedInput, 50)
    },
    onKeyPress: (button) => {
      debounceOnKeyPress.value(button)
    },
    layoutName: props.defaultLayout, // 新增：设置默认布局
    layoutCandidates: chineseLayout.layoutCandidates, // 直接使用导入的布局
    layoutCandidatesPageSize: 22, // 设置候选词每页显示数量为22个
    layout: {
      number: ['7 8 9', '4 5 6', '1 2 3', '0 {bksp} {clear} {close}'],
      default: [
        '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
        '{tab} q w e r t y u i o p [ ] \\',
        "{lock} a s d f g h j k l ; ' {enter}",
        '{close} z x c v b n m , . / {submit}',
        '{clear} {space} {change}', // 添加切换按钮
      ],
      shift: [
        '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
        '{tab} Q W E R T Y U I O P { } |',
        '{lock} A S D F G H J K L : " {enter}',
        '{close} Z X C V B N M < > ? {submit}',
        '{clear} {space} {change}', // 添加切换按钮
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
      '{change}': '中/英文（中文）', // 添加切换按钮显示文本
      '{submit}': '提交保存',
    },
  })

  // 监听中文输入法事件
  const inputElement = document.querySelector(`.${props.keyboardClass} .hg-input`)
  if (inputElement) {
    let isComposing = false
    inputElement.addEventListener('compositionstart', () => {
      isComposing = true
    })
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
  // +++ 新增的关键步骤：初始化键盘的值，使其等于父组件的初始值 +++
  // 确保在下一个DOM更新周期后设置初始值，避免可能出现的同步问题
  nextTick(() => {
    if (props.modelValue !== undefined && props.modelValue !== null && props.modelValue !== '') {
      // 将父组件传递的初始值设置给键盘
      keyboard.value.setInput(props.modelValue.toString()) // 使用 toString() 确保为字符串
    }
  })
})
// 监听外部输入值变化，同步到键盘
watch(
  () => props.modelValue,
  (newValue) => {
    console.log('watch:', newValue)
    keyboard.value.setInput(newValue)
    /*
    if (newValue !== keyboard.value.getInput()) {
      keyboard.value.setInput(newValue)
    }
    */
  },
)
// 监听 defaultLayout 变化，动态切换布局.这里没用到。此代码可以删除。
watch(
  () => props.defaultLayout,
  (newLayout) => {
    if (keyboard.value) {
      keyboard.value.setOptions({ layoutName: newLayout })
    }
  },
)
</script>
<style>
/* 关键：在这里设置键盘按键高度 */
.keyboard-container .hg-theme-default .hg-button {
  height: 0.7rem;
  font-size: 0.3rem;
  color:#333;
}

/* 单独调整数字0按键的宽度 */
.keyboard-container .hg-theme-default .hg-button[data-skbtn="0"] {
  width: 1rem;
  /* 根据需要调整宽度值 */
}

.keyboard-container .hg-candidate-box {
  position: absolute !important;
  bottom: 3.84rem !important;
  right: 0 !important;
  width: 100% !important;
  border-radius: 5px;
  height: 0.7rem;
  overflow-y: hidden;
  z-index: 10000 !important;
  padding: 5px 20px;
}

.keyboard-container .hg-candidate-box-list {
  display: flex;
  flex-wrap: wrap;
}

.keyboard-container .hg-candidate-box-list-item {
  background: white;
  border: 1px solid #ddd;
  font-size: 0.25rem;
  margin-left: 10px;
  height: 100%;
  border-radius: 5px;
  color:#333;
}

.keyboard-container .hg-candidate-box-list-item:hover {
  background: #e6f3ff;
}

/* 分页按钮样式 */
.keyboard-container .hg-candidate-box-prev,
.keyboard-container .hg-candidate-box-next {
  background: #ddd;
  border: 1px solid #bbb;
  border-radius: 3px;
  padding: 5px 10px;
  margin: 0 5px;
  font-size: 0.2rem;
}

.keyboard-container .hg-candidate-box-prev:hover,
.keyboard-container .hg-candidate-box-next:hover {
  background: #ccc;
}
</style>
