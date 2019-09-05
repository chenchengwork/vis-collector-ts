import L from "leaflet";
import { formatUrlParams } from '../../lib/helper';
import WindBarbsLayer  from './WindBarbsLayer';

const GeoTIFF = require('geotiff/src/main');
const fetch = require("../../lib/fetch").default as typeof window.fetch;


/**
 * 依据tif方式获取layer
 * @param url
 */
export const getWindBarsTiffLayer = (url: string) => {

    const getWindBarsData = (map: L.Map, draw: Function) => {
        // 组装bbox
        const getRealUrl = () => {
            const bounds = map.getBounds();
            const size = map.getSize();
            const southWest = bounds.getSouthWest();
            const northEast = bounds.getNorthEast();
            const realUrl = formatUrlParams(
                url.replace("{z}", map.getZoom().toString()),
                Object.assign(
                    {
                        // bbox: `${bounds._southWest.lng},${bounds._southWest.lat},${bounds._northEast.lng},${bounds._northEast.lat}`,
                        bbox: `${southWest.lng},${southWest.lat},${northEast.lng},${northEast.lat}`,
                        // bbox: "",
                    }
                )
            );

            return realUrl;
        }

        fetch(url)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => GeoTIFF.fromArrayBuffer(arrayBuffer))
            .then((tif) => tif.getImage())
            .then((image) => {
                image.readRasters({
                    pool: new GeoTIFF.Pool(),   // 使用web-worker
                    samples: [0,1],
                    // window: [0, 0, image.getWidth() - 300, image.getHeight()- 300],
                }).then((imageData: {"0": number[], "1": number[], width: number, height: number}) => {

                    draw({
                        imgW: image.getWidth(),
                        imgH: image.getHeight(),
                        geoTransform: (() => {
                            const tiepoint = image.getTiePoints()[0];
                            const pixelScale = image.getFileDirectory().ModelPixelScale;
                            return [tiepoint.x, pixelScale[0], 0, tiepoint.y, 0, -1 * pixelScale[1]];
                        })(),
                        data: [imageData[0], imageData[1]],
                    })

                }).catch((e: ExceptionInformation) => {
                    console.error(e);
                })
            })
            .catch((e) => {
                console.error(e);
            });
    }

    // @ts-ignore
    return new WindBarbsLayer({ getWindBarsData });
};
