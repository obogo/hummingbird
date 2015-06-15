//! pattern /hb\-errors-debug\b/
internal('hb.debug.dev', ['hb.debug', 'hb.debug.logs', 'hb.debug.stats'], function (debug, debugLogs, debugStats) {
    //TODO: there are strings that haven't been replaced with these yet.
    var errors = debug.errors;
    errors.E1 = 'Trying to assign multiple scopes to the same dom element is not permitted.',
    errors.E2 = 'Unable to find element',
    errors.E3 = 'Exceeded max digests of ',
    errors.E4 = 'parent element not found in %o',
    errors.E5 = 'property is not of type object',
    errors.E6a = 'Error evaluating: "',
    errors.E6b = '" against %o',
    errors.E7 = '$digest already in progress.',
    errors.E8 = 'Name required to instantiate module',
    errors.E9 = 'Injection not found for ',
    errors.E10 = 'This element has already been compiled',
    errors.E11 = 'Watch cannot have a function of null or undefined',
    errors.E12 = 'parent element not found in %o'

    debugLogs(debug);// add log debug functionality to it.
    debugStats(debug);// add stat debug functionality to it.
    return debug;
});
