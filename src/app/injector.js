function Injector() {
    'use strict';
    var self = this, registered = {}, injector = {};

    function invoke(fn, scope, locals) {
        var f;
        if (fn instanceof Array) {
            f = fn.pop();
            f.$inject = fn;
            fn = f;
        }
        if (!fn.$inject) {
            fn.$inject = getInjectionArgs(fn);
        }
        var args = fn.$inject ? fn.$inject.slice() : [];
        helpers.each(args, getInjection, locals);
        return fn.apply(scope, args);
    }

    function getInjectionArgs(fn) {
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

    function getRegistered() {
        return registered;
    }

    self.invoke = invoke;
    self.getInjection = getInjection;
    self.getRegistered = getRegistered;
    self.set = function (name, fn) {
        registered[name.toLowerCase()] = fn;
    };
    self.get = function (name) {
        return registered[name.toLowerCase()];
    };
}