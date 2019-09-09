import axios from 'axios';
import QS from 'qs';

/* 封装axios */

// 设置请求地址
if (process.env.NODE_ENV == 'development') {
    axios.defaults.baseURL = 'http://localhost:8089/';
} else if (process.env.NODE_ENV == 'production') {
    axios.defaults.baseURL = 'http://192.168.1.154:8080/JT-hd/';
}

axios.defaults.timeout = 50000; // 超时
//axios.defaults.withCredentials = true; // 跨域请求时是否需要使用凭证
// 设置post请求头
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';

//http request 拦截器
axios.interceptors.request.use(config => {
    // 登录流程控制中，根据本地是否存在token判断用户的登录情况        
    // 但是即使token存在，也有可能token是过期的，所以在每次的请求头中携带token        
    // 后台根据携带的token判断用户的登录情况，并返回给我们对应的状态码        
    // 而后我们可以在响应拦截器中，根据状态码进行一些统一的操作。
    const token = store.state.token || sessionStorage.getItem('token');
    //token && (config.headers.Authorization = token);

    return config;
}, error => {
    return Promise.reject(error);
});

// http response 拦截器
axios.interceptors.response.use(response => {
    if (response.status === 200) {
        return Promise.resolve(response);
    } else {
        return Promise.reject(response);
    }
}, error => { // 请求失败
    const { response } = error;
    if (response) {
        // 请求已发出，但是不在2xx的范围 
        //errorHandle(response.status, response.data.message);
        return Promise.reject(response);
    } else {
        // 处理断网的情况
        // eg:请求超时或断网时，更新state的network状态
        // network状态在app.vue中控制着一个全局的断网提示组件的显示隐藏
        // 关于断网组件中的刷新重新获取数据，会在断网组件中说明
        if (!window.navigator.onLine) {
            //store.commit('changeNetwork', false);
        } else {
            return Promise.reject(error);
        }
    }
});

export default axios;

/* 封装方法 */
/**
 * get方法，对应get请求
 * @param {String} url [请求的url地址]
 * @param {Object} params [请求时携带的参数] params属性值是一个参数对象
 * @returns {Promise}
 */
export function get(url, params = {}) {
    return new Promise((resolve, reject) => {
        axios.get(url, {
            params: params
        }).then(res => {
            resolve(res.data);
        }).catch(err => {
            reject(err.data)
        })
    });
}

/**
 * post方法，对应post请求 
 * @param {String} url [请求的url地址]
 * @param {Object} data [请求时携带的数据]
 */
export function post(url, data = {}) {
    return new Promise((resolve, reject) => {
        axios.post(url, QS.stringify(data))
            .then(res => {
                resolve(res.data);
            })
            .catch(err => {
                reject(err.data)
            })
    });
}