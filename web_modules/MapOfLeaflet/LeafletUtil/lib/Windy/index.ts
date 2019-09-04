/*  Global class for simulating the movement of particle through a 1km wind grid
 credit: All the credit for this work goes to: https://github.com/cambecc for creating the repo:
 https://github.com/cambecc/earth. The majority of this code is directly take nfrom there, since its awesome.
 This class takes a canvas element and an array of data (1km GFS from http://www.emc.ncep.noaa.gov/index.php?branch=GFS)
 and then uses a mercator (forward/reverse) projection to correctly map wind vectors in "map space".
 The "start" method takes the bounds of the map at its current extent and starts the whole gridding,
 interpolation and animation process.
 */

// 关于风向的u、v分量及js、c#根据uv计算风向公式(https://www.giserdqy.com/gis/opengis/algorithm/1288/)

import {
    isValue,
    floorMod,
    isMobile,
    distort,
    deg2rad,
    invert
} from './windyHelper';

import { scale, RGBA } from './color'

type InterpolateVectorFN = (x:number, y:number, g00:number[], g10:number[], g01:number[], g11:number[]) => [number, number, number]
type InterpolateFN = (λ: number, φ: number) => [number, number, number]
type BuildGridCallback = ({interpolate}: {interpolate: InterpolateFN}) => void;

interface Field{
    (x: number, y: number): number[];
    release: () => void;
    randomize: <T>(o:T) => T;
}

interface BuildBounds {
    x: number;
    y: number;
    xMax: number;
    yMax: number;
    width: number;
    height: number;
};

interface MapBounds{
    south: number;   // 西南纬度
    north: number;   // 东北纬度
    east: number;    // 东北经度
    west: number;    // 西南经度
    width: number;
    height: number;
};

interface InitParams {
    data: UV[];
    minVelocity?: number;
    maxVelocity?: number;
    velocityScale?: number;
    particleAge?: number;
    lineWidth?: number;
    particleMultiplier?: number;
    devicePixelRatio?: number;
    frameRate?: number;
    colorScale?: string | string[];
}

interface Params extends  InitParams{
    canvas: HTMLCanvasElement;
}

interface UVHeader {
    parameterCategory: number;
    parameterNumber: number;
    lo1: number;
    la1: number;
    dx: number;
    dy: number;
    nx: number;
    ny: number;
}

interface UV {
    data: number[];
    header: UVHeader;
}

export { Params };
export { InitParams };
export { UV };

const Windy = function(params: Params){

    const formatConfig = (params: Params) => {

        return {
            MIN_VELOCITY_INTENSITY: params.minVelocity || 0,    // 最大风速
            MAX_VELOCITY_INTENSITY: params.maxVelocity || 10,   // 最小风速
            VELOCITY_SCALE: (params.velocityScale || 0.005) * (Math.pow(window.devicePixelRatio,1/3) || 1),
            MAX_PARTICLE_AGE: params.particleAge || 90,                 // 再生前绘制粒子的最大帧数
            PARTICLE_LINE_WIDTH: params.lineWidth || 1,                 // 线的宽度
            PARTICLE_MULTIPLIER: params.particleMultiplier || 1 / 300,  // 控制粒子的密度范围0~1
            PARTICLE_REDUCTION: (Math.pow(window.devicePixelRatio,1/3) || 1.6),     // 用于控制移动端的粒子密度
            FRAME_RATE: params.frameRate || 15,                                       // 控制每秒钟多少帧
            FRAME_TIME: 1000 / (params.frameRate || 15),
            colorScale: (() => {
                let colorScale = [
                    "rgb(36,104, 180)",
                    "rgb(60,157, 194)",
                    "rgb(128,205,193 )",
                    "rgb(151,218,168 )",
                    "rgb(198,231,181)",
                    "rgb(238,247,217)",
                    "rgb(255,238,159)",
                    "rgb(252,217,125)",
                    "rgb(255,182,100)",
                    "rgb(252,150,75)",
                    "rgb(250,112,52)",
                    "rgb(245,64,32)",
                    "rgb(237,45,28)",
                    "rgb(220,24,32)",
                    "rgb(180,0,35)"
                ];

                if(params.colorScale && !Array.isArray(params.colorScale)) {
                    colorScale = [params.colorScale];
                }

                // else{
                //     colorScale = params.colorScale as string[];
                // }

                return colorScale;
            })(),
        }
    }

    let config = formatConfig(params);

    const NULL_WIND_VECTOR = [NaN, NaN, null];  // singleton for no wind in the form: [u, v, magnitude]

    let windColorData: ImageData = null;
    let builder: {
        header:UVHeader;
        data: (i: number) => number[];
        interpolate: InterpolateVectorFN;
    };
    let grid: number[][][];
    let gridData = params.data;
    let date;
    let λ0: number, φ0: number, Δλ: number, Δφ: number, ni, nj;

    const setData = function (data: UV[]) {
        gridData = data;
    };

    /**
     * 设置配置
     * @param myConfig
     */
    const setConfig = (myConfig: Params) => {
        config = Object.assign(config, formatConfig(myConfig));
    };

    // interpolation for vectors like wind (u,v,m)
    // 插值向量数据(u, v, m)
    const bilinearInterpolateVector: InterpolateVectorFN = function(x, y, g00, g10, g01, g11) {
        const rx = (1 - x);
        const ry = (1 - y);
        const a = rx * ry,  b = x * ry,  c = rx * y,  d = x * y;
        const u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
        const v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
        return [u, v, Math.sqrt(u * u + v * v)];
    };

    const createWindBuilder = function(uComp: UV, vComp:UV) {
        const uData = uComp.data, vData = vComp.data;

        return {
            header: uComp.header,
            data: function(i: number) {
                return [uData[i], vData[i]];
            },

            interpolate: bilinearInterpolateVector
        }
    };

    const createBuilder = function(data: UV[]) {
        let uComp:UV = null, vComp: UV = null, scalar = null;

        data.forEach(function(record: UV) {
            switch (record.header.parameterCategory + "," + record.header.parameterNumber) {
                case "1,2":
                case "2,2":
                    uComp = record;
                    break;
                case "1,3":
                case "2,3":
                    vComp = record;
                    break;
                default:
                    scalar = record;
            }
        });

        return createWindBuilder(uComp, vComp);
    };

    const buildGrid = function (data: UV[], callback: BuildGridCallback) {
        builder = createBuilder(data);
        const header = builder.header;

        λ0 = header.lo1;   // 最小经度
        φ0 = header.la1;   // 最小维度 the grid's origin (e.g., 0.0E, 90.0N)

        Δλ = header.dx;
        Δφ = header.dy;    // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)

        ni = header.nx;    // u宽度
        nj = header.ny;    // v高度 number of grid points W-E and N-S (e.g., 144 x 73)

        // TODO 暂时注释掉时间, 没有发现时间的作用
        // date = new Date(header.refTime);
        // date.setHours(date.getHours() + header.forecastTime);

        // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
        // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
        grid = [];
        let p = 0;
        const isContinuous = Math.floor(ni * Δλ) >= 360;

        for (let j = 0; j < nj; j++) {
            const row = [];
            for (let i = 0; i < ni; i++, p++) {
                row[i] = builder.data(p);
            }
            if (isContinuous) {
                // For wrapped grids, duplicate first column as last column to simplify interpolation logic
                row.push(row[0]);
            }
            grid[j] = row;
        }

        callback({
            // date: date,
            interpolate: interpolate
        });
    };

    /**
     * Get interpolated grid value from Lon/Lat position
     * @param λ {float} Longitude
     * @param φ {float} Latitude
     * @returns {Object}
     */
    const interpolate = function(λ: number, φ: number) {
        // λ是lng
        // φ是lat
        // λ0是minLng
        // φ0是minLat
        // Δλ = (maxLng - minLng) / image.width
        // Δφ = (minLat - maxLat) / image.height
        if(!grid) return null;

        const i = floorMod(λ - λ0, 360) / Δλ;  // calculate longitude index in wrapped range [0, 360)
        // setTimeout(() => console.log(i), 0)
        const j = (φ0 - φ) / Δφ;                 // calculate latitude index in direction +90 to -90

        const fi = Math.floor(i), ci = fi + 1;
        const fj = Math.floor(j), cj = fj + 1;

        let row;
        if ((row = grid[fj])) {
            const g00 = row[fi];
            const g10 = row[ci];
            if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
                const g01 = row[fi];
                const g11 = row[ci];
                if (isValue(g01) && isValue(g11)) {
                    // All four points found, so interpolate the value.
                    return builder.interpolate(i - fi, j - fj, g00, g10, g01, g11);
                }
            }
        }

        return null;
    };

    const createField = function(columns: number[][][], bounds: BuildBounds, callback: Function) {

        /**
         * @returns {Array} wind vector [u, v, magnitude] at the point (x, y), or [NaN, NaN, null] if wind
         *          is undefined at that point.
         */
        function field(x: number, y: number) {
            const column = columns[Math.round(x)];
            return column && column[Math.round(y)] || NULL_WIND_VECTOR;
        }

        // Frees the massive "columns" array for GC. Without this, the array is leaked (in Chrome) each time a new
        // field is interpolated because the field closure's context is leaked, for reasons that defy explanation.
        field.release = function() {
            columns = [];
        };

        field.randomize = function(o: {x: number; y: number;}) {  // UNDONE: this method is terrible
            let x, y;
            let safetyNet = 0;
            do {
                x = Math.round(Math.floor(Math.random() * bounds.width) + bounds.x);
                y = Math.round(Math.floor(Math.random() * bounds.height) + bounds.y)
            } while (field(x, y)[2] === null && safetyNet++ < 30);
            o.x = x;
            o.y = y;
            return o;
        };

        callback( bounds, field );
    };

    const buildBounds = function( bounds: number[][], width: number, height: number ) {
        const upperLeft = bounds[0];
        const lowerRight = bounds[1];
        const x = Math.round(upperLeft[0]); //Math.max(Math.floor(upperLeft[0], 0), 0);
        const y = Math.max(Math.floor(upperLeft[1]), 0);
        const xMax = Math.min(Math.ceil(lowerRight[0]), width - 1);
        const yMax = Math.min(Math.ceil(lowerRight[1]), height - 1);
        return {x: x, y: y, xMax: xMax, yMax: yMax, width: width, height: height};
    };

    const interpolateField = function( grid: {interpolate: InterpolateFN}, bounds: BuildBounds, extent: MapBounds, callback: Function ) {
        const mask = createMask(bounds.width, bounds.height);

        const projection = {};
        const mapArea = ((extent.south - extent.north) * (extent.west - extent.east));
        const velocityScale = config.VELOCITY_SCALE * Math.pow(mapArea, 0.4);

        const columns:number[][][] = [];
        let x = bounds.x;

        function interpolateColumn(x: number) {
            const column = [];
            for (let y = bounds.y; y <= bounds.yMax; y += 2) {
                const coord = invert( x, y, extent );
                let color: RGBA = [0, 0, 0, 0];

                if (coord) {
                    const λ = coord[0], φ = coord[1];

                    if (isFinite(λ)) {  // 是否是有限值
                        let wind = grid.interpolate(λ, φ);
                        if (wind) {
                            wind = distort(projection, λ, φ, x, y, velocityScale, wind, extent);
                            column[y+1] = column[y] = wind;
                            color = scale.gradient(wind[2], Math.floor(0.6 * 255)) as RGBA;
                        }
                    }
                }


                // 设置颜色
                mask.set(x, y, color).set(x+1, y, color).set(x, y+1, color).set(x+1, y+1, color);
            }
            columns[x+1] = columns[x] = column;
        }

        (function batchInterpolate() {
            const start = Date.now();
            while (x < bounds.width) {
                interpolateColumn(x);
                x += 2;
                if ((Date.now() - start) > 1000) { //MAX_TASK_TIME) {
                    setTimeout(batchInterpolate, 25);
                    return;
                }
            }

            // console.log('columns->', columns)
            // console.log("mask->", mask)
            windColorData = mask.imageData;
            createField(columns, bounds, callback);
        })();
    };

    let animationLoop: number;
    const animate = function(bounds: BuildBounds, field: Field) {
        function windIntensityColorScale(min: number, max: number) {
            // @ts-ignore
            config.colorScale.indexFor = function (m: number) {  // map velocity speed to a style
                return Math.floor(Math.min(m, max) / max * (config.colorScale.length - 1))
                return Math.max(0, Math.min((config.colorScale.length - 1),
                    Math.round((m - min) / (max - min) * (config.colorScale.length - 1))));
            };

            return config.colorScale;
        }

        const colorStyles = windIntensityColorScale(config.MIN_VELOCITY_INTENSITY, config.MAX_VELOCITY_INTENSITY);
        const buckets = colorStyles.map(function() { return []; });

        let particleCount = Math.round(bounds.width * bounds.height * config.PARTICLE_MULTIPLIER);
        if (isMobile()) {
            particleCount *= config.PARTICLE_REDUCTION;
        }

        const fadeFillStyle = "rgba(0, 0, 0, 0.97)";
        // @ts-ignore
        const particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(field.randomize({age: Math.floor(Math.random() * config.MAX_PARTICLE_AGE) + 0}));
        }

        function evolve() {
            buckets.forEach(function(bucket) { bucket.length = 0; });
            // @ts-ignore
            particles.forEach(function(particle) {
                if (particle.age > config.MAX_PARTICLE_AGE) {
                    field.randomize(particle).age = 0;
                }
                const x = particle.x;
                const y = particle.y;
                const v = field(x, y);  // vector at current position
                // console.log(v)
                const m = v[2];
                if (m === null) {
                    particle.age = config.MAX_PARTICLE_AGE;  // particle has escaped the grid, never to return...
                }
                else {
                    const xt = x + v[0];
                    const yt = y + v[1];
                    if (field(xt, yt)[2] !== null) {
                        // Path from (x,y) to (xt,yt) is visible, so add this particle to the appropriate draw bucket.
                        particle.xt = xt;
                        particle.yt = yt;
                        // @ts-ignore
                        buckets[colorStyles.indexFor(m)].push(particle);
                    }
                    else {
                        // Particle isn't visible, but it still moves through the field.
                        particle.x = xt;
                        particle.y = yt;
                    }
                }
                particle.age += 1;
            });
        }

        const g = params.canvas.getContext("2d");
        g.lineWidth = config.PARTICLE_LINE_WIDTH;
        g.fillStyle = fadeFillStyle;
        g.globalAlpha = 0.6;

        function draw() {
            // console.log('buckets->', buckets)
            // Fade existing particle trails.
            // const prev = "lighter";
            const prev = g.globalCompositeOperation;
            g.globalCompositeOperation = "destination-in";
            g.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
            g.globalCompositeOperation = prev;
            g.globalAlpha = 0.9;
            // Draw new particle trails.
            buckets.forEach(function(bucket, i) {
                if (bucket.length > 0) {
                    g.beginPath();
                    g.strokeStyle = colorStyles[i];
                    bucket.forEach(function(particle) {
                        g.moveTo(particle.x, particle.y);
                        g.lineTo(particle.xt, particle.yt);
                        particle.x = particle.xt;
                        particle.y = particle.yt;
                    });
                    g.stroke();
                }
            });
        }

        let then = Date.now();
        (function frame() {
            animationLoop = requestAnimationFrame(frame);
            const now = Date.now();
            const delta = now - then;
            if (delta > config.FRAME_TIME) {
                then = now - (delta % config.FRAME_TIME);
                evolve();
                draw();
            }
        })();
    };

    const start = function(bounds: number[][], width: number, height: number, extent: number[][] ){
        const mapBounds = {
            south: deg2rad(extent[0][1]),   // 西南纬度
            north: deg2rad(extent[1][1]),   // 东北纬度
            east: deg2rad(extent[1][0]),    // 东北经度
            west: deg2rad(extent[0][0]),    // 西南经度
            width: width,
            height: height
        };

        stop();

        const buildGridCallback = function(grid: {interpolate: InterpolateFN}){
            // console.time("interpolateField->")
            // interpolateField
            interpolateField(grid, buildBounds( bounds, width, height), mapBounds, function( bounds: BuildBounds, field:Field ){
                // animate the canvas with random points

                // console.log('bounds->', bounds);
                // @ts-ignore
                windy.field = field;
                // console.time("animate->");
                animate( bounds, field );
                // console.timeEnd("animate->");
            });
            // console.timeEnd("interpolateField->")
        };

        // console.time("buildGrid->");
        buildGrid(gridData, buildGridCallback);
        // console.timeEnd("buildGrid->")
    };

    const stop = function () {
        // @ts-ignore
        if (windy.field) windy.field.release();
        windColorData = null;
        if (animationLoop) cancelAnimationFrame(animationLoop);
    };

    const windy = {
        params: params,
        start: start,
        stop: stop,
        createField: createField,
        interpolatePoint: interpolate,
        setData: setData,
        setConfig: setConfig,
        getWindColorData: () => windColorData
    };

    return windy;
};

if(!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = function (id) {
        clearTimeout(id);
    };
}

export default Windy;


const createMask = (width: number, height: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    context.fillStyle = "rgba(255, 0, 0, 1)";
    context.fill();

    // d3.select("#display").node().appendChild(canvas);  // make mask visible for debugging

    const imageData = context.getImageData(0, 0, width, height);
    const data = imageData.data;  // layout: [r, g, b, a, r, g, b, a, ...]

    return {
        imageData: imageData,
        isVisible: function(x:number, y: number) {
            var i = (y * width + x) * 4;
            return data[i + 3] > 0;  // non-zero alpha means pixel is visible
        },
        set: function(x: number, y: number, rgba: RGBA) {
            const i = (y * width + x) * 4;
            data[i    ] = rgba[0];
            data[i + 1] = rgba[1];
            data[i + 2] = rgba[2];
            data[i + 3] = rgba[3];
            return this;
        }
    };
}
