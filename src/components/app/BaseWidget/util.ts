export type TypeStringOrNum = string | number;

export interface TypePosition {
    leftX?: TypeStringOrNum;
    topY?: TypeStringOrNum;
    rightX?: TypeStringOrNum;
    bottomY?: TypeStringOrNum;
}

/**
 * 是否是undefined
 * @param data
 * @returns {boolean}
 */
export const isUndefined = (data: any) => data === undefined;

/**
 * 是否是数字
 * @param data
 * @returns {boolean}
 */
export const isNumber = (data: any) => typeof data === 'number' && data > Number.NEGATIVE_INFINITY && data < Number.POSITIVE_INFINITY;

/**
 * 是否是字符串
 * @param data
 * @returns {boolean}
 */
export const isString = (data: any) => typeof data === 'string';

/**
 * 是否显示组件
 * @param value
 * @param isShow
 */
export const showComponent = <T>(value: T, isShow = true) => isShow ? value : null;

/**
 * 计算元素位置
 * @param containerDom
 * @param position
 * @param itemW
 * @param itemH
 */
export const computeXY = (containerDom: HTMLDivElement | null, position: TypePosition, itemW = 0, itemH = 0) => {
    if(!containerDom) return {x: 0, y: 0};

    const width = containerDom.clientWidth;
    const height = containerDom.clientHeight;
    const { leftX, topY, rightX, bottomY } = position;
    const x = Reflect.has(position, "leftX") ? toPointLT(leftX, width) : toPointRB(rightX, width, itemW);
    const y =  Reflect.has(position, "topY") ? toPointLT(topY, height) : toPointRB(bottomY, height, itemH);
    return {x, y};
};

/**
 * 防抖函数
 * @param {Function} fn     回调函数
 * @param {Number} delay    延迟时间
 * @param {Object} [context]  回调函数上下文
 * @returns {Function}
 */
export const debounce = (fn: Function, delay: number, context?: any) => {
    let timeout: any;

    return function(){

        clearTimeout(timeout);

        context = context || this;
        let args = arguments

        timeout = setTimeout(function(){

            fn.apply(context, args);

        },delay)

    };
};

/**
 * 计算左上的位置
 * @param value
 * @param range
 */
const toPointLT = (value: TypeStringOrNum, range: number): number => {
    if(isNumber(value)) return value as number;

    if(isString(value) && /%$/.test(value.toString())) {
        value = value.toString().replace("%", "");
        value = parseFloat(value) / 100 * range;
    }

    return value as number;
};

/**
 * 计算右下的位置
 * @param value
 * @param range
 * @param offset
 */
const toPointRB = (value: TypeStringOrNum, range: number, offset: number): number => {
    if(isNumber(value)) return range - (value as number) - offset;

    if(isString(value) && /%$/.test(value.toString())) {
        value = value.toString().replace("%", "");
        value = parseFloat(value) / 100 * range;
    }

    return range - (value as number) - offset;
};
