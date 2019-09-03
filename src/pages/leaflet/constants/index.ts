
/**
 *  枚举widget的类型
 */
export const EnumWidgetType = {
    heightLine: "heightLine",           // 高度轴
    test: "test",           // 高度轴
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
export const EnumWidgetData = {
    [EnumWidgetType.heightLine]: {
        containerProps: {
            position: {leftX: 20, topY: 10}
        },
        widgetParams: {}
    },
    [EnumWidgetType.test]: {
        containerProps: {
            position: {rightX: 0, bottomY: 0}
        },
        widgetParams: {}
    },
};


