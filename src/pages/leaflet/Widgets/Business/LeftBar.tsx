import React from 'react';
import { TypeMapUtil } from '#/MapOfLeaflet';
import { request } from '@/utils/T';

const LeftBar: React.FC<{mapUtil: TypeMapUtil}> = ({ mapUtil }) => {

    return (
        <div className="map-control">
            <div className="item" onClick={() => mapUtil.addImageOverLayer("https://legacy.lib.utexas.edu/maps/historical/newark_nj_1922.jpg", [[40.712216, -74.22655], [40.773941, -74.12544]], {}, true)}>贴图</div>
            <div className="line" />
            <div
                className="item"
                onClick={() => {
                    request.get("data/leaflet/windy/windy_10.json").then((resp) => {
                        mapUtil.addWindyLayer(resp.data);
                    }, (resp) => console.error(resp.msg))
                }}
            >风场</div>


            {/*language=SCSS*/}
            <style jsx>{`
                .map-control{
                    display: flex;
                    flex-flow: column;
                    align-items: center;
                    width: 45px;
                    background-color: #fff;
                     border-radius: 3px;
                     user-select: none;
                     .line{
                        height: 1px;
                        width: 25px;
                        background-color: #ccc;
                     }
                    .item{
                        display: flex;
                        flex-flow: row;
                        align-items: center;
                        justify-content: center;
                        padding: 5px 10px;
                        height: 100%;
                        cursor: pointer;
                    }
                }
            `}</style>
        </div>
    )
};

export default LeftBar
