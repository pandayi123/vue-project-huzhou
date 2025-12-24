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
    // 查询装备数据并分批次上传
    if (options.equipment == true) {
      console.log('开始上传装备数据')
      const result = await window.electronAPI.el_post({
        action: 'queryAndUploadData',
        payload: {
          tableName: 'equipment',
          url: url,
          condition: '', // 可选条件
          orderBy: 'rowid ASC', // 可选排序
          batchSize: 5, // 每批次上传数量，默认300
          terminalId: terminalInstance.terminalId,
          dataType: 'other',
        },
      })
      console.log('上传equipment完成，处理结果:', result)
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
      transports: ['websocket', 'polling'],
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
          equipment: true,
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
      // 【新增】监听上传数据到服务器后的处理结果
      .on('data:insert_success', (data) => this.handleDataInsertSuccess(data))
      // 【新增】监听服务器下发的通用指令
      .on('cmd:execute', (packet) => this.handleServerCommand(packet))
  }

  // 手动重连方法（可选）
  manualReconnect() {
    if (!this.socket || !this.socket.connected) {
      console.log('尝试手动重连...')
      this.connect()
    }
  }

  /**
   * 统一处理服务器下发的指令
   * @param {Object} packet - 服务器下发的指令数据包
   * @param {string} packet.type - 业务类型（例如：'update_dynamic_code'、'remote_unlock'）
   * @param {Object} packet.data - 业务数据，具体内容根据 type 而定
   * @param {string} packet.from - 发送指令的终端 ID
   * @param {string} packet.timestamp - 指令时间戳（ISO 格式）
   */
  handleServerCommand(packet) {
    console.log('收到远程指令:', packet)
    const { type, data, from } = packet
    console.log('from:', from)

    switch (type) {
      case 'update_dynamic_code':
        this.handleDynamicCodeUpdate(data)
        break

      case 'remote_unlock': // 预留：以后做远程开锁可以写在这里
        console.log('收到远程开锁指令')
        break

      default:
        console.warn('未知的指令类型:', type)
    }
  }

  /**
   * 【新增】处理动态验证码更新逻辑
   * @param {Object} data - 动态码参数对象
   * @param {string} data.code - 动态码内容（默认8位，如 '12029017'）
   * @param {number} data.duration - 动态码有效期（单位：分钟，默认30）
   * @param {string} data.authLevel - 动态码的权限级别（可选值: 'user' 用户, 'admin' 管理员, 'system_admin' 系统管理员）
   */
  /**
   * 【新增】处理动态验证码更新逻辑 (适配新数据库结构 + 加密)
   */
  async handleDynamicCodeUpdate(data) {
    const { code, duration, authLevel } = data
    console.log(`收到动态码更新指令: 码=******(安全隐藏), 时长=${duration}分, 等级=${authLevel}`)

    try {
      // 1. 计算过期时间 (UTC格式 或 本地时间格式，取决于你的数据库存什么，这里为了兼容sqlite datetime建议用标准格式)
      const now = new Date()
      const expireTime = new Date(now.getTime() + duration * 60 * 1000)
      // 生成符合 SQLite datetime 格式的字符串 (YYYY-MM-DD HH:MM:SS)
      const expireTimeStr = this.toLocalDateTime(expireTime)

      // 2. 执行加密 (PBKDF2)
      // 使用 await 等待异步加密完成
      const { hash, salt } = await generateSecureHash(code)

      // 3. 更新 Pinia (仅更新状态，不要在内存存明文密码，如果需要显示倒计时可存过期时间)
      if (this.configStore) {
        // 如果 UI 需要知道当前有动态码，可以更新一个标识
        // this.configStore.terminalSettings.has_dynamic_code = true
        console.log('Pinia 状态已更新')
      }

      // 4. 更新本地 SQLite 数据库
      // 对应你的 table_settings 新表结构
      const payload = {
        tableName: 'terminal_settings',
        setValues: {
          // --- 核心加密字段 ---
          dynamic_code_hash: hash, // 存储哈希值
          dynamic_code_salt: salt, // 存储盐值
          dynamic_code_expiry: expireTimeStr, // 过期时间
          dynamic_code_permissions: authLevel || 'system_admin', // 权限等级

          // --- 重置安全计数器 ---
          dynamic_code_current_failed_count: 0, // 重置失败次数
          dynamic_code_locked_until: null, // 注意: SQL中null通常不加引号，但在 electronAPI 的封装中，看你的实现是否支持直接传 null
        },
        condition: 'id=1',
      }

      // 特殊处理 null 值：如果 el_post 无法处理 JS 的 null，你可能需要根据你的 electronAPI 实现来调整
      // 这里假设你的后端 update 构建器能处理 null，或者你可以传空字符串，取决于你的业务逻辑
      // 如果后端不支持 null，可以通过 sql 注入的方式(不推荐)或者修改 el_post 支持 null

      // 针对 locked_until 的特殊处理 (如果 el_post 不支持 null, 可能需要单独发一个 raw sql)
      // 假设 el_post 的 update 逻辑比较简单，我们先只更新上面字段。
      // 为了严谨，建议在 electronAPI 中增加对 null 的支持。

      const result = await window.electronAPI.el_post({
        action: 'update',
        payload: payload,
      })

      // 单独发送 SQL 清除锁定状态 (更稳妥的方法，确保 locked_until 变成数据库的 NULL)
      // 如果你的 el_post 支持 action: 'execute' 或 raw sql
      /*
      await window.electronAPI.el_post({
         action: 'execute',
         sql: "UPDATE terminal_settings SET locked_until = NULL WHERE id = 1"
      })
      */

      console.log('动态验证码(加密后)已写入本地数据库:', result)

      // 5. 播放提示音
      // this.audioStore.play('success.mp3')
    } catch (error) {
      console.error('保存动态验证码失败:', error)
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
 * 浏览器端 PBKDF2 加密工具
 * 对应 Node.js: crypto.pbkdf2(password, salt, 10000, 64, 'sha512')
 */
async function generateSecureHash(plainCode) {
  const ITERATIONS = 10000 // 迭代次数（越高越安全，但性能开销越大）
  const KEY_LEN = 64 // 派生密钥长度（字节）
  const ALGO = 'SHA-512' // 哈希算法

  // 1. 生成 16 字节随机盐
  //  类型化数组 (TypedArray)。它和普通数组 [] 不太一样，它更像是一块固定大小的内存区域，
  // 专门用来存放 0 到 255 之间的整数（即一个字节）。
  const saltBytes = new Uint8Array(16)
  window.crypto.getRandomValues(saltBytes) // saltBytes 被填充为 16 个密码学安全的随机字节（如 [23, 145, 67, ...] ）。

  // 转换盐为 Hex 字符串 (用于存库)
  const saltHex = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  // 2. 引入密钥材料
  // 这段代码的作用是将原始动态码（ plainCode ）转换为加密 API 可用的密钥材料，
  // 以便后续用于 PBKDF2 算法派生密钥。
  const enc = new TextEncoder() // 1. 创建文本编码器
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', // 2. 密钥格式：原始二进制数据
    enc.encode(plainCode), // 3. 将动态码编码为二进制（Uint8Array）
    { name: 'PBKDF2' }, // 4. 指定算法为 PBKDF2
    false, // 5. 是否可导出密钥：否
    ['deriveBits'], // 6. 密钥用途：派生密钥
  )

  // 3. 派生密钥 (计算 Hash)
  // 注意：Nodejs的crypto.pbkdf2如果salt传入字符串，会将其视为二进制数据。
  // 为了跨平台一致性，这里我们直接使用 utf-8 编码后的 salt 字符串或原始 bytes 都可以。
  // 这里使用原始 bytes 作为 salt 进行加密，更加标准。
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2', // 使用 PBKDF2 算法
      salt: enc.encode(saltHex), // 使用 Hex 字符串作为 Salt 输入，与 Node 代码逻辑保持逻辑对齐
      iterations: ITERATIONS, // 迭代次数（如 10000）
      hash: ALGO, // 哈希算法（如 'SHA-512'）
    },
    keyMaterial,
    KEY_LEN * 8, // bit length 输出长度（比特，如 64字节 * 8 = 512比特）
  )

  // 转换 Hash 为 Hex 字符串
  // Uint8Array变成了 0-255 的数字列表
  // Array.from 将 Uint8Array 转换为普通数组
  const hashHex = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')

  return {
    hash: hashHex,
    salt: saltHex,
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
