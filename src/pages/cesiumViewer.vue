<template>
  <div id="cesiumContainer">
    <menu-layer class="menu-bar-layer"
                @showLayers="handleLayers"
                @showOrbitsLayer="handleOrbitsLayer"
                @showGridLayer="handleGridLayer"
                @showGeoJSONLayer="handleGeoJSONLayer"
                @showOverviewLayer="handleOverviewLayer"
                @showHeatmapLayer="handleHeatmapLayer"
                @showContourLayer="handleContourLayer">
    </menu-layer>

    <!--<div class="leaflet-control-minimap" id="overview"></div>-->
    <div class="bar-lonlat"><span>{{mouseLonlat}}</span></div>

    <canvas id="windy"></canvas>
  </div>
</template>

<script>
  import CesiumNavigation from 'cesium-navigation-es6'

  import menuLayer from '@/components/menu/menuLayer'
  import menuMeteo from '@/components/menu/menuMeteo'

  import TileLonlatImageryProvider from '@/js/TileLonlatImageryProvider'
  import HeatmapImageryProvider from '@/js/HeatmapImageryProvider'
  import WindyImageryProvider from '@/js/WindyImageryProvider'
  import WindImageryProvider from '@/js/WindImageryProvider'

  import api from '@/api/api'

  export default {
    name: 'cesiumViewer', // 单页面 index组件(其他组件在这里注册)
    components: {
      menuLayer,
      menuMeteo
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

          baseLayerPicker: false, // 是否显示图层选择控件
          sceneModePicker: false, // 是否显示投影方式控件
          shouldAnimate: true,

          requestRenderMode: true, // 启用请求渲染模式
          scene3DOnly: false,      // 每个几何实例将只能以3D渲染以节省GPU内存
          sceneMode: 3,            // 初始场景模式 1 2D模式 2 2D循环模式 3 3D模式

          skyAtmosphere: false //关闭地球光环
        },
        mouseLonlat: '', // 鼠标位置经纬度

        layers: null, // 图层列表

        orbitsDS: null, // 卫星轨道数据源
        chinaDS: null,  // GeoJSON数据源

        lonlatLayer: null,   // 经纬网图层
        heatmapLayer: null,  // 热力图层

        windy: null,
        started: false
      }
    },
    mounted () {
      // 初始化视图
      this.initViewer();
    },
    methods: {
      /**** 事件处理函数 ****/
      /**
       * 显示/隐藏图层
       * @param visible -是否可见
       */
      handleLayers(visible) {
        this.$HTTP.get('../static/mock/json/province_hb.json').then(res => {
          console.log('load hb json');
          let data = res.data;

        }).catch(err => {
          console.log(err)
        });
      },

      /**
       * 加载/删除卫星轨道
       * @param visible -是否可见
       */
      handleOrbitsLayer(visible) {
        let czmlPath = '../static/mock/czml/astro-e2.czml';

        let Cesium = this.$Cesium;
        let viewer = window.globeViewer;

        if (visible) {
          if (this.orbitsDS) {
            viewer.dataSources.add(this.orbitsDS);
          } else {
            let that = this;
            Cesium.CzmlDataSource.load(czmlPath).then(function (dataSource) {
              that.orbitsDS = dataSource;

              viewer.dataSources.add(that.orbitsDS);
            });
          }
        } else {
          if (this.orbitsDS) {
            viewer.dataSources.remove(this.orbitsDS);
          }
        }
      },

      /**
       * 加载/删除网格图层
       * @param visible -是否可见
       */
      handleGridLayer(visible) {
        if (visible) {
          if (!this.lonlatLayer) {
            let layer = new TileLonlatImageryProvider({});
            this.lonlatLayer = this.layers.addImageryProvider(layer);
          } else {
            this.layers.add(this.lonlatLayer);
          }
        } else {
          if (this.lonlatLayer) {
            this.layers.remove(this.lonlatLayer, false);
          }
        }
      },

      /**
       * 加载/删除网格图层
       * @param visible -是否可见
       */
      handleGeoJSONLayer(visible) {
        let jsonPath = '../static/mock/json/China.json';

        let Cesium = this.$Cesium;
        let viewer = window.globeViewer;

        if (visible) {
          if (this.chinaDS) {
            viewer.dataSources.add(this.chinaDS);
          } else {
            let that = this;
            let color = Cesium.Color.CHOCOLATE.withAlpha(0.8);
            // 加载数据源
            Cesium.GeoJsonDataSource.load(jsonPath).then(function (dataSource) {
              let entities = dataSource.entities.values;
              // 可以指定各个要素的属性
              for (let i = 0; i < entities.length; i++) {
                let entity = entities[i];

                entity.polyline.width = 1.0;
                entity.polyline.material = color;
                entity.polyline.clampToGround = true;
              }
              that.chinaDS = dataSource;

              viewer.dataSources.add(that.chinaDS);
            });
          }
        } else {
          if (this.chinaDS) {
            viewer.dataSources.remove(this.chinaDS);
          }
        }
      },

      /**
       * 显示/隐藏鹰眼
       * @param visible -是否可见
       */
      handleOverviewLayer(visible) {
      },

      /**
       * 加载/删除热力图层
       * @param visible -是否可见
       */
      handleHeatmapLayer(visible) {
        if (visible) {
          if (!this.heatmapLayer) {
            let latMin = 28.364807;
            let latMax = 40.251095;
            let lonMin = 94.389228;
            let lonMax = 108.666357;

            let bounds = {
              west: lonMin,
              east: lonMax,
              south: latMin,
              north: latMax
            };
            let max = -100;
            let min = 100;

            let len = 300;
            let dataRaw = [];
            for (let i = 0; i < len; i++) {
              let point = {
                x: lonMin + Math.random() * (lonMax - lonMin),
                y: latMin + Math.random() * (latMax - latMin),
                value: Math.floor(Math.random() * 100)
              };
              max = Math.max(max, point.value);
              min = Math.min(min, point.value);

              dataRaw.push(point);
            }

            let data = {};
            data.min = min;
            data.max = max;
            data.points = dataRaw;

            let options = {};
            options.bounds = bounds;
            options.data = data;

            let layer = new HeatmapImageryProvider(options);
            this.heatmapLayer = this.layers.addImageryProvider(layer);
          } else {
            this.layers.add(this.heatmapLayer);
          }
        } else {
          if (this.heatmapLayer) {
            this.layers.remove(this.heatmapLayer, false);
          }
        }
      },

      /**
       * 加载/删除等值面图层
       * @param visible -是否可见
       */
      handleContourLayer(visible) {
        // 测试风向图
        let viewer = window.globeViewer;

        if (visible) {
          let canvas = document.getElementById("windy");
          canvas.width = viewer.canvas.width;
          canvas.height = viewer.canvas.height;

          debugger;
          // 查询GFS
          api.fetchGFS().then((res) => {
            console.log('load gfs');
            let data = res.data;

            let options = {};
            options.canvas = canvas;
            options.data = data;
            // 创建风场
            this.windy = new WindImageryProvider(options);
            // 重绘风场
            this.redrawWindy();

          }).catch((err) => { });

          let that = this;
          // 添加监听
          viewer.camera.moveStart.addEventListener(function () {
            console.log("move start...");
            document.getElementById("windy").style.display = "none";
            if(!!that.windy && that.started){
              that.windy.stop();
            }
          });

          viewer.camera.moveEnd.addEventListener(function () {
            console.log("move end...");
            document.getElementById("windy").style.display = "none";
            if(!!that.windy && that.started){
              that.redrawWindy();
            }
          });
        }
      },

      /**** 自定义函数 ****/
      /**
       * 初始化视图
       */
      initViewer() {
        let Cesium = this.$Cesium;
        // 资源访问令牌 Cesium token
        Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2OTgxNTY1Ni05ZWQzLTQ5OWMtODVlMS1kZTQyNzE5ODkyMzYiLCJpZCI6MTUzNDgsInNjb3BlcyI6WyJhc2wiLCJhc3IiLCJhc3ciLCJnYyJdLCJpYXQiOjE1Njc2NTMzMzZ9.lgaMvwkiWOimFhfJ4dgfNmKZDfjqIPaAfg0ycjwFTfc';

        // 创建viewer实例
        let viewer = new Cesium.Viewer('cesiumContainer', this.config);

        let layers = viewer.imageryLayers;
        // 增加地图图片资源提供者（CesiumIon） Cesium官方
        layers.remove(0); // 图片层级管理 移除默认的基础层级提供者
        layers.addImageryProvider(new Cesium.IonImageryProvider({assetId:3954}));

        // 设置地形
        viewer.terrainProvider = Cesium.createWorldTerrain({
          requestWaterMask:true,    //水渲染需求
          requestVertexNormals:true //顶点法线渲染需求
        });
        // 深度显示（用于湖泊河流 水深对周围景观的影响）
        viewer.scene.globe.depthTestAgainstTerrain = true;
        // 全局日照（受太阳，月亮的位置而影响光照信息）
        //viewer.scene.globe.enableLighting = true;

        // 添加导航插件
        let options = {};
        // 用于在使用重置导航重置地图视图时设置默认视图控制。接受的值是Cesium.Cartographic 和 Cesium.Rectangle.
        options.defaultResetView = Cesium.Rectangle.fromDegrees(80, 22, 130, 50);
        options.enableCompass = true;          // 罗盘
        options.enableZoomControls = false;    // 缩放控件
        options.enableDistanceLegend = true;   // 距离图例
        options.enableCompassOuterRing = true; // 指南针外环
        CesiumNavigation(viewer, options);

        // 创建初始化摄像机视图
        // 摄像机位置 ，经度，纬度，高度
        let initialPosition = new Cesium.Cartesian3.fromDegrees(110.998114468289017509, 30.674512895646692812, 10631000);
        // 飞行 专用的  表示旋转角度之类的东西： 飞行中飞机机体轴相对于地面的角位置
        let initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(7.1077496389876024807, -91.987223091598949054, 0.025883251314954971306);
        let homeCameraView = {
          destination: initialPosition,
          orientation: {
            heading: initialOrientation.heading, //偏航角
            pitch: initialOrientation.pitch,     //俯仰角
            roll: initialOrientation.roll        //滚转角
          }
        };
        viewer.scene.camera.setView(homeCameraView);
        // 取消左键双击事件
        viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

        // 阻止镜头飞至地表以下
        let minPitch = -Cesium.Math.PI_OVER_TWO;
        let maxPitch = 0;
        let minHeight = 200;
        viewer.camera.changed.addEventListener(
          function () {
            if (viewer.camera._suspendTerrainAdjustment && viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
              viewer.camera._suspendTerrainAdjustment = false;
              viewer.camera._adjustHeightForTerrain();
            }
            // Keep camera in a reasonable pitch range
            let pitch = viewer.camera.pitch;
            if (pitch > maxPitch || pitch < minPitch) {
              viewer.scene.screenSpaceCameraController.enableTilt = false;

              // clamp the pitch
              if(pitch > maxPitch ) {
                pitch = maxPitch;
              } else if(pitch < minPitch) {
                pitch = minPitch;
              }

              let destination = Cesium.Cartesian3.fromRadians(
                viewer.camera.positionCartographic.longitude,
                viewer.camera.positionCartographic.latitude,
                Math.max(viewer.camera.positionCartographic.height, minHeight)
              );

              viewer.camera.setView({
                destination: destination,
                orientation: { pitch: pitch }
              });

              viewer.scene.screenSpaceCameraController.enableTilt = true;
            }
          }
        );

        let that = this;
        // 得到当前三维场景的椭球体
        let ellipsoid = viewer.scene.globe.ellipsoid;

        let canvas = viewer.scene.canvas; // 获取canvas
        /* 事件句柄 */
		    let eventHandler = new Cesium.ScreenSpaceEventHandler(canvas);

		    // 鼠标移动事件
		    eventHandler.setInputAction(function (event) {
		      let cartesian = viewer.camera.pickEllipsoid(event.endPosition, ellipsoid);
			    if (cartesian) {
			      // 笛卡尔坐标转地理坐标
				    let cartographic = Cesium.Cartographic.fromCartesian(cartesian);
				    let lon = Cesium.Math.toDegrees(cartographic.longitude);
				    let lat = Cesium.Math.toDegrees(cartographic.latitude);
            that.mouseLonlat = 'Lon: ' + lon.toFixed(4) + '  Lat: ' + lat.toFixed(4);
			    }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

        // 赋值
        window.globeViewer = viewer; // 视图(全局对象!!!)
        this.layers = layers; // 图层列表
      },

      /**
       * 重绘风场
       */
      redrawWindy() {
        let viewer = window.globeViewer;
        let width = viewer.canvas.width;
        let height = viewer.canvas.height;

        let canvas = document.getElementById("windy");
        canvas.width = width;
        canvas.height = height;

        this.windy.stop();

        debugger;
        let that = this;
        setTimeout(function () {
          that.started = that.windy.start(
            [[0,0],[width, height]],
            width,
            height
          );
          document.getElementById("windy").style.display = "block";
        }, 200);
      }

    }

  }
</script>

<style scoped>
  #windy{
    position: absolute;
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    z-index: 3;
    pointer-events: none;
    overflow: hidden;
  }
  .menu-bar-layer{
    position: absolute;
    display: block;
    top: 10px;
    left: 20px;
    background-color: rgba(48,51,54,0.7);
    border-radius: 5px;
    z-index: 999;
  }
  .leaflet-control-minimap{0
    position: absolute;
    width: 200px;
    height: 150px;
    right: 10px;
    top: 10px;
    z-index: 999;
  }
  .bar-lonlat{
    position: absolute;
    display: block;
    width: 220px;
    height: 21px;
    line-height: 21px;
    text-align: center;
    bottom: 10px;
    right: 20px;
    color: #FFF;
    border-radius: 8px;
    z-index: 999;
  }
</style>
