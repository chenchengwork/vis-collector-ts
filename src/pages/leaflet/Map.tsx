import React from 'react';
import { observer } from 'mobx-react-lite';
import BaseMap, { TypeMapUtil } from "#/MapOfLeaflet";
import { request } from '@/utils/T';

import Widgets from './Widgets';

const mapOptions = {
    zoom: 4,
    baseLayerTMS: "Google.Normal.Map",
}


const Map: React.FC = () => {

    const handleMapLoaded = (mapUtil: TypeMapUtil) => {

        // ------添加图片覆盖物------
        // mapUtil.addImageOverLayer("https://legacy.lib.utexas.edu/maps/historical/newark_nj_1922.jpg", [[40.712216, -74.22655], [40.773941, -74.12544]], {}, true);


        // ------添加风场------
        // request.get("data/leaflet/windy/windy_10.json").then((resp) => {
        //     console.log(resp);
        //     mapUtil.addWindyLayer(resp.data);
        // }, (resp) => console.log(resp.msg))
    };


    return (
        <BaseMap
            mapOptions={mapOptions}
            // onMapLoaded={handleMapLoaded}
        >
            <Widgets />
        </BaseMap>
    )
};

export default observer(Map);
