import io from 'socket.io-client'

// import axios from 'axios'

// 模块内部保存终端实例
let terminalInstance = null

// axios.defaults.baseURL = 'http://localhost:3000' // 设置默认的请求地址,也可以在请求时单独设置

// 上传数据到服务器
export const upload_data_to_server = async (options, delay = 1, serverIp = '', port = '') => {
  /*
  options:{
  logs:bolean
  }
  */
  try {
    if (terminalInstance == null) {
      console.log('terminalInstance:null')
      return
    }
    // 如果传入了serverIp和port，优先使用传入的参数
    // 如果没传入，且terminalInstance存在，使用terminalInstance的配置
    if (!serverIp && !port) {
      serverIp = terminalInstance.configStore.network.server_ip
      port = terminalInstance.configStore.network.server_port1
    }
    // 如果还是没有serverIp和port，抛出错误
    if (!serverIp || !port) {
      throw new Error('缺少服务器地址配置，请传入serverIp和port参数或确保terminalInstance已初始化')
    }
    delay = delay == 1 ? Math.floor(Math.random() * 20000) : delay // 生成一个随机延迟时间0到20秒的整数，单位为毫秒,实时推送的话传0
    // axios.defaults.baseURL = 'http://' + serverIp + ':' + port
    const url = 'http://' + serverIp + ':' + port + '/api/terminal/data'
    console.log('准备上传数据到服务器，延迟执行秒数:', delay, '服务器ip:', url)
    // await new Promise((resolve) => setTimeout(resolve, delay))
    // dataType的取值：log,other（用来指定推送到rabbitmq哪个队列）。平台会在messageWorker文件里，根据上传的内容自动判断需要更新哪个表，
    if (options.terminal == true) {
      console.log('开始上传terminal_settings数据')
      const result = await window.electronAPI.el_post({
        action: 'queryAndUploadData',
        payload: {
          tableName: 'terminal_settings',
          url: url,
          condition: '', // 可选条件
          orderBy: 'rowid ASC', // 可选排序
          batchSize: 300, // 每批次上传数量，默认300
          terminalId: terminalInstance.terminalId,
          dataType: 'other',
        },
      })
      console.log('上传terminal_settings完成，处理结果:', result)
    }
    // 查询日志数据并分批次上传
    if (options.logs == true) {
      console.log('开始上传logs数据')
      const result = await window.electronAPI.el_post({
        action: 'queryAndUploadData',
        payload: {
          tableName: 'logs',
          url: url,
          condition: 'is_synced = 0', // 可选条件
          orderBy: 'rowid ASC', // 可选排序
          batchSize: 300, // 每批次上传数量，默认300
          terminalId: terminalInstance.terminalId,
          dataType: 'log',
        },
      })
      console.log('上传logs完成，处理结果:', result)
    }

    return
    /*
    // 使用axios发送请求，获取响应
    const response = await axios({
      // withCredentials: true, // 跨域请求时是否需要使用凭证
      method: 'post', // 请求方式
      url: '/api/terminal/data', // `baseURL` 将自动加在 `url` 前面，除非 `url` 是一个绝对 URL。
      data: {
        data: {},
        terminalId: options.terminalId,
        dataType: options.dataType,
      }, // `data` 是作为请求体被发送的数据。仅适用 'PUT', 'POST', 'DELETE 和 'PATCH' 请求方法
    })
    console.log(response.data)
    return response.data
    */
  } catch (err) {
    console.error('Error fetching data:', err)
    return null
  }
}

class SmartLockerTerminal {
  constructor(serverUrl, terminalId) {
    this.terminalId = terminalId
    this.serverUrl = serverUrl
    this.socket = null
    this.configStore = null // 将 store 作为实例属性，先置为 null
    this.reconnectEnabled = true // 重连总开关，如不需要自动重连，可设置为 false
    this.initializeStore() // 调用初始化Store的方法
    this.connect()
  }

  connect() {
    // 先完全断开旧连接（如果存在）
    this.disconnect()

    // 创建新连接
    this.socket = io(this.serverUrl, {
      query: { terminalId: this.terminalId },
      reconnection: this.reconnectEnabled, // 使用开关控制
      reconnectionAttempts: Infinity, // 自动重连的最大尝试次数，Infinity 表示无限次重连
      reconnectionDelay: 10000, // 每次重连的延迟时间（毫秒），这里是 10 秒
      reconnectionDelayMax: 10000, // 最大重连延迟时间，避免重连间隔过大
      timeout: 30000, // 如果在 30 秒内未能建立连接，则会触发连接超时错误。
    })
    this.setupEventListeners()
  }

  /*
    import('@/stores/configStore')不能放在plugin.js的首部，这个导入会发生在 app.use(pinia)之前，会报错
    也就是在 Pinia 状态管理库被正确安装和激活之前就尝试使用它了。简单来说，就是代码执行顺序出了问题，使用 Store 的时机早于 Pinia 本身的初始化
    当 const { useConfigStore } = await import('@/stores/configStore');放入initializeStore()方法中，
    由于在app.vue加载完成的情况下才会调用plugins.createTerminal初始化socket,此时pinia已经初始化完成，所以不会报错.
    */
  async initializeStore() {
    // 此时调用 useConfigStore，会确保在 Vue 组件上下文中执行
    const { useConfigStore } = await import('@/stores/configStore')
    this.configStore = useConfigStore()
  }

  disconnect() {
    if (this.socket) {
      /*
      reconnection(false) = 告诉系统"不要开始新的重连"
      skipReconnect = true = 强制"立即停止所有当前的重连活动"
      */
      // 完全禁用自动重连，避免在主动断开时触发重连逻辑
      this.socket.io.reconnection(false)
      this.socket.io.skipReconnect = true // 额外设置跳过重连标志
      // 移除所有事件监听器，防止内存泄漏
      this.socket.removeAllListeners()
      // 断开连接
      this.socket.disconnect()
      this.socket = null
    }
  }

  updateServerUrl(newServerUrl) {
    console.log(`更新服务器地址: ${this.serverUrl} -> ${newServerUrl}`)

    // 步骤1: 在更新地址前，先完全断开并清理旧连接
    this.disconnect()

    // 步骤2: 等待一小段时间确保旧连接完全清理
    setTimeout(() => {
      // 步骤3: 更新目标地址
      this.serverUrl = newServerUrl
      // 步骤4: 建立新连接
      this.connect()
    }, 100)
  }

  // 返回sqlite3数据库时间格式一致的日期时间，
  toLocalDateTime(date) {
    const d = date || new Date()
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0') +
      ' ' +
      String(d.getHours()).padStart(2, '0') +
      ':' +
      String(d.getMinutes()).padStart(2, '0') +
      ':' +
      String(d.getSeconds()).padStart(2, '0')
    )
  }

  setupEventListeners() {
    this.socket
      .on('connect', () => {
        console.log('已成功和服务器建立websocket连接')
        // 更新终端连接状态和连接时间等数据库记录
        this.configStore.terminal.connection_status = 'connected'
        this.configStore.terminal.last_connected_time = this.toLocalDateTime(new Date())
        let payload = {
          tableName: 'terminal_settings',
          setValues: {
            connection_status: this.configStore.terminal.connection_status,
            last_connected_time: this.configStore.terminal.last_connected_time,
          },
          condition: 'id=1',
        }
        window.electronAPI.el_post({ action: 'update', payload: payload })
        // 连接成功后是否启用断线自动重连（如果需要）
        this.socket.io.reconnection(this.reconnectEnabled)
        // 终端连接成功后，推送数据到服务器数据库
        upload_data_to_server({
          logs: true,
          terminal: true,
        })
      })
      .on('disconnect', (reason) => {
        console.log('连接断开:', reason)
        // 可以根据 reason 判断是主动断开还是意外断开
        if (reason === 'io client disconnect') {
          console.log('连接由客户端主动断开')
        } else {
          console.log('连接意外断开，将尝试自动重连')
        }
      })
      .on('connect_error', (error) => {
        console.error('连接错误:', error.message)
        // 可以在这里添加错误处理逻辑，如通知用户网络异常
      })
      .on('terminal:config_update', (config) => this.applyNewConfiguration(config))
      .on('video:call_alert', (data) => this.startVideoCall(data.callId))
      .on('log:upload_ack', (ack) => console.log('日志上传成功, ID:', ack.logId))
      .on('data:insert_success', (data) => this.handleDataInsertSuccess(data))
  }

  // 手动重连方法（可选）
  manualReconnect() {
    if (!this.socket || !this.socket.connected) {
      console.log('尝试手动重连...')
      this.connect()
    }
  }

  uploadLogs(logData) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('log:upload', logData)
    } else {
      console.warn('WebSocket 未连接，无法上传日志')
      // 可以在这里实现日志缓存机制，待连接恢复后重新发送
    }
  }

  requestVideoCall(additionalData = {}) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('video:terminal_request', { terminalId: this.terminalId, ...additionalData })
    } else {
      console.warn('WebSocket 未连接，无法请求视频通话')
    }
  }

  applyNewConfiguration(config) {
    console.log('应用配置:', config)
  }

  startVideoCall(callId) {
    console.log('启动视频通话:', callId)
  }

  /**
   * 处理数据插入成功事件
   * @param {Object} data - 插入结果数据
   */
  async handleDataInsertSuccess(data) {
    // 使用守卫语句进行参数验证
    if (!data?.insertResult) {
      console.warn('handleDataInsertSuccess: 无效的插入结果数据', data)
      return
    }

    const { insertResult } = data
    console.log('服务器回传同步数据结果:', insertResult)

    // 检查是否为日志表且包含插入的记录ID
    if (
      insertResult.tableName === 'logs' &&
      Array.isArray(insertResult.insertedRecordIds) &&
      insertResult.insertedRecordIds.length > 0
    ) {
      try {
        // 使用 Promise.all 并行处理所有更新请求
        const updatePromises = insertResult.insertedRecordIds.map((recordId) =>
          window.electronAPI.el_post({
            action: 'update',
            payload: {
              tableName: 'logs',
              setValues: { is_synced: 1 },
              condition: `id=${recordId}`,
            },
          }),
        )

        // 等待所有更新操作完成
        await Promise.all(updatePromises)
        console.log(`成功更新 ${insertResult.insertedRecordIds.length} 条日志记录的异步状态`)
      } catch (error) {
        console.error('更新日志异步状态失败:', error)
        // 可以选择记录错误但不中断主流程
      }
    }
  }

  /**
   * 记录用户行为日志
   * @param {string} action - 用户行为类型（如：login、logout、button_click、page_view等）
   * @param {string} description - 行为描述
   * @param {Object} extraData - 额外数据
   */
  logUserAction(action, description, extraData = {}) {
    const logData = {
      action,
      description,
      terminal_id: this.terminalId,
      timestamp: this.toLocalDateTime(new Date()),
      ...extraData,
    }

    console.log('用户行为日志:', logData)

    // 上传到服务器
    /*
    this.uploadLogs({
      type: 'user_action',
      data: logData,
    })
    */

    // 同时保存到本地数据库
    const payload = {
      tableName: 'logs',
      setValues: logData,
    }

    window.electronAPI
      .el_post({ action: 'insert', payload: payload })
      .then((response) => {
        if (response.success) {
          console.log('用户行为日志已保存到本地数据库')
        }
      })
      .catch((error) => {
        console.error('保存用户行为日志失败:', error)
      })
  }
}

/**
 * 记录用户行为日志的便捷函数
 * @param {string} action - 用户行为类型
 * @param {string} description - 行为描述
 * @param {Object} extraData - 额外数据
 * // 记录登录行为
plugins.logUserAction('login', '用户登录系统', { username: 'admin' })

// 记录按钮点击
plugins.logUserAction('button_click', '点击保存按钮', { buttonId: 'save_btn' })

// 记录页面浏览
plugins.logUserAction('page_view', '访问网络设置页面', { page: 'network_settings' })
日志数据格式：
{
  action: "login",           // 行为类型
  description: "用户登录系统", // 行为描述
  terminalId: "terminal_001", // 终端ID
  timestamp: "2025-11-05 14:30:25", // 时间戳
  username: "admin"         // 额外数据
}

 */
function logUserAction(action, description, extraData = {}) {
  if (terminalInstance) {
    terminalInstance.logUserAction(action, description, extraData)
  } else {
    console.warn('终端实例未初始化，无法记录用户行为日志')
  }
}

/**
 * 获取当前北京时间并格式化
 * @returns {string} 格式化后的时间字符串，例如 "2025年10月17日 星期五 19:01:42"
 */
function getBeijingTime() {
  const now = new Date()
  const options = {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }
  const formatter = new Intl.DateTimeFormat('zh-CN', options)
  const parts = formatter.formatToParts(now)

  const year = parts.find((p) => p.type === 'year').value
  const month = parts.find((p) => p.type === 'month').value
  const day = parts.find((p) => p.type === 'day').value
  const weekday = parts.find((p) => p.type === 'weekday').value
  const hour = parts.find((p) => p.type === 'hour').value
  const minute = parts.find((p) => p.type === 'minute').value
  const second = parts.find((p) => p.type === 'second').value

  return `${year}年${month}月${day}日 ${weekday} ${hour}:${minute}:${second}`
}

/**
 * 获取当前北京时间并格式化为 "YYYY-MM-DD HH:mm:ss"
 * @returns {string} 格式化后的时间字符串，例如 "2025-06-01 12:00:00"
 */
function getFormattedTime() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export default {
  createTerminal(serverUrl, terminalId) {
    if (!terminalInstance) {
      terminalInstance = new SmartLockerTerminal(serverUrl, terminalId)
    }
    return terminalInstance
  },
  updateServerUrl(newServerUrl) {
    if (terminalInstance) {
      terminalInstance.updateServerUrl(newServerUrl)
    } else {
      console.warn('终端实例未初始化，请先调用 createTerminal')
    }
  },
  getBeijingTime,
  getFormattedTime,
  logUserAction,
}
