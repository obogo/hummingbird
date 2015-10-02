internal('queryParams', function () {
    function queryParams(queryString) {
        var regex = /([^&=]+)=?([^&]*)/g;
        var match, store = {};

        var haystack = queryString || window.location.search || window.location.hash;
        haystack = haystack.substring(haystack.indexOf('?') + 1, haystack.length);

        while ((match = regex.exec(haystack))) {
            store[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
        }

        return store;
    }

    return queryParams;
});