/* global plugins, exports, utils */
plugins.http = function (module) {
    return module.injector.val('http', utils.ajax.http);
};
