<template>
  <div id="cesiumContainer"></div>
</template>

<script>
  //导入Cesium源码中的Viewer组件，注意这里是用的Viewer组件的方式加载，而不是加载整个Cesium
  //import Viewer from 'cesium/Source/Widgets/Viewer/Viewer'
  //我们刚才所说的如何让Cesium知道静态资源在哪里的API
  //import buildModuleUrl from 'cesium/Source/Core/buildModuleUrl'
  //导入必须的样式表
  //import 'cesium/Source/Widgets/widgets.css'
  export default {
    name: 'cesiumViewer',
    data() {
      return {
        config: {
          animation: false, // 是否显示动画控件
          shouldAnimate: true,
          homeButton: false, // 是否显示Home按钮
          fullscreenButton: false, // 是否显示全屏按钮
          baseLayerPicker: true, // 是否显示图层选择控件
          geocoder: false, // 是否显示地名查找控件
          timeline: false, // 是否显示时间线控件
          sceneModePicker: true, // 是否显示投影方式控件
          navigationHelpButton: false, // 是否显示帮助信息控件
          infoBox: false, // 是否显示点击要素之后显示的信息
          requestRenderMode: true, // 启用请求渲染模式
          scene3DOnly: false, // 每个几何实例将只能以3D渲染以节省GPU内存
          sceneMode: 3, // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式  Cesium.SceneMode

        },
        viewer: {}
      }
    },
    mounted () {
      //设置静态资源目录
      //buildModuleUrl.setBaseUrl('../static/Cesium/');
      //创建viewer实例
      this.viewer = new this.Cesium.Viewer('cesiumContainer', this.config);
      // 去除版权信息
      this.viewer._cesiumWidget._creditContainer.style.display = 'none'
    }
  }
</script>

<style scoped>
</style>
