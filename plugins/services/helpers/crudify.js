internal('services.crudify', ['services.resource', 'defer', 'http', 'inflection'], function (resource, defer, http, inflection) {

    var $baseUrl = "!!baseUrl";
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

    $methods.all = function (name) {
        return function (params) {
            var deferred = defer();
            var payload = {};
            payload.credentials = !!withCredentials; //[string replacement]
            payload.url = resource({baseUrl: $baseUrl}).resource(name).params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.get(payload);
            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.create = function (name) {
        return function (data, params) {

            requireData(data);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!withCredentials; //[string replacement]
            payload.url = resource({baseUrl: $baseUrl}).resource(name).params(params).toUrl();
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

    $methods.get = function (name) {
        return function (id, params) {

            requireId(id);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!withCredentials; //[string replacement]
            payload.url = resource({baseUrl: $baseUrl}).resource(name, id).params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.get(payload);

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.update = function (name) {
        return function (id, data, params) {

            requireId(id);
            requireData(data);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!withCredentials; //[string replacement]
            payload.url = resource({baseUrl: $baseUrl}).resource(name, id).params(params).toUrl();
            payload.data = data;
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.put(payload);
            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.delete = function (name) {
        return function (id, params) {

            requireId(id);

            var deferred = defer();
            var payload = {};
            payload.credentials = !!withCredentials; //[string replacement]
            payload.url = resource({baseUrl: $baseUrl}).resource(name, id).params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.delete(payload);

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.count = function (name) {
        return function (params) {
            var deferred = defer();
            var payload = {};
            payload.credentials = !!withCredentials; //[string replacement]
            payload.url = resource({baseUrl: $baseUrl}).resource(name).resource('count').params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.get(payload);

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    $methods.exists = function (name) {
        return function (params) {
            var deferred = defer();
            var payload = {};
            payload.credentials = !!withCredentials; //[string replacement]
            payload.url = resource({baseUrl: $baseUrl}).resource(name).resource('exists').params(params).toUrl();
            payload.success = deferred.resolve;
            payload.error = deferred.reject;
            http.get(payload);

            var promise = deferred.promise;

            promise.success(onSuccess);
            promise.error(onError);

            return promise;
        };
    };

    return function (target, options) {

        onSuccess = function (response) {
            target.fire('rest::success', response);
        };

        onError = function (response) {
            target.fire('rest::error', response);
        };

        var methods = options.methods;
        if (!methods) {
            methods = 'all create get update delete exists count';
        }

        if (typeof methods === 'string') {
            methods = methods.split(' ');
        }

        var name = options.name;
        var i;
        var methodName;
        if (name) { // if resource was defined
            // remove extra slashes
            name = trimSlashes(name);
            // format url
            var baseUrl = trimSlashes(options.baseUrl || '');
            var resourceName = trimSlashes(options.url || '') || name;
            var url = baseUrl + '/' + resourceName;
            // loop through methods and set them up
            for (i = 0; i < methods.length; i++) {
                methodName = methods[i];
                if ($methods.hasOwnProperty(methodName)) {
                    if (options.syntax === 'camel') {
                        switch (methodName) {
                            case 'all':     // getResources
                                if (options.methods && options.methods.hasOwnProperty(methodName)) {
                                    target[options.methods[methodName].name] = $methods[methodName](url);
                                } else {
                                    target['get' + capitalize(name)] = $methods[methodName](url);
                                }
                                break;
                            case 'create':  // createResource
                            case 'update':  // updateResource
                            case 'get':     // getResource
                            case 'delete':  // deleteResource
                                if (options.methods && options.methods.hasOwnProperty(methodName)) {
                                    target[options.methods[methodName].name] = $methods[methodName](url);
                                } else {
                                    target[methodName + singularizeCapitalize(name)] = $methods[methodName](url);
                                }
                                break;
                            case 'count':   // getResourceCount
                                if (options.methods && options.methods.hasOwnProperty(methodName)) {
                                    target[options.methods[methodName].name] = $methods[methodName](name);
                                } else {
                                    target['get' + singularizeCapitalize(name) + 'Count'] = $methods.get(url);
                                }
                                break;
                            case 'exists':  // getResourceExists
                                if (options.methods && options.methods.hasOwnProperty(methodName)) {
                                    target[options.methods[methodName].name] = $methods[methodName](name);
                                } else {
                                    target['get' + singularizeCapitalize(name) + 'Exists'] = $methods.get(url);
                                }
                                break;
                            default:
                                target[methodName + capitalize(name)] = $methods[methodName](url);
                        }
                    } else {
                        target[name] = target[name] || {};
                        target[name][methodName] = $methods[methodName](url);
                    }
                }
            }
        } else { // otherwise we place it on the global namespace
            var methodOptions, path;
            methods = options.methods;
            for (methodName in methods) {
                if (methods.hasOwnProperty(methodName)) {
                    methodOptions = methods[methodName];
                    path = methodOptions.url || methodName;
                    switch (methodOptions.type.toUpperCase()) {
                        case 'POST':
                            target[methodName] = $methods.create(path);
                            break;
                        case 'GET':
                            target[methodName] = $methods.all(path);
                            break;
                        case 'PUT':
                            target[methodName] = $methods.update(path);
                            break;
                        case 'DELETE':
                            target[methodName] = $methods.delete(path);
                            break;
                    }
                }
            }
        }
    };
});
