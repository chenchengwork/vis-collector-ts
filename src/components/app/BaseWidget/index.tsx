import React from "react";
import { Icon, Tooltip } from "antd";
import {showComponent, TypePosition} from "./util";

import DynamicWidget from './DynamicWidget';
import FixedWidget from "./FixedWidget";
import WidgetStore from './WidgetStore';

interface BaseWidgetProps {
    style?: React.CSSProperties;
    isAllowDrag?: boolean;
    position?: TypePosition,
    zIndex?: number;
    isShowClose?: boolean;
    widgetStore: WidgetStore;
    widgetType: string;
}

const BaseWidget: React.FC<BaseWidgetProps> = (props) => {
    const { isAllowDrag = false, position, widgetStore, widgetType, isShowClose, children} = props;

    if(isAllowDrag) return (
        <DynamicWidget {...props}>
            <Content {...{ widgetStore, widgetType, isShowClose}}>
                {children}
            </Content>
        </DynamicWidget>
    );

    return (
        <FixedWidget position={position}>
            <Content {...{ widgetStore, widgetType, isShowClose}}>
                {children}
            </Content>
        </FixedWidget>
    );
};

export { WidgetStore }

export default BaseWidget;


/**
 * 内容组件
 */
const Content: React.FC<{widgetStore: WidgetStore; widgetType: string; isShowClose: boolean;}> = ({children, widgetStore, widgetType, isShowClose}) => {

    return (
        <div className="content">
            {showComponent(
                <div className="header">
                    <Tooltip title="关闭" placement="right">
                        <Icon
                            type="close-circle"
                            onClick={() => widgetStore.closeWidget(widgetType)}
                        />
                    </Tooltip>
                </div>,
                isShowClose
            )}

            {children}

            {/*language=SCSS*/}
            <style jsx>{`
                .content{
                    :global(.header){
                        position: relative;
                        height: 10px;
                        background-color: #1D2440;
                        cursor: move;
                    }
                }
            `}</style>
        </div>
    )
}
