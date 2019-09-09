/**   
 * api接口统一管理
 */
import http from './http'

export default {
    // 查询湖北省行政区划geojson数据
    queryHbGeoJSON() {
        return http.get('geojson/provinceHb', {});
    }
}