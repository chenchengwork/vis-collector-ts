import { observable, action } from 'mobx';

/**
 * 管理动态widget
 */
export default class WidgetStore{

    /**
     * 结构：
     *  [key]: {
     *      containerProps:{
     *          // 存放BaseWidget组件的props
     *      },
     *      widgetParams: {
     *          // 子组件自定义的props
     *      },
     *      // 保存销毁副作用方法的map
     *      destroyEffectMap: new Map(),
     *  }
     * @type {Map<any, any>}
     */
    @observable.shallow widgetTypeToVal = new Map();


    constructor(widgetTypeToVal){
        Object.keys(widgetTypeToVal).forEach(key => this.widgetTypeToVal.set(key, widgetTypeToVal[key]))
    }


    /**
     * 获取widget的参数
     * @param widgetType
     * @return {{}}
     */
    @action
    getWidgetParams = (widgetType) => {
        const { widgetParams } = this.widgetTypeToVal.get(widgetType);

        return widgetParams || {};
    };

    /**
     * 展示widget
     * @param widgetType
     * @param params
     */
    @action
    showWidget = (widgetType, params = {}) => {
        this.widgetTypeToVal.set(widgetType, helper.deepmerge(initData[widgetType], params));
    };

    /**
     * 关闭widget
     * @param  widgetType // {Array|string}
     */
    @action
    closeWidget = (widgetType) => {
        const widgetTypes = Array.isArray(widgetType) ? widgetType : [widgetType];

        widgetTypes.forEach((widgetType) => {
            const values = this.widgetTypeToVal.get(widgetType);
            if(values) {
                // 销毁副作用
                const {destroyEffectMap} = values;
                if(destroyEffectMap){
                    for(const [key, clearFn] of destroyEffectMap){
                        clearFn();
                    }
                }

                this.widgetTypeToVal.delete(widgetType);
            }
        })
    };

    /**
     * 是否显示widget
     * @param widgetType
     * @return {boolean}
     */
    isShowWidget = (widgetType) => this.widgetTypeToVal.has(widgetType);


    /**
     * 设置销毁副作用方法
     * @param widgetType
     * @param effectFnKey
     * @param effectFn
     */
    @action
    setDestroyEffectFn = (widgetType, effectFnKey, effectFn) => {
        if(this.widgetTypeToVal.has(widgetType)){
            const widget = this.widgetTypeToVal.get(widgetType);
            if(!Reflect.has(widget, "destroyEffectMap")) widget.destroyEffectMap = new Map();

            if(widget.destroyEffectMap.has(effectFnKey)) console.warn(`setDestroyEffectFn中的key值${effectFnKey}已经存在`);

            widget.destroyEffectMap.set(effectFnKey, effectFn);
            this.widgetTypeToVal.set(widgetType, widget);
        }
    }
}
