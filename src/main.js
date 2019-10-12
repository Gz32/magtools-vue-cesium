// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
// 引用全局的Cesium
import Cesium from 'cesium/Cesium'
import 'cesium/Widgets/widgets.css'
// 引用全局的Viewer
import Viewer from 'cesium/Widgets/Viewer/Viewer'

// 注册全局变量
Vue.prototype.$Cesium = Cesium
Vue.prototype.$Viewer = Viewer

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  components: { App },
  template: '<App/>'
})
