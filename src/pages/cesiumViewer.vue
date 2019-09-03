<template>
  <div id="cesiumContainer"></div>
</template>

<script>
  export default {
    name: 'cesiumViewer', // 单页面 index组件(其他组件在这里注册)
    data() {
      return {
        config: {
          animation: false, // 是否显示动画控件  
          geocoder: false,  // 是否显示地名查找控件
          timeline: false,  // 是否显示时间线控件
          infoBox: false,   // 是否显示要素信息
          homeButton: false,           // 是否显示Home按钮                   
          fullscreenButton: false,     // 是否显示全屏按钮
          navigationHelpButton: false, // 是否显示帮助信息控件     
          
          baseLayerPicker: true, // 是否显示图层选择控件
          sceneModePicker: true, // 是否显示投影方式控件  
          shouldAnimate: true,

          requestRenderMode: true, // 启用请求渲染模式
          scene3DOnly: false,      // 每个几何实例将只能以3D渲染以节省GPU内存
          sceneMode: 3,            // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式
        },
        viewer: {}
      }
    },
    mounted () {
      //创建viewer实例
      this.viewer = new this.Cesium.Viewer('cesiumContainer', this.config);
    }
  }
</script>

<style scoped>
</style>
