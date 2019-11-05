<template>
  <div class='layer-container'>
    <div class="layer-item" id="map">
      <i class="iconfont " :class="mapIconClass"></i>
    </div>
  </div>
</template>

<script>
  import '@/assets/icon/layer/iconfont.css'

  export default {
    name: "magMenuLayer",
    data () {
      return {
        mapIconClass: 'icon-world',
      }
    }
  }
</script>

<style scoped>
  .layer-container{
    height: 36px;
    display: flex;
  }
  .layer-item{
    display: inline-flex;
    margin: 3px;
  }
  .layer-item :hover{
    cursor: pointer;
  }
</style>
