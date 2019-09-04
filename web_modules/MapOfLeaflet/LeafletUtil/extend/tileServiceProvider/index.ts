import L from 'leaflet';


const providers = {
    TianDiTu: {
        Normal: {
            // Map: 'http://t0.tianditu.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}',
            Map: 'http://t0.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={x}&TILECOL={y}&tk=2b389b94c34689a638c26db18c927aea',
            // Annotion: 'http://t0.tianditu.cn/DataServer?T=cva_w&X={x}&Y={y}&L={z}',
        },
        Satellite: {
            Map: 'http://t0.tianditu.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}',
            // Annotion: 'http://t0.tianditu.cn/DataServer?T=cia_w&X={x}&Y={y}&L={z}',
        },
        Terrain: {
            Map: 'http://t0.tianditu.cn/DataServer?T=ter_w&X={x}&Y={y}&L={z}',
            // Annotion: 'http://t0.tianditu.cn/DataServer?T=cta_w&X={x}&Y={y}&L={z}',
        },
        Subdomains: ['0', '1', '2', '3', '4', '5', '6', '7']
    },

    // 高德地图: https://lbs.amap.com/api/javascript-api/reference/layer
    GaoDe: {
        Normal: {
            Map: 'http://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        },
        Satellite: {
            Map: 'http://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
            Annotion: 'http://webst01.is.autonavi.com/appmaptile?style=8&x={x}&y={y}&z={z}'
        },

        Subdomains: ['1']
    },

    // 谷歌: http://www.google.cn/maps/
    Google: {
        Normal: {
            Map: 'http://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}'
        },
        Satellite: {
            Map: 'http://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}'
        },
        Terrain: {
            Map: 'http://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}&s=Galil',
        },
        Subdomains: [] as string[]
    },

    // 智图: http://www.geoq.cn/index.html
    Geoq: {
        Normal: {
            Map: 'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineCommunity/MapServer/tile/{z}/{y}/{x}',
            // Color: 'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetColor/MapServer/tile/{z}/{y}/{x}',
            PurplishBlue: 'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetPurplishBlue/MapServer/tile/{z}/{y}/{x}',
            Gray: 'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetGray/MapServer/tile/{z}/{y}/{x}',
            Warm: 'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetWarm/MapServer/tile/{z}/{y}/{x}',
            Cold: 'http://map.geoq.cn/ArcGIS/rest/services/ChinaOnlineStreetCold/MapServer/tile/{z}/{y}/{x}'
        },
        Subdomains: [] as string[]
    }
};

const TileServiceProvider: {new(...args: any[]): any} = L.TileLayer.extend({

    initialize: function(type: string, options = {}) {

        let parts = type.split('.');

        let providerName = parts[0];
        let mapName = parts[1];
        let mapType = parts[2];

        // @ts-ignore
        let url = providers[providerName][mapName][mapType];
        // @ts-ignore
        options.subdomains = providers[providerName].Subdomains;
        // @ts-ignore
        L.TileLayer.prototype.initialize.call(this, url, options);
    },
});


export const getTmsUrlByType =  (type: string): string => {
    const parts = type.split('.');

    const providerName = parts[0];
    const mapName = parts[1];
    const mapType = parts[2];
    // @ts-ignore
    return providers[providerName][mapName][mapType];
};

export { providers };

export const tileServiceProvider = (type: string, options = {}): L.TileLayer => {
    return new TileServiceProvider(type, options);
};


