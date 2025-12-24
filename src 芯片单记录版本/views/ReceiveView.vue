<template>
  <div>
    <!-- 新增加的返回按钮 -->
    <el-button @click="goBack" style="width:3rem;height:3rem;">返回</el-button>
  </div>
</template>

<script setup>
// 1. 从 vue-router 导入 useRouter
import { useRouter } from 'vue-router'
// 导入 ref 创建响应式变量
import { onMounted, } from 'vue'
// import { useAudioStore } from '@/stores/audioStore'
// const audioStore = useAudioStore()
// 2. 获取路由实例
const router = useRouter()
onMounted(async () => {
})

// 3. 定义返回函数
const goBack = () => {
  router.go(-1)
}
</script>
