/* global exports, dispatcher, crudify, http */
define('rest', ['dispatcher', 'http', 'http.mock'], function (dispatcher, http, mock) {

    var rest = {};

    // set default content-type
    http.defaults.headers['Content-Type'] = 'application/json;charset=UTF-8';

    dispatcher(rest);

    rest.mock = mock;
    rest.registerMock = mock.create;

    var resources = !!resources; //[string replacement]
    for (var i = 0; i < resources.length; i += 1) {
        crudify(exports, resources[i], resources[i].methods);
    }

    return rest;
});
