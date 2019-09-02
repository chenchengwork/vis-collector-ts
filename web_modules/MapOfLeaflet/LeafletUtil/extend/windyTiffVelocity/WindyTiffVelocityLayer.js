import L from 'leaflet';
import Windy from '../../lib/Windy';
import { formatUrlParams, debounce } from '../../lib/helper';
import CanvasLayer from '../../lib/CanvasLayer';

const WindyTiffVelocityLayer = (L.Layer ? L.Layer : L.Class).extend({
    oldTime: null,
    fetching: false,
    options: {
        url: "",
        urlParams:{

        },
        windyOpts: {
            maxVelocity: 10, // used to align color scale
            colorScale: null,
            data: null
        }
    },

    _map: null,
    _canvasLayer: null,
    _windy: null,
    _context: null,
    _timer: 0,
    _mouseControl: null,

    initialize: function(options) {
        L.setOptions(this, options);
    },

    onAdd: function(map) {
        // create canvas, add overlay control
        this._canvasLayer = new CanvasLayer().delegate(this);
        this._canvasColorLayer = new CanvasLayer().delegate(this);
        this._canvasColorLayer.addTo(map);
        this._canvasLayer.addTo(map);
        this._map = map;

        this._debounceStartWindy = debounce(this._startWindy, 750, this);
    },

    onRemove: function(map) {
        this._destroyWind();
    },

    setData: function (data) {
        this.options.data = data;

        if (this._windy) {
            this._windy.setData(data);
            this._clearAndRestart();
        }

        this.fire('load');
    },

    setConfig: function (config) {
        if (this._windy) {
            this._windy.setConfig(config);
            this._clearAndRestart();
        }

        this.fire('load');
    },

    setOptions: function (options = {}){
        L.setOptions(this, Object.assign(this.options, options));
        this._clearAndRestart();
    },

    /*------------------------------------ PRIVATE ------------------------------------------*/
    onDrawLayer: function(overlay, params) {
        const self = this;
        if (!this._windy) return this._initWindy(this);
        self._debounceStartWindy();
    },


    _startWindy: function() {
        const self = this;
        let { url, urlParams } = self.options;
        const bounds = self._map.getBounds();
        // const bounds = {
        //     _southWest:{lat: 31.5967, lng: 89.3848},
        //     _northEast:{lat: 39.1992, lng: 103.0078},
        // };
        const size = self._map.getSize();

        // console.log("zoom->", self._map.getZoom());
        // console.log("center->", self._map.getCenter());

        url = formatUrlParams(
            url.replace("{z}", self._map.getZoom()),
            // url.replace("{z}", 4),
            Object.assign(
                urlParams,
                {
                    bbox: `${bounds._southWest.lng},${bounds._southWest.lat},${bounds._northEast.lng},${bounds._northEast.lat}`,
                    // 青海的bbox
                    // bbox: `89.3848,31.5967,103.0078,39.1992`,
                    // bbox: "",
                }
            )
        );

        // url = "data/u_5_x.tif";

        const drawWindy = (windData, image) =>{
            self._windy.setData(windData);

            self._windy.start(
                [
                    [0, 0],
                    [size.x, size.y]
                ],
                size.x,
                size.y,
                [
                    [bounds._southWest.lng, bounds._southWest.lat],
                    [bounds._northEast.lng, bounds._northEast.lat]
                ]
            );

            // 添加风速底图
            const windColorData = self._windy.getWindColorData();
            // console.log('windColorData', windColorData)
            if(windColorData && this._colorContext){
                this._colorContext.clearRect(0, 0, 3000, 3000)
                this._colorContext.putImageData(windColorData, 0, 0);
            }
        };

        // TODO 临时处理提高性能
        // if(self.windData && self.oldTime == urlParams.timex && !this.fetching){
        //     console.log('no fetch data->', self.windData);
        //     drawWindy(self.windData);
        //     return;
        // }

        this.fetching = true;
        getWindDataByTif(url, self._map.getZoom(), bounds).then(({windData, image}) => {
            // console.log('fetch data->', windData);
            this.fetching = false;
            self.windData = windData;
            self.oldTime = urlParams.timex;

            if(!self._windy) return false;
            drawWindy(windData, image);
        }).catch((e) => console.error(e));

    },

    _initWindy: function() {
        const self = this;
        // windy object, copy options
        const options = Object.assign({ canvas: self._canvasLayer._canvas }, self.options.windyOpts);
        this._windy = new Windy(options);

        // prepare context global var, start drawing
        this._context = this._canvasLayer._canvas.getContext('2d');
        this._colorContext = this._canvasColorLayer._canvas.getContext('2d');
        this._canvasLayer._canvas.classList.add("velocity-overlay");
        this._canvasColorLayer._canvas.classList.add("velocity-color-overlay");
        this.onDrawLayer();

        this._map.on('dragstart', self._windy.stop);
        this._map.on('dragend', self._clearAndRestart);
        this._map.on('zoomstart', self._windy.stop);
        this._map.on('zoomend', self._clearAndRestart);
        this._map.on('resize', self._clearWind);

        this._initMouseHandler();
    },

    _initMouseHandler: function() {
        // if (!this._mouseControl && this.options.displayValues) {
        //     var options = this.options.displayOptions || {};
        //     options['leafletVelocity'] = this;
        //     this._mouseControl = L.control.velocity(options).addTo(this._map);
        // }
    },

    _clearAndRestart: function(){
        // TODO 暂时不清除
        // if (this._windy) this._windy.stop();
        if (this._context) {
            this._context.clearRect(0, 0, 3000, 3000);
        }
        // if (this._colorContext) this._colorContext.clearRect(0, 0, 3000, 3000);
        if (this._windy) this._debounceStartWindy();
    },

    _clearWind: function() {
        if (this._windy) this._windy.stop();
        if (this._context) this._context.clearRect(0, 0, 3000, 3000);
        if (this._colorContext) this._colorContext.clearRect(0, 0, 3000, 3000);
    },

    _destroyWind: function() {
        if (this._timer) clearTimeout(this._timer);
        if (this._windy) this._windy.stop();
        if (this._context) this._context.clearRect(0, 0, 3000, 3000);
        if (this._colorContext) this._colorContext.clearRect(0, 0, 3000, 3000);
        if (this._mouseControl) this._map.removeControl(this._mouseControl);
        this._mouseControl = null;
        this._windy = null;
        this._map.removeLayer(this._canvasLayer);
        this._map.removeLayer(this._canvasColorLayer);
    }
});

export default (options) => new WindyTiffVelocityLayer(options)


const getWindDataByTif = (tifUrl) => {
    const GeoTIFF = require('geotiff/src/main');
    const pool = new GeoTIFF.Pool();
    const fetch = require("../../lib/fetch").default;

    return new Promise((resolve, reject) => {
        fetch(tifUrl)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => GeoTIFF.fromArrayBuffer(arrayBuffer))
            .then((tif) => tif.getImage())
            .then((image) => {
                // return;

                const [minLng, minLat, maxLng, maxLat] = image.getBoundingBox();

                image.readRasters({
                    // pool,
                    samples: [0,1],
                    // window: [0, 0, image.getWidth() - 300, image.getHeight()- 300],
                }).then((imageData) => {
                    const width = imageData.width;
                    const height = imageData.height;
                    const uData = imageData[0];
                    const vData = imageData[1];

                    const lngLat = {
                        "lo2": maxLng,
                        "lo1": minLng,
                        "la2": maxLat,
                        "la1": minLat,
                    };

                    const other = {
                        "dx": (maxLng - minLng) / width,
                        "dy": (minLat - maxLat) / height,
                        "nx": width,
                        "ny": height,
                    };

                    const windData = [
                        {
                            data: uData,
                            header: {
                                ...lngLat,
                                ...other,
                                "parameterCategory": 2,
                                "parameterNumber": 2
                            }
                        },
                        {
                            data: vData,
                            header: {
                                "parameterCategory": 2,
                                "parameterNumber": 3,
                                ...lngLat,
                                ...other
                            }
                        }
                    ];

                    resolve({windData, image});

                }).catch(e => {
                    // console.log(`报错tif-->${z}/${x}/${y}.tif`)
                    // console.log("image.readRasters报错")
                    // console.error(e)
                    reject(e);
                })
            })
            .catch((e) => {
                // console.warn(`----------获取失败:${z}/${x}/${y}.tif---------------`)
                // done(null, tile);
                reject(e);
            });
    })

}
