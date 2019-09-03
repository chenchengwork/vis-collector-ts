import React, {useContext, useMemo, Fragment} from 'react';
import { observer } from 'mobx-react-lite';
import { MapUtilCtx } from "#/MapOfLeaflet";
import BaseWidget, { WidgetStore } from '@/components/app/BaseWidget'
import { EnumWidget, EnumWidgetType } from '../constants';



const EnumDynamicWidgets = [
    {
        type: EnumWidgetType.mapControlBar,
        Widget: require("./MapControlBar").default
    },
    {
        type: EnumWidgetType.test,
        Widget: () => <div style={{height: 100, width: 100, backgroundColor: "green"}} onClick={() => alert(111)}>22222</div>
    },
];

const Widgets: React.FC = () => {
    const mapUtil = useContext(MapUtilCtx);
    const widgetStore = useMemo(() => new WidgetStore(EnumWidget), []);
    const { isShowWidget, widgetTypeToVal } = widgetStore;
console.log('mapUtil->', mapUtil)
    return (
        <Fragment>
            {
                EnumDynamicWidgets.map(({type, Widget}) => {
                    if(isShowWidget(type)){
                        const {containerProps, widgetParams} = widgetTypeToVal.get(type);

                        return (
                            <BaseWidget key={type} widgetType={type} widgetStore={widgetStore} {...containerProps}>
                                <Widget mapUtil={mapUtil} widgetType={type} widgetStore={widgetStore} {...widgetParams} />
                            </BaseWidget>
                        )
                    }

                    return null;
                })
            }
        </Fragment>
    )
};


export default observer(Widgets);




