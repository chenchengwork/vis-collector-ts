import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as geojson from 'geojson';
import IconMarker from './img/marker.png';

// 加载切片服务配置
// import "./extend/tileServiceProvider";
import {providers, getTmsUrlByType, tileServiceProvider} from "./extend/tileServiceProvider";
// import "./extend/NonTiledLayer.WCS";
//
// // 加载鼠标工具
import MouseTool from './extend/mouseTool';
// // 加载风速layer
import "./extend/windyVelocity";

//
// // 加载风速tif layer
// import { windyTiffVelocityLayer } from "./extend/windyTiffVelocity";
//
// import windyGlVelocity from './extend/windyGlVelocity';
//
// // 加载风向杆layer
// import { windBarbsTiffLayer } from "./extend/windBarbsTiffLayer";
//
// // 加载要素tif layer
// import elementTileTifLayer from "./extend/elementTileTifLayer";
//
// // 加载移动Marker
// import "./extend/movingMarker";
//
// // 加载地理编码工具
// import GeoCoder from './GeoCoder';

// 加载mapUtil枚举文件
import { ZOOM, CENTER } from './constants';

/**
 * 记录清除地图回调函数
 * @type {Map<any, any>}
 */
let cacheClearCallBack = new Map();

/**
 * 触发清除地图回调
 */
const triggerClearMapCb = () => {
	for(let [cb, {params, context}] of cacheClearCallBack.entries()) {
		cb.apply(context, params);
	}
};

export interface LeafletMapUtilOpts extends L.MapOptions{
    baseLayerTMS?: string;
}


/**
 * Leaflet 地图工具类
 */
export default class LeafletUtil {
    map: L.Map;
    protected containerDom: HTMLElement;
    protected baseLayers: L.TileLayer[];
    mouseTool: MouseTool;

    static G = {
        L,
        ZOOM
    };

    /**
     * 初始化地图
     * @param {String} idOrHTMLElement    地图容器id
     * @param {Object} options  地图配置 https://leafletjs.com/reference-1.4.0.html#map-option
     * @returns {null|*}
     */
    constructor(idOrHTMLElement: string | HTMLElement, options: LeafletMapUtilOpts = {}) {
        this.containerDom = idOrHTMLElement instanceof HTMLElement ? idOrHTMLElement : document.querySelector(`#${idOrHTMLElement}`);
        this.baseLayers = [];
        if(options.baseLayerTMS) {
            this.baseLayers.push(tileServiceProvider(options.baseLayerTMS, ZOOM))
        }else {
            this.baseLayers = [tileServiceProvider('Geoq.Normal.Map', ZOOM)];
        }

        this.map = L.map(this.containerDom, Object.assign({
            attributionControl: false,      // 去掉leaflet的标识
            crs: L.CRS.EPSG3857,             // 墨卡托投影
            // crs:L.CRS.EPSG4326,          // 经纬度投影
            center: CENTER,
            zoom: ZOOM.minZoom,
            layers: this.baseLayers,
            zoomControl: false,
            doubleClickZoom: false,
            renderer: L.canvas()
            // renderer: L.svg()
        }, options));

        // 鼠标工具
        this.mouseTool = new MouseTool(this.map);

        // 地理编码工具
        // this.geoCoder = new GeoCoder();
    }

    /**
     * 将*addLayer方法转换成setLayer方法
     * @param {Function} addLayer
     * @return {*}
     */
    getSetLayerFN = <T>(addLayer: (...rest: T[]) => L.Layer) => (() => {
        let oldLayer: L.TileLayer;
        return (...params: T[]) => {
            if (oldLayer) oldLayer.remove();
            return oldLayer = addLayer.apply(this, params);
        }
    })();


    /**
     * 是基础类型地图的type
     * @return {boolean}
     */
    isBaseMapType = (type: string) => {
        try {
            // @ts-ignore
            return this.baseLayers[0]._url == getTmsUrlByType(type)
        }catch (e) {
            console.error(e);
            return false;
        }
    };

    /**
     * 更新底图
     * @param type
     */
    updateBaseMap = (type: string) => {
        try {
            const layer = this.baseLayers[0];
            const tmsUrl = getTmsUrlByType(type);

            layer && layer.setUrl(tmsUrl);
        }catch (e) {
            console.error(e);
        }
    };

    /**
     * 销毁地图
     */
    destroy = () => {
        this.map.remove();
    };

    /**
     * 获取公共数据
     * @return {{center: number[], zoomRange: {maxZoom: number, minZoom: number}}}
     */
    getCommonData = () => {
        return {
            zoomRange: ZOOM,
            center: CENTER
        }
    };

    /**
     * 地图放大
     * @return {*}
     */
    zoomIn = () => this.map.zoomIn();

    /**
     * 地图缩小
     * @return {*}
     */
    zoomOut = () => this.map.zoomOut();


    /**
     * 重置
     */
    reset = (zoom?: number) => {
        this.map.flyTo(CENTER, zoom || ZOOM.minZoom);
    }


	/**
	 * 绑定清除地图的回调
	 * @param {Function} cb 回调方法
	 * @param {Array} params 回调参数
	 * @param {Object} context 上下文
	 */
	onClearMap = <T>(cb = () => {}, params:T[] = [], context: Function) => {
		cacheClearCallBack.set(cb, { params: Array.isArray(params) ? params : [params], context });
	}

	/**
	 * 解除清除地图的回调
	 * @param cb
	 */
	offClearMap = (cb: Function) =>{
		if (cacheClearCallBack.has(cb)) {
			cacheClearCallBack.delete(cb);
		}
	}

    /**
     * 清空地图
     * @param {Array} keepLayers 需要保留的layer [layerIns]
     */
    clearMap = (keepLayers: L.Layer[] = []) => {
        keepLayers = keepLayers.length <= 0 ? this.baseLayers : keepLayers;
        this.mouseTool.measure.clear();

        setTimeout(() => {
            this.map.eachLayer((layer) => {
                if (keepLayers.indexOf(layer) === -1) {
                    layer.remove();
                }
            });

            triggerClearMapCb();
        }, 0)
    }

    /**
     * 添加图片覆盖物
     * @param {String} url 图片访问地址
     * @param {Array}bounds 对角坐标[[15.9654505397617, 68.6096163928448], [54.8956963438891, 139.992039141987]]
     * @param {Object} options
     * @param {boolean} isFit
     */
    addImageOverLayer = (url: string, bounds: [number,number][], options = {}, isFit = false) => {
        const imageLayer = L.imageOverlay(url, L.latLngBounds(bounds[0], bounds[1]), options).addTo(this.map);
        if(isFit) this.map.fitBounds(imageLayer.getBounds());
        return imageLayer;
    };

    /**
     * 设置图片覆盖物
     * @type {*}
     */
    setImageOverLayer = this.getSetLayerFN(this.addImageOverLayer);

    /**
     * 添加WMS切片到地图中
     * @param {String} url WMS服务地址
     * @param {Object} options 配置说明： http://leafletjs.com/reference-1.2.0.html#tilelayer-wms
     */
    addWMSLayer = (url: string, options = {}) => {
        const wmsTileLayer = L.tileLayer.wms(url, Object.assign({
            layers: '',
            format: 'image/png',
            transparent: true,
            version: '',
            styles: '',
        }, options));

        this.map.addLayer(wmsTileLayer);

        return wmsTileLayer;
    }

    /**
     * 设置WMS切片到地图中
     * @type {*}
     */
    setWMSLayer = this.getSetLayerFN(this.addWMSLayer);

    addTMSLayer = (url: string, options = {}) => {
        const tmsTileLayer = L.tileLayer(url, options || {});

        this.map.addLayer(tmsTileLayer);

        return tmsTileLayer;
    }

    /**
     * 设置TMS切片到地图中
     * @type {*}
     */
    setTMSLayer = this.getSetLayerFN(this.addTMSLayer);

    /**
     * 添加GeoJSON数据
     * @param {Object} data
     * @param {Object} opts
     * @param {boolean} isFit
     */
    addGeoJSONLayer = (data: geojson.GeoJsonObject, opts = {}, isFit = false) => {
        const layer = L.geoJSON(data, Object.assign({
            style: function () {
                // return {color: feature.properties.color};
                return {
                    color: "#333333",
                    opacity: 1,
                    fill: true,
                    fillColor: "#333333",
                    fillOpacity: 1
                };
            }
        }, opts)).bindPopup(function (layer: L.GeoJSON) {
            //@ts-ignore
            return layer.feature.properties.description;
        }).addTo(this.map);

        if(isFit) this.map.fitBounds(layer.getBounds());

        return layer;
    }

    /**
     * 设置GeoJSON数据
     * @type {*}
     */
    setGeoJSONLayer = this.getSetLayerFN(this.addGeoJSONLayer);

    /**
     * 依据经纬度获取距离
     * @param {Array} start 起点坐标 [lat, lng]
     * @param {Array} end 终点坐标 [lat, lng]
     * @returns {number} 单位是: "米"
     */
    getDistanceByLatLng = (start: [number, number], end: [number, number]) => {
        return this.map.distance(start,end);
    }


    /**
     * 添加点到地图
     * @param {Array} latlngs [lat, lng]
     * @param {Object} options  配置说明： http://leafletjs.com/reference-1.2.0.html#marker
     * @param {Boolean} isFit
     * @returns {*}
     */
    addMarker = (latlngs: [number, number], options: L.MarkerOptions = {}, isFit = false) => {
       const marker = L.marker(latlngs, Object.assign({
            icon: L.icon({
                iconUrl: IconMarker,
                iconSize: [16, 16],
                // iconAnchor: [16, 16],
            })
        }, options)).addTo(this.map);

       if(isFit){
           this.map.fitBounds([
               [latlngs[0] + 5, latlngs[1] + 5],
               [latlngs[0] - 5, latlngs[1] - 5]
           ]);
       }

       return marker;
    }

    /**
     * 设置点到地图
     * @type {*}
     */
    setMarker = this.getSetLayerFN(this.addMarker);

    /**
     * 添加矩形到地图
     * @param {Array} bounds [[lat, lng], [lat, lng]]
     * @param options
     */
    addRectangle = (bounds: [number, number][], options: L.PolylineOptions = {}) => {
        return L.rectangle(bounds, Object.assign({color: "#ff7800", weight: 1}, options)).addTo(this.map);
    }

    /**
     * 设置矩形到地图
     * @type {*}
     */
    setRectangle = this.getSetLayerFN(this.addRectangle);

    /**
     * 绘制多边形到地图
     * @param {Array} latlngs [[lat, lng], [lat, lng]]
     * @param options
     */
    addPolygon = (latlngs: [number, number][], options: L.PolylineOptions = {}) => {
        return L.polygon(latlngs, Object.assign({color: "#ff7800", weight: 1}, options)).addTo(this.map);
    }

    /**
     * 设置多边形到地图
     * @type {*}
     */
    setPolygon = this.getSetLayerFN(this.addPolygon);


    /**
     * 添加圆形到地图
     * @param {Array} latlngs [lat, lng]
     * @param {Number} radius
     * @param options
     */
    addCirCle = (latlngs: [number, number], radius: number, options: L.CircleMarkerOptions = {}) => {
        return L.circle(latlngs, {radius, color: "#ff7800", weight: 1}).addTo(this.map);
    }

    /**
     * 设置圆形到地图
     * @type {*}
     */
    setCirCle = this.getSetLayerFN(this.addCirCle);

    /**
     * 添加折线到地图
     * @param latlngs [[lat1, lng1], [lat2, lng2],...]
     * @param options
     * @returns {*}
     */
    addPolyline = (latlngs: [number, number][], options: L.PolylineOptions = {}) =>{
        return L.polyline(latlngs, Object.assign({
            color: '#FFFF00',
            weight: 1,
        }, options)).addTo(this.map)
    }

    /**
     * 设置折线到地图
     * @type {*}
     */
    setPolyline = this.getSetLayerFN(this.addPolyline);

    /**
     * 添加圆点标记到地图
     * @param latlngs [lat, lng]
     * @param options 配置说明：http://leafletjs.com/reference-1.2.0.html#circlemarker
     * @returns {*}
     */
    addCircleMarker = (latlngs: [number, number], options: L.CircleMarkerOptions = {}) => {
        return L.circleMarker(L.latLng(latlngs[0], latlngs[1]), Object.assign({
            radius: 1,
            color: 'green',
            fillColor: 'green',
            fillOpacity: 1
        }, options)).addTo(this.map)
    }

    /**
     * 设置圆点标记到地图
     * @type {*}
     */
    setCircleMarker = this.getSetLayerFN(this.addCircleMarker);


    /**
     * 添加风资源图层
     * @param {Object} windData
     * @param {Object} opts
     * @returns {*}
     */
    addWindyLayer(windData, opts = {}) {
        const windyVelocityLayer = L.windyVelocityLayer(Object.assign({
            crs: L.CRS.EPSG3857,
            data: windData,
            velocityScale: 0.005,    // 调整风速大小
        }, opts)).addTo(this.map);

        return windyVelocityLayer
    }

    /**
     * 设置风资源图层
     * @type {*}
     */
    setWindyLayer = this.getSetLayerFN(this.addWindyLayer);


    // /**
    //  * 添加风资源图层 tif
    //  * @returns {*}
    //  */
    // addWindyByTifLayer = (url, urlParams = {}, windyOpts = {}) => {
    //     const layer = windyTiffVelocityLayer({
    //         url,
    //         urlParams,
    //         windyOpts: Object.assign({
    //             velocityScale: 0.005,    // 调整风速大小
    //             frameRate: 60,           // 1秒钟绘制多少帧
    //         }, windyOpts)
    //     }).addTo(this.map);
    //
    //     return layer
    // };
    //
    // /**
    //  * 设置风资源图层 tif
    //  * @type {*}
    //  */
    // setWindyByTifLayer = this.getSetLayerFN(this.addWindyByTifLayer);

    // /**
    //  * 添加风资源图层gl
    //  * @returns {*}
    //  */
    // addWindyGlVelocity = (url, urlParams = {}, windyOpts = {}) => {
    //     const layer = windyGlVelocity({
    //         url,
    //         urlParams,
    //         windyOpts: Object.assign({
    //             velocityScale: 0.005,    // 调整风速大小
    //             frameRate: 60,           // 1秒钟绘制多少帧
    //         }, windyOpts)
    //     }).addTo(this.map);
    //
    //     return layer
    // };
    //
    // /**
    //  * 设置风资源图层gl
    //  * @type {*}
    //  */
    // setWindyGlVelocity = this.getSetLayerFN(this.addWindyGlVelocity);

    // /**
    //  * 添加风向杆
    //  * @returns {*}
    //  */
    // addWindBarbsByTifLayer = (url, urlParams = {}) => {
    //     const layer = windBarbsTiffLayer({
    //         url,
    //         urlParams,
    //     }).addTo(this.map);
    //
    //     return layer
    // };
    //
    // /**
    //  * 设置风向杆 tif
    //  * @type {*}
    //  */
    // setWindBarbsByTifLayer = this.getSetLayerFN(this.addWindBarbsByTifLayer);


    // /**
    //  * 添加风资源图层 tif
    //  * @returns {*}
    //  */
    // addElementTileTifLayer = (url, opts = {}) => {
    //     const layer = elementTileTifLayer({
    //         url,
    //         ...opts,
    //     }).addTo(this.map);
    //
    //     return layer
    // };
    //
    // setElementTileTifLayer = this.getSetLayerFN(this.addElementTileTifLayer);

    /**
     * 依据坐标和盒子的宽高，计算position的x和y
     * @param {Array} coordinate [ lat, lng ]
     * @param {Number} boxWidth
     * @param {Number} boxHeight
     * @returns {{x: number, y: number}}
     */
    computeBoxPosByCoord = (coordinate: [number, number], boxWidth: number, boxHeight: number) =>{
        const map = this.map;
        const mapWidth = map.getSize().x,
            mapHeight = map.getSize().y,
            coord = this.map.latLngToContainerPoint(L.latLng(coordinate[0], coordinate[1]));

        const x = coord.x + boxWidth > mapWidth ? coord.x - boxWidth - 50 : coord.x + 20;
        const y = coord.y - boxHeight/2 > mapHeight ? coord.y + boxHeight/2 : coord.y - boxHeight / 2;

        return { x, y }
    }

}

