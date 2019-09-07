import L from "leaflet";
import WindyVelocityLayer, {Opts, TypeWindyVelocityLayer} from "./WindyVelocityLayer";
const GeoTIFF = require('geotiff/src/main');
const fetch = require("../../lib/fetch").default as typeof window.fetch;

export const getWindyVelocityLayer = (opts: Opts) => {
    // @ts-ignore
    return new WindyVelocityLayer(opts) as TypeWindyVelocityLayer;
};

/**
 * 依据tif方式获取layer
 * @param url
 */
export const getWindBarsTiffLayer = (url: string, opts: Opts) => {

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

        fetch(tifUrl)
            .then((response) => response.arrayBuffer())
            .then((arrayBuffer) => GeoTIFF.fromArrayBuffer(arrayBuffer))
            .then((tif) => tif.getImage())
            .then((image) => {
                const [minLng, minLat, maxLng, maxLat] = image.getBoundingBox();

                image.readRasters({
                    // pool,
                    samples: [0,1],
                    // window: [0, 0, image.getWidth() - 300, image.getHeight()- 300],
                }).then((imageData: {"0": number[], "1": number[], width: number, height: number}) => {
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

                }).catch((e: ExceptionInformation) => {
                    console.error(e);
                })
            })
            .catch((e) => {
                console.error(e);
            });
    }

    // @ts-ignore
    return new WindyVelocityLayer({ getWindBarsData });
};
