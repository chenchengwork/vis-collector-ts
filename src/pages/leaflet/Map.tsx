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
        console.log('mapUtil -> ', mapUtil)

        // -------鼠标绘图-------
        // mapUtil.mouseTool.marker().then((resp) => {console.log('resp->', resp)})
        // mapUtil.mouseTool.rectangle().then((resp) => {console.log('resp->', resp)})
        // mapUtil.mouseTool.circle().then((resp) => {console.log('resp->', resp)})
        // mapUtil.mouseTool.polygon().then((resp) => {console.log('resp->', resp)})
        // mapUtil.mouseTool.polyline().then((resp) => {console.log('resp->', resp)})

        // -------鼠标测距-------
        // mapUtil.mouseTool.measure.start()
        // mapUtil.mouseTool.measure.

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
