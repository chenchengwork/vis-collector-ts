
/**
 *  枚举widget的类型
 */
export const EnumWidgetType = {
    mapControlBar: "mapControlBar",           // 地图控制按钮
    leftBar: "leftBar",                           // 高度轴
};

/**
 * 默认显示的widgetType
 * @type {string[]}
 */
// export const EnumShowWidgetTypes = [];

/**
 * 枚举widget的数据
 * 格式说明：
 *  情况1:
 *  containerProps.isStartDrag = true时：
 *  containerProps.position = {left, top, right, bottom};   // 使用的属性
 *  情况2:
 *  containerProps.isStartDrag = false时：
 *  containerProps.position = {x, y};   // 使用的属性
 * @type {{}}
 */
export const EnumWidget = {
    [EnumWidgetType.mapControlBar]: {
        containerProps: {
            position: {rightX: 50, topY: 20},
            isShowClose: false,
        },
        widgetParams: {}
    },
    [EnumWidgetType.leftBar]: {
        containerProps: {
            position: {leftX: 30, topY: 50},
            isShowClose: false,
        },
        widgetParams: {}
    },
};


