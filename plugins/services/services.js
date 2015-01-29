/* global exports, dispatcher, crudify, http */
define('services', ['services.crudify', 'dispatcher', 'http', 'http.interceptor'], function (crudify, dispatcher, http, httpInterceptor) {

    var rest = {};

    // set default content-type
    http.defaults.headers['Content-Type'] = 'application/json;charset=UTF-8';

    dispatcher(rest);

    rest.enableInterceptor = function (value) {
        http.interceptor = value ? httpInterceptor : null;
    };
    rest.intercept = httpInterceptor.create;

    var resources = !!resources; //[string replacement]
    for (var i = 0; i < resources.length; i += 1) {
        crudify(rest, resources[i], resources[i].methods);
    }

    return rest;
});
