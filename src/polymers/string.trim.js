(function () {
    // native trim is way faster: http://jsperf.com/angular-trim-test
    // but IE doesn't have it... :-(
    // TODO: we should move this into IE/ES5 polyfill
    if (!String.prototype.trim) {
        return function (value) {
            return validators.isString(value) ? value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') : value;
        };
    }
    return function (value) {
        return validators.isString(value) ? value.trim() : value;
    };
}());