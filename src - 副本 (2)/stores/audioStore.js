import { defineStore } from 'pinia'

// defineStore('audio', { ... })里的 'audio'是这个 Store 的唯一标识符（ID），不能重复。
export const useAudioStore = defineStore('audio', {
  state: () => ({
    audioElement: null,
  }),
  actions: {
    setAudioElement(element) {
      this.audioElement = element
    },
    setSrc(src) {
      if (this.audioElement) {
        // 生产环境下，音频文件存储在 dist/audio/ 目录中，开发环境下：/audio/volume_set.mp3（public文件夹）。因此我们需要使用相对路径来引用音频文件。
        // import.meta.env ，这是 Vite 或类似构建工具提供的环境变量功能，
        // Vue 3 项目通常使用 Vite 作为构建工具，因此完全支持。
        // import.meta.env.PROD 是一个布尔值，当项目在生产模式下构建时，它的值为 true，
        // 在开发模式下构建时，它的值为 false。
        // 生产环境下，音频文件存储在 dist/audio/ 目录中，因此我们需要使用相对路径来引用音频文件。
        const temp_src = (import.meta.env.PROD ? '.' : '') + src
        this.audioElement.src = temp_src
      }
    },
    play(src) {
      return new Promise((resolve, reject) => {
        if (!this.audioElement) {
          console.log('Audio element not set')
          reject(new Error('Audio element not set'))
          return
        }

        if (src) {
          this.setSrc(src)
          this.audioElement.onended = resolve
          this.audioElement.onerror = reject
          this.audioElement.play().catch(reject)
        } else {
          reject(new Error('No audio source provided'))
        }
      })
    },

    /*
    play(src) {
      if (this.audioElement) {
        if (src) {
          this.setSrc(src) // 动态设置音频路径
          this.audioElement.play()
        } else {
          console.log('Audio element not set')
        }
      }
    },
    */
  },
})
