// src/stores/authStore.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // 存储所有验证通过的人员对象数组
  const verifiedUsers = ref([])

  // 清除登录信息
  const clearAuth = () => {
    // ✅ 正确写法：直接赋值为空数组
    verifiedUsers.value = []
  }

  // 设置人员信息
  const setVerifiedUsers = (users) => {
    verifiedUsers.value = users
  }

  return { verifiedUsers, setVerifiedUsers, clearAuth }
})
