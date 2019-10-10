<template>
  <div class='layer-container'>
    <a>
      <div v-if="isGridLoad" @click="handleGrid">
        <img src="../assets/img/layer/layer-grid-on.png"/>
      </div>
      <div v-else>
        <img src="../assets/img/layer/layer-grid-off.png"/>
      </div>
    </a>
    <a class="layer-item" @click="handleLayer">
      <div v-if="isLayerLoad">
        <img src="../assets/img/layer/layer-map-on.png"/>
      </div>
      <div v-else>
        <img src="../assets/img/layer/layer-map-off.png"/>
      </div>
    </a>
    <a class="layer-item" @click="handleHeatmap">
      <div v-if="isHeatmapLoad">
        <img src="../assets/img/layer/layer-heatmap-on.png"/>
      </div>
      <div v-else>
        <img src="../assets/img/layer/layer-heatmap-off.png"/>
      </div>
    </a>
    <a class="layer-item" @click="handleWindy">
      <div v-if="isWindyLoad">
        <img src="../assets/img/layer/layer-wind-on.png"/>
      </div>
      <div v-else>
        <img src="../assets/img/layer/layer-wind-off.png"/>
      </div>
    </a>
  </div>
</template>

<script>
export default {
  name: 'layerMenu', // 图层菜单
  props: {},
  data() {
    return {
      isGridLoad: false,  // 是否加载经纬网
      isLayerLoad: false, // 是否加载政区
      isHeatmapLoad: false, // 是否加载热图
      isWindyLoad: false,   // 是否加载风场
    }
  },
  methods: {
    // 添加/删除经纬网
    handleGrid() {
      this.isGridLoad = !this.isGridLoad;
    },
    // 添加/删除政区
    handleLayer() {
      this.isLayerLoad = !this.isLayerLoad;
    },
    // 添加/删除热图
    handleHeatmap() {
      this.isHeatmapLoad = !this.isHeatmapLoad;
    },
    handleWindy() {
      this.isWindyLoad = !this.isWindyLoad;
    }
  },  
}
</script>

<style scoped>
  .layer-container{    
    height: 30px;
    display: flex;
  }
  .layer-item{
    display: inline-flex;
    margin: 1px 3px 0 3px; /* 上右下左 */    
  }
  .layer-item :hover{    
    cursor: pointer;
  }
  .layer-item img{
    width: 27px;
    height: 27px;
  }
</style>
