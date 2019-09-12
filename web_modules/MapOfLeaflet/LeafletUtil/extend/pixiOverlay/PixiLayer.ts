import L from 'leaflet';
import PixiOverlay, { PIXI, Options, Utils, PixiOverlayInterface } from './PixiOverlay';
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


    addMarkerForClick = (markers) => {
        const map = this.map;
        const loader = new PIXI.Loader();
        const getImg = (name) => `/data/leaflet/pixi/markers/${name}`;

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
                var firstDraw = true;
                var prevZoom;
                var markerSprites = [];
                var colorScale = d3Scale.scaleLinear()
                    .domain([0, 50, 100])
                    .range(["#c6233c", "#ffd300", "#008000"]);

                var frame = null;
                var focus = null;

                return (utils: Utils) => {
                    var zoom = utils.getMap().getZoom();

                    var container = utils.getContainer();
                    var renderer = utils.getRenderer();
                    var project = utils.latLngToLayerPoint;
                    var scale = utils.getScale();
                    var invScale = 1 / scale;
                    if (firstDraw) {
                        prevZoom = zoom;
                        console.log('11212111212121212')
                        console.time("time1")
                        markers.forEach(function(marker) {
                            var coords = project([marker.latitude, marker.longitude]);
                            var index = Math.floor(Math.random() * textures.length);
                            var markerSprite = new PIXI.Sprite(textures[index]);
                            markerSprite.textureIndex = index;
                            markerSprite.x0 = coords.x;
                            markerSprite.y0 = coords.y;
                            markerSprite.anchor.set(0.5, 0.5);
                            var tint = d3Color.color(colorScale(marker.avancement || Math.random() * 100)).rgb();
                            markerSprite.tint = 256 * (tint.r * 256 + tint.g) + tint.b;
                            container.addChild(markerSprite);
                            markerSprites.push(markerSprite);
                            markerSprite.legend = marker.city || marker.label;
                        });
                        console.timeEnd("time1")

                        console.time("time2")
                        var quadTrees = {};
                        for (var z = map.getMinZoom(); z <= map.getMaxZoom(); z++) {
                            var rInit = ((z <= 7) ? 10 : 24) / utils.getScale(z);
                            quadTrees[z] = solveCollision(markerSprites, {r0: rInit, zoom: z});
                        }
                        console.timeEnd("time2")
                        console.log('quadTrees->', quadTrees);
                        function findMarker(ll) {
                            var layerPoint = project(ll);
                            var quadTree = quadTrees[utils.getMap().getZoom()];
                            var marker;
                            var rMax = quadTree.rMax;
                            var found = false;
                            quadTree.visit(function(quad, x1, y1, x2, y2) {
                                if (!quad.length) {
                                    var dx = quad.data.x - layerPoint.x;
                                    var dy = quad.data.y - layerPoint.y;
                                    var r = quad.data.scale.x * 16;
                                    if (dx * dx + dy * dy <= r * r) {
                                        marker = quad.data;
                                        found = true;
                                    }
                                }
                                return found || x1 > layerPoint.x + rMax || x2 + rMax < layerPoint.x || y1 > layerPoint.y + rMax || y2 + rMax < layerPoint.y;
                            });
                            return marker;
                        }

                        map.on('click', function(e) {
                            var redraw = false;
                            if (focus) {
                                focus.texture = textures[focus.textureIndex];
                                focus = null;
                                // L.DomUtil.addClass(legend, 'hide');
                                // legendContent.innerHTML = '';
                                redraw = true;
                            }
                            var marker = findMarker(e.latlng);
                            if (marker) {
                                marker.texture = focusTextures[marker.textureIndex];
                                focus = marker;
                                // legendContent.innerHTML = marker.legend;
                                // L.DomUtil.removeClass(legend, 'hide');
                                redraw = true;
                            }
                            if (redraw) utils.getRenderer().render(container);
                        });

                        var self = this;
                        // map.on('mousemove', L.Util.throttle(function(e) {
                        //     var marker = findMarker(e.latlng);
                        //     if (marker) {
                        //         L.DomUtil.addClass(self._container, 'leaflet-interactive');
                        //     } else {
                        //         L.DomUtil.removeClass(self._container, 'leaflet-interactive');
                        //     }
                        // }, 32));
                    }
                    if (firstDraw || prevZoom !== zoom) {
                        markerSprites.forEach(function(markerSprite) {
                            var position = markerSprite.cache[zoom];
                            if (firstDraw) {
                                markerSprite.x = position.x;
                                markerSprite.y = position.y;
                                markerSprite.scale.set((position.r * scale < 16) ? position.r / 16 : invScale);
                            } else {
                                markerSprite.currentX = markerSprite.x;
                                markerSprite.currentY = markerSprite.y;
                                markerSprite.targetX = position.x;
                                markerSprite.targetY = position.y;
                                markerSprite.currentScale = markerSprite.scale.x;
                                markerSprite.targetScale = (position.r * scale < 16) ? position.r / 16 : invScale;
                            }
                        });
                    }

                    var start = null;
                    var delta = 250;

                    if (frame) {
                        cancelAnimationFrame(frame);
                        frame = null;
                    }
                    function animate(timestamp) {
                        var progress;
                        if (start === null) start = timestamp;
                        progress = timestamp - start;
                        var lambda = progress / delta;
                        if (lambda > 1) lambda = 1;
                        lambda = lambda * (0.4 + lambda * (2.2 + lambda * -1.6));
                        markerSprites.forEach(function(markerSprite) {
                            markerSprite.x = markerSprite.currentX + lambda * (markerSprite.targetX - markerSprite.currentX);
                            markerSprite.y = markerSprite.currentY + lambda * (markerSprite.targetY - markerSprite.currentY);
                            markerSprite.scale.set(markerSprite.currentScale + lambda * (markerSprite.targetScale - markerSprite.currentScale));
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
