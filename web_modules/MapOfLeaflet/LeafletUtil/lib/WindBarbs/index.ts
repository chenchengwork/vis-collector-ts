import { invert, range, deg2rad, rad2deg} from './helper';
/**
 * 是否是undefined
 * @param data
 * @returns {boolean}
 */
const isUndefined = (data) => data === undefined;

/**
 * 是否是null
 * @param data
 * @returns {boolean}
 */
const isNull = (data) => data === null;

export default class WindBarbs {
    /**
     *
     * @param {Object} opts
     * @param {HTMLCanvasElement} opts.canvas
     */
    constructor(opts) {
        this.opts = {
            canvas: opts.canvas,
            tifNoData: -9999,       // tif中noData的填充值
        }
    }

    render = (params) => {
        this.stop();
        const { barbSize, canvasW, canvasH, imgW, imgH, geoTransform, data, extent } = params;

        const mapBounds = {
            south: deg2rad(extent[0][1]),   // 西南纬度
            north: deg2rad(extent[1][1]),   // 东北纬度
            east: deg2rad(extent[1][0]),    // 东北经度
            west: deg2rad(extent[0][0]),    // 西南经度
            width: canvasW,
            height: canvasH
        };

        const { uData, vData, spdData } = this._convertDataToGrid(imgW, imgH, data);

        const xPos = range(barbSize, canvasW, barbSize);
        const yPos = range(barbSize, canvasH, barbSize);
        const context = this.opts.canvas.getContext("2d");

        xPos.forEach(function(x){
            yPos.forEach(function(y){
                const coords = invert(x, y, mapBounds);
                const px = Math.round((coords[0] - geoTransform[0]) / geoTransform[1]);
                const py = Math.round((coords[1] - geoTransform[3]) / geoTransform[5]);

                if(isUndefined(vData[py]) || isUndefined(uData[py]) ||
                    isUndefined(vData[py][px]) || isUndefined(uData[py][px]) ||
                    isNull(vData[py][px]) || isNull(uData[py][px])
                ) return false;

                const angle = Math.atan2(-vData[py][px], uData[py][px]);
                let spd5 = Math.round(spdData[py][px] / 5);
                let spd10 = Math.floor(spd5 / 2);
                spd5 = spd5 % 2;
                let spd50 = Math.floor(spd10 / 5);
                spd10 = spd10 % 5;

                drawBarbs({context, x, y, barbSize, angle, spd5, spd10, spd50});
            });
        });
    }

    stop = () => {
        const context = this.opts.canvas.getContext("2d");
        context.clearRect(0, 0, 3000, 3000);
    }

    /**
     * 将数据转为格点数据
     * @param width
     * @param height
     * @param rasters
     * @return {{spdData: any[], uData: any[], vData: any[]}}
     * @private
     */
    _convertDataToGrid = (width, height, rasters) => {
        const noData = this.opts.tifNoData
        const uData = new Array(height);
        const vData = new Array(height);
        const spdData = new Array(height);
        for (let j = 0; j < height; j++){
            uData[j] = new Array(width);
            vData[j] = new Array(width);
            spdData[j] = new Array(width);
            for (let i = 0; i < width; i++){
                uData[j][i] = rasters[0][i + j * width] === noData ? null : rasters[0][i + j * width];
                vData[j][i] = rasters[1][i + j * width] === noData ? null : rasters[1][i + j * width];
                if(isNull(uData[j][i]) || isNull(vData[j][i])){
                    spdData[j][i] = null;
                }else {
                    spdData[j][i] = 1.943844492 * Math.sqrt(uData[j][i] * uData[j][i] + vData[j][i] * vData[j][i]);
                }
            }
        }

        return { uData, vData, spdData }
    }
}

/**
 * 绘制风向杆
 * @param params
 */
const drawBarbs = (params) => {
    const { context, x, y, barbSize, angle, spd5, spd10, spd50 } = params;

    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.beginPath();
    context.strokeStyle = "#444";
    context.fillStyle = "#444";

    let pos = -barbSize / 2;
    const separation = 2.5;

    for(let i = 0; i < spd50; i++){
        context.moveTo(pos, 0);
        context.lineTo(pos + barbSize / 8, barbSize / 4);
        context.lineTo(pos + barbSize / 4, 0);
        pos = pos + barbSize / 4 + separation;
        context.fill();
    }

    for(let i = 0; i < spd10; i++){
        context.moveTo(pos, 0);
        context.lineTo(pos, barbSize/3);
        pos = pos + separation
    }

    if(spd5 == 1){
        if (pos == -barbSize/2){
            pos = pos + separation
        }
        context.moveTo(pos, 0);
        context.lineTo(pos, barbSize/6);
    }

    if(spd5 == 0 && spd10 == 0 && spd50 == 0){
        context.arc(0, 0, 4, 0, 2 * Math.PI, false);
    } else {
        context.moveTo(-barbSize/2,0);
        context.lineTo(barbSize/2,0);
    }
    context.stroke();
    context.restore();
}

// 绘制风向箭头 http://geoexamples.com/d3-raster-tools-docs/code_samples/wind-arrows-page.html
// const drawArrows = (params) => {
//     const { context, x, y, barbSize, angle, spd5, spd10, spd50 } = params;
//
//     context.save();
//     context.translate(x, y);
//     context.rotate(angle);
//     context.scale(sizeScale(spd), sizeScale(spd));
//     context.beginPath();
//     context.strokeStyle = "#444";
//     context.fillStyle = colorScale(spd);
//
//     context.moveTo(-arrowSize/2,0);
//     context.lineTo(arrowSize/5,arrowSize/6);
//     context.lineTo(arrowSize/5,arrowSize/3);
//     context.lineTo(arrowSize/2,0);
//     context.lineTo(arrowSize/5,-arrowSize/3);
//     context.lineTo(arrowSize/5,-arrowSize/6);
//     context.lineTo(-arrowSize/2,0);
//
//     context.stroke();
//     context.fill();
//     context.restore();
// }
