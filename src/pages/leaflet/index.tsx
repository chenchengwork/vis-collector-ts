import React, { Fragment, useEffect, useRef } from 'react';
import { MainContent, MainHeader } from '@/layouts/MainLayout'
import Map from './Map';

const Screen = () => {
    const divRef: React.RefObject<HTMLDivElement> = useRef();

    useEffect(() => {
        console.log("divRef.current.clientWidth->", divRef.current.clientWidth);
        console.log("divRef.current.clientHeight->", divRef.current.clientHeight);
    });

    return (
        <Fragment>
            <MainHeader title="可视化列表" rightRender={<div>12121</div>}/>
            <MainContent isShowMainHeader={true}>
                <div ref={divRef} style={{height: "100%"}}>
                    <div style={{border: "1px solid red"}}>2222222222</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                    <div style={{border: "1px solid red"}}>111111</div>
                </div>
                {/*<Map />*/}
            </MainContent>
        </Fragment>
    )
}

Screen.propTypes = {

}

export default Screen;
