import Vue from 'vue'
import Router from 'vue-router'
import cesiumViewer from '@/pages/cesiumViewer'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'CesiumViewer',
      component: cesiumViewer
    }
  ]
})
