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
      let Cesium = this.Cesium;

      // 资源访问令牌 Cesium token
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2OTgxNTY1Ni05ZWQzLTQ5OWMtODVlMS1kZTQyNzE5ODkyMzYiLCJpZCI6MTUzNDgsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyJdLCJpYXQiOjE1Njc2NTMzMzZ9.lgaMvwkiWOimFhfJ4dgfNmKZDfjqIPaAfg0ycjwFTfc';
      
      // 创建viewer实例
      let viewer = new Cesium.Viewer('cesiumContainer', this.config);
      //增加地图图片资源提供者（CesiumIon） Cesium官方
      viewer.imageryLayers.remove(0); // 图片层级管理 移除默认的基础层级提供者
      viewer.imageryLayers.addImageryProvider(new Cesium.IonImageryProvider({assetId:3954}));

      //设置地形
      viewer.terrainProvider=Cesium.createWorldTerrain({
        requestWaterMask:true,//水渲染需求
        requestVertexNormals:true//顶点法线渲染需求
      });

      viewer.scene.globe.depthTestAgainstTerrain=true; //深度显示（用于湖泊河流 水深对周围景观的影响）
      viewer.scene.globe.enableLighting=true; //全局日照（受太阳，月亮的位置而影响光照信息）
  
      //创建初始化摄像机视图
      var initialPosition=new Cesium.Cartesian3.fromDegrees(110.998114468289017509, 30.674512895646692812, 2631000); //摄像机位置 ，经度，纬度，高度
      var initialOrientation=new Cesium.HeadingPitchRoll.fromDegrees(7.1077496389876024807, -91.987223091598949054, 0.025883251314954971306);//飞行 专用的  表示旋转角度之类的东西： 飞行中飞机机体轴相对于地面的角位置
      var homeCameraView={
        destination:initialPosition,
        orientation:{
          heading:initialOrientation.heading, //偏航角
          pitch:initialOrientation.pitch,     //俯仰角
          roll:initialOrientation.roll        //滚转角
        }
      };
      viewer.scene.camera.setView(homeCameraView);

      this.viewer = viewer;
    }
  }
</script>

<style scoped>
</style>
