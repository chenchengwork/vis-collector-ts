import React from 'react';
import { TypeMapUtil } from '#/MapOfLeaflet';

const MapControlBar: React.FC<{mapUtil: TypeMapUtil}> = ({mapUtil}) => {

    return (
        <div className="map-control">
            <div className="item" onClick={() => mapUtil.zoomIn()}>放大</div>
            <div className="line" />
            <div className="item" onClick={() => mapUtil.zoomOut()}>缩小</div>
            <div className="line" />
            <div className="item" onClick={() => mapUtil.reset()}>重置</div>

            {/*language=SCSS*/}
            <style jsx>{`
                .map-control{
                    display: flex;
                    align-items: center;
                    height: 35px;
                    background-color: #fff;
                     border-radius: 3px;
                     user-select: none;
                     .line{
                        height: 25px;
                        width: 1px;
                        background-color: #ccc;
                     }
                    .item{
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0px 10px;
                        height: 100%;
                        cursor: pointer;
                    }
                }
            `}</style>
        </div>
    )
};

export default MapControlBar;
