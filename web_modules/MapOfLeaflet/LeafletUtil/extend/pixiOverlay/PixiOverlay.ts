import L from 'leaflet';
import * as PIXI from 'pixi.js'

// @ts-ignore
const round = L.Point.prototype._round;
const no_round = function () {return this;};

function setInteractionManager(interactionManager: PIXI.interaction.InteractionManager, destroyInteractionManager: boolean, autoPreventDefault: boolean) {
    if (destroyInteractionManager) {
        interactionManager.destroy();
    } else if (!autoPreventDefault) {
        interactionManager.autoPreventDefault = false;
    }
}

const pixiOverlayClass = {
    options: {
        // @option padding: Number = 0.1
        // How much to extend the clip area around the map view (relative to its size)
        // e.g. 0.1 would be 10% of map view in each direction
        padding: 0.1,
        // @option forceCanvas: Boolean = false
        // Force use of a 2d-canvas
        forceCanvas: false,
        // @option doubleBuffering: Boolean = false
        // Help to prevent flicker when refreshing display on some devices (e.g. iOS devices)
        // It is ignored if rendering is done with 2d-canvas
        doubleBuffering: false,
        // @option resolution: Number = 1
        // Resolution of the renderer canvas
        resolution: L.Browser.retina ? 2 : 1,
        // @option projectionZoom(map: map): Number
        // return the layer projection zoom level
        projectionZoom: function (map: L.Map) {return (map.getMaxZoom() + map.getMinZoom()) / 2;},
        // @option destroyInteractionManager:  Boolean = false
        // Destroy PIXI Interaction Manager
        destroyInteractionManager: false,
        // @option
        // Customize PIXI Interaction Manager autoPreventDefault property
        // This option is ignored if destroyInteractionManager is set
        autoPreventDefault: true,
        // @option resolution: Boolean = false
        // Enables drawing buffer preservation
        preserveDrawingBuffer: false,
        // @option resolution: Boolean = true
        // Clear the canvas before the new render pass
        clearBeforeRender: true,
        // @option shouldRedrawOnMove(e: moveEvent): Boolean
        // filter move events that should trigger a layer redraw
        shouldRedrawOnMove: function () {return false;},
    },

    initialize: function (drawCallback, pixiContainer, options) {
        // @ts-ignore
        L.setOptions(this, options);  L.stamp(this);

        this._drawCallback = drawCallback;
        this._pixiContainer = pixiContainer;
        this._rendererOptions = {
            transparent: true,
            resolution: this.options.resolution,
            antialias: true,
            forceCanvas: this.options.forceCanvas,
            preserveDrawingBuffer: this.options.preserveDrawingBuffer,
            clearBeforeRender: this.options.clearBeforeRender
        };
        this._doubleBuffering = PIXI.utils.isWebGLSupported() && !this.options.forceCanvas && this.options.doubleBuffering;
    },

    _setContainerStyle: function () {},

    _addContainer: function () {
        this.getPane().appendChild(this._container);
    },

    _setEvents: function () {},

    onAdd: function () {
        if (!this._container) {
            const container = this._container = L.DomUtil.create('div', 'leaflet-pixi-overlay');
            container.style.position = 'absolute';
            this._renderer = PIXI.autoDetectRenderer(this._rendererOptions);
            setInteractionManager(
                this._renderer.plugins.interaction,
                this.options.destroyInteractionManager,
                this.options.autoPreventDefault
            );

            container.appendChild(this._renderer.view);
            if (this._zoomAnimated) {
                L.DomUtil.addClass(container, 'leaflet-zoom-animated');
                this._setContainerStyle();
            }

            if (this._doubleBuffering) {
                this._auxRenderer = PIXI.autoDetectRenderer(this._rendererOptions);
                setInteractionManager(
                    this._auxRenderer.plugins.interaction,
                    this.options.destroyInteractionManager,
                    this.options.autoPreventDefault
                );
                container.appendChild(this._auxRenderer.view);
                this._renderer.view.style.position = 'absolute';
                this._auxRenderer.view.style.position = 'absolute';
            }
        }
        this._addContainer();
        this._setEvents();

        const map = this._map;
        this._initialZoom = this.options.projectionZoom(map);
        this._wgsOrigin = L.latLng([0, 0]);
        this._wgsInitialShift = map.project(this._wgsOrigin, this._initialZoom);
        this._mapInitialZoom = map.getZoom();
        const _layer = this;

        this.utils = {
            // 经纬度转成像素点位置
            latLngToLayerPoint: function (latLng: L.LatLngExpression, zoom: number) {
                zoom = (zoom === undefined) ? _layer._initialZoom : zoom;
                const projectedPoint = map.project(L.latLng(latLng), zoom);
                return projectedPoint;
            },
            // 像素点位置转换成经纬度
            layerPointToLatLng: function (point: L.PointTuple, zoom: number) {
                zoom = (zoom === undefined) ? _layer._initialZoom : zoom;
                const projectedPoint = L.point(point);
                return map.unproject(projectedPoint, zoom);
            },
            // 获取地图当前缩放等级
            getScale: function (zoom: number) {
                return map.getZoomScale(zoom === undefined ? map.getZoom() : zoom, _layer._initialZoom)
            },
            getRenderer: function () {
                return _layer._renderer;
            },
            getContainer: function () {
                return _layer._pixiContainer;
            },
            getMap: function () {
                return _layer._map;
            }
        };

        this._update({type: 'add'});
    },

    onRemove: function () {
        L.DomUtil.remove(this._container);
    },

    getEvents: function () {
        const events = {
            zoom: this._onZoom,
            move: this._onMove,
            moveend: this._update
        };
        if (this._zoomAnimated) {
            // @ts-ignore
            events.zoomanim = this._onAnimZoom;
        }
        return events;
    },

    _onZoom: function () {
        this._updateTransform(this._map.getCenter(), this._map.getZoom());
    },

    _onAnimZoom: function (e: L.ZoomAnimEvent) {
        this._updateTransform(e.center, e.zoom);
    },

    _onMove: function(e: L.LeafletMouseEvent) {
        if (this.options.shouldRedrawOnMove(e)) {
            this._update(e);
        }
    },

    _updateTransform: function (center: L.LatLngExpression, zoom: number) {
        const scale = this._map.getZoomScale(zoom, this._zoom),
            viewHalf = this._map.getSize().multiplyBy(0.5 + this.options.padding),
            currentCenterPoint = this._map.project(this._center, zoom),

            topLeftOffset = viewHalf.multiplyBy(-scale).add(currentCenterPoint)
                .subtract(this._map._getNewPixelOrigin(center, zoom));

        if (L.Browser.any3d) {
            L.DomUtil.setTransform(this._container, topLeftOffset, scale);
        } else {
            L.DomUtil.setPosition(this._container, topLeftOffset);
        }
    },

    _redraw: function(offset: L.Point, e: L.LayerEvent) {
        this._disableLeafletRounding();
        const scale = this._map.getZoomScale(this._zoom, this._initialZoom),
            shift = this._map.latLngToLayerPoint(this._wgsOrigin)
                ._subtract(this._wgsInitialShift.multiplyBy(scale))._subtract(offset);
        this._pixiContainer.scale.set(scale);
        this._pixiContainer.position.set(shift.x, shift.y);
        this._drawCallback(this.utils, e);
        this._enableLeafletRounding();
    },

    _update: function (e: L.LayerEvent) {
        // is this really useful?
        if (this._map._animatingZoom && this._bounds) {return;}
        // Update pixel bounds of renderer container
        const p = this.options.padding,
            mapSize = this._map.getSize(),
            min = this._map.containerPointToLayerPoint(mapSize.multiplyBy(-p)).round();

        this._bounds = new L.Bounds(min, min.add(mapSize.multiplyBy(1 + p * 2)).round());
        this._center = this._map.getCenter();
        this._zoom = this._map.getZoom();

        if (this._doubleBuffering) {
            var currentRenderer = this._renderer;
            this._renderer = this._auxRenderer;
            this._auxRenderer = currentRenderer;
        }

        const view = this._renderer.view;
        const b = this._bounds,
            container = this._container,
            size = b.getSize();

        if (!this._renderer.size || this._renderer.size.x !== size.x || this._renderer.size.y !== size.y) {
            if (this._renderer.gl) {
                this._renderer.resolution = this.options.resolution;
                if (this._renderer.rootRenderTarget) {
                    this._renderer.rootRenderTarget.resolution = this.options.resolution;
                }
            }
            this._renderer.resize(size.x, size.y);
            view.style.width = size.x + 'px';
            view.style.height = size.y + 'px';
            if (this._renderer.gl) {
                const gl = this._renderer.gl;
                if (gl.drawingBufferWidth !== this._renderer.width) {
                    const resolution = this.options.resolution * gl.drawingBufferWidth / this._renderer.width;
                    this._renderer.resolution = resolution;
                    if (this._renderer.rootRenderTarget) {
                        this._renderer.rootRenderTarget.resolution = resolution;
                    }
                    this._renderer.resize(size.x, size.y);
                }
            }
            this._renderer.size = size;
        }

        if (this._doubleBuffering) {
            const self = this;
            requestAnimationFrame(function() {
                self._redraw(b.min, e);
                self._renderer.gl.finish();
                view.style.visibility = 'visible';
                self._auxRenderer.view.style.visibility = 'hidden';
                L.DomUtil.setPosition(container, b.min);
            });
        } else {
            this._redraw(b.min, e);
            L.DomUtil.setPosition(container, b.min);
        }
    },

    _disableLeafletRounding: function () {
        // @ts-ignore
        L.Point.prototype._round = no_round;
    },

    _enableLeafletRounding: function () {
        // @ts-ignore
        L.Point.prototype._round = round;
    },

    redraw: function (data: any) {
        if (this._map) {
            this._disableLeafletRounding();
            this._drawCallback(this.utils, data);
            this._enableLeafletRounding();
        }

        return this;
    }
};


const PixiOverlay = L.Layer.extend(pixiOverlayClass);

export { PIXI }

export default PixiOverlay;



