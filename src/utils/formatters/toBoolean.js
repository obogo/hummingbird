define('toBoolean', function () {
    return function(val) {
        var type = typeof val;
        switch (type) {
            case 'boolean':
                return val;
            case 'string':
                if (val === 'true') {
                    return true;
                }
                if (val === 'false') {
                    return false;
                }
        }
        return !!val;
    };
});