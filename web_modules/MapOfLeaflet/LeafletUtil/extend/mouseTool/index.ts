import L from 'leaflet';

import Measure from './Measure';
import IconMarker from '../../img/marker.png';

interface TypeMouseStartEventCb {
    [index: string]: {
        eventName: string;
        eventCb: (e?: any) => void;
    }
}

type WrapMousePPCreateMark = (markObj: L.Polygon | L.Polyline, e: L.LeafletMouseEvent) => L.Polygon | L.Polyline;
type WrapMousePPSetMarkBounds = (markObj: L.Polygon | L.Polyline, e: L.LeafletMouseEvent) => void;

type WrapMouseCreateMark = (downEvent: L.LeafletMouseEvent, moveEvent: L.LeafletMouseEvent) => L.Rectangle | L.Circle;
type WrapMouseSetMarkBounds = (rectangleObj: L.Rectangle | L.Circle, downEvent: L.LeafletMouseEvent, moveEvent: L.LeafletMouseEvent) => void;


const cacheMouseStartEventCb: TypeMouseStartEventCb = {
    marker: {
        eventName: 'click',
        eventCb: null,
    },
    rectangle: {
        eventName: 'mousedown',
        eventCb: null,
    },
    circle: {
        eventName: 'mousedown',
        eventCb: null,
    },
    polyline: {
        eventName: 'dblclick',
        eventCb: null,
    },
    polygon: {
        eventName: 'dblclick',
        eventCb: null,
    }
};

/**
 * 枚举形状类型
 * @type {{polygon: string, polyline: string}}
 */
const EnumShapeType = {
    polygon: 'polygon',
    polyline: 'polyline'
};

/**
 * 默认鼠标样式
 * @type {string}
 */
let defaultMapMouseCursor = 'move';

const wrapMouse = (map: L.Map, createMark: WrapMouseCreateMark, setMarkBounds: WrapMouseSetMarkBounds, drawEndCb: (markObj: L.Rectangle | L.Circle) => void) => {
    // @ts-ignore
    map._container.style.cursor = 'crosshair';
    map.dragging.disable();

    const mousedownCb = (downEvent: L.LeafletMouseEvent) => {
        let markObj: L.Rectangle | L.Circle =  null;

        const mousemoveCb = (moveEvent: L.LeafletMouseEvent) => {
            if (markObj){
                setMarkBounds(markObj, downEvent, moveEvent);
            }else {
                markObj =  createMark(downEvent, moveEvent);
            }
        };

        const mouseupCb = () => {
            map.off('mouseup', mouseupCb);
            map.off('mousemove', mousemoveCb);
            drawEndCb(markObj);
        };

        map.on('mousemove', mousemoveCb);
        map.on('mouseup', mouseupCb)
    };

    map.on('mousedown', mousedownCb);

    return mousedownCb;
};

const wrapMousePP = (map: L.Map, createMark: WrapMousePPCreateMark, setMarkBounds: WrapMousePPSetMarkBounds, drawEndCb: (markObj: L.Polygon | L.Polyline) => void) => {
    // @ts-ignore
    map._container.style.cursor = 'crosshair';
    let markObj: L.Polygon | L.Polyline =  null;
    let cacheMousemoveCb: (e: L.LeafletMouseEvent) => void = null;

    const clickCb = (clickedEvent: L.LeafletMouseEvent) => {
        markObj =  createMark(markObj, clickedEvent);

        const mousemoveCb = (moveEvent: L.LeafletMouseEvent) => {
            setMarkBounds(markObj, moveEvent);
        };

        map.off('mousemove', cacheMousemoveCb);
        map.on('mousemove', mousemoveCb);
        cacheMousemoveCb = mousemoveCb;
    };

    const dblClickCb = () => {
        map.off('mousemove', cacheMousemoveCb);
        drawEndCb(markObj)
        markObj = null;
    }

    map.on('click', clickCb);
    map.on('dblclick', dblClickCb);

    return dblClickCb;
}


/**
 * 绘制多边形或折线
 * @param type
 * @param map
 * @param options
 * @returns {Promise<any>}
 */
const drawPolygonOrPolyline = (type: string, map: L.Map, options = {}) => new Promise((resolve, reject) => {

    const createMark: WrapMousePPCreateMark = (markObj, clickedEvent) => {
        if(markObj){
            let currentLatLngs = markObj.getLatLngs();

            if (type == EnumShapeType.polygon) {
                (currentLatLngs[0] as L.LatLng[]).push(L.latLng(clickedEvent.latlng.lat, clickedEvent.latlng.lng));
            }else if (type == EnumShapeType.polyline) {
                (currentLatLngs as L.LatLng[]).push(L.latLng(clickedEvent.latlng.lat, clickedEvent.latlng.lng));
            }
            markObj.setLatLngs(currentLatLngs);

            return markObj;
        }

        const shape = {
            [EnumShapeType.polygon]: L.polygon,
            [EnumShapeType.polyline]: L.polyline,
        };

        return shape[type](
            [[clickedEvent.latlng.lat, clickedEvent.latlng.lng]],
            Object.assign({
                color: "#ff7800",
                weight: 1,
            }, options)
        ).addTo(map);
    };

    const setMarkBounds: WrapMousePPSetMarkBounds = (markObj,  moveEvent) => {
        let currentLatLngs = markObj.getLatLngs();
        if (type == EnumShapeType.polygon) {
            if ((currentLatLngs[0] as L.LatLng[]).length < 2) {
                (currentLatLngs[0] as L.LatLng[]).push(L.latLng(moveEvent.latlng.lat, moveEvent.latlng.lng));
            } else {
                (currentLatLngs[0] as L.LatLng[]).pop();
                (currentLatLngs[0] as L.LatLng[]).push(L.latLng(moveEvent.latlng.lat, moveEvent.latlng.lng));
            }
        }else if (type == EnumShapeType.polyline) {
            if (currentLatLngs.length < 2) {
                (currentLatLngs as L.LatLng[]).push(L.latLng(moveEvent.latlng.lat, moveEvent.latlng.lng));
            } else {
                currentLatLngs.pop();
                (currentLatLngs as L.LatLng[]).push(L.latLng(moveEvent.latlng.lat, moveEvent.latlng.lng));
            }
        }

        markObj.setLatLngs(currentLatLngs);
    };

    try {
        cacheMouseStartEventCb[type].eventCb = wrapMousePP(map, createMark, setMarkBounds, (markObj: L.Polygon | L.Polyline) => {
            let currentLatLngs = markObj.getLatLngs();
            if (type == EnumShapeType.polygon) {
                (currentLatLngs[0] as L.LatLng[]).pop();
                (currentLatLngs[0] as L.LatLng[]).pop();
            }else if (type == EnumShapeType.polyline) {
                currentLatLngs.pop();
                currentLatLngs.pop();
            }

            markObj.setLatLngs(currentLatLngs);

            resolve(markObj)
        })
    }catch (e){
        reject(e)
    }
});


export default class MouseTool{
    private map: L.Map;
    measure: Measure;

    /**
     *
     * @param {Object} map leaflet地图实例
     */
    constructor(map: L.Map) {
        this.map = map;
        defaultMapMouseCursor = this._getCursor() || 'move';

        // this.L = L;
        // 测距工具
        this.measure = new Measure(map);

        // 按esc键取消鼠标操作
        window.addEventListener("keydown", (e) => e.keyCode === 27 && this.close())
    }

    private _getCursor = (): string => {
        //@ts-ignore
        return this.map._container.style.cursor;
    }

    private _setCursor = (cursor: string) => {
        //@ts-ignore
        this.map._container.style.cursor = cursor;
    }

    /**
     * 清除事件
     * @private
     */
    private _clearEvent(){
        Object.values(cacheMouseStartEventCb).forEach((item) => this.map.off(item.eventName, item.eventCb));
    }

    /**
     * 关闭鼠标工具
     */
    close() {
        this.measure.clear();
        this._clearEvent();

        this.map.dragging.enable();
        this._setCursor(defaultMapMouseCursor);
    }

    /**
     * 绘制标记
     * @param {Object} options 配置说明： http://leafletjs.com/reference-1.2.0.html#marker
     * @param {Boolean} isFitBounds 是否移动到目标区域
     */
    marker(options = {}, isFitBounds = false) {
        this._clearEvent();
        return new Promise((resolve, reject) => {
            const map = this.map;
            // const L = this.L;
            this._setCursor("crosshair")
            // map._container.style.cursor = 'crosshair';

            try{
                const clickCb = (e: L.LeafletMouseEvent) => {
                    const marker = L.marker(
                        [e.latlng.lat, e.latlng.lng],
                        Object.assign({
                            icon: L.icon({
                                iconUrl: IconMarker,
                                iconSize: [16, 16],
                                // iconAnchor: [16, 16],
                            })
                        }, options)
                    ).addTo(map);

                    resolve(marker);
                    this.close();
                };

                map.on('click', clickCb);
                cacheMouseStartEventCb.marker.eventCb = clickCb;

            }catch (e){
                reject(e)
            }
        })
    }

    /**
     * 绘制矩形
     * @param {Object} options 配置说明： http://leafletjs.com/reference-1.2.0.html#rectangle
     * @param {Boolean} isFitBounds 是否移动到目标区域
     * @returns {Promise<any>}
     */
    rectangle(options = {}, isFitBounds = false){
        this._clearEvent();
        return new Promise((resolve, reject) => {
            const map = this.map;

            const createMark: WrapMouseCreateMark = (downEvent, moveEvent) => {
                return L.rectangle(
                    [[downEvent.latlng.lat, downEvent.latlng.lng ],[moveEvent.latlng.lat, moveEvent.latlng.lng]],

                    Object.assign({
                        color: "#ff7800",
                        weight: 1
                    }, options)

                ).addTo(map);
            };

            const setMarkBounds: WrapMouseSetMarkBounds = (rectangleObj, downEvent, moveEvent) => {
                (rectangleObj as L.Rectangle).setBounds(L.latLngBounds(
                    L.latLng(downEvent.latlng.lat, downEvent.latlng.lng),
                    L.latLng(moveEvent.latlng.lat, moveEvent.latlng.lng)
                ));
            };

            try {
                cacheMouseStartEventCb.rectangle.eventCb = wrapMouse(map, createMark, setMarkBounds, (markObj: L.Rectangle) => {
                    resolve(markObj)
                    this.close();
                })
            }catch (e){
                reject(e)
            }
        });
    }

    /**
     * 绘制圆形
     * @param {Object} options 配置说明： http://leafletjs.com/reference-1.2.0.html#circle
     * @param {Boolean} isFitBounds 是否移动到目标区域
     * @returns {Promise<any>}
     */
    circle(options = {}, isFitBounds = false){
        this._clearEvent();
        return new Promise((resolve, reject) => {
            const map = this.map;
            // const L = this.L;

            const createMark: WrapMouseCreateMark = (downEvent, moveEvent) => {
                return L.circle(
                    [downEvent.latlng.lat, downEvent.latlng.lng],

                    Object.assign({
                        color: "#ff7800",
                        weight: 1,
                        radius: map.distance([downEvent.latlng.lat, downEvent.latlng.lng ],[moveEvent.latlng.lat, moveEvent.latlng.lng])
                    }, options)

                ).addTo(map);
            };

            const setMarkBounds: WrapMouseSetMarkBounds = (circleObj: L.Circle, downEvent: L.LeafletMouseEvent, moveEvent: L.LeafletMouseEvent) => {
                circleObj.setRadius(map.distance(
                    [downEvent.latlng.lat, downEvent.latlng.lng],
                    [moveEvent.latlng.lat, moveEvent.latlng.lng]
                ));
            };

            try {
                cacheMouseStartEventCb.circle.eventCb = wrapMouse(map, createMark, setMarkBounds, (markObj: L.Circle) => {
                    resolve(markObj)
                    this.close();
                })
            }catch (e){
                reject(e)
            }
        });
    }

    /**
     * 绘制多边形
     * @param {Object} options 配置说明： http://leafletjs.com/reference-1.2.0.html#polygon
     * @param {Boolean} isFitBounds
     * @returns {Promise<any>}
     */
    polygon(options = {}, isFitBounds = false){
        this._clearEvent();
        return drawPolygonOrPolyline(EnumShapeType.polygon,this.map, options).then(resp => {
            this.close();
            return resp;
        }, (e) => e)
    }

    /**
     * 绘制折线
     * @param {object} options   配置说明： http://leafletjs.com/reference-1.2.0.html#polyline
     * @param {Boolean} isFitBounds
     * @returns {Promise<any>}
     */
    polyline(options = {}, isFitBounds = false){
        this._clearEvent();
        return drawPolygonOrPolyline(EnumShapeType.polyline,this.map, options).then(resp => {
            this.close();
            return resp;
        }, (e) => e)
    }
}
