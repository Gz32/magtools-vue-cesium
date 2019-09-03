<template>
  <div id="app">
    <!--<img src="./assets/logo.png">-->
    <router-view/>
  </div>
</template>

<script>
import cesiumViewer from './pages/cesiumViewer'

export default {
  name: 'App',
  components: {
    cesiumViewer
  }
}
</script>

<style>
/* 保证浏览器全屏幕显示，没有多余的白边 */
html, body, #app, #cesiumContainer {
  width: 100%; 
  height: 100%; 
  margin: 0; 
  padding: 0; 
  overflow: hidden;
}
/*隐藏cesium 下部bind map的文字提示 */
#cesiumContainer .cesium-viewer .cesium-viewer-bottom{
  display: none;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
body .ivu-spin-fix {
  background-color: rgba(12, 10, 10, 0.94);
}
</style>
