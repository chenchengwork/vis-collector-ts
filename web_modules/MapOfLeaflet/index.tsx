import React, { useEffect, useRef, memo, createContext, useState } from 'react';
import PropTypes from 'prop-types';
import MapUtil, { MapUtilOpts } from "./MapUtil";

export const MapUtilCtx = createContext({} as MapUtil);
export type TypeMapUtil = MapUtil;

interface BaseMapProps {
    onMapLoaded?: (realMapUtil: MapUtil) => void;
    mapOptions?: MapUtilOpts;
}

const defaultStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%"
};

/**
 * 基础地图组件
 */
const BaseMap: React.FC<BaseMapProps> = memo(({children, mapOptions = {},  onMapLoaded}) => {
    const [mapUtil, setMapUtil ] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if(!mapUtil){
            const realMapUtil = new MapUtil(containerRef.current, mapOptions);
            setMapUtil(realMapUtil);
            onMapLoaded && onMapLoaded(realMapUtil);
        }

        // 清理资源和副作用
        return () => {
            mapUtil && mapUtil.destroy();
        }
    }, [mapUtil]);

    return (
        <div style={defaultStyle}>
            <div style={{zIndex: 0, width: "100%", height: "100%", position: "absolute"}}>
                <div ref={containerRef} style={{zIndex: 0, width: "100%", height: "100%"}}></div>
            </div>

            {mapUtil ?  <MapUtilCtx.Provider value={mapUtil}>{children}</MapUtilCtx.Provider> : null}
        </div>
    )
});


BaseMap.propTypes = {
    mapOptions: PropTypes.object,
    onMapLoaded: PropTypes.func
};

export default BaseMap;


