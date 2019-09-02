import React, { Fragment } from 'react';
import { MainContent, MainHeader } from '@/layouts/MainLayout'
import Map from './Map';

const Screen = () => {

    return (
        <Fragment>
            {/*<MainHeader title="可视化列表" />*/}
            <MainContent isShowMainHeader={false}>
                <Map />
            </MainContent>
        </Fragment>
    )
}

Screen.propTypes = {

}

export default Screen;
