// we expect a $inject to be on the method.
(function () {

    var cache = utils.data.cache('$injectors');

    /**
     * inject
     * @deps functions.each
     * @param fn
     * @param scope
     * @param locals
     * @returns {*}
     */
    function inject(fn, scope, locals) {
        var f;
        // allow ["inst", function (inst) {...}] to be executed by just passing the array. it replaces $inject.
        if (fn instanceof Array) {
            f = fn.pop();
            f.$inject = fn;// the rest of the items in the array.
            fn = f;
        }
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

    utils.patterns.inject = inject;
    utils.patterns.inject.set = function (name, fn) {
        cache.set(name.toLowerCase(), fn);
    };
}());
