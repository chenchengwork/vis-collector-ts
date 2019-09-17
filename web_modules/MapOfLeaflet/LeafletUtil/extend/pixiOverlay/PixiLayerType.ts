import * as PIXI from 'pixi.js'

export interface TypeCircleMarker {
    shape: PIXI.Sprite;
    textureIndex: number;

    x0?: number;
    y0?: number;
    xp?: number;
    yp?: number;
    r?: number;
    r0?: number;
    xMin?: number;
    xMax?: number;
    yMin?: number;
    yMax?: number;
    cache?: {
        [index: number]: {
            x: number;
            y: number;
            r: number;
        }
    }

    currentX?: number;
    currentY?: number;
    targetX?: number;
    targetY?: number;
    currentScale?: number;
    targetScale?: number;
}
