const path = require("path");
const { assemble, pipe, depend } = require("webpack-pipe");
// 入口配置
const entry = (config) => depend.merge({
    entry:{
        app: ["./src"],
    }
}, config);

// 输出配置
const output = (config) => depend.merge({
    output:{
        publicPath: "/public/",
        path: depend.tool.resolveAppPath("public/build"),
    }
}, config);

const resolve = (config) => depend.merge({
    resolve: {
        "modules": [
            "web_modules",
        ],
        alias: {
            "@": path.resolve(__dirname, '../src/'),
            "#": path.resolve(__dirname, '../web_modules/'),
        },
        extensions: [ '.tsx', '.ts', '.js', ".jsx" ],
    }
}, config);

const styledJsx = (config) => {
    config.module.rules = config.module.rules.map(rule => {
        if (rule.loader === "babel-loader"){
            // styled-jsx
            rule.options.plugins.push([
                "styled-jsx/babel",
                {
                    "vendorPrefixes": true,     // 为css自动添加前缀
                    "plugins": [
                        ["styled-jsx-plugin-sass",{sassOptions: {}}]
                    ]
                }
            ]);
            return rule;
        }

        return rule;
    });

    return config;
};


/**
 * 解决web-worker的加载问题
 * 依赖包"worker-loader",
 * 当前改loader被应用的包有:
 * geotiff
 * @param config
 */
const workerLoader = (config) => {
    const isProduction = (process.env.NODE_ENV === 'production');

    return depend.merge({
        module: {
            rules: [
                {
                    test: /\.worker\.js$/,
                    use: {
                        loader: 'worker-loader',
                        options: {
                            name: isProduction ? '[hash].decoder.worker.min.js' : '[hash].decoder.worker.js',
                            inline: true,
                            fallback: true,
                        },
                    },
                }
            ]
        },
        // node: {
        //     fs: 'empty',
        //     buffer: 'empty',
        //     http: 'empty',
        // },
    }, config)
}

/**
 * 组装webpack config
 * @return {*}
 */
module.exports = (pipeNodes = []) => {
    const config = assemble([
        ...pipeNodes,
        styledJsx,
        workerLoader,
        pipe.base,
        pipe.staticResource,
        pipe.css,
        pipe.scss,
        pipe.babelAntd,
        pipe.babelTsReact,

        pipe.miniCssExtractPlugin,
        pipe.provideReactPlugin,
        pipe.webpackbarPlugin,

        resolve,
        output,
        entry,
    ]);

    return config;
};
