import React, { Fragment, useEffect, useRef } from 'react';
import { MainContent, MainHeader } from '@/layouts/MainLayout'

const Screen = () => {
    return (
        <Fragment>
            <MainHeader title="mapboxgl地图" />
            <MainContent isShowMainHeader={true}>

            </MainContent>
        </Fragment>
    )
}

Screen.propTypes = {

}

export default Screen;
