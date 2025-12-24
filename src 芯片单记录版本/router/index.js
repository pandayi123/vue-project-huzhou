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
          path: 'receive',
          name: 'receive',
          component: () => import('@/views/ReceiveView.vue'),
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
          path: 'registerview',
          name: 'registerview',
          component: () => import('@/views/FaceRegister.vue'),
        },
        {
          path: 'factorytest',
          name: 'factorytest',
          component: () => import('@/views/FactoryTest.vue'),
        },
      ],
    },
  ],
})

export default router
