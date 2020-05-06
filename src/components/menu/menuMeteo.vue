<template>
  <div class="meteo-container"></div>
</template>

<script>
  export default {
    name: "menuMeteo", // 气象菜单
    data () {
      return {}
    },
    methods: {}
  }
</script>

<style scoped>
  .meteo-container{
    width: 40px;
    display: flex;
  }
  .meteo-item{
    display: inline-flex;
    margin: 5px;
  }
  .meteo-item :hover{
    cursor: pointer;
  }
</style>
