// we expect a $inject to be on the method.
(function () {

    var cache = data.cache('$injectors');

    /**
     * inject
     * @deps functions.each
     * @param fn
     * @param scope
     * @param locals
     * @returns {*}
     */
    function inject(fn, scope, locals) {
        if (!fn.$inject) {
            fn.$inject = getInjectionArgs(fn);
        }
        var args = fn.$inject.slice();
        each(args, getInjection, locals);
        return fn.apply(scope, args);
    }

    function getInjectionArgs(fn) {
        var str = fn.toString();
        return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
    }

    function getInjection(type, index, list, locals) {
        var result, cacheValue = cache.get(type.toLowerCase());
        if (cacheValue !== undefined) {
            result = cacheValue;
        } else if (locals && locals[type]) {
            result = locals[type];
        }
        list[index] = result;
    }

    patterns.inject = inject;
    patterns.inject.register = function (name, fn) {
        cache.set(name.toLowerCase(), fn);
    };
}());
