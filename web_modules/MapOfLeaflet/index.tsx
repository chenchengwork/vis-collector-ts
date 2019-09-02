import React, { useEffect, useRef, memo, createContext, useState } from 'react';
import PropTypes from 'prop-types';
import MapUtil, { MapUtilOpts } from "./MapUtil";

export const MapUtilCtx = createContext({} as MapUtil);
export type TypeMapUtil = MapUtil;

interface BaseMapProps {
    mapType: string;
    onMapLoaded?: (realMapUtil: MapUtil) => void;
    mapOptions?: MapUtilOpts;
    isFixed?: boolean;
    height?: string | number;
}

/**
 * 基础地图组件
 */
const BaseMap: React.FC<BaseMapProps> = memo(({children, mapOptions = {}, isFixed = true, height = "100%", onMapLoaded}) => {
    const [mapUtil, setMapUtil ] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if(!mapUtil){
            const realMapUtil = new MapUtil(containerRef.current, mapOptions);
            setMapUtil(realMapUtil);
            if(onMapLoaded) onMapLoaded(realMapUtil);
        }

        // 清理资源和副作用
        return () => {
            mapUtil && mapUtil.destroy();
        }
    }, [mapUtil]);

    const containerH = isFixed ? "100%": height;
    const containerP = isFixed ? "fixed": "absolute";

    return (
        <div style={{position: "relative", width: "100%", height: containerH}} >
            <div ref={containerRef} style={{ position: containerP, zIndex: 0,width: "100%", height: containerH}}></div>

            {mapUtil ?
                <MapUtilCtx.Provider value={mapUtil}>
                    <div style={{position: "absolute", zIndex: 10}}>
                        {children}
                    </div>
                </MapUtilCtx.Provider>
                : null
            }
        </div>
    )
});

BaseMap.propTypes = {
    mapOptions: PropTypes.object,
    onMapLoaded: PropTypes.func
};

export default BaseMap;


