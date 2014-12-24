internal('string.trim', function () {
    /* global validators */
    // native trim is way faster: http://jsperf.com/angular-trim-test
    // but IE doesn't have it... :-(
    if (!String.prototype.trim) {
        return function (value) {
            return utils.validators.isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
        };
    }
    return true;
});
