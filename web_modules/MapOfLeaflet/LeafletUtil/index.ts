import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import * as geojson from 'geojson';
import IconMarker from './img/marker.png';

// 加载切片服务配置
import {providers, getTmsUrlByType, tileServiceProvider} from "./extend/tileServiceProvider";

// 加载鼠标工具
import MouseTool from './extend/mouseTool';

// 加载风速layer
import { getWindyVelocityLayer, WindData } from './extend/windyVelocityLayer';

// 加载风向杆layer
import { getWindBarsTiffLayer } from "./extend/windBarbsLayer";


// import windyGlVelocity from './extend/windyGlVelocity';

// // 加载要素tif layer
// import elementTileTifLayer from "./extend/elementTileTifLayer";
//
// // 加载移动Marker
// import "./extend/movingMarker";
//
// // 加载地理编码工具
// import GeoCoder from './GeoCoder';

export interface LeafletUtilOpts extends L.MapOptions{
    baseLayerTMS?: string | string[];
}

const isUndefined = (data: any) => data === undefined;

/**
 * 组装基础TMS Layer
 * @param baseLayerTMS
 * @param ZOOM
 */
const assembleBaseTmsLayers = (baseLayerTMS: string | string[], ZOOM: {maxZoom: number; minZoom: number}) => {
    let baseLayers: L.TileLayer[] = [];
    if(Array.isArray(baseLayerTMS)){
        baseLayers = baseLayerTMS.map((type) => tileServiceProvider(type));
    }else {
        baseLayers.push(tileServiceProvider(baseLayerTMS, ZOOM));
    }
    return baseLayers;
};


/**
 * Leaflet 地图工具类
 */
export default class LeafletUtil {
    map: L.Map;
    mouseTool: MouseTool;
    protected containerDom: HTMLElement;
    protected baseLayers: L.TileLayer[];
    private _cacheData = {
        clearMapCallback: new Map(),                // 存储清空地图的回调方法
        center: [28.9, 128.9] as L.LatLngTuple,     // 中心点
        maxZoom: 28,                                // 地图最大level
        minZoom: 4,                                 // 地图最小level
        zoom: 4,                                    // 地图初始level
    };

    /**
     * 初始化地图
     * @param {String} idOrHTMLElement    地图容器id
     * @param {Object} options  地图配置 https://leafletjs.com/reference-1.4.0.html#map-option
     * @returns {null|*}
     */
    constructor(idOrHTMLElement: string | HTMLElement, options: LeafletUtilOpts = {}) {
        this.containerDom = idOrHTMLElement instanceof HTMLElement ? idOrHTMLElement : document.querySelector(`#${idOrHTMLElement}`);
        // 设置缓存数据
        this._setCacheData(options);
        const { zoom, maxZoom, minZoom, center } = this._cacheData;

        this.baseLayers = assembleBaseTmsLayers(options.baseLayerTMS || 'Geoq.Normal.Map', {maxZoom, minZoom});

        this.map = L.map(this.containerDom, Object.assign({
            attributionControl: false,      // 去掉leaflet的标识
            crs: L.CRS.EPSG3857,             // 墨卡托投影
            // crs:L.CRS.EPSG4326,          // 经纬度投影
            center: center,
            zoom,
            maxZoom,
            minZoom,
            layers: this.baseLayers,
            zoomControl: false,
            doubleClickZoom: false,
            renderer: L.canvas(),
            // renderer: L.svg()
        }, options));

        // 鼠标工具
        this.mouseTool = new MouseTool(this.map);

        // 地理编码工具
        // this.geoCoder = new GeoCoder();
    }

    /**
     * 设置缓存数据
     * @param opts
     * @private
     */
    private _setCacheData = (opts: LeafletUtilOpts) => {
        const { zoom, maxZoom, minZoom, center } = opts;
        if(!isUndefined(center)) this._cacheData.center = center as L.LatLngTuple;
        if(!isUndefined(zoom)) this._cacheData.zoom = zoom;
        if(!isUndefined(maxZoom)) this._cacheData.zoom = maxZoom;
        if(!isUndefined(minZoom)) this._cacheData.zoom = minZoom;
    };

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
            for(let i = 0; i < this.baseLayers.length; i++){
                // @ts-ignore
                if(this.baseLayers[i]._url == getTmsUrlByType(type)) return true;
            }
            return false;
        }catch (e) {
            console.error(e);
            return false;
        }
    };

    /**
     * 更新底图
     * @param type
     */
    updateBaseMap = (type: string | string[]) => {
        try {
            const newTypes = Array.isArray(type) ? type : [type];
            const maxCount = Math.max(newTypes.length, this.baseLayers.length);

            for(let i = 0; i < maxCount; i++){
                if(this.baseLayers[i] && newTypes[i]){
                    this.baseLayers[i].setUrl(getTmsUrlByType(newTypes[i]))
                }else if(newTypes[i] && !this.baseLayers[i]){
                    const layer = tileServiceProvider(newTypes[i]);
                    this.baseLayers.push(layer);
                    this.map.addLayer(layer);
                }else if(!newTypes[i] && this.baseLayers[i]){
                    this.baseLayers[i].remove();
                    this.baseLayers.splice(i, 1);
                }
            }
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
        const { center, minZoom } = this._cacheData;
        this.map.flyTo(center, zoom || minZoom);
    };

	/**
	 * 绑定清除地图的回调
	 * @param {Function} cb 回调方法
	 * @param {Array} params 回调参数
	 * @param {Object} context 上下文
	 */
	onClearMap = <T>(cb = () => {}, params:T[] = [], context: Function) => {
		this._cacheData.clearMapCallback.set(cb, { params: Array.isArray(params) ? params : [params], context });
	}

	/**
	 * 解除清除地图的回调
	 * @param cb
	 */
	offClearMap = (cb: Function) =>{
		if (this._cacheData.clearMapCallback.has(cb)) {
            this._cacheData.clearMapCallback.delete(cb);
		}
	};

    /**
     * 清空地图
     * @param {Array} keepLayers 需要保留的layer [layerIns]
     */
    clearMap = (keepLayers: L.Layer[] = []) => {
        keepLayers = keepLayers.length <= 0 ? this.baseLayers : keepLayers;
        this.mouseTool.measure.clear();

        setTimeout(() => {
            this.map.eachLayer((layer) => {
                if ((layer instanceof L.TileLayer && !this.baseLayers.includes(layer)) && !keepLayers.includes(layer)) {
                    layer.remove();
                }
            });

            // 触发清空地图的回调方法
            for(let [cb, {params, context}] of this._cacheData.clearMapCallback.entries()) {
                cb.apply(context, params);
            }
        }, 0)
    };

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
    addWindyLayer(windData: WindData, opts = {}) {
        const params = Object.assign({
            crs: L.CRS.EPSG3857,
            windyParams: {
                data: windData,
                velocityScale: 0.005,    // 调整风速大小
            }
        }, opts);

        const layer = getWindyVelocityLayer(params).addTo(this.map);
        // layer.setData()
        return layer
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

    /**
     * 添加风向杆
     * @returns {*}
     */
    addWindBarbsByTifLayer = (url: string, urlParams = {}) => {
        const layer = getWindBarsTiffLayer(url).addTo(this.map);
        return layer
    };

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

