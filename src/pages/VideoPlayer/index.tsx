import React from 'react';
import Video from '#/VideoPlayer';

const VideoPlayer: React.FC = () => {

    return (
        <div>
            <Video
                url="rtmp://58.200.131.2:1935/livetv/hunantv"
                videoAttributes={{
                    height: 500,
                    width: 500
                }}
            />
        </div>
    )
};

export default VideoPlayer;
