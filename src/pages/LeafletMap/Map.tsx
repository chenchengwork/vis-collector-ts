import React from 'react';
import { observer } from 'mobx-react-lite';
import BaseMap from "#/MapOfLeaflet";
import Widgets from './Widgets';

const mapOptions = {
    zoom: 4,
    baseLayerTMS: "Google.Normal.Map",
};

const Map: React.FC = () => {

    return (
        <BaseMap mapOptions={mapOptions}>
            <Widgets />
        </BaseMap>
    )
};

export default observer(Map);
