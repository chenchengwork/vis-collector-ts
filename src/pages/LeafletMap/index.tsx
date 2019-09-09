import React, { Fragment } from 'react';
import { MainContent, MainHeader } from '@/layouts/MainLayout'
import Map from './Map';

const LeafletMap = () => {

    return (
        <Fragment>
            <MainHeader title="Leaflet地图" />
            <MainContent isShowMainHeader={true}>
                <Map />
            </MainContent>
        </Fragment>
    )
};

export default LeafletMap;
