const GeoTIFF = require('geotiff/src/main');
const fetch = require("./fetch").default as typeof window.fetch;

/**
 * 获取风场数据
 * @param url
 */
export const getWindFieldData = (url: string) => new Promise((resolve, reject) => {

    fetch(url)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => GeoTIFF.fromArrayBuffer(arrayBuffer))
        .then((tif) => tif.getImage())
        .then((image) => {
            const [minLng, minLat, maxLng, maxLat] = image.getBoundingBox();

            image.readRasters({
                // pool: new GeoTIFF.Pool(),
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
                resolve(windData)
            }).catch((e: ExceptionInformation) => {
                reject(e);
            })
        })
        .catch((e) => {
            reject(e);
        });
});
