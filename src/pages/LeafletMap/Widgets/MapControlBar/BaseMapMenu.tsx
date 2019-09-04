import React from 'react';
import { Menu, Dropdown } from 'antd';
import { ClickParam } from 'antd/lib/menu';
import { TypeMapUtil } from '#/MapOfLeaflet';

const EnumBaseMapType = [
    {
        label: "GaoDe.Normal.Map",
        value: ["GaoDe.Normal.Map"]
    },
    {
        label: "GaoDe.Satellite.Map",
        value: ["GaoDe.Satellite.Map", "GaoDe.Satellite.Annotion"]
    },
    {
        label: "Google.Normal.Map",
        value: ["Google.Normal.Map"]
    },
    {
        label: "Google.Satellite.Map",
        value: ["Google.Satellite.Map", "GaoDe.Satellite.Annotion"]
    },
    {
        label: "Google.Terrain.Map",
        value: ["Google.Terrain.Map"]
    },
    {
        label: "Geoq.Normal.Map",
        value: ["Geoq.Normal.Map"]
    },
    {
        label: "Geoq.Normal.PurplishBlue",
        value: ["Geoq.Normal.PurplishBlue"]
    },
    {
        label: "Geoq.Normal.Gray",
        value: ["Geoq.Normal.Gray"]
    },
    {
        label: "Geoq.Normal.Warm",
        value: ["Geoq.Normal.Warm"]
    },
    {
        label: "Geoq.Normal.Cold",
        value: ["Geoq.Normal.Cold"]
    },
];

/**
 * 鼠标工具菜单
 * @param children
 * @param mapUtil
 * @constructor
 */
const BaseMapMenu: React.FC<{mapUtil: TypeMapUtil}> = ({children, mapUtil}) => {
    return (
        <Dropdown overlay={<Menus mapUtil={mapUtil} />}>
            {children}
        </Dropdown>
    );
};

export default BaseMapMenu;

const Menus: React.FC<{mapUtil: TypeMapUtil}> = ({mapUtil}) => {

    const handleClick = (e: ClickParam) => {
        mapUtil.updateBaseMap(JSON.parse(e.key));
    };

    return (
        <Menu onClick={handleClick}>
            {EnumBaseMapType.map(({label, value}) => (
                <Menu.Item key={JSON.stringify(value)}>
                    <a>
                        {label}
                    </a>
                </Menu.Item>
            ))}
        </Menu>
    );
};
