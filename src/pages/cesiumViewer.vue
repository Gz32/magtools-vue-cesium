<template>
  <div id="cesiumContainer">
    <layer-menu class="bar-layer" 
                @showLonlatGridLayerEvent="showLonlatGridLayer"
                @showHeatmapLayerEvent="showHeatmapLayer"
                @showGeoJSONLayerEvent="showGeoJSONLayer"
                @showWindyLayerEvent="showWindyLayer"></layer-menu>
    <div class="bar-lonlat"><span>{{mouseLonlat}}</span></div>

    <div id="heatmap" style="width: 400px;height:400px;" v-show="false"></div>
  </div>
</template>

<script>
  import layerMenu from '@/components/layerMenu'
  import Heatmap from 'heatmap.js'

  //import '@/js/GraticulesImageryProvider.js'

  export default {
    name: 'cesiumViewer', // 单页面 index组件(其他组件在这里注册)
    components: {
      layerMenu
    },
    data () {
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
          
          skyAtmosphere: false //关闭地球光环
        },
        viewer: {},
        layers: [], // 图层列表

        cityDS: null, // 湖北省地市GeoJSON数据源
        lonlatLayer: null, // 经纬网图层

        mouseLonlat: '', // 鼠标位置经纬度

        cityPath: '../static/mock/json/city_hb.json',
      }
    },
    mounted () {
      let Cesium = this.$Cesium;
      let Viewer = this.$Viewer;

      // 资源访问令牌 Cesium token
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2OTgxNTY1Ni05ZWQzLTQ5OWMtODVlMS1kZTQyNzE5ODkyMzYiLCJpZCI6MTUzNDgsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyJdLCJpYXQiOjE1Njc2NTMzMzZ9.lgaMvwkiWOimFhfJ4dgfNmKZDfjqIPaAfg0ycjwFTfc';
      
      // 创建viewer实例
      //let viewer = new Cesium.Viewer('cesiumContainer', this.config);
      let viewer = new Viewer('cesiumContainer', this.config);

      let layers = viewer.imageryLayers;
      //增加地图图片资源提供者（CesiumIon） Cesium官方
      layers.remove(0); // 图片层级管理 移除默认的基础层级提供者
      layers.addImageryProvider(new Cesium.IonImageryProvider({assetId:3954}));

      //设置地形
      viewer.terrainProvider = Cesium.createWorldTerrain({
        requestWaterMask:true,    //水渲染需求
        requestVertexNormals:true //顶点法线渲染需求
      });

      viewer.scene.globe.depthTestAgainstTerrain=true; //深度显示（用于湖泊河流 水深对周围景观的影响）
      viewer.scene.globe.enableLighting=true;          //全局日照（受太阳，月亮的位置而影响光照信息）
  
      //创建初始化摄像机视图
      let initialPosition = new Cesium.Cartesian3.fromDegrees(110.998114468289017509, 30.674512895646692812, 5631000); //摄像机位置 ，经度，纬度，高度
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
				  let str = 'Lon: ' + lon.toFixed(4) + '  Lat: ' + lat.toFixed(4);
				
				  _this.mouseLonlat = str;
			  }
		  }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);		  
      
      // 获取canvas
      var canvas = viewer.scene.canvas;
      
      // 变量赋值
      this.viewer = viewer;
      this.layers = layers; // 图层列表        
    },
    methods: {
      /**
       * 加载/删除经纬网图层
       * @param vs -加载/删除
       */
      showLonlatGridLayer(vs) {
        if (vs === 'show') {
          /*
          if (!this.lonlatLayer) {
            let lonlatImageryLayer = new GraticulesImageryProvider({});
            this.lonlatLayer = lonlatImageryLayer;            
          }

          this.layers.addImageryProvider(this.lonlatLayer);*/
        } else {
          if (this.lonlatLayer) {
            this.layers.remove(this.lonlatLayer);
          }
        }
      },

      /**
       * 加载/删除GeoJSON图层
       * @param vs -加载/删除
       */
      showGeoJSONLayer(vs) {
        let Cesium = this.$Cesium;
        let viewer = this.viewer;

        if (vs === 'show') { // 加载湖北省地市
          if (this.cityDS) {
            viewer.dataSources.add(this.cityDS);
          } else {
            let _this = this;
            let color = Cesium.Color.MIDNIGHTBLUE.withAlpha(0.8);      
            // 加载数据源
            Cesium.GeoJsonDataSource.load(this.cityPath).then(function (dataSource) {
              var entities = dataSource.entities.values;
              // 可以指定各个要素的属性
			        for (var i = 0; i < entities.length; i++) {
			          var entity = entities[i];
				        var name = entity.name;
					
				        entity.polygon.fill = false;				
				        entity.polygon.outline = true;
				        entity.polygon.outlineColor = color;
				        entity.polygon.outlineWidth = 1.2;
				        entity.polygon.extrudedHeight = entity.properties.area / 10;
              }
              _this.cityDS = dataSource;           

              viewer.dataSources.add(_this.cityDS);
            });
          }
        } else {
          if (this.cityDS) {
            viewer.dataSources.remove(this.cityDS);
          }
        }
      },

      /**
       * 加载/删除热图图层
       * @param vs -加载/删除
       */
      showHeatmapLayer(vs) {
        let Cesium = this.$Cesium;
        let Viewer = this.viewer;

        if (vs === 'show') { // 加载
          var len = 300;
			    var points = [];
			    var max = 100;
			    var width = 600;
			    var height = 400;

			    var latMin = 28.364807;
			    var latMax = 40.251095;
			    var lonMin = 94.389228;
			    var lonMax = 108.666357;

			    var dataRaw = [];
			    for (var i = 0; i < len; i++) {
				    var point = {
					    lat: latMin + Math.random() * (latMax - latMin),
					    lon: lonMin + Math.random() * (lonMax - lonMin),
					    value: Math.floor(Math.random() * 100)
				    };
				    dataRaw.push(point);
			    }

			    for (var i = 0; i < len; i++) {
				    var dataItem = dataRaw[i];
				    var point = {
					    x: Math.floor((dataItem.lat - latMin) / (latMax - latMin) * width),
					    y: Math.floor((dataItem.lon - lonMin) / (lonMax - lonMin) * height),
					    value: Math.floor(dataItem.value)
				    };
				    max = Math.max(max, dataItem.value);
				    points.push(point);
			    }

			    var heatmapInstance = Heatmap.create({
				    container: document.querySelector('#heatmap')
			    });

			    var data = {
				    max: max,
				    data: points
			    };

          heatmapInstance.setData(data);
          
          var canvas = document.getElementsByClassName('heatmap-canvas');
			    console.log(canvas);
			    Viewer.entities.add({
				    name: 'heatmap',
				    rectangle: {
					    coordinates: Cesium.Rectangle.fromDegrees(lonMin, latMin, lonMax, latMax),
					    material: new Cesium.ImageMaterialProperty({
						    image: canvas[0],
						    transparent: true
					    })
				    }
			    });
        } else {}
      },

      /**
       * 加载/删除风场图层
       * @param vs -加载/删除
       */
      showWindyLayer(vs) {
      }
    },
  }
</script>

<style scoped>
  .bar-layer{
    position: absolute;
    display: block;    
    border-radius: 5px;
    top: 5px;
    left: 20px;
    background-color: rgba(48,51,54,0.7);
    z-index: 999;
  }
  .bar-lonlat{
    position: absolute;
    display: block;
    width: 220px;
    height: 21px;
    border-radius: 8px;
    bottom: 5px;
    right: 20px;
    background-color: rgba(48,51,54,0.7);
    color: #FFF;
    line-height: 21px;
    text-align: center;
    z-index: 999;
  }
</style>