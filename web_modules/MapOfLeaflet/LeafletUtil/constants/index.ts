/*
 * 修饰mapUtil的枚举
 *
 */

/**
 * 枚举缩放等级
 * @type {{maxZoom: number, minZoom: number}}
 */
export const ZOOM = {
    maxZoom: 28,
    minZoom: 3
};

/**
 * 枚举中心坐标点
 * @type {number[]} [lat, lng]
 */
// export const CENTER = [39.272688, 100.923828]
export const CENTER: [number, number] = [28.9, 128.9];  // 当zoom=5时,这个中心点能最大显示中国地图
