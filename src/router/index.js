import Vue from 'vue'
import Router from 'vue-router'
import cesiumViewer from '@/pages/cesiumViewer'

Vue.use(Router)

const router =  new Router({
  routes: [
    {
      path: '/',
      name: 'CesiumViewer',
      component: cesiumViewer
    }
  ]
});

export default router