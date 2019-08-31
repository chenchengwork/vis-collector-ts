import {proxyAPI} from '@/services/proxyAPI';
import { request } from '@/utils/T';
const { get, postJSON } = request;

/**
 * 权限管理
 */
class Permission {
    // constructor() {
    //     this.localPermissioKey = "sk_permission";
    // }

    localPermissioKey = "sk_permission";

    /**
     * 是否已经登录
     * @return {boolean}
     */
    isLogin = () => {
        return true;
    }
}

/**
 * 导出权限
 * @type {Permission}
 */
export const permission = new Permission();


/**
 * 登录
 * @param {String} user_email
 * @param {String} password
 * @return {Promise}
 */
export const login = (user_email: string, password: string) => new Promise((resolve, reject) => {
    postJSON(proxyAPI("login"), {user_email, password}).then((resp) => {
        // 用于保存当前登录者的权限信息
        resolve(resp)
    }, (resp) => reject(resp) );
});


/**
 * 退出登录
 * @return {Promise}
 */
export const logout = () => new Promise((resolve, reject) => {
    get(proxyAPI("logout")).then(resp => {
        // 清空权限信息
        resolve(resp);
    },(resp) => reject(resp))
});


/**
 * 注册
 * @param {Object} params
 * @return {Promise}
 */
export const register = (params = {}) => postJSON(proxyAPI("register"), params);


