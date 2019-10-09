import React, {useEffect, memo, useRef, VideoHTMLAttributes} from 'react';
import "video.js/dist/video-js.css";
import videojs, {VideoJsPlayerOptions} from "video.js";
import "videojs-flash";

interface VideoProps {
    url: string;
    options?: VideoJsPlayerOptions;
    onError?: (...args: any[]) => void;
    videoAttributes?:VideoHTMLAttributes<HTMLVideoElement>;
}

const defaultVideoAttributes = {
    controls: true,     // 是否显示控制器
    autoPlay: true,     // 是否自动播放
    width: 640,
    height: 360,
};

//可以测试的rtmp流媒体服务:
// https://blog.csdn.net/qq_23851665/article/details/84026015
// https://blog.csdn.net/renhui1112/article/details/70141725
const Video: React.FC<VideoProps> = memo(({url, options = {}, onError, videoAttributes}) => {
    const videoRef = useRef(null);

    useEffect(() => {
        const player = videojs(videoRef.current,Object.assign({
            notSupportedMessage : '您的浏览器没有安装或开启Flash,戳我开启！',
            techOrder : ["flash"],
            autoplay : true,        // 自动播放
            flash: {
                swf: require("./video-js.swf")
            }
        }, options));

        if(onError) player.on("error", onError);

        return () => player.dispose();
    }, []);

    return (
        <video
            ref={videoRef}
            className="video-js vjs-default-skin vjs-big-play-centered"
            {...Object.assign({}, defaultVideoAttributes, videoAttributes || {})}
        >
            <source src={url}></source>

            <p className="vjs-no-js">
                To view this video please enable JavaScript, and consider upgrading to a web browser that
                <a href="http://videojs.com/html5-video-support/" target="_blank">
                    supports HTML5 video
                </a>
            </p>
        </video>
    )
});


export default Video;
