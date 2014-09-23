/* global plugins, exports, utils */
plugins.http = function (module) {
    return module.injector.set('http', utils.ajax.http);
};
