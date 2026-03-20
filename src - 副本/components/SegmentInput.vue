<template>
  <div class="segment-input-container">
    <div v-for="(segment, index) in segments" :key="index" class="segment-wrapper">
      <el-input
        ref="inputRefs"
        v-model.number="segments[index]"
        :class="{
          'segment-input': true,
          'has-dot': index < 3,
          'input-active': activeSegmentIndex === index, // 修改这里：使用父组件控制的索引
        }"
        @input="handleInput(index, $event)"
        @keydown="handleKeydown($event, index)"
        @paste="handlePaste($event)"
        @focus="handleFocus($event, index)"
      />
      <span v-if="index < 3" class="segment-dot">.</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, defineExpose } from 'vue'
// 1. 创建一个变量来记录当前聚焦的输入框索引（比如0,1,2,3）
const activeIndex = ref(0)
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  id: { type: String, default: '' }, // <- 新增这行
})

const emit = defineEmits(['update:modelValue', 'focus'])

// 将IP地址分解为4个段
const segments = ref(['', '', '', ''])
const inputRefs = ref([])

// 监听父组件传递的v-model值变化
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal) {
      const newSegments = newVal.split('.')
      if (newSegments.length === 4) {
        segments.value = newSegments
      }
    } else {
      segments.value = ['', '', '', '']
    }
  },
  { immediate: true },
)

// 处理输入
const handleInput = (index, value) => {
  // 保存输入前的值用于比较
  const previousValue = segments.value[index]

  // 基础验证：确保是0-255之间的数字
  if (value !== '') {
    let num = parseInt(value, 10) // 使用 parseInt将输入的字符串转换为十进制整数。这是进行数值范围判断的基础
    if (isNaN(num)) num = 0
    if (num < 0) num = 0
    if (num > 255) num = 255
    segments.value[index] = num.toString()
  } else {
    segments.value[index] = ''
  }

  // 合成完整的IP地址并通知父组件
  const ip = segments.value.join('.')
  emit('update:modelValue', ip)

  // 自动跳转逻辑：输入3位数字后自动跳到下一段,区分"用户新输入"和"点击已满输入框"这两种情况，只有值发生变化且新长度达到3位才跳转。
  if (value && value.toString().length === 3 && index < 3 && previousValue !== value) {
    nextTick(() => {
      if (inputRefs.value[index + 1]) {
        const nextInput = inputRefs.value[index + 1]

        // 先调用 focus()
        nextInput.focus()

        // 延迟设置光标位置
        setTimeout(() => {
          // 确保输入框获得焦点并显示光标
          if (nextInput.$el) {
            const inputEl = nextInput.$el.querySelector('input') || nextInput.$el
            inputEl.focus()

            // 设置选择范围以显示光标
            if (inputEl.setSelectionRange) {
              const currentValue = inputEl.value || ''
              inputEl.setSelectionRange(currentValue.length, currentValue.length) // 光标在末尾
            }
          }
        }, 10)
      }
    })
  }
}

// 处理键盘事件，增强用户体验
const handleKeydown = (event, index) => {
  switch (event.key) {
    case 'ArrowRight':
      if (index < 3) {
        event.preventDefault()
        if (inputRefs.value[index + 1]) {
          inputRefs.value[index + 1].focus()
        }
      }
      break
    case 'ArrowLeft':
      if (index > 0) {
        event.preventDefault()
        if (inputRefs.value[index - 1]) {
          inputRefs.value[index - 1].focus()
        }
      }
      break
    case '.':
      event.preventDefault()
      if (index < 3 && inputRefs.value[index + 1]) {
        inputRefs.value[index + 1].focus()
      }
      break
    case 'Backspace':
      if (segments.value[index] === '' && index > 0) {
        if (inputRefs.value[index - 1]) {
          inputRefs.value[index - 1].focus()
        }
      }
      break
  }
}

// 处理粘贴事件，方便用户快速输入
const handlePaste = (event) => {
  event.preventDefault()
  const pasteData = event.clipboardData.getData('text/plain').trim()
  const pasteSegments = pasteData.split('.')

  if (pasteSegments.length === 4) {
    pasteSegments.forEach((part, idx) => {
      if (idx < 4) {
        let num = parseInt(part, 10)
        if (!isNaN(num) && num >= 0 && num <= 255) {
          segments.value[idx] = num.toString()
        }
      }
    })
    const ip = segments.value.join('.')
    emit('update:modelValue', ip)
  }
}

// 2. 修改handleFocus函数，在聚焦时更新activeIndex
const handleFocus = (event, index) => {
  activeIndex.value = index // 关键：记录当前是第几个输入框
  // 获取当前输入框的DOM元素用于定位
  const currentInput =
    inputRefs.value[index]?.$el?.querySelector('input') || inputRefs.value[index]?.$el

  // 关键：获取当前聚焦输入框的值
  const currentSegmentValue = segments.value[index] || ''

  // 向父组件传递焦点事件，包含定位所需的元素和字段信息
  emit('focus', {
    originalEvent: event,
    targetElement: currentInput,
    segmentIndex: index,
    currentValue: currentSegmentValue, //传递当前输入框的值
    fieldType: 'ipSegment', // 标识这是IP段输入框
    componentId: props.id, // 用于点亮当前输入框，区别于其他输入框
  })
}
// 3. 创建一个方法，供父组件调用，用来更新当前激活输入框的值
const updateActiveSegment = (value) => {
  console.log('updateActiveSegment:', value)
  // 使用现有的handleInput方法来更新指定索引的段，并触发验证和跳转
  handleInput(activeIndex.value, value)
}
// 新增一个内部状态，记录“父组件让我点亮第几个输入框”
const activeSegmentIndex = ref(-1) // -1 表示都不点亮

// 新增一个方法，让父组件可以调用这个方法來控制点亮状态
const setActiveSegment = (index) => {
  activeSegmentIndex.value = index
}
defineExpose({
  updateActiveSegment,
  setActiveSegment,
})
</script>

<style scoped>
.segment-input-container {
  display: flex;
  align-items: center;
  padding: 0 5px;
  transition: border-color 0.2s;
}

.segment-input-container:focus-within {
  border-color: #409eff;
}

.segment-wrapper {
  display: flex;
  align-items: center;
}

.segment-input {
  width: 1.5rem;
  font-size: 0.3rem;
  color: black;
  font-weight: bolder;
  text-align: center;
}
/* 关键修改：使用样式穿透和更高优先级的选择器 */
.input-active :deep(.el-input__wrapper) {
  background-color: #798ef7;
}

.segment-input :deep(.el-input__wrapper) {
  box-shadow: none !important;
  border: none !important;
}

.segment-input.has-dot {
  margin-right: 2px;
}

.segment-dot {
  margin: 0 5px;
  user-select: none;
  color: #fff;
  font-size: 0.23rem;
}
</style>
