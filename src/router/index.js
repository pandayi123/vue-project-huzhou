import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  // 修改这一行：使用 createWebHashHistory 替代 createWebHistory
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      children: [
        // 子路由配置
        {
          path: '',
          name: 'menu',
          component: () => import('@/views/DeskViewMenu.vue'), // 专门的功能菜单组件
        },
        {
          path: 'systemsettings',
          name: 'systemsettings',
          component: () => import('@/views/SystemSettings.vue'),
        },
        {
          path: 'networksettings',
          name: 'networksettings',
          component: () => import('@/views/NetworkSettings.vue'),
        },
        {
          path: 'hardwaresettings',
          name: 'hardwaresettings',
          component: () => import('@/views/HardwareSettings.vue'),
        },
        {
          path: 'equipmentmanagementview',
          name: 'equipmentmanagementview',
          component: () => import('@/views/EquipmentManagementView.vue'),
        },
        {
          path: 'factorytest',
          name: 'factorytest',
          component: () => import('@/views/FactoryTest.vue'),
        },
      ],
    },
    // --- 新增：loginview 移到这里，与 path: '/' 平级 ---
    {
      path: '/loginview', // 注意加上 '/'，表示根路径下的独立页面
      name: 'loginview',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/receive',
      name: 'receive',
      component: () => import('@/views/ReceiveView.vue'),
    },
    {
      path: '/return',
      name: 'return',
      component: () => import('@/views/ReturnView.vue'),
    },
    {
      path: '/usermanagement',
      name: 'usermanagement',
      component: () => import('@/views/UserManagement.vue'),
    },
    {
      path: '/informationsettings',
      name: 'informationsettings',
      component: () => import('@/views/InformationSettings.vue'),
    },
     {
      path: '/feedbackupdate',
      name: 'feedbackupdate',
      component: () => import('@/views/feedbackUpdate.vue'),
    },
  ],
})

export default router
