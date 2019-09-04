import L from 'leaflet';

export default L.Layer.extend({
    initialize: function (options: L.LayerOptions) {
        this._map = null;
        this._canvas = null;
        this._frame = null;
        this._delegate = null;
        // @ts-ignore
        L.setOptions(this, options);
    },

    // @ts-ignore
    delegate: function (del) {
        this._delegate = del;
        return this;
    },

    needRedraw: function () {
        if (!this._frame) this._frame = L.Util.requestAnimFrame(this.drawLayer, this);
        return this;
    },

    _onLayerDidResize: function (resizeEvent: L.ResizeEvent) {
        this._canvas.width = resizeEvent.newSize.x;
        this._canvas.height = resizeEvent.newSize.y;
    },

    _onLayerDidMove: function () {
        const topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);
        this.drawLayer();
    },

    getEvents: function () {
        const events = {
            resize: this._onLayerDidResize,
            moveend: this._onLayerDidMove,
        };
        if (this._map.options.zoomAnimation && L.Browser.any3d) {
            // @ts-ignore
            events.zoomanim = this._animateZoom;
        }

        return events;
    },

    onAdd: function (map: L.Map) {
        this._map = map;
        this._canvas = L.DomUtil.create('canvas', 'leaflet-layer');
        this.tiles = {};

        const size = this._map.getSize();
        this._canvas.width = size.x;
        this._canvas.height = size.y;

        const animated = this._map.options.zoomAnimation && L.Browser.any3d;
        L.DomUtil.addClass(this._canvas, 'leaflet-zoom-' + (animated ? 'animated' : 'hide'));

        // @ts-ignore
        map._panes.overlayPane.appendChild(this._canvas);
        map.on(this.getEvents(), this);

        const del = this._delegate || this;
        del.onLayerDidMount && del.onLayerDidMount(); // -- callback
        this.needRedraw();

        const self = this;
        setTimeout(function () {
            self._onLayerDidMove();
        }, 0);
    },

    onRemove: function (map:L.Map) {
        const del = this._delegate || this;
        del.onLayerWillUnmount && del.onLayerWillUnmount(); // -- callback
        map.getPanes().overlayPane.removeChild(this._canvas);
        map.off(this.getEvents(), this);
        this._canvas = null;
    },

    addTo: function (map:L.Map) {
        map.addLayer(this);
        return this;
    },

    LatLonToMercator: function (latlon: {lng: number; lat: number}) {
        return {
            x: latlon.lng * 6378137 * Math.PI / 180,
            y: Math.log(Math.tan((90 + latlon.lat) * Math.PI / 360)) * 6378137
        };
    },

    drawLayer: function () {
        // -- todo make the viewInfo properties  flat objects.
        const size = this._map.getSize();
        const bounds = this._map.getBounds();
        const zoom = this._map.getZoom();

        const center = this.LatLonToMercator(this._map.getCenter());
        const corner = this.LatLonToMercator(this._map.containerPointToLatLng(this._map.getSize()));

        const del = this._delegate || this;
        del.onDrawLayer && del.onDrawLayer({
            layer: this,
            canvas: this._canvas,
            bounds: bounds,
            size: size,
            zoom: zoom,
            center: center,
            corner: corner
        });
        this._frame = null;
    },

    //------------------------------------------------------------------------------
    _animateZoom: function (e: L.ZoomAnimEvent) {
        const scale = this._map.getZoomScale(e.zoom);
        const offset = this._map._latLngToNewLayerPoint(this._map.getBounds().getNorthWest(), e.zoom, e.center);

        L.DomUtil.setTransform(this._canvas, offset, scale);
    }
});




