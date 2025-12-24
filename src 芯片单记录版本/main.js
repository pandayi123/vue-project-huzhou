import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia' // 1. 引入 createPinia
import router from './router'
import Antd from 'ant-design-vue' // 引入Ant Design Vue组件库
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import '@/assets/css/common.css' // 引入全局样式


// 完整安装表格和配套 UI 库,以使用表格所有功能
/*
import VxeUIAll from 'vxe-pc-ui'
import 'vxe-pc-ui/lib/style.css'
import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'
*/


const app = createApp(App) // 创建Vue应用实例

/*
app.use(VxeUIAll)
app.use(VxeUITable)
*/


app.use(router)
app.use(Antd) // 使用Ant Design Vue组件库
app.use(createPinia()) // 2. 使用Pinia
app.use(ElementPlus)

app.mount('#app') // 挂载到idnex.html页面中id为app的元素上
