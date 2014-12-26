append('plugins.http', ['framework', 'http'], function (framework, http) {
    return framework.plugins.http = function (module) {
        return module.injector.val('http', http);
    };
});
