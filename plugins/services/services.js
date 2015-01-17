/* global exports, dispatcher, crudify, http */
define('services', ['services.crudify', 'dispatcher', 'http', 'http.mock'], function (crudify, dispatcher, http, mock) {

    var rest = {};

    // set default content-type
    http.defaults.headers['Content-Type'] = 'application/json;charset=UTF-8';

    dispatcher(rest);

    rest.mock = mock;
    rest.registerMock = mock.create;

    var resources = !!resources; //[string replacement]
    for (var i = 0; i < resources.length; i += 1) {
        crudify(rest, resources[i], resources[i].methods);
    }

    return rest;
});
