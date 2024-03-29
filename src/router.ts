import transformRouter from './transformRouter';
import EnumRouter from '@/constants/EnumRouter';

/**
 * 定义路由
 * @type {*[]}
 * 说明:
 *  {
         uri: "/",                                          // 该字段必填
         component: import("./components/CodeEditor"),      // 该字段必填
         storeKeys: "mobx的状态对象key",                      // 该字段可选
         props: "传入组件的props"                             // 该字段可选, 必须是对象
         isMainLayout: true,                                // 该字段可选, 是否开启MainLayout布局, 默认是true
     }
 */
const routes = [
    {
        uri: EnumRouter.leaflet,
        component: import("@/pages/LeafletMap"),
        stores: {}
    },
    {
        uri: EnumRouter.mapboxgl,
        component: import("@/pages/MapboxglMap"),
        stores: {}
    },
    {
        uri: EnumRouter.videoPlayer,
        component: import("@/pages/VideoPlayer"),
        stores: {}
    },
];


export default transformRouter(routes);


