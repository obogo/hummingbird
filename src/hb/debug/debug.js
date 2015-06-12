internal('hb.debug', function() {
    var errors = {
        E0: '',
        E1: '',
        E2: '',
        E3: '',
        E4: '',
        E5: '',
        E6a: '',
        E6b: '',
        E7: '',
        E8: '',
        E9: '',
        E10: '',
        E11: '',
        E12: '',
        E13: ''
    };
    var fn = function() {};
    var statItem = {
        clear:fn,
        next:fn,
        inc:fn,
        dec:fn
    };
    var db = {log: fn, info: fn, warn: fn, error: fn, stat: function() {return statItem;}, getStats: fn, flushStats: fn};
    // they need to throw their number so we can find the error.
    // this may be helpful for scripts like capture so it can report the error
    // to the server when it is caught in production.
    for(var i in errors) {
        errors[i] = i;
    }
    return {
        register: function() {
            return db;
        },
        liveStats: fn,
        getStats: fn,
        logStats: fn,
        stats: fn,
        errors:errors
    };
});