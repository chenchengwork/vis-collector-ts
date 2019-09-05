// 坐标系投影
const crsCode = "EPSG:3857";

interface MapBounds {
    east: number;
    west: number;
    south: number;
    north: number;
    width: number;
    height: number;
}

/**
 *
 * @param x
 * @param y
 * @param {Object} mapBounds
 * @param {Number} mapBounds.east   // 弧度
 * @param {Number} mapBounds.west
 * @param {Number} mapBounds.south
 * @param {Number} mapBounds.north
 * @param {Number} mapBounds.width
 * @param {Number} mapBounds.height
 * @return {*[]}
 */
export const invert = (x: number, y: number, mapBounds: MapBounds) => {
    // @ts-ignore
    if(crsCode == "EPSG:4326"){
        const mapLonDelta = mapBounds.east - mapBounds.west;
        const mapLatDelta = mapBounds.south - mapBounds.north;
        const lat = rad2deg(mapBounds.north) + y / mapBounds.height * rad2deg(mapLatDelta);
        const lon = rad2deg(mapBounds.west) + x / mapBounds.width * rad2deg(mapLonDelta);
        return [lon, lat];
    }
    // EPSG:3857
    else {
        const mapLonDelta = mapBounds.east - mapBounds.west;    // 地图经度弧度范围
        const worldMapRadius = mapBounds.width / rad2deg(mapLonDelta) * 360 / (2 * Math.PI);
        const mapOffsetY = (worldMapRadius / 2 * Math.log((1 + Math.sin(mapBounds.south)) / (1 - Math.sin(mapBounds.south))));
        const equatorY = mapBounds.height + mapOffsetY;
        const a = (equatorY - y) / worldMapRadius;
        const lat = 180 / Math.PI * (2 * Math.atan(Math.exp(a)) - Math.PI / 2);
        const lon = rad2deg(mapBounds.west) + x / mapBounds.width * rad2deg(mapLonDelta);
        return [lon, lat];
    }
};


export const deg2rad = function( deg: number ){
    return (deg / 180) * Math.PI;
};

export const rad2deg = function( ang: number ){
    return ang / (Math.PI/180.0);
};

/**
 * 填充数组
 * @param start
 * @param stop
 * @param step
 */
export const range = function(start: number, stop: number, step: number){
    let n;

    start = +start;
    stop = +stop;
    step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

    let i = -1, range = new Array(n);
    n = Math.max(0, Math.ceil((stop - start) / step)) | 0;

    while (++i < n) {
        range[i] = start + i * step;
    }

    return range;
};
