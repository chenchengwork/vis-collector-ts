import L from 'leaflet';
const GeoTIFF = require('geotiff/src/main');
import * as plotty from './plotty';

const ElementTileTifLayer = L.GridLayer.extend({
    options: {
        url: "",
        tileSize: 256,
        // tileSize: 512,
        minZoom: 4,
        maxZoom: 18
    },

    initialize: function(options) {
        L.setOptions(this, options);
    },

    _formatUrl: function(url, coords){
        url = url.replace("{x}", coords.x);
        url = url.replace("{y}", coords.y);
        url = url.replace("{z}", coords.z);

        return url;
    },

    // 异步方式加载 render tif by plotty

    createTile: function (coords, done) {
        const tile = L.DomUtil.create("canvas");
        // tile.style.outline = '1px solid red';
        const pool = new GeoTIFF.Pool();

        const {x, y, z} = coords;
        // this.options.url = "/data/tz850.tiff";
        fetch(this._formatUrl(this.options.url, coords))
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => GeoTIFF.fromArrayBuffer(arrayBuffer))
            .then((tif) => tif.getImage())
            .then((image) => {

                image.readRasters({ /*pool*/ })
                    .then((rasters) => {
                    // console.log("rasters->", rasters)

                    // TODO 研究一下差值算法
                    // http://bl.ocks.org/rveciana/263b324083ece278e966686d7dba700f
                    let plot = new plotty.plot({
                        useWebGL: true,
                        canvas: tile,
                        data: rasters[0],
                        width: image.getWidth(),
                        height: image.getHeight(),
                        // domain:[10, 65000],
                        // domain:[1392.58056640625, 1545.54052734375],
                        domain:[0.0019285716116428375,24.590068817138672],
                        // colorScale: "rainbow",
                        colorScale: "viridis",
                        // clampLow: false,
                        clampHigh: true,
                        noDataValue: -9999
                    });
                    plot.setClamp(false);
                    plot.render();
                    done(null, tile);

                }).catch(e => {
                    console.log(`报错tif-->${z}/${x}/${y}.tif`)
                    console.error(e)
                })
            })
            .catch((e) => {
                console.warn(`----------未获取到:${z}/${x}/${y}.tif---------------`)
                done(null, tile);
            });

        return tile;
    },

})

export default (options) => new ElementTileTifLayer(options)
