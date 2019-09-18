import React, {useContext, useMemo, Fragment, useEffect} from 'react';
import { observer } from 'mobx-react-lite';
import { MapUtilCtx } from "#/MapOfLeaflet";
import BaseWidget, { WidgetStore } from '@/components/app/BaseWidget';
import { mapCommandDispatcher } from '@/layouts/MainLayout';
import { EnumWidget } from '../constants';
import EnumDynamicWidgets from './EnumDynamicWidgets';


const Widgets: React.FC = () => {
    const mapUtil = useContext(MapUtilCtx);
    const widgetStore = useMemo(() => new WidgetStore(EnumWidget), []);
    const { isShowWidget, widgetTypeToVal } = widgetStore;

    useEffect(() => {
        const listenFn = (mapCommand:string) => {
            console.log("mapCommand->", mapCommand)
        };

        mapCommandDispatcher.listen(listenFn);

        return () => mapCommandDispatcher.off(listenFn);
    }, []);

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




