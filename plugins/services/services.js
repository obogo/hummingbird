/* global exports, dispatcher, crudify, http */
define('services', ['services.crudify', 'dispatcher', 'http'], function (crudify, dispatcher, http) {

    var rest = {};

    // set default content-type
    //http.defaults.headers['Content-Type'] = 'application/json;charset=UTF-8';
    if('!!contentType') {
        http.defaults.headers['Content-Type'] = '!!contentType'; //[string replacement]
    }

    dispatcher(rest);

    var resources = !!resources; //[string replacement]
    for (var i = 0; i < resources.length; i += 1) {
        crudify(rest, resources[i], resources[i].methods);
    }

    return rest;
});
