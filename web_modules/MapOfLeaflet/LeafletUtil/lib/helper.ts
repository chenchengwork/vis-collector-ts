/**
 * 组装url参数
 * @param url
 * @param params
 * @return {*}
 */
export const formatUrlParams = (url: string, params: {[index: string]: string} = {}) => {
    Object.keys(params).forEach((key, index) => {
        if (index === 0 && url.indexOf('?') === -1) {
            url += '?' + key + '=' + params[key];
        } else {
            url += '&' + key + '=' + params[key];
        }
    });

    return url;
};



/**
 * 减速节流函数
 * @param {Function} fn 需要延迟执行的函数
 * @param {Number} time 延迟时间毫秒
 * @param {Object} context
 * @return {wrapperFn}
 *
 * usage:
 const a_fn = (params) => {}
 const render = throttle(a_fn, 16, null);
 render(1);
 render(2); // 将延迟16毫秒执行
 */
export const throttle = (fn: Function, time: number, context: any) => {
    let lock: boolean, args: IArguments | boolean;

    function later () {
        // reset lock and call if queued
        lock = false;
        if (args) {
            wrapperFn.apply(context, args);
            args = false;
        }
    }

    function wrapperFn () {
        if (lock) {
            // called too soon, queue to call later
            args = arguments;

        } else {
            // lock until later then call
            lock = true;
            fn.apply(context, arguments);
            setTimeout(later, time);
        }
    }

    return wrapperFn;
};


/**
 * 防抖函数
 * @param {Function} fn     回调函数
 * @param {Number} delay    延迟事件
 * @param {Object} [context]  回调函数上下文
 * @returns {Function}
 */
export const debounce = (fn: Function, delay: number, context: any) => {
    let timeout: number;

    return function(){

        clearTimeout(timeout);

        context = context || this;
        let args = arguments

        // @ts-ignore
        timeout = setTimeout(function(){

            fn.apply(context, args);

        },delay)

    };
};
