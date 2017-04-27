/* global define */
define('rest.crudify', ['rest.resource', 'defer', 'http', 'inflection', 'extend'], function (resource, defer, http, inflection, extend) {

    var $methods = {};

    var onSuccess, onError;

    var capitalize = function (str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    };

    var trimSlashes = function (str) {
        return str.replace(/^\/?(.*?)\/?$/, '$1');
    };

    var singularizeCapitalize = function (str) {
        str = inflection.singularize(str) || str;
        str = capitalize(str);
        return str;
    };

    var requireParam = function (key, value) {
        if (typeof value === 'undefined') {
            throw new Error('Expected param ' + key + ' to be defined: ' + JSON.stringify(value));
        }
    };

    var requireId = function (value) {
        requireParam('id', value);
        var type = typeof value;
        if (!(type === 'number' || type === 'string')) {
            throw new Error('Expected param "id" to be "number" or "string": ' + JSON.stringify(value));
        }
    };

    var requireData = function (value) {
        requireParam('data', value);
        var type = typeof value;
        if (type !== 'object') {
            throw new Error('Expected param "data" to be "object": ' + JSON.stringify(value));
        }
    };

    $methods.all = function (name, options) {
        return function (params, opts) {
            params = extend({}, params, http.defaults.params);
            opts = extend({}, options, opts);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!options.withCredentials; //[string replacement]
            payload.url = resource({baseUrl: options.baseUrl}).resource(options.uri || name).params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.get(payload);
            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.create = function (name, options) {
        return function (data, params, opts) {
            // requireData(data);
            data = data || {};
            params = extend({}, params, http.defaults.params);
            opts = extend({}, options, opts);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!options.withCredentials; //[string replacement]
            payload.url = resource({baseUrl: options.baseUrl}).resource(options.uri || name).params(params).toUrl();
            payload.data = data;
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.post(payload);

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.get = function (name, options) {

        return function (id, params, opts) {

            requireId(id);

            params = extend({}, params, http.defaults.params);
            opts = extend({}, options, opts);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!options.withCredentials; //[string replacement]
            payload.url = resource({baseUrl: options.baseUrl}).resource(options.uri || name, id).params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.get(payload);

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.update = function (name, options) {
        var path = '';
        if(options.useGETPOSTonly === false) {
            path = 'update';
        }

        return function (id, data, params, opts) {
            requireId(id);
            requireData(data);

            params = extend({}, params, http.defaults.params);
            opts = extend({}, options, opts);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!options.withCredentials;
            payload.url = resource({baseUrl: options.baseUrl}).resource(options.uri || name, id).resource(path).params(params).toUrl();
            payload.data = data;
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            if(options.useGETPOSTonly === false) {
                http.post(payload);
            } else {
                http.put(payload);
            }
            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.delete = function (name, options) {
        var path = '';
        if(options.useGETPOSTonly === false) {
            path = 'delete';
        }

        return function (id, params, opts) {

            requireId(id);

            params = extend({}, params, http.defaults.params);
            opts = extend({}, options, opts);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!options.withCredentials; //[string replacement]
            payload.url = resource({baseUrl: options.baseUrl}).resource(options.uri || name, id).resource(path).params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;

            if(options.useGETPOSTonly === false) {
                http.post(payload);
            } else {
                http.delete(payload);
            }

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.count = function (name, options) {
        return function (params, opts) {
            params = extend({}, params, http.defaults.params);
            opts = extend({}, options, opts);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!options.withCredentials; //[string replacement]
            payload.url = resource({baseUrl: options.baseUrl}).resource(options.uri || name).resource('count').params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.get(payload);

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.exists = function (name, options) {
        return function (params, opts) {
            params = extend({}, params, http.defaults.params);
            opts = extend({}, options, opts);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!options.withCredentials; //[string replacement]
            payload.url = resource({baseUrl: options.baseUrl}).resource(options.uri || name).resource('exists').params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.get(payload);

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    return function (target, resource, options) {

        options = extend({}, resource, options);

        onSuccess = function (response) {
            target.fire('success', response);
        };

        onError = function (response) {
            target.fire('error', response);
        };

        var methods = resource.methods;
        if (!methods) {
            methods = 'all create get update delete exists count';
        }

        if (typeof methods === 'string') {
            methods = methods.split(' ');
        }

        var name = resource.name;
        var i;
        var methodName;
        if (name) { // if resource was defined
            // remove extra slashes
            name = trimSlashes(name);
            // format url
            var baseUrl = trimSlashes(resource.baseUrl || '');
            var resourceName = trimSlashes(resource.url || '') || name;
            var url = baseUrl + '/' + resourceName;
            // loop through methods and set them up
            for (i = 0; i < methods.length; i++) {
                methodName = methods[i];
                if ($methods.hasOwnProperty(methodName)) {
                    if (resource.syntax === 'camel') {
                        switch (methodName) {
                            case 'all':     // getResources
                                if (resource.methods && resource.methods.hasOwnProperty(methodName)) {
                                    target[resource.methods[methodName].name] = $methods[methodName](url, options);
                                } else {
                                    target['get' + capitalize(name)] = $methods[methodName](url, options);
                                }
                                break;
                            case 'create':  // createResource
                            case 'update':  // updateResource
                            case 'get':     // getResource
                            case 'delete':  // deleteResource
                                if (resource.methods && resource.methods.hasOwnProperty(methodName)) {
                                    target[resource.methods[methodName].name] = $methods[methodName](url, options);
                                } else {
                                    target[methodName + singularizeCapitalize(name)] = $methods[methodName](url, options);
                                }
                                break;
                            case 'count':   // getResourceCount
                                if (resource.methods && resource.methods.hasOwnProperty(methodName)) {
                                    target[resource.methods[methodName].name] = $methods[methodName](name);
                                } else {
                                    target['get' + singularizeCapitalize(name) + 'Count'] = $methods.get(url, options);
                                }
                                break;
                            case 'exists':  // getResourceExists
                                if (resource.methods && resource.methods.hasOwnProperty(methodName)) {
                                    target[resource.methods[methodName].name] = $methods[methodName](name);
                                } else {
                                    target['get' + singularizeCapitalize(name) + 'Exists'] = $methods.get(url, options);
                                }
                                break;
                            default:
                                target[methodName + capitalize(name)] = $methods[methodName](url, options);
                        }
                    } else {
                        target[name] = target[name] || {};
                        target[name][methodName] = $methods[methodName](url, options);
                    }
                }
            }
        } else { // otherwise we place it on the global namespace
            var methodOptions, path;
            methods = resource.methods;
            for (methodName in methods) {
                if (methods.hasOwnProperty(methodName)) {
                    var opts = extend({}, options, methods[methodName].options);
                    methodOptions = methods[methodName];
                    path = methodOptions.url || methodName;
                    switch (methodOptions.type.toUpperCase()) {
                        case 'POST':
                            target[methodName] = $methods.create(path, opts);
                            break;
                        case 'GET':
                            target[methodName] = $methods.all(path, opts);
                            break;
                        case 'PUT':
                            target[methodName] = $methods.update(path, opts);
                            break;
                        case 'DELETE':
                            target[methodName] = $methods.delete(path, opts);
                            break;
                    }
                }
            }
        }
    };
});
