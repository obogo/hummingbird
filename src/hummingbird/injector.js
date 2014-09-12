/* global app, helpers */
hummingbird.injector = (function () {
    function Injector() {

        var self = this, registered = {}, injector = {};

        function prepareArgs(fn, locals) {
            if (!fn.$inject) {
                fn.$inject = $getInjectionArgs(fn);
            }
            var args = fn.$inject ? fn.$inject.slice() : [];

            helpers.each(args, getInjection, locals);
            return args;
        }

        function functionOrArray(fn) {
            var f;
            if (fn instanceof Array) {
                f = fn.pop();
                f.$inject = fn;
                fn = f;
            }
            return fn;
        }

        function invoke(fn, scope, locals) {
            fn = functionOrArray(fn);
            return fn.apply(scope, prepareArgs(fn, locals));
        }

        function instantiate(fn, locals) {
            fn = functionOrArray(fn);
            return construct(fn, prepareArgs(fn, locals));
        }

        function construct(constructor, args) {
            function F() {
                return constructor.apply(this, args);
            }
            F.prototype = constructor.prototype;
            return new F();
        }

        function $getInjectionArgs(fn) {
            var str = fn.toString();
            return str.match(/\(.*\)/)[0].match(/([\$\w])+/gm);
        }

        function getInjection(type, index, list, locals) {
            var result, cacheValue = self.get(type);
            if (cacheValue !== undefined) {
                result = cacheValue;
            } else if (locals && locals[type]) {
                result = locals[type];
            }
            list[index] = result;
        }

        function _get(name) {
            return registered[name.toLowerCase()];
        }

        function _set(name, fn) {
            registered[name.toLowerCase()] = fn;
        }

        self.getInjection = getInjection;
        self.set = _set;
        self.get = _get;
        self.invoke = invoke;
        self.instantiate = instantiate;
    }

    return function() {
        return new Injector();
    };
})();
