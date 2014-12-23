var throwErrors = true,
    init = true,
    unresolved = [],
    internalCache = {},
    required = [];

function saveDefinition(key, dependencies, func, cache) {
    if (throwErrors && cache[key]) {
        throw new Error(key + ' is already in use.');
    }
    if (typeof dependencies === 'function') {
        cache[key] = dependencies.call(exports);
    } else {
        var fn = func;
        fn.$inject = dependencies;
        unresolved.push({key: key, fn: fn, cache: cache})
    }
}

function define(key, dependencies, func) {
    saveDefinition(key, dependencies, func, exports);
}

function internal(key, dependencies, func) {
    saveDefinition(key, dependencies, func, internalCache);
}

function require() {
    var args = Array.prototype.slice.call(arguments);
    var fn = args.pop();
    fn.$inject = args;

    unresolved.push({fn: fn, cache: exports});
    if (!init) {
        resolveAll();
    }
}

function acquire(name) {
    debugger;
    return exports[name] || internalCache[name];
}

function resolveDependencies(list) {
    var i, len = list.length, ary = list.slice(0);
    for (i = 0; i < len; i += 1) {
        ary[i] = acquire(ary[i]);
        if (!ary[i]) {
            return false;
        }
    }
    return ary;
}

function resolve(item) {
    var result;
    var args = resolveDependencies(item.fn.$inject);
    if (item && item.fn.$inject && args) {
        result = item.fn.apply(exports, args);
        if (item.key) {
            item.cache[item.key] = result;
        }
        return true;
    }
    return false;
}

function resolveAll() {
    var i = 0, len = unresolved.length;
    while (unresolved.length && i < unresolved.length) {
        console.log("resolve", unresolved[i]);
        if (resolve(unresolved[i])) {
            unresolved.splice(i, 1);
            i = 0;
        } else {
            i += 1;
        }
    }
}