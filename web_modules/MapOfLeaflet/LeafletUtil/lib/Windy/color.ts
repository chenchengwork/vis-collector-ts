const BOUNDARY = 0.45;
const τ = 2 * Math.PI;

export type RGBA  =  [number, number, number, number];
type RGB  =  [number, number, number];

export const scale = {
    bounds: [0, 100],
    gradient: function(v: number, a: number) {
        return extendedSinebowColor(Math.min(v, 100) / 100, a);
    }
};

const colorInterpolator = (start: RGBA, end: RGB) => {
    const r = start[0], g = start[1], b = start[2];
    const Δr = end[0] - r, Δg = end[1] - g, Δb = end[2] - b;
    return function(i:number, a: number) {
        return [Math.floor(r + i * Δr), Math.floor(g + i * Δg), Math.floor(b + i * Δb), a];
    };
}

/**
 * Produces a color style in a rainbow-like trefoil color space. Not quite HSV, but produces a nice
 * spectrum. See http://krazydad.com/tutorials/makecolors.php.
 *
 * @param hue the hue rotation in the range [0, 1]
 * @param a the alpha value in the range [0, 255]
 * @returns {Array} [r, g, b, a]
 */
const sinebowColor = (hue: number, a: number): RGBA  =>{
    // Map hue [0, 1] to radians [0, 5/6τ]. Don't allow a full rotation because that keeps hue == 0 and
    // hue == 1 from mapping to the same color.
    let rad = hue * τ * 5/6;
    rad *= 0.75;  // increase frequency to 2/3 cycle per rad

    const s = Math.sin(rad);
    const c = Math.cos(rad);
    const r = Math.floor(Math.max(0, -c) * 255);
    const g = Math.floor(Math.max(s, 0) * 255);
    const b = Math.floor(Math.max(c, 0, -s) * 255);
    return [r, g, b, a];
};

const fadeToWhite = colorInterpolator(sinebowColor(1.0, 0), [255, 255, 255]);


/**
 * Interpolates a sinebow color where 0 <= i <= j, then fades to white where j < i <= 1.
 *
 * @param i number in the range [0, 1]
 * @param a alpha value in range [0, 255]
 * @returns {Array} [r, g, b, a]
 */
const extendedSinebowColor = (i: number, a: number) => {
    return i <= BOUNDARY ?
        sinebowColor(i / BOUNDARY, a) :
        fadeToWhite((i - BOUNDARY) / (1 - BOUNDARY), a);
}
