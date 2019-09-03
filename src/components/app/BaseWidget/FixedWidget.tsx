import React from 'react';
import { TypePosition, TypeStringOrNum, isUndefined } from './util';

interface Position {
    left?: TypeStringOrNum;
    right?: TypeStringOrNum;
    top?: TypeStringOrNum;
    bottom?: TypeStringOrNum;
}

const FixedWidget: React.FC<{position: TypePosition}> = ({position, children}) => {

    return (
        <div style={{position: "absolute", ...formatPosition(position)}}>
            {children}
        </div>
    )
};

export default FixedWidget;


const formatPosition = (position: TypePosition) => {
    const newPosition: Position = {};
    const { leftX, topY, rightX, bottomY } = position;

    if(!isUndefined(leftX)) newPosition.left = leftX;
    if(!isUndefined(topY)) newPosition.top = topY;
    if(!isUndefined(rightX)) newPosition.right = rightX;
    if(!isUndefined(bottomY)) newPosition.bottom = bottomY;

    return newPosition;
};
