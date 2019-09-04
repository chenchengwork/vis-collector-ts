import React from 'react';
import { Menu, Dropdown } from 'antd';
import { ClickParam } from 'antd/lib/menu';
import { TypeMapUtil } from '#/MapOfLeaflet';

const EnumShape = {
    point: {
        label: "点",
        value: "point"
    },
    rectangle: {
        label: "矩形",
        value: "rectangle"
    },
    polygon: {
        label: "多边形",
        value: "polygon"
    },
    circle: {
        label: "圆形",
        value: "circle"
    },
    polyline: {
        label: "折线",
        value: "polyline"
    },
};

/**
 * 鼠标工具菜单
 * @param children
 * @param mapUtil
 * @constructor
 */
const MouseToolMenu: React.FC<{mapUtil: TypeMapUtil}> = ({children, mapUtil}) => {
    return (
        <Dropdown overlay={<Menus mapUtil={mapUtil} />}>
            {children}
        </Dropdown>
    );
};

export default MouseToolMenu;

const Menus: React.FC<{mapUtil: TypeMapUtil}> = ({mapUtil}) => {
    const { mouseTool } = mapUtil;

    const handleClick = (e: ClickParam) => {
        switch (e.key) {
            case EnumShape.point.value:{
                mouseTool.marker().then((resp) => {console.log('resp->', resp)});
                break;
            }
            case EnumShape.rectangle.value:{
                mouseTool.rectangle().then((resp) => {console.log('resp->', resp)});
                break;
            }
            case EnumShape.polygon.value:{
                mouseTool.polygon().then((resp) => {console.log('resp->', resp)});
                break;
            }
            case EnumShape.circle.value:{
                mouseTool.circle().then((resp) => {console.log('resp->', resp)});
                break;
            }
            case EnumShape.polyline.value:{
                mouseTool.polyline().then((resp) => {console.log('resp->', resp)});
                break;
            }
        }
    }

    return (
        <Menu onClick={handleClick}>
            {Object.values(EnumShape).map(({label, value}) => (
                <Menu.Item key={value}>
                    <a>
                        {label}
                    </a>
                </Menu.Item>
            ))}


        </Menu>
    );
};
