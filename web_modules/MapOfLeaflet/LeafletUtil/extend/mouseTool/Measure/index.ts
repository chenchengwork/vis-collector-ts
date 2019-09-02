import L from 'leaflet';

import "./Measure.scss";

interface Options {
    circleMarker?: {
        color: string;
        radius: number;
    },
    lineStyle?: {
        color: string;
        dashArray: string;
    },
    lengthUnit?: {
        display: string;
        decimal: number;
        factor: number;
    },
    angleUnit?: {
        display: string;
        decimal: number;
        factor: number;
    }
}

export default class Measure{
    private _map: L.Map;
    private options: Options;
    private _defaultCursor: string;
    private _allLayers: L.LayerGroup;
    private _clickedLatLong: L.LatLng;
    private _clickedPoints: L.LatLng[];
    private _totalLength: number;
    private _clickCount: number;
    private _tempLine: L.FeatureGroup;
    private _tempPoint: L.FeatureGroup;
    private _pointLayer: L.FeatureGroup;
    private _polylineLayer: L.FeatureGroup;
    private _movingLatLong: L.LatLng;
    private _result: {
        Bearing: number,
        Distance: number
    };
    private _addedLength: number;

    constructor(map: L.Map, options: Options = {}) {
        this._map = map;

        this.options = Object.assign({
            circleMarker: {
                // color: 'rgb(252, 249, 242)',
                color:"#000000",
                radius: 3
            },
            lineStyle: {
                color: '#25A5F7',
                dashArray: '1,6'
            },
            lengthUnit: {
                display: 'km',
                decimal: 2,     // 小数位
                factor: null
            },
            angleUnit: {
                display: '&deg;',
                decimal: 2,     // 小数位
                factor: null
            }
        }, options);
    }

    private _getCursor = (): string => {
        //@ts-ignore
        return this._map._container.style.cursor;
    }

    private _setCursor = (cursor: string) => {
        //@ts-ignore
        this._map._container.style.cursor = cursor;
    }

    private _getMapContainer = () => {
        //@ts-ignore
        return this._map._container;
    }

    /**
     * 开启测距
     * @param {Object} options 测距样式可以修改
     */
    start(options = {}) {
        this.options = Object.assign(this.options, options);

        this._defaultCursor = this._getCursor() || 'move';
        this._allLayers = L.layerGroup();
        this._toggleMeasure(true);
    }

    /**
     * 清空测距
     */
    clear() {
        this._toggleMeasure(false);
    }

    private _toggleMeasure(choice: boolean, isClear = true) {
        // const L = this.L;

        this._clickedLatLong = null;
        this._clickedPoints = [];
        this._totalLength = 0;

        if (choice) {
            this._map.doubleClickZoom.disable();
            // L.DomEvent.on(this._map._container, 'keydown', this._escape, this);
            // L.DomEvent.on(this._map._container, 'dblclick', this._closePath, this);

            L.DomEvent.on(this._getMapContainer(), 'keydown', this._escape, this);
            L.DomEvent.on(this._getMapContainer(), 'dblclick', this._closePath, this);

            this._clickCount = 0;
            this._tempLine = L.featureGroup().addTo(this._allLayers);
            this._tempPoint = L.featureGroup().addTo(this._allLayers);
            this._pointLayer = L.featureGroup().addTo(this._allLayers);
            this._polylineLayer = L.featureGroup().addTo(this._allLayers);
            this._allLayers.addTo(this._map);
            // this._map._container.style.cursor = 'crosshair';
            this._setCursor("crosshair")
            this._map.on('click', this._clicked, this);
            this._map.on('mousemove', this._moving, this);
        } else {
            this._map.doubleClickZoom.enable();
            // L.DomEvent.off(this._map._container, 'keydown', this._escape, this);
            // L.DomEvent.off(this._map._container, 'dblclick', this._closePath, this);

            L.DomEvent.off(this._getMapContainer(), 'keydown', this._escape, this);
            L.DomEvent.off(this._getMapContainer(), 'dblclick', this._closePath, this);

            if(isClear) {
                if (!this._allLayers) return false;
                this._map.removeLayer(this._allLayers);
                this._allLayers = L.layerGroup();
            }
            // this._map._container.style.cursor = this._defaultCursor;
            this._setCursor(this._defaultCursor);

            this._map.off('click', this._clicked, this);
            this._map.off('mousemove', this._moving, this);
        }
    }

    private _clicked(e: L.LeafletMouseEvent) {
        // const L = this.L;

        this._clickedLatLong = e.latlng;
        this._clickedPoints.push(this._clickedLatLong);
        L.circleMarker(this._clickedLatLong, this.options.circleMarker).addTo(this._pointLayer);
        if(this._clickCount > 0 && !e.latlng.equals(this._clickedPoints[this._clickedPoints.length - 2])){
            if (this._movingLatLong){
                L.polyline([this._clickedPoints[this._clickCount-1], this._movingLatLong], this.options.lineStyle).addTo(this._polylineLayer);
            }

            let text;
            this._totalLength += this._result.Distance;

            text = `<b>距离:</b>&nbsp;
${this._totalLength.toFixed(this.options.lengthUnit.decimal)}&nbsp;
${this.options.lengthUnit.display}
`
            L.circleMarker(this._clickedLatLong, this.options.circleMarker).bindTooltip(text, {permanent: true, className: 'result-tooltip'}).addTo(this._pointLayer).openTooltip();
        }
        this._clickCount++;
    }

    private _moving(e: L.LeafletMouseEvent) {
        // const L = this.L;

        if (this._clickedLatLong){
            this._movingLatLong = e.latlng;
            if (this._tempLine){
                this._map.removeLayer(this._tempLine);
                this._map.removeLayer(this._tempPoint);
            }
            let text;
            this._addedLength = 0;
            this._tempLine = L.featureGroup();
            this._tempPoint = L.featureGroup();
            this._tempLine.addTo(this._map);
            this._tempPoint.addTo(this._map);
            this._calculateBearingAndDistance();
            this._addedLength = this._result.Distance + this._totalLength;
            L.polyline([this._clickedLatLong, this._movingLatLong], this.options.lineStyle).addTo(this._tempLine);

            if (this._clickCount > 1){
                text = `<b>距离:</b>&nbsp;
${this._addedLength.toFixed(this.options.lengthUnit.decimal)}&nbsp;
${this.options.lengthUnit.display}
<br>
<div class="plus-length">(${this._result.Distance.toFixed(this.options.lengthUnit.decimal)})</div>
`;
            }
            else {
                text = `<b>距离:</b>&nbsp;
${this._result.Distance.toFixed(this.options.lengthUnit.decimal)}&nbsp;
${this.options.lengthUnit.display}
`;
            }

            L.circleMarker(this._movingLatLong, this.options.circleMarker).bindTooltip(text, {sticky: true, offset: L.point(0, -40) ,className: 'moving-tooltip'}).addTo(this._tempPoint).openTooltip();
        }
    }

    private _escape(e: KeyboardEvent) {
        if (e.keyCode === 27){
            if (this._clickCount > 0){
                this._closePath();
            }
            else {
                this._toggleMeasure(false);
            }
        }
    }

    private _calculateBearingAndDistance() {
        const f1 = this._clickedLatLong.lat, l1 = this._clickedLatLong.lng, f2 = this._movingLatLong.lat, l2 = this._movingLatLong.lng;
        const toRadian = Math.PI / 180;
        // haversine formula
        // bearing
        const y = Math.sin((l2-l1)*toRadian) * Math.cos(f2*toRadian);
        const x = Math.cos(f1*toRadian)*Math.sin(f2*toRadian) - Math.sin(f1*toRadian)*Math.cos(f2*toRadian)*Math.cos((l2-l1)*toRadian);
        let brng = Math.atan2(y, x)*((this.options.angleUnit.factor ? this.options.angleUnit.factor/2 : 180)/Math.PI);
        brng += brng < 0 ? (this.options.angleUnit.factor ? this.options.angleUnit.factor : 360) : 0;
        // distance
        const R = this.options.lengthUnit.factor ? 6371 * this.options.lengthUnit.factor : 6371; // kilometres
        const deltaF = (f2 - f1)*toRadian;
        const deltaL = (l2 - l1)*toRadian;
        const a = Math.sin(deltaF/2) * Math.sin(deltaF/2) + Math.cos(f1*toRadian) * Math.cos(f2*toRadian) * Math.sin(deltaL/2) * Math.sin(deltaL/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        this._result = {
            Bearing: brng,
            Distance: distance
        };
    }

    private _closePath() {
        this._map.removeLayer(this._tempLine);
        this._map.removeLayer(this._tempPoint);
        // 启用该方式,则只能一次测距
        this._toggleMeasure(false, false);

        // 启用该方式,则能连续测距
        // this._toggleMeasure(true);
    }
}

