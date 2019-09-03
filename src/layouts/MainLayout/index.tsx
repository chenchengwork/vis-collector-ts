import React, { useState } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';
import { Layout } from 'antd';
import prompt from '@/utils/prompt';

import { UrlToExtraInfoMap, getLeftMenu, getMenus, isRemoveLeftMenu } from './menuUtil';
import { logout } from '@/services/auth';
import EnumRouter from '@/constants/EnumRouter';
import { LayoutCtx } from './layoutContext';
import {theme} from './theme';

import MenuHeader from './MenuHeader';
import MenuLeft from './MenuLeft';

import MainHeader from './MainHeader';
import MainContent from "./MainContent"
export {MainHeader}
export {MainContent}
export {LayoutCtx}

const MainLayout: React.FC<RouteComponentProps> = (props) => {

    /**
     * 获取左侧菜单宽度
     * @param {bool} leftMenuCollapsed
     * @return {number}
     */
    const getLeftMenuWidth = (leftMenuCollapsed: boolean) => {
        // 是否移除左侧菜单
        const currentUrl = props.match.path;
        if(isRemoveLeftMenu(currentUrl)) return 0;

        return leftMenuCollapsed ? 80 : 200;
    };

    const [leftMenuCollapsed, setLeftMenuCollapsed] = useState(!UrlToExtraInfoMap[props.match.path]);
    const [appMenuLeftWidth, setAppMenuLeftWidth] = useState(getLeftMenuWidth(leftMenuCollapsed));

    /**
     * 退出登录
     */
    const doLogout = ():any => prompt.confirm(
        () =>  logout().then(() => props.history.push(EnumRouter.login), resp => prompt.error(resp.msg)),
        {title: "确定退出登录?"}
    );

    /**
     * 左侧菜单的收起和关闭
     */
    const handleLeftMenuCollapse = () => {
        const newCollapsed = !leftMenuCollapsed;
        setLeftMenuCollapsed(newCollapsed);
        setAppMenuLeftWidth(getLeftMenuWidth(newCollapsed))
    };

    const currentUrl = props.match.path;

    return (
        <LayoutCtx.Provider value={{handleLeftMenuCollapse, leftMenuCollapsed, appMenuLeftWidth, theme}}>
            <Layout style={{height: "100%"}}>
                {/*头部菜单*/}
                <MenuHeader
                    currentUrl={currentUrl}
                    menus={getMenus()}
                    logout={doLogout}
                />

                {/*左侧菜单*/}
                <MenuLeft
                    currentUrl={currentUrl}
                    leftMenu={getLeftMenu(currentUrl)}
                    leftWidth={appMenuLeftWidth}
                    collapsed={leftMenuCollapsed}
                    onLeftMenuCollapse={handleLeftMenuCollapse}
                />

                {/*内容区域*/}
                <Layout style={{ marginLeft: getLeftMenuWidth(leftMenuCollapsed), height: "100%" }}>
                    {props.children}
                </Layout>
            </Layout>
        </LayoutCtx.Provider>
    )
};



export default withRouter(MainLayout)
