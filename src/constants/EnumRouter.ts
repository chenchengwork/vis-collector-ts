import EnumEnv from '@/constants/EnumEnv';
const to = (route: string) =>  EnumEnv.rootPath.replace(/\/$/, "") + "/" + route;

/**
 * 路由枚举
 */
const EnumRouter = {
    rootRoute: to(''),		        // 根路由

    login: to('login'),		        // 登录
    leaflet: to('leaflet'),		        // 我的可视化
};

export default EnumRouter;
