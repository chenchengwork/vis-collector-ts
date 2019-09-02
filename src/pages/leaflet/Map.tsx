import React, { useContext } from 'react';
import BaseMap, { TypeMapUtil } from "#/MapOfLeaflet";
import { request } from '@/utils/T';
import BaseWidget, { WidgetStore } from '@/components/app/BaseWidget'
import { EnumWidgetData, EnumWidgetType } from './constants';

const EnumDynamicWidgets = [
    {
        type: EnumWidgetType.heightLine,
        Widget: () => <div style={{height: 100, width: 100, backgroundColor: "red"}}>111111</div>
    },
];


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


        // ------
        // mapUtil.addWindyLayer(require("./windy_10.json"));

        request.get("data/leaflet/windy/windy_10.json").then((resp) => {
            console.log(resp);
            mapUtil.addWindyLayer(resp.data);
        }, (resp) => console.log(resp.msg))

    };
    const widgetStore = new WidgetStore(EnumWidgetData);
    const { isShowWidget, widgetTypeToVal } = widgetStore;

    return (
        <BaseMap
            mapType="leaflet"
            mapOptions={{
                zoom: 4,
                baseLayerTMS: "Google.Normal.Map",
            }}
            isFixed={true}
            onMapLoaded={handleMapLoaded}
        >
            {/*<QueryType />*/}
            {EnumDynamicWidgets.map(({type, Widget}) => {
                if(isShowWidget(type)){
                    const {containerProps, widgetParams} = widgetTypeToVal.get(type);

                    return (
                        <BaseWidget key={type} widgetType={type} widgetStore={widgetStore} {...containerProps}>
                            <Widget widgetType={type} widgetStore={widgetStore} {...widgetParams} />
                        </BaseWidget>
                    )
                }

                return null;
            })}
        </BaseMap>
    )
};

export default Map;
