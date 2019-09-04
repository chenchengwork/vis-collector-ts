/**
 *  枚举widget的类型
 */
export const EnumWidgetType = {
    mapControlBar: "mapControlBar",           // 地图公共控制按钮
    leftBar: "leftBar",                       // 左侧的业务工具条
};

/**
 * 枚举widget的数据
 * 格式说明：
 *
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


