/* global utils */
var injector = (function () {
    function Injector() {

        var self = this, registered = {}, string = 'string', func = 'function';

        function prepareArgs(fn, locals, scope) {
            if (!fn.$inject) {
                fn.$inject = $getInjectionArgs(fn);
            }
            var args = fn.$inject ? fn.$inject.slice() : [];

            utils.each.call({all:true}, args, getInjection, locals, scope);
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
            return fn.apply(scope, prepareArgs(fn, locals, scope));
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

        function getInjection(type, index, list, locals, scope) {
            var result, cacheValue;
            // locals need to check first so they can override.
            if (locals && locals[type]) {
                result = locals[type];
            } else if ((cacheValue = self.get(type)) !== undefined) {
                result = cacheValue;
            }
            if (result instanceof Array && typeof result[0] === string && typeof result[result.length - 1] === func) {
                result = invoke(result.concat(), scope);
            }
            list[index] = result;
        }

        function _get(name) {
            var value = registered[name.toLowerCase()];
            if(typeof value === func) {
                if(value.isClass) {
                    if(!value.instance) {
                        value.instance = instantiate(value);
                    }
                    return value.instance;
                }
            }
            return value;
        }

        function _set(name, value) {
            return (registered[name.toLowerCase()] = value);
        }

        self.set = _set;
        self.get = _get;
        self.invoke = invoke;
        self.instantiate = instantiate;
    }

    return function() {
        return new Injector();
    };
})();
