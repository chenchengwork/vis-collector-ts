import L from 'leaflet';
import {  debounce } from '../../lib/helper';
import CanvasLayer from '../../lib/CanvasLayer';
import WindGL from './glWindy';

const WindyGlVelocityLayer = (L.Layer ? L.Layer : L.Class).extend({
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
        const wind = this._windy;
        let { url, urlParams } = self.options;
        const bounds = self._map.getBounds();
        const size = self._map.getSize();
        // url = "data/u_5_x.tif";
        wind.resize();
        const drawWindy = () =>{
            wind.numParticles = 65536 / 4;
            function frame() {
                if (wind.windData) {
                    wind.draw();
                }

                self.animationTimer = requestAnimationFrame(frame);
            }

            frame();
        };

        // TODO 临时处理提高性能
        // if(self.windData && self.oldTime == urlParams.timex && !this.fetching){
        //     console.log('no fetch data->', self.windData);
        //     drawWindy(self.windData);
        //     return;
        // }

        this.fetching = true;
        getWindData("windGl/2016112000.json", "windGl/2016112000.png").then((windData) => {
            if(self.animationTimer) cancelAnimationFrame(self.animationTimer);
            wind.setWind(windData);
            drawWindy();
        }).catch((e) => console.error(e));

    },

    _initWindy: function() {
        const self = this;
        // windy object, copy options
        const options = Object.assign({ canvas: self._canvasLayer._canvas }, self.options.windyOpts);
        this._windy = new WindGL(self._canvasLayer._canvas.getContext('webgl', {antialiasing: false}));

        // prepare context global var, start drawing
        this._context = this._canvasLayer._canvas.getContext('2d');
        this._canvasLayer._canvas.classList.add("velocity-gl-overlay");
        this.onDrawLayer();

        // this._map.on('dragstart', self._windy.stop);
        this._map.on('dragend', self._clearAndRestart);
        // this._map.on('zoomstart', self._windy.stop);
        this._map.on('zoomend', self._clearAndRestart);
        this._map.on('resize', self._clearWind);
    },

    _clearAndRestart: function(){
        // if (this._context) this._context.clearRect(0, 0, 3000, 3000);
        if (this._windy) this._debounceStartWindy();
    },

    _clearWind: function() {
        // if (this._windy) this._windy.stop();
        // if (this._context) this._context.clearRect(0, 0, 3000, 3000);
        // if (this._colorContext) this._colorContext.clearRect(0, 0, 3000, 3000);
    },

    _destroyWind: function() {
        // if (this._timer) clearTimeout(this._timer);
        // if (this._windy) this._windy.stop();
        // if (this._context) this._context.clearRect(0, 0, 3000, 3000);
        // if (this._colorContext) this._colorContext.clearRect(0, 0, 3000, 3000);
        // if (this._mouseControl) this._map.removeControl(this._mouseControl);
        // this._mouseControl = null;
        this._windy = null;
        this._map.removeLayer(this._canvasLayer);
    }
});

export default (options) => new WindyGlVelocityLayer(options)

const getWindData = (jsonUrl, imgUrl) => new Promise((resolve, reject) => {
    const getJSON = (url, callback) => {
        const xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open('get', url, true);
        xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
                callback(xhr.response);
            } else {
                throw new Error(xhr.statusText);
            }
        };
        xhr.send();
    };


    getJSON(jsonUrl, function (windData) {
        const windImage = new Image();
        windData.image = windImage;
        windImage.src = imgUrl;
        windImage.onload = function () {
            resolve(windData);
        };
    });
});
