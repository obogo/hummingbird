define('queryParams', function () {
    function queryParams(param) {
        var regex = /([^&=]+)=?([^&]*)/g;
        var match, store = {};

        var haystack = window.location.search || window.location.hash;
        haystack = haystack.substring(haystack.indexOf('?') + 1, haystack.length);

        while ((match = regex.exec(haystack))) {
            store[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
        }

        if(param) {
            return store[param];
        }
        return store;
    }

    return queryParams;
});