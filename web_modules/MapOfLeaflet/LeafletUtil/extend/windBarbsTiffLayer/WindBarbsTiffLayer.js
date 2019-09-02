import L from 'leaflet';
import WindBarbs from '../../lib/WindBarbs';
import { formatUrlParams } from '../../lib/helper';
import CanvasLayer from '../../lib/CanvasLayer';

const WindBarbsTiffLayer = (L.Layer ? L.Layer : L.Class).extend({
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
    _windBarbs: null,
    _context: null,
    _timer: 0,
    _mouseControl: null,

    initialize: function(options) {
        L.setOptions(this, options);
    },

    onAdd: function(map) {
        // create canvas, add overlay control
        this._canvasLayer = new CanvasLayer().delegate(this);
        this._canvasLayer.addTo(map);
        this._map = map;
    },

    onRemove: function(map) {
        this._destroyWind();
    },

    setData: function setData(data) {
        this.options.data = data;

        if (this._windBarbs) {
            this._windBarbs.setData(data);
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

        if (!this._windBarbs) {
            this._initWindy(this);
            return;
        }

        if (this._timer) clearTimeout(self._timer);

        this._timer = setTimeout(function () {
            self._startWindBarbs();
        }, 0); // showing velocity is delayed
    },


    _startWindBarbs: function() {
        const self = this;
        let { url, urlParams } = self.options;
        const bounds = self._map.getBounds();
        const size = self._map.getSize();

        url = formatUrlParams(
            url.replace("{z}", self._map.getZoom()),
            // url.replace("{z}", 4),
            Object.assign(
                urlParams,
                {
                    bbox: `${bounds._southWest.lng},${bounds._southWest.lat},${bounds._northEast.lng},${bounds._northEast.lat}`,
                    // bbox: "",
                }
            )
        );

        // url = "data/u_5_x.tif";

        const draw = (windData, image) =>{
            self._windBarbs.render({
                barbSize: 30,
                canvasW: size.x,
                canvasH: size.y,
                imgW: image.getWidth(),
                imgH: image.getHeight(),
                geoTransform: (() => {
                    const tiepoint = image.getTiePoints()[0];
                    const pixelScale = image.getFileDirectory().ModelPixelScale;
                    // console.log('tiepoint->', tiepoint)
                    // console.log('pixelScale->', pixelScale)
                    const geoTransform = [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1*pixelScale[1]];
                    return geoTransform;
                })(),
                data: windData,
                extent: [
                    [bounds._southWest.lng, bounds._southWest.lat],
                    [bounds._northEast.lng, bounds._northEast.lat]
                ]
            });
        };

        // TODO 临时处理提高性能
        // if(self.imageData && self.tifImage && self.oldTime == urlParams.timex && !this.fetching){
        //     console.log('no fetch data->', self.windData);
        //     draw(self.imageData, self.tifImage);
        //     return;
        // }

        this.fetching = true;
        getWindDataByTif(url, self._map.getZoom(), bounds).then(({imageData, image}) => {
            console.log('fetch imageData->', imageData);

            this.fetching = false;
            self.imageData = imageData;
            self.tifImage = image;
            self.oldTime = urlParams.timex;

            if(!self._windBarbs) return false;
            draw(imageData, image);

        }).catch((e) => console.error(e));
    },

    _initWindy: function(self) {
        // windy object, copy options
        const options = Object.assign({ canvas: self._canvasLayer._canvas }, self.options.windyOpts);
        this._windBarbs = new WindBarbs(options);

        // prepare context global var, start drawing
        this._context = this._canvasLayer._canvas.getContext('2d');
        this._canvasLayer._canvas.classList.add("wind-barbs-overlay");
        this.onDrawLayer();

        this._map.on('dragstart', self._windBarbs.stop);
        this._map.on('dragend', self._clearAndRestart);
        this._map.on('zoomstart', self._windBarbs.stop);
        this._map.on('zoomend', self._clearAndRestart);
        this._map.on('resize', self._clearWind);
    },

    _clearAndRestart: function(){
        if (this._context) this._context.clearRect(0, 0, 3000, 3000);
        if (this._windBarbs) this._startWindBarbs();
    },

    _clearWind: function() {
        // if (this._windBarbs) this._windBarbs.stop();
        if (this._context) this._context.clearRect(0, 0, 3000, 3000);
    },

    _destroyWind: function() {
        if (this._timer) clearTimeout(this._timer);
        if (this._windBarbs) this._windBarbs.stop();
        if (this._context) this._context.clearRect(0, 0, 3000, 3000);
        if (this._mouseControl) this._map.removeControl(this._mouseControl);
        this._mouseControl = null;
        this._windBarbs = null;
        this._map.removeLayer(this._canvasLayer);
    }
});

export default (options) => new WindBarbsTiffLayer(options)

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
                    pool,
                    samples: [0,1],
                    // window: [0, 0, image.getWidth() - 300, image.getHeight()- 300],
                }).then((imageData) => {


                    resolve({imageData, image});

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
