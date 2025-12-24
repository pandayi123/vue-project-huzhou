<template>
  <div class="simple-face-register">
    <!-- 页面标题和返回按钮 -->
    <div class="header-section">
      <h3>人脸注册验证</h3>
      <button @click="goBack" class="btn btn-back">
        ← 返回上页
      </button>
    </div>

    <!-- 视频预览 -->
    <div class="video-container">
      <video ref="videoRef" autoplay muted class="camera-view"></video>
      <div v-if="!isCameraActive" class="camera-status">摄像头未启动</div>
    </div>

    <!-- 状态显示 -->
    <div class="status-info">
      <p>状态: {{ statusMessage }}</p>
      <p v-if="currentUserID">用户ID: {{ currentUserID }}</p>
    </div>

    <!-- 操作按钮 -->
    <div class="control-buttons">
      <button @click="toggleCamera" class="btn btn-primary">
        {{ isCameraActive ? '停止摄像头' : '启动摄像头' }}
      </button>
      <button @click="captureAndRegister" :disabled="!isCameraActive || isProcessing" class="btn btn-success">
        {{ isProcessing ? '注册中...' : '开始注册' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router'; // 引入Vue Router

// 获取路由实例
const router = useRouter();

// 响应式数据
const videoRef = ref(null);
const isCameraActive = ref(false);
const isProcessing = ref(false);
const statusMessage = ref('准备就绪');
const currentUserID = ref('');
let mediaStream = null;

// 返回上页功能
const goBack = () => {
  // 方法1: 使用Vue Router的编程式导航（推荐）
  if (router) {
    // 检查是否有上一页历史记录
    if (window.history.length > 1) {
      router.go(-1); // 返回上一页
    } else {
      // 如果没有历史记录，跳转到首页或指定页面
      router.push('/');
    }
  }
  // 方法2: 使用浏览器原生方法（备用方案）
  else if (window.history.length > 1) {
    window.history.back();
  } else {
    // 如果无法返回，可以跳转到应用首页
    window.location.href = '/';
  }
};

// 生成用户ID
const generateUserID = () => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
};

// 摄像头管理
const startCamera = async () => {
  try {
    statusMessage.value = '启动摄像头...';

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    });

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream;
      isCameraActive.value = true;
      statusMessage.value = '摄像头就绪';
    }
  } catch (error) {
    console.error('摄像头启动失败:', error);
    statusMessage.value = `摄像头错误: ${error.message}`;
    isCameraActive.value = false;
  }
};

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  isCameraActive.value = false;
  statusMessage.value = '摄像头已停止';
};

const toggleCamera = async () => {
  if (isCameraActive.value) {
    stopCamera();
  } else {
    await startCamera();
  }
};

// 图像捕获
const captureImage = () => {
  if (!videoRef.value || !isCameraActive.value) {
    throw new Error('摄像头未就绪');
  }

  const canvas = document.createElement('canvas');
  const video = videoRef.value;
  const context = canvas.getContext('2d');

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL('image/png');
};

// 调用人脸注册服务
const registerFace = async (imageData, userID) => {
  // const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

  try {
    // 通过 Electron API 调用后端人脸识别服务
    const response = await window.electronAPI.el_post({
      action: 'face_register',
      payload: {
        user_id: userID,
        image_data: imageData,
        image_type: 'BASE64',
        face_threshold: 80,
        timestamp: Date.now()
      }
    });

    return response;
  } catch (error) {
    console.error('注册请求失败:', error);
    throw new Error(`网络请求失败: ${error.message}`);
  }
};

// 核心注册流程
const captureAndRegister = async () => {
  if (isProcessing.value) return;

  isProcessing.value = true;
  statusMessage.value = '开始注册流程...';

  try {
    // 生成用户ID
    currentUserID.value = generateUserID();
    statusMessage.value = `用户ID: ${currentUserID.value}`;

    // 捕获图像
    const imageData = captureImage();

    // 设置一个短暂的延迟，让“图像捕获”函数执行完成
    await new Promise(resolve => setTimeout(resolve, 300));
    statusMessage.value = '图像捕获成功';

    // 调用注册服务
    statusMessage.value = '正在注册人脸...';
    const result = await registerFace(imageData, currentUserID.value);

    // 处理结果
    if (result.success) {
      statusMessage.value = '人脸注册成功！';

      // 注册成功后，可以设置自动返回或提示用户返回
      setTimeout(() => {
        if (confirm('注册成功！是否返回上页？')) {
          goBack();
        }
      }, 1500);

    } else {
      const errorMsg = getErrorMessage(result.error_code);
      statusMessage.value = errorMsg;
      throw new Error(errorMsg);
    }

  } catch (error) {
    console.error('注册失败:', error);
    statusMessage.value = `注册失败: ${error.message}`;
  } finally {
    isProcessing.value = false;
  }
};

// 错误信息映射
const getErrorMessage = (errorCode) => {
  const errorMap = {
    1: '未检测到人脸',
    2: '已存在该用户',
    3: '检测到多张人脸',
    4: '非活体检测',
    5: '图像质量不合格',
    6: '服务未连接',
    7: '系统繁忙',
    8: '人脸服务异常'
  };
  return errorMap[errorCode] || `注册失败(错误码: ${errorCode})`;
};

// 清理资源
onUnmounted(() => {
  stopCamera();
});
</script>

<style scoped>
.simple-face-register {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  position: relative;
}

/* 头部区域样式 */
.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.header-section h3 {
  margin: 0;
  color: #333;
}

/* 返回按钮样式 */
.btn-back {
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-back:hover {
  background: #545b62;
  transform: translateY(-1px);
}

.video-container {
  position: relative;
  width: 100%;
  height: 400px;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.camera-view {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-status {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #666;
}

.status-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.control-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007acc;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }

  .header-section h3 {
    font-size: 1.2rem;
  }

  .control-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
