import L from 'leaflet';
import PixiOverlay, { PIXI, Options, Utils } from './PixiOverlay';

interface PixiOverlayInterface extends L.Layer{
    utils: Utils;
    getUtils: () => Utils;
}

const getPixiOverlay = (callback, pixiContainer, opts: Options) => {
    // @ts-ignore
    return  new PixiOverlay(callback , pixiContainer, opts) as PixiOverlayInterface
}

class DrawManager {
    quene = [] as Function[]

}

export default class PixiLayer {
    readonly map : L.Map;
    readonly pixiOverlay: PixiOverlayInterface;
    readonly pixiContainer: PIXI.Container;
    readonly quene = [] as Function[]

    constructor(map: L.Map) {
        this.map = map;
        const pixiContainer = new PIXI.Container();
        this.pixiContainer = pixiContainer;

        // this.triangle = new PIXI.Graphics();
        // pixiContainer.addChild(this.triangle);
        this.pixiOverlay = getPixiOverlay((utils: Utils) => {
            this.quene.forEach(fn => fn(utils));
            utils.getRenderer().render(this.pixiContainer);

        }, pixiContainer, {
            doubleBuffering: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
            autoPreventDefault: false
        });

        this.pixiOverlay.addTo(map);
        // this.addPolygon();
        // this.pixiOverlay._update();
        // this.addPolygon1()
    }

    // addPolygon = () => {
    //     const map = this.map;
    //     const polygonLatLngs = [
    //         [51.509, -0.08],
    //         [51.503, -0.06],
    //         [51.51, -0.047],
    //         [51.509, -0.08]
    //     ];
    //
    //     map.flyToBounds(polygonLatLngs, { animate: false});
    //     // L.polygon(polygonLatLngs,  {color: 'red'}).addTo(map);
    // };

    addPolygon = (utils: Utils) => {
        const map = this.map;
        const polygonLatLngs = [
            [51.509, -0.08],
            [51.503, -0.06],
            [51.51, -0.047],
            [51.509, -0.08]
        ];

        const triangle = new PIXI.Graphics();
        const fn = () => {
            // const triangle = this.triangle;
            const { getRenderer, getContainer, latLngToLayerPoint: project, getScale } = this.pixiOverlay.getUtils();
            // const { getRenderer, getContainer, latLngToLayerPoint: project, getScale } = utils;
            const container = getContainer();
            const renderer = getRenderer();
            const scale = getScale();
            //
            let projectedPolygon = polygonLatLngs.map(function(coords) {return project(coords)})

            triangle.clear();
            triangle.lineStyle(3 / scale, 0x3388ff, 1);
            triangle.beginFill(0x3388ff, 0.2);
            triangle.x = projectedPolygon[0].x;
            triangle.y = projectedPolygon[0].y;
            projectedPolygon.forEach(function(coords, index) {
                if (index == 0) triangle.moveTo(0, 0);
                else triangle.lineTo(coords.x - triangle.x, coords.y - triangle.y);
            });
            triangle.endFill();
        }

        this.quene.push(fn)
        this.pixiContainer.addChild(triangle)
        map.flyToBounds(polygonLatLngs, { animate: false});

        this.pixiOverlay._update()

        setTimeout(() => {
            this.pixiContainer.removeChild(triangle);
            this.pixiOverlay._update()
            triangle.destroy()
        }, 1000)

    }

}
