/**
 * api接口统一管理
 */
import http from './http'

export default {

  // 查询湖北省行政区划geojson数据
  fetchHbGeoJSON() {
    return http.get('/api/json/province_hb.json', {});
  },

  // 获取GFS数据
  fetchGFS() {
    return http.get('/api/data/gfs.json', {})
  }
}
