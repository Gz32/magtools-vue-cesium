<template>
  <div class='layer-container'>
    <a class="layer-item" @click="handleLayer">
      <div v-if="isLayerAdd">
        <img src="../assets/img/layer/layer-map-on.png"/>
      </div>
      <div v-else>
        <img src="../assets/img/layer/layer-map-off.png"/>
      </div>
    </a>
    <a class="layer-item" @click="handleHotmap">
      <div v-if="isHotmapAdd">
        <img src="../assets/img/layer/layer-hotmap-on.png"/>
      </div>
      <div v-else>
        <img src="../assets/img/layer/layer-hotmap-off.png"/>
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
      isLayerAdd: false,
      isHotmapAdd: false,
    }
  },
  methods: {
    // 添加/删除区划图层
    handleLayer() {
      this.isLayerAdd = !this.isLayerAdd;
    },
    // 添加/删除热图
    handleHotmap() {
      this.isHotmapAdd = !this.isHotmapAdd;
    },
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
