import EE from 'onfire.js';

const eventName = "clickMapCommand";

/**
 * 地图指令调度器
 */
export default class MapCommandDispatcher {
    ee = new EE();

    listen = (fn: Function) => {
        this.ee.on(eventName, fn)
    }

    emit = (...params: any[]) => {
        this.ee.fire(eventName, ...params);
    }

    off = (fn: Function) => {
        this.ee.off(eventName, fn)
    }
}
