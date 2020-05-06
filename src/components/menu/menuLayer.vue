<template>
  <div class='layer-container'>
    <div class="layer-item" @click="handleLayer">
      <i class="iconlayer " :class="layerIconClass"></i>
    </div>
    <div class="layer-item" @click="handleOrbits">
      <i class="iconlayer " :class="orbitsIconClass"></i>
    </div>
    <div class="layer-item" @click="handleGlobal">
      <i class="iconlayer " :class="globalIconClass"></i>
    </div>
    <div class="layer-item" @click="handleMap">
      <i class="iconlayer " :class="mapIconClass"></i>
    </div>
    <div class="layer-item" @click="handleHawkEye">
      <i class="iconlayer " :class="eyeIconClass"></i>
    </div>
    <div class="layer-item" @click="handleHeatmap">
      <i class="iconlayer " :class="heatmapIconClass"></i>
    </div>
    <div class="layer-item" @click="handleContour">
      <i class="iconlayer " :class="contourIconClass"></i>
    </div>
  </div>
</template>

<script>
  import '@/assets/icon/layer/iconlayer.css'

  export default {
    name: "menuLayer", // 图层菜单
    data () {
      return {
        globalIconClass: 'icon-global',
        mapIconClass: 'icon-earth',
        layerIconClass: 'icon-layers',
        eyeIconClass: 'icon-eye',
        heatmapIconClass: 'icon-heatmap',
        contourIconClass: 'icon-contour',
        orbitsIconClass: 'icon-orbits'
      }
    },
    methods: {
      /**** 事件处理函数 ****/
      // 图层
      handleLayer() {
        this.layerIconClass = this.layerIconClass === 'icon-layers' ? 'icon-layers-sel' : 'icon-layers';
        // 显示图层
        this.$emit('showLayers', this.layerIconClass === 'icon-layers-sel');
      },

      // 轨道
      handleOrbits() {
        this.orbitsIconClass = this.orbitsIconClass === 'icon-orbits' ? 'icon-orbits-sel' : 'icon-orbits';
        // 显示轨道
        this.$emit('showOrbitsLayer', this.orbitsIconClass === 'icon-orbits-sel');
      },

      // 网格
      handleGlobal() {
        this.globalIconClass = this.globalIconClass === 'icon-global' ? 'icon-global-sel' : 'icon-global';
        // 显示经纬网
        this.$emit('showGridLayer', this.globalIconClass === 'icon-global-sel');
      },

      // 地图
      handleMap() {
        this.mapIconClass = this.mapIconClass === 'icon-earth' ? 'icon-earth-sel' : 'icon-earth';
        // 显示地图
        this.$emit('showGeoJSONLayer', this.mapIconClass === 'icon-earth-sel');
      },

      // 鹰眼
      handleHawkEye() {
        this.eyeIconClass = this.eyeIconClass === 'icon-eye' ? 'icon-eye-sel' : 'icon-eye';
        // 显示鹰眼
        this.$emit('showOverviewLayer', this.eyeIconClass === 'icon-eye-sel');
      },

      // 热力图
      handleHeatmap() {
        this.heatmapIconClass = this.heatmapIconClass === 'icon-heatmap' ? 'icon-heatmap-sel' : 'icon-heatmap';
        // 显示热力图
        this.$emit('showHeatmapLayer', this.heatmapIconClass === 'icon-heatmap-sel');
      },

      // 等值线/面
      handleContour() {
        this.contourIconClass = this.contourIconClass === 'icon-contour' ? 'icon-contour-sel' : 'icon-contour';
        // 显示等值面
        this.$emit('showContourLayer', this.contourIconClass === 'icon-contour-sel');
      }

    }
  }
</script>

<style scoped>
  .layer-container{
    height: 40px;
    display: flex;
  }
  .layer-item{
    display: inline-flex;
    margin: 5px;
  }
  .layer-item :hover{
    cursor: pointer;
  }
</style>
