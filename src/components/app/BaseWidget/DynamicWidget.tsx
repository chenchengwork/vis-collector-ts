import React, {useEffect, useRef, useState}  from "react";
import Draggable from 'react-draggable';
import {computeXY, debounce, TypePosition } from "./util";

interface BaseWidgetProps {
    style?: React.CSSProperties;
    isAllowDrag?: boolean;
    position?: TypePosition,
    zIndex?: number;
    isShowClose?: boolean;
}

const DynamicWidget: React.FC<BaseWidgetProps> = ({
    style = {},
    isAllowDrag = true,
    position,
    zIndex = 1,
    children
}) => {
    const divRef: React.RefObject<HTMLDivElement> = useRef();
    const [ realPosition, setRealPosition] = useState(computeXY(null, position));

    useEffect(() => {
        resize();

        // const handleResize = debounce(resize, 50);
        // window.addEventListener("resize", handleResize);
        // return () => window.removeEventListener("resize", handleResize)

    }, []);

    const resize = () => {
        // 获取容器DOM
        const containerDom = divRef.current.parentElement as HTMLDivElement;
        const {clientWidth: itemW, clientHeight: itemH} = divRef.current;
        setRealPosition(computeXY(containerDom, position, itemW, itemH))
    };

    return (
        <Draggable {...{
            handle:".header",
            disabled: !isAllowDrag,
            grid: [1, 1],
            position: realPosition,
            onStop: (e, ui) => setRealPosition({x: ui.x, y: ui.y})
        }}>
            <div ref={divRef} className="item" style={{ ...style, zIndex }}>
                {children}

                {/*language=SCSS*/}
                <style jsx>{`
                    .item {
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

export default DynamicWidget;
