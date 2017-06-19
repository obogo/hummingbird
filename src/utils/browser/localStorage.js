define('localStorage', function () {

    function LocalStorage(prefix) {
        this.setPrefix(prefix);
    }

    var LocalStorageProto = LocalStorage.prototype;
    LocalStorageProto.setPrefix = function (prefix) {
        this.prefix = prefix ? prefix + ':' : '';
    };

    // Checks the browser to see if local storage is supported
    LocalStorageProto.isSupported = function () {
        try {
            return ('localStorage' in window && window.localStorage !== null);
        } catch (e) {
            return false;
        }
    };

    LocalStorageProto.isEnabled = function () {
        try {
            var has = this.isSupported(), key = '__localStorageSupportTest__', r;
            if (has) {
                // now we need to determine if it works. Because Safari Private Browsing will say it is there
                // but it won't work.
                r = Date.now().toString();
                localStorage.setItem(key, r);
                return localStorage.getItem(key) === r;
            }
        } catch (e) {
            return false;
        }
    };

    // Directly adds a value to local storage
    // If local storage is not available in the browser use cookies
    // Example use: localStorage.add('library','angular');
    LocalStorageProto.set = function (key, value) {

        var prefix = this.prefix;

        // If this browser does not support local storage use cookies
        if (!this.isSupported()) {
            return false;
        }

        // 0 and "" is allowed as a value but let's limit other falsey values like "undefined"
        if (!value && value !== 0 && value !== "") {
            return false;
        }

        try {
            localStorage.setItem(prefix + key, JSON.stringify(value));
        } catch (e) {
            return false;
        }
        return true;
    };

    // legacy support
    LocalStorageProto.put = LocalStorageProto.set;

    // Directly get a value from local storage
    // Example use: localStorage.get('library'); // returns 'angular'
    LocalStorageProto.get = function (key) {
        var prefix = this.prefix;

        if (!this.isSupported()) {
            return false;
        }

        var item = localStorage.getItem(prefix + key);
        if (!item) {
            return null;
        }
        return JSON.parse(item);
    };

    // Remove an item from local storage
    // Example use: localStorage.remove('library'); // removes the key/value pair of library='angular'
    LocalStorageProto.remove = function (key) {
        var prefix = this.prefix;

        if (!this.isSupported()) {
            return false;
        }

        try {
            localStorage.removeItem(prefix + key);
        } catch (e) {
            return false;
        }
        return true;
    };

    LocalStorageProto.getAll = function (localPrefix) {
        var prefix = this.prefix;

        if (!this.isSupported()) {
            return false;
        }

        var prefixKey = prefix + (localPrefix || ''),
            prefixKeyLength = prefixKey.length,
            prefixLength = prefix.length,
            localKey,
            result = {};

        for (var key in localStorage) {
            // Only remove items that are for this app
            if (localStorage.hasOwnProperty(key) && key.substr(0, prefixKeyLength) === prefixKey) {
                localKey = key.substr(prefixLength);
                result[localKey] = this.get(localKey);
            }
        }
        return result;
    };

    // Remove all data for this app from local storage
    // Example use: localStorage.clearAll();
    // Should be used mostly for development purposes
    LocalStorageProto.clearAll = function (pattern) {
        var prefix = this.prefix;

        if (!this.isSupported()) {
            return false;
        }

        var prefixLength = prefix.length;

        for (var key in localStorage) {
            // Only remove items that are for this app
            if (localStorage.hasOwnProperty(key) && key.substr(0, prefixLength) === prefix && (!pattern || key.substr(prefixLength).match(pattern))) {
                try {
                    this.remove(key.substr(prefixLength));
                } catch (e) {
                    return false;
                }
            }
        }
        return true;
    };

    var stores = {};
    return function (prefix) {
        var store = stores[prefix];
        if (!store) {
            store = stores[prefix] = new LocalStorage(prefix);
        }
        return store;
    };
});

