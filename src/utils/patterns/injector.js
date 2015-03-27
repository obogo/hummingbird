/* global utils */
define('injector', ['isFunction', 'toArray', 'functionArgs'], function (isFunction, toArray, functionArgs) {

    var string = 'string', func = 'function', proto = Injector.prototype;

    function functionOrArray(fn) {
        var f;
        if (fn instanceof Array) {
            fn = fn.concat();// clone it.
            f = fn.pop();
            f.$inject = fn;
            fn = f;
        }
        return fn;
    }

    function construct(constructor, args) {
        function F() {
            return constructor.apply(this, args);
        }

        F.prototype = constructor.prototype;
        return new F();
    }

    function Injector() {
        this.registered = {};
        this.preProcessor = null;// this allows for custom manipulation prior to invoke/instantiate
    }

    // Define API
    // get/set values.
    proto.val = function (name, value) {
        var n = name.toLowerCase(), override;
        if (value !== undefined) {
            this.registered[n] = value;
        } else if (this.preProcessor) {// only process on a get.
            override = this.preProcessor(name, this.registered[n]);
            if (override !== undefined) {
                this.registered[n] = override;
            }
        }
        return this.registered[n];
    };

    // determine the args and then execute the function with it's injectable items
    proto.invoke = function (fn, scope, locals) {
        fn = functionOrArray(fn);
        return fn.apply(scope, this.prepareArgs(fn, locals, scope));
    };

    // create a new instance
    proto.instantiate = function (fn, locals) {
        fn = functionOrArray(fn);
        return construct(fn, this.prepareArgs(fn, locals));
    };

    // pass an array or fn and get all of its args back as injectable items.
    proto.prepareArgs = function (fn, locals, scope) {
        if (!fn.$inject) {
            fn.$inject = functionArgs(fn);
        }
        var args = fn.$inject ? fn.$inject.slice() : [], i, len = args.length;
        for (i = 0; i < len; i += 1) {
            this.getInjection(args[i], i, args, locals, scope);
        }
        return args;
    };
    // get the args of a fn.
    proto.getArgs = functionArgs;

    // handy externally for passing in a scope as the locals so it gets properties right off the scope.
    proto.getInjection = function (type, index, list, locals, scope) {
        var result, cacheValue;
        // locals need to check first so they can override.
        if (locals && locals[type]) {
            result = locals[type];
        } else if ((cacheValue = this.val(type)) !== undefined) {
            result = cacheValue;
        }
        if (result === undefined) {
            console.warn("Injection not found for " + type);// leave until reject is fixed.
            throw new Error("Injection not found for " + type);
        }
        if (result instanceof Array && typeof result[0] === string && typeof result[result.length - 1] === func) {
            result = this.invoke(result.concat(), scope);
        }
        list[index] = result;
    };

    return function () {
        var injector = new Injector();
        if (arguments.length && isFunction(arguments[0])) {
            return injector.invoke.apply(injector, toArray(arguments));
        }
        return injector;
    };

});

