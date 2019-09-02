import React, {useEffect, useRef, useState}  from "react";
import Draggable, { DraggableProps } from 'react-draggable';
import { Icon, Tooltip } from 'antd';
import { checkType, helper } from '@/utils/T';
import css from 'styled-jsx/css';

export {default as WidgetStore} from './WidgetStore';

type TypeStringOrNum = string | number;

interface BaseWidgetProps {
    style?: React.CSSProperties;
    isAllowDrag?: boolean;
    position?: {
        left?: TypeStringOrNum;
        top?: TypeStringOrNum;
        right?: TypeStringOrNum;
        bottom?: TypeStringOrNum;
    },
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
    console.log('position->', position)
    const computeXY = (itemW = 0, itemH = 0) => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const { leftX, topY, rightX, bottomY } = position;
        const x = Reflect.has(position, "leftX") ? toPointLT(leftX, width) : toPointRB(rightX, width, itemW);
        const y =  Reflect.has(position, "topY") ? toPointLT(topY, height) : toPointRB(bottomY, height, itemH);
        return {x, y};
    };

    const divRef = useRef(null);
    const [ realPosition, setRealPosition] = useState(computeXY());

    // useEffect(() => {
    //     function resize() {
    //         const {clientWidth, clientHeight} = divRef.current;
    //         setRealPosition(computeXY(clientWidth, clientHeight))
    //     }
    //
    //     const handleResize = helper.debounce(resize, 50);
    //     window.addEventListener("resize", handleResize);
    //     resize();
    //
    //     return () => window.removeEventListener("resize", handleResize)
    // }, []);


    // @ts-ignore
    const draggableProps: DraggableProps = {
        // handle:".ant-tabs-nav-wrap",
        disabled: !isAllowDrag,
        grid: [1, 1],
        position: realPosition,
        onStop: (e, ui) => setRealPosition({x: ui.x, y: ui.y})
    };
console.log('draggableProps->', draggableProps)
    return (
        <Draggable {...draggableProps}>
            <div ref={divRef} className="query-type" style={{...style, zIndex}}>
                {/*{children}*/}

                <div style={{height: 100, width: 100, backgroundColor: "red"}}>111111</div>

                {isShowClose ? (<Tooltip title="关闭" placement="right">
                    <Icon
                        type="close-circle"
                        className={closeIconClassName}
                        onClick={() => widgetStore.closeWidget(widgetType)}
                    />
                </Tooltip>) : null}

                {closeIconStyles}

                {/*language=SCSS*/}
                <style jsx>{`
                    .query-type {
                        //position: absolute;
                        background-color: rgba(0, 0, 0, 0.43);
                        color: #fff;
                        border-radius: 3px;
                        //cursor: move;
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

/**
 * 计算左上的位置
 * @param value
 * @param range
 */
const toPointLT = (value: TypeStringOrNum, range: number): number => {
    if(checkType.isNumber(value)) return value as number;

    if(checkType.isString(value) && /%$/.test(value.toString())) {
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
    if(checkType.isNumber(value)) return range - (value as number) - offset;

    if(checkType.isString(value) && /%$/.test(value.toString())) {
        value = value.toString().replace("%", "");
        value = parseFloat(value) / 100 * range;
    }

    return range - (value as number) - offset;
};
