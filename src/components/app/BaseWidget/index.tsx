import React, {useEffect, useRef, useState}  from "react";
import Draggable, { DraggableProps } from 'react-draggable';
import css from 'styled-jsx/css';
import { Icon, Tooltip } from 'antd';

import {computeXY, debounce, showComponent, TypePosition } from "./util";
export {default as WidgetStore} from './WidgetStore';

interface BaseWidgetProps {
    style?: React.CSSProperties;
    isAllowDrag?: boolean;
    position?: TypePosition,
    zIndex?: number;
    isShowClose?: boolean;
}

const BaseWidget: React.FC<BaseWidgetProps> = ({
    style = {},
    isAllowDrag = true,
    position,
    zIndex = 1,
    widgetStore,
    widgetType,
    isShowClose = false,
    children
}) => {
    const divRef: React.RefObject<HTMLDivElement> = useRef();
    const [ realPosition, setRealPosition] = useState(computeXY(null, position));

    useEffect(() => {
        const handleResize = debounce(resize, 50);
        window.addEventListener("resize", handleResize);
        resize();

        return () => window.removeEventListener("resize", handleResize)
    }, []);


    const resize = () => {
        // 获取容器DOM
        const containerDom = divRef.current.parentElement.parentElement as HTMLDivElement;
        const {clientWidth: itemW, clientHeight: itemH} = divRef.current;
        setRealPosition(computeXY(containerDom, position, itemW, itemH))
    };

    // @ts-ignore
    const draggableProps: DraggableProps = {
        handle:".header",
        disabled: !isAllowDrag,
        grid: [1, 1],
        position: realPosition,
        onStop: (e, ui) => setRealPosition({x: ui.x, y: ui.y})
    };

    return (
        <Draggable {...draggableProps}>
            <div
                ref={divRef}
                className="item"
                style={{
                    ...style,
                    zIndex,
                }}
            >

                <div className="header">
                    {showComponent(
                        <Tooltip title="关闭" placement="right">
                            <Icon
                                type="close-circle"
                                className={closeIconClassName}
                                onClick={() => widgetStore.closeWidget(widgetType)}
                            />
                        </Tooltip>,
                        isShowClose
                    )}
                </div>

                {children}

                {closeIconStyles}

                {/*language=SCSS*/}
                <style jsx>{`
                    .item {
                        :global(.header){
                            position: relative;
                            height: 10px;
                            background-color: #1D2440;
                            cursor: move;
                        }
                    
                        position: absolute;
                        background-color: rgba(0, 0, 0, 0.43);
                        color: #fff;
                        border-radius: 3px;
                    }
                `}</style>
            </div>
        </Draggable>
    );
};

export default BaseWidget;

// language=SCSS
const {styles: closeIconStyles, className: closeIconClassName} = css.resolve`    
    .anticon-close-circle{
        position: absolute;
        right: 0px;
        top: 0px;
        cursor: pointer;
        color: #fff;
        //margin-bottom: 20px;
    }
`;

