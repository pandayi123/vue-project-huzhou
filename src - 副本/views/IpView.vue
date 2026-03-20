<template>
  <div class="home">
    <div class="return-container">
      <div class="button" @click="goBack">
        退出返回
      </div>
      <template>
        <el-form :model="form" :rules="rules" ref="ipForm" label-width="120px">
          <el-form-item label="IP 地址" prop="ipAddress">
            <el-input v-model="form.ipAddress" placeholder="请输入有效的 IP 地址" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm">提交</el-button>
          </el-form-item>
        </el-form>
      </template>

    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回上一页功能[8](@ref)
const goBack = () => {
  // 使用Vue Router的返回方法，比浏览器原生方法更适合Vue应用[6,7](@ref)
  router.back()
  // 也可以使用 router.go(-1)，效果类似[8](@ref)
}

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
  justify-content: center;
  background-color: #02153d;
  padding: 0.2rem;
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
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  /* 改为auto以便滚动 */
  font-size: 0.5rem;
  color: #fff;
  position: relative;
}

/* 返回按钮容器 */
.return-container {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 30px;
}

/* 返回按钮样式 */
.return-btn {
  background: linear-gradient(145deg, #3498db 0%, #2980b9 100%);
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.45rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.3s ease;
  box-shadow:
    0 4px 15px rgba(52, 152, 219, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
}

/* 鼠标悬停效果 */
.return-btn:hover {
  background: linear-gradient(145deg, #3ba3e8 0%, #3498db 100%);
  transform: translateY(-2px);
  box-shadow:
    0 6px 20px rgba(52, 152, 219, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* 点击效果 */
.return-btn:active {
  transform: translateY(0);
  box-shadow:
    0 2px 10px rgba(52, 152, 219, 0.3);
}

/* 按钮图标 */
.btn-icon {
  font-size: 0.5rem;
  font-weight: bold;
}

/* 按钮文字 */
.btn-text {
  letter-spacing: 1px;
}

/* 添加光晕效果 */
.return-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent);
  transition: left 0.5s ease;
}

.return-btn:hover::before {
  left: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .return-btn {
    padding: 0.3rem 0.6rem;
    font-size: 0.4rem;
  }

  .return-container {
    justify-content: center;
  }
}
</style>
