<!--视频通话-->
<template>
  <div class="video-chat-container">
    <h1>🎥 低延迟视频对讲系统 (HTTP-FLV)</h1>

    <div class="video-container">
      <div>
        <h3>远程视频</h3>
        <video ref="remoteVideo" controls muted autoplay playsinline></video>
        <div class="status" :style="statusStyle">{{ statusText }}</div>
      </div>
    </div>

    <div class="controls">
      <button @click="connectStream">🔗 连接视频流</button>
      <button @click="disconnectStream">❌ 断开连接</button>
      <button @click="toggleMute">🔇 切换静音</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import flvjs from 'flv.js';

export default {
  name: 'VideoChat',
  setup() {
    const remoteVideo = ref(null);
    const statusText = ref('等待连接...');
    const statusStyle = ref({ color: '#666' });
    const flvPlayer = ref(null);
    const isConnected = ref(false);
    const isMuted = ref(true);
    const streamName = 'av_stream_3333'; // 请替换为实际的流名称

    const updateStatus = (message, type = 'info') => {
      statusText.value = message;
      statusStyle.value = {
        color: type === 'error' ? 'red' :
               type === 'success' ? 'green' : 'blue'
      };
    };

    const connectStream = () => {
      if (flvPlayer.value) {
        disconnectStream();
      }

      const flvUrl = `http://192.168.31.138:8080/live?app=myapp&stream=${streamName}`;

      if (flvjs.isSupported()) {
        flvPlayer.value = flvjs.createPlayer({
          type: 'flv',
          url: flvUrl,
          isLive: true,
          hasAudio: true,
          hasVideo: true
        }, {
          enableWorker: false,
          enableStashBuffer: false,
          stashInitialSize: 128,
          liveBufferLatencyChasing: true,
          liveBufferLatencyMaxLatency: 0.5,
          liveBufferLatencyMinRemain: 0.1
        });

        flvPlayer.value.attachMediaElement(remoteVideo.value);
        flvPlayer.value.load();

        flvPlayer.value.play().then(() => {
          console.log('播放器开始播放');
          updateStatus('✅ 已连接 - 低延迟模式', 'success');
          isConnected.value = true;
        }).catch(err => {
          console.error('播放失败:', err);
          updateStatus('❌ 播放失败: ' + err.message, 'error');
        });

        flvPlayer.value.on(flvjs.Events.METADATA_ARRIVED, () => {
          console.log('流媒体元数据到达');
        });

        flvPlayer.value.on(flvjs.Events.STATISTICS_INFO, (info) => {
          statusText.value = `✅ 已连接 | 速度: ${(info.speed * 8 / 1024)} kbps | 延迟: ${info.latency}s`;
        });

        flvPlayer.value.on(flvjs.Events.ERROR, (error) => {
          console.error('播放错误:', error);
          updateStatus('❌ 连接错误: ' + error, 'error');
          isConnected.value = false;
        });

      } else {
        alert('当前浏览器不支持 flv.js，请使用 Chrome、Firefox 或 Edge 等现代浏览器。');
      }
    };

    const disconnectStream = () => {
      if (flvPlayer.value) {
        flvPlayer.value.pause();
        flvPlayer.value.unload();
        flvPlayer.value.detachMediaElement();
        flvPlayer.value.destroy();
        flvPlayer.value = null;
        updateStatus('🔌 连接已断开');
        isConnected.value = false;
      }
    };

    const toggleMute = () => {
      if (remoteVideo.value) {
        remoteVideo.value.muted = !remoteVideo.value.muted;
        isMuted.value = remoteVideo.value.muted;
        updateStatus(remoteVideo.value.muted ? '🔇 已静音' : '🔊 声音开启');
      }
    };

    onMounted(() => {
      // 3秒后自动连接
      setTimeout(connectStream, 3000);
    });

    onBeforeUnmount(() => {
      disconnectStream();
    });

    return {
      remoteVideo,
      statusText,
      statusStyle,
      connectStream,
      disconnectStream,
      toggleMute
    };
  }
};
</script>

<style scoped>
.video-chat-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.video-container {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

video {
  width: 100%;
  max-width: 640px;
  height: auto;
  border: 2px solid #ccc;
  border-radius: 8px;
}

.controls {
  margin: 20px 0;
}

button {
  padding: 10px 20px;
  margin: 0 10px;
  font-size: 16px;
  cursor: pointer;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
}

button:hover {
  background-color: #45a049;
}

.status {
  margin: 10px 0;
  font-size: 14px;
}
</style>
