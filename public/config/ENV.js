/**
 * 配置文件
 * @type {{apiDomain}}
 */
var ENV = (function () {
    var apiDomain = "http://localhost:9000";
    var rootPath = "/";

    return {
        rootPath: rootPath,                                 // 根路由前缀
        apiDomain: apiDomain,
        login: {}
    }
})();
