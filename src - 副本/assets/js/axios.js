import axios from 'axios'

axios.defaults.baseURL = 'http://172.20.10.8:3000'

async function request_data(url, data) {
  try {
    const response = await axios({
      method: 'get',
      url: url,
      // 注意：GET请求参数建议放在 params，POST放在 data
      // 如果你按照上一条建议修改了这里，请保持；如果没改，这里仅展示错误处理逻辑
      params: data,
    })

    // 能走到这里，说明服务器【有响应】且状态码是 200 OK
    console.log('✅ 请求成功，服务器有响应:', response.data)
    return response.data
  } catch (err) {
    // ⬇️⬇️⬇️ 重点在这里 ⬇️⬇️⬇️

    if (err.response) {
      // CASE 1: 服务器【有响应】，但告诉你是错误的
      // (例如：状态码 400 参数错误, 401 未登录, 404 找不到, 500 服务器内部报错)
      console.log('⚠️ 服务器有响应，但返回了错误状态码')
      console.log('状态码:', err.response.status)
      console.log('错误数据:', err.response.data)
    } else if (err.request) {
      // CASE 2: 服务器【完全没有响应】
      // (例如：你的IP填错了、服务器没启动、防火墙拦截、客户端断网、请求超时)
      console.error('❌ 服务器没有响应！(可能是网络问题或地址错误)')
      console.error('详细信息:', err.message) // 通常会显示 "Network Error" 或 "timeout"
    } else {
      // CASE 3: 代码写错了，请求没发出去
      console.error('❌ 请求配置出错:', err.message)
    }

    return null
  }
}

export default {
  request_data,
}
