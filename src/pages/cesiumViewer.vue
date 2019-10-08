<template>
  <div id="cesiumContainer">
    <div class="statusbar-lonlat"><span>{{mouseLonlat}}</span></div>
  </div>
</template>

<script>
  import api from '@/api/api'

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
          
          skyAtmosphere: false, //关闭地球光环
        },
        viewer: {},

        mouseLonlat: '',
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
        requestWaterMask:true,    //水渲染需求
        requestVertexNormals:true //顶点法线渲染需求
      });

      viewer.scene.globe.depthTestAgainstTerrain=true; //深度显示（用于湖泊河流 水深对周围景观的影响）
      viewer.scene.globe.enableLighting=true;          //全局日照（受太阳，月亮的位置而影响光照信息）
  
      //创建初始化摄像机视图
      let initialPosition = new Cesium.Cartesian3.fromDegrees(110.998114468289017509, 30.674512895646692812, 2631000); //摄像机位置 ，经度，纬度，高度
      let initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(7.1077496389876024807, -91.987223091598949054, 0.025883251314954971306);//飞行 专用的  表示旋转角度之类的东西： 飞行中飞机机体轴相对于地面的角位置
      let homeCameraView = {
        destination:initialPosition,
        orientation:{
          heading:initialOrientation.heading, //偏航角
          pitch:initialOrientation.pitch,     //俯仰角
          roll:initialOrientation.roll        //滚转角
        }
      };
      viewer.scene.camera.setView(homeCameraView);
      //取消左键双击事件
      viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
      
      let _this = this;
      // 得到当前三维场景的椭球体
      let ellipsoid = viewer.scene.globe.ellipsoid;
      /* 鼠标事件 */
		  let eventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);		
		  // 鼠标移动事件
		  eventHandler.setInputAction(function (event) {
		    let cartesian = viewer.camera.pickEllipsoid(event.endPosition, ellipsoid);
			  if (cartesian) {
			    // 笛卡尔坐标转地理坐标
				  let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
				  let lon = Cesium.Math.toDegrees(cartographic.longitude);
				  let lat = Cesium.Math.toDegrees(cartographic.latitude);
				  let str = 'Lon: ' + lon.toFixed(4) + '; Lat: ' + lat.toFixed(4);
				
				  _this.mouseLonlat = str;
			  }
		  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		  
		  // 图层列表
      let layers = viewer.scene.imageryLayers;      
      this.viewer = viewer;
      
      // 加载湖北省地市
      var color = Cesium.Color.MIDNIGHTBLUE.withAlpha(0.8);      
      var adminPromise = Cesium.GeoJsonDataSource.load('../static/mock/json/city_hb.json');
      adminPromise.then(function (dataSource) {
		    viewer.dataSources.add(dataSource);
		    var entities = dataSource.entities.values;
			  for (var i = 0; i < entities.length; i++) {
			    var entity = entities[i];
				  var name = entity.name;
					
				  entity.polygon.fill = false;				
				  entity.polygon.outline = true;
				  entity.polygon.outlineColor = color;
				  entity.polygon.outlineWidth = 1.2;
				  entity.polygon.extrudedHeight = entity.properties.area / 10;
			  }
		  });
    }
  }
</script>

<style scoped>
  .statusbar-lonlat{
    position: absolute;
    display: block;
    width: 240px;
    height: 25px;
    border-radius: 25px;
    bottom: 0px;
    right: 400px;
    background-color: rgba(178,178,178,0.5);
    color: #000;
    line-height: 25px; 
    text-align: center;
    z-index: 999;
  }
</style>
