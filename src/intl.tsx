import React from 'react';
import { ConfigProvider } from "antd";

const lang = {
    zh: {
        antdLocale: require('antd/lib/locale-provider/zh_CN').default,
        intlLocale: "zh",

        // TODO 注释掉,关闭国际化模式
        // intlMessages: require('../locales/zh.json'),
    },

};


export default function LocaleWrapper({children}: {children: React.ReactNode}){
    // TODO 打开下面的注释, 开启非国际化模式
    const { antdLocale, intlLocale } = lang["zh"];
    return (
        <ConfigProvider locale={antdLocale}>
            {children}
        </ConfigProvider>
    );
}


