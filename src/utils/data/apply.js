define('apply', function () {
    return function (func, scope, args) {
        args = args || [];
        switch (args.length) {
            case 0:
                return func.call(scope);
            case 1:
                return func.call(scope, args[0]);
            case 2:
                return func.call(scope, args[0], args[1]);
            case 3:
                return func.call(scope, args[0], args[1], args[2]);
            case 4:
                return func.call(scope, args[0], args[1], args[2], args[3]);
            case 5:
                return func.call(scope, args[0], args[1], args[2], args[3], args[4]);
            case 6:
                return func.call(scope, args[0], args[1], args[2], args[3], args[4], args[5]);
        }
        return func.apply(scope, args);
    };
})