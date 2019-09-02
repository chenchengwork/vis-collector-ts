// 坐标系投影
const crsCode = "EPSG:3857";

/**
 *
 * @param x
 * @param y
 * @param {Object} windy
 * @param {Number} windy.east   // 弧度
 * @param {Number} windy.west
 * @param {Number} windy.south
 * @param {Number} windy.north
 * @param {Number} windy.width
 * @param {Number} windy.height
 * @return {*[]}
 */
export const invert = (x, y, windy) => {
    if(crsCode == "EPSG:4326"){
        const mapLonDelta = windy.east - windy.west;
        const mapLatDelta = windy.south - windy.north;
        const lat = rad2deg(windy.north) + y / windy.height * rad2deg(mapLatDelta);
        const lon = rad2deg(windy.west) + x / windy.width * rad2deg(mapLonDelta);
        return [lon, lat];
    }
    // EPSG:3857
    else {
        const mapLonDelta = windy.east - windy.west;    // 地图经度弧度范围
        const worldMapRadius = windy.width / rad2deg(mapLonDelta) * 360 / (2 * Math.PI);
        const mapOffsetY = (worldMapRadius / 2 * Math.log((1 + Math.sin(windy.south)) / (1 - Math.sin(windy.south))));
        const equatorY = windy.height + mapOffsetY;
        const a = (equatorY - y) / worldMapRadius;
        const lat = 180 / Math.PI * (2 * Math.atan(Math.exp(a)) - Math.PI / 2);
        const lon = rad2deg(windy.west) + x / windy.width * rad2deg(mapLonDelta);
        return [lon, lat];
    }
};


export const deg2rad = function( deg ){
    return (deg / 180) * Math.PI;
};

export const rad2deg = function( ang ){
    return ang / (Math.PI/180.0);
};

/**
 * 填充数组
 * @param start
 * @param stop
 * @param step
 * @return {any[]}
 */
export const range = function(start, stop, step){
    start = +start,
        stop = +stop,
        step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

    let i = -1,
        n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
        range = new Array(n);

    while (++i < n) {
        range[i] = start + i * step;
    }

    return range;
};
