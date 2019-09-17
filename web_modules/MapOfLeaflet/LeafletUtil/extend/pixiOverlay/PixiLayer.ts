import L, {LatLng, LeafletEvent} from 'leaflet';
import PixiOverlay, { PIXI, Options, Utils, PixiOverlayInterface } from './PixiOverlay';
import { TypeCircleMarker } from './PixiLayerType';
import { d3Color, d3Scale } from './tool';
import { solveCollision } from './algorithm';

const getPixiOverlay = (callback: (utils: Utils) => void, pixiContainer: PIXI.Container, opts: Options) => {
    // @ts-ignore
    return  new PixiOverlay(callback , pixiContainer, opts) as PixiOverlayInterface
};

export default class PixiLayer {
    readonly map : L.Map;
    private readonly _pixiOverlay: PixiOverlayInterface;
    private readonly _pixiContainer: PIXI.Container;
    private readonly _queueFN = [] as Function[];

    constructor(map: L.Map, opts?: Options) {
        this.map = map;
        this._pixiContainer = new PIXI.Container();

        opts = Object.assign({
            doubleBuffering: /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream,
            autoPreventDefault: false
        }, opts || {});

        this._pixiOverlay = getPixiOverlay((utils: Utils) => {
            this._queueFN.forEach(fn => fn(utils));
            utils.getRenderer().render(this._pixiContainer);
        }, this._pixiContainer, opts);

        this._pixiOverlay.addTo(map);
    }

    doDraw = (fn: Function, shape: PIXI.Graphics | PIXI.Container, flyToParams?: {bounds: L.LatLngBoundsExpression; options?: L.FitBoundsOptions}) => {
        this._queueFN.push(fn);
        const fnIndex = this._queueFN.length - 1;
        this._pixiContainer.addChild(shape);

        if(flyToParams){
            const { bounds, options } = flyToParams;
            this.map.flyToBounds(bounds, options || {});
        }

        this._pixiOverlay._update();

        return {
            shape,
            remove: () => {
                this._pixiContainer.removeChild(shape);
                this._queueFN.splice(fnIndex, 1);
                this._pixiOverlay._update();
                shape.destroy({children: true});
            }
        }
    };


    destroy = () => {
        this._pixiContainer.destroy({children: true, texture: true, baseTexture: true});
    };


    addPolygon = () => {
        const polygonLatLngs = [
            [51.509, -0.08],
            [51.503, -0.06],
            [51.51, -0.047],
            [51.509, -0.08]
        ];

        const triangle = new PIXI.Graphics();

        const assembleShape = (utils: Utils) => {
            const { latLngToLayerPoint: project, getScale } = utils;
            const scale = getScale();
            //
            let projectedPolygon = polygonLatLngs.map(function(coords) {return project(coords as L.LatLngExpression)});

            triangle.clear();
            triangle.lineStyle(3 / scale, 0x3388ff, 1);
            triangle.beginFill(0x3388ff, 0.2);
            triangle.x = projectedPolygon[0].x;
            triangle.y = projectedPolygon[0].y;
            projectedPolygon.forEach(function(coords, index) {
                if (index == 0) {
                    triangle.moveTo(0, 0);
                }else {
                    triangle.lineTo(coords.x - triangle.x, coords.y - triangle.y);
                }
            });
            triangle.endFill();
        };

        this.doDraw(assembleShape, triangle, {bounds: polygonLatLngs as L.LatLngBoundsExpression});
    }

    // 添加具有click事件marker
    addMarkerForClick = <T>(data: T[]) => {
        const map = this.map;
        const loader = new PIXI.Loader();
        const getImg = (name: string) => `/data/leaflet/pixi/markers/${name}`;

        // 准备资源
        loader.add('plane', getImg('plane.png'))
            .add('focusPlane', getImg('focus-plane.png'))
            .add('circle', getImg('circle.png'))
            .add('focusCircle', getImg('focus-circle.png'))
            .add('bicycle', getImg('bicycle.png'))
            .add('focusBicycle', getImg('focus-bicycle.png'));

        loader.load((loader, resources) => {
            const textures = [resources.plane.texture, resources.circle.texture, resources.bicycle.texture];
            const focusTextures = [resources.focusPlane.texture, resources.focusCircle.texture, resources.focusBicycle.texture];
            const container = new PIXI.Container();

            const assembleShape = (() => {
                let firstDraw = true;
                let prevZoom: number;
                const markerSprites = [] as PIXI.Sprite[];

                const markers = [] as TypeCircleMarker[];

                // @ts-ignore
                let colorScale = d3Scale.scaleLinear().domain([0, 50, 100]).range(["#c6233c", "#ffd300", "#008000"]);

                let frame: number = null;
                let focus: TypeCircleMarker = null;

                return (utils: Utils) => {
                    const zoom = utils.getMap().getZoom();

                    const container = utils.getContainer();
                    const renderer = utils.getRenderer();
                    const project = utils.latLngToLayerPoint;
                    const scale = utils.getScale();
                    const invScale = 1 / scale;

                    if (firstDraw) {
                        prevZoom = zoom;
                        console.time("time1")
                        data.forEach((item) => {
                            const coords = project([item.latitude, item.longitude]);
                            const index = Math.floor(Math.random() * textures.length);
                            const markerSprite = new PIXI.Sprite(textures[index]);
                            markerSprite.anchor.set(0.5, 0.5);

                            const tint = d3Color.color(colorScale(item.avancement || Math.random() * 100)).rgb();
                            markerSprite.tint = 256 * (tint.r * 256 + tint.g) + tint.b;
                            container.addChild(markerSprite);
                            markerSprites.push(markerSprite);

                            markers.push({
                                shape: markerSprite,
                                textureIndex: index,
                                x0: coords.x,
                                y0: coords.y,
                            })
                        });

                        console.timeEnd("time1")

                        //--------------------生成各个层级碰撞检测数据集(很耗性能, 尝试将其改成web worker的方式)-------------------------
                        console.time("time2")
                        const quadTrees = new Map();
                        for (let z = map.getMinZoom(); z <= map.getMaxZoom(); z++) {
                            const rInit = ((z <= 7) ? 10 : 24) / utils.getScale(z);
                            quadTrees.set(z, solveCollision(markers, {r0: rInit, zoom: z}));
                        }
                        console.timeEnd("time2");


                        function findMarker(ll: L.LatLng) {
                            const layerPoint = project(ll);
                            const quadTree = quadTrees.get(utils.getMap().getZoom());
                            let marker: TypeCircleMarker = null;
                            const rMax = quadTree.rMax;
                            let found = false;
                            // @ts-ignore
                            quadTree.visit(function(quad, x1: number, y1: number, x2: number, y2: number) {
                                if (!quad.length) {
                                    const dx = quad.data.shape.x - layerPoint.x;
                                    const dy = quad.data.shape.y - layerPoint.y;
                                    const r = quad.data.shape.scale.x * 16;
                                    if (dx * dx + dy * dy <= r * r) {
                                        marker = quad.data;
                                        found = true;
                                    }
                                }
                                return found || x1 > layerPoint.x + rMax || x2 + rMax < layerPoint.x || y1 > layerPoint.y + rMax || y2 + rMax < layerPoint.y;
                            });

                            return marker;
                        }

                        // 鼠标点击事件
                        map.on('click', function(e: L.LeafletMouseEvent) {
                            let redraw = false;
                            if (focus) {
                                focus.shape.texture = textures[focus.textureIndex];
                                focus = null;
                                redraw = true;
                            }

                            const marker = findMarker(e.latlng);
                            if (marker) {
                                marker.shape.texture = focusTextures[marker.textureIndex];
                                focus = marker;
                                redraw = true;
                            }

                            if (redraw) utils.getRenderer().render(container);
                        });

                        // 鼠标移动事件
                        // @ts-ignore
                        // map.on('mousemove', L.Util.throttle((e: L.LeafletMouseEvent) => {
                        //     let marker = findMarker(e.latlng);
                        //     if (marker) {
                        //         console.log("选中")
                        //     } else {
                        //         console.log("未选中")
                        //     }
                        // }, 100, null));
                    }

                    if (firstDraw || prevZoom !== zoom) {
                        markers.forEach(function(marker) {
                            const position = marker.cache[zoom];
                            if (firstDraw) {
                                marker.shape.x = position.x;
                                marker.shape.y = position.y;
                                marker.shape.scale.set((position.r * scale < 16) ? position.r / 16 : invScale);
                            } else {
                                marker.currentX = marker.shape.x;
                                marker.currentY = marker.shape.y;
                                marker.targetX = position.x;
                                marker.targetY = position.y;
                                marker.currentScale = marker.shape.scale.x;
                                marker.targetScale = (position.r * scale < 16) ? position.r / 16 : invScale;
                            }
                        });
                    }


                    //-----------------------开启层级缩放动画-----------------------------------

                    let start: number = null;
                    const delta = 250;

                    if (frame) {
                        cancelAnimationFrame(frame);
                        frame = null;
                    }

                    function animate(timestamp: number) {
                        let progress;
                        if (start === null) start = timestamp;
                        progress = timestamp - start;
                        let lambda = progress / delta;
                        if (lambda > 1) lambda = 1;
                        lambda = lambda * (0.4 + lambda * (2.2 + lambda * -1.6));

                        markers.forEach((marker) => {
                            marker.shape.x = marker.currentX + lambda * (marker.targetX - marker.currentX);
                            marker.shape.y = marker.currentY + lambda * (marker.targetY - marker.currentY);
                            marker.shape.scale.set(marker.currentScale + lambda * (marker.targetScale - marker.currentScale));
                        });

                        renderer.render(container);
                        if (progress < delta) {
                            frame = requestAnimationFrame(animate);
                        }
                    }
                    if (!firstDraw && prevZoom !== zoom) {
                        frame = requestAnimationFrame(animate);
                    }
                    firstDraw = false;
                    prevZoom = zoom;
                }
            })();

            map.setView([46.953387, 2.892341], 6);
            this.doDraw(assembleShape, container)
        })
    }
}
