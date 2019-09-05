import L from 'leaflet';
import WindBarbs from '../../lib/WindBarbs';
import CanvasLayer from '../../lib/CanvasLayer';

const WindBarbsLayer = (L.Layer ? L.Layer : L.Class).extend({
    options: {
        url: "",
        getWindBarsData: () => {}
    },

    _map: null,
    _canvasLayer: null,
    _windBarbs: null,
    _context: null,
    _timer: 0,
    _mouseControl: null,

    initialize: function(options: L.LayerOptions) {
        // @ts-ignore
        L.setOptions(this, options);
    },

    onAdd: function(map: L.Map) {
        // create canvas, add overlay control
        this._canvasLayer = new CanvasLayer().delegate(this);
        this._canvasLayer.addTo(map);
        this._map = map;
    },

    onRemove: function(map: L.Map) {
        this._destroyWind();
    },

    setOptions: function (options = {}){
        // @ts-ignore
        L.setOptions(this, Object.assign(this.options, options));
        this._clearAndRestart();
    },

    onDrawLayer: function() {
        const self = this;
        if (!this._windBarbs) {
            this._initWindy();
            return;
        }

        if (this._timer) clearTimeout(self._timer);

        this._timer = setTimeout(function () {
            self._startWindBarbs();
        }, 0); // showing velocity is delayed
    },

    _startWindBarbs: function() {
        const self = this;
        let { getWindBarsData } = self.options;
        const bounds = self._map.getBounds();
        const size = self._map.getSize();

        getWindBarsData(this._map, (params: {imgW: number; imgH: number; geoTransform: number[]; data: [number[], number[]]}) => {
            self._windBarbs.render(Object.assign({
                barbSize: 30,
                canvasW: size.x,
                canvasH: size.y,
                extent: [
                    [bounds._southWest.lng, bounds._southWest.lat],
                    [bounds._northEast.lng, bounds._northEast.lat]
                ]
            }, params));
        })
    },


    /*------------------------------------ PRIVATE ------------------------------------------*/

    _initWindy: function() {
        const self = this;
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

export default WindBarbsLayer

