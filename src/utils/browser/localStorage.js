define('localStorage', ['dispatcher'], function (dispatcher) {
    var ls = (function () {
        var api = {
                events: {
                    WARNING: 'localStorage:warning',
                    ERROR: 'localStorage:error'
                },
                UNSUPPORTED: "LOCAL_STORAGE_NOT_SUPPORTED"
            },
            pfx = 'global',
            prefix = pfx + ':';

        // Checks the browser to see if local storage is supported
        function browserSupportsLocalStorage() {
            try {
                return ('localStorage' in window && window.localStorage !== null);
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
        }

        function localStorageEnabled() {
            try {
                var has = browserSupportsLocalStorage(), key = '__localStorageSupportTest__', r;
                if (has) {
                    // now we need to determine if it works. Because Safari Private Browsing will say it is there
                    // but it won't work.
                    r = Date.now().toString();
                    localStorage.setItem(key, r);
                    return localStorage.getItem(key) === r;
                }
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
        }

        // Directly adds a value to local storage
        // If local storage is not available in the browser use cookies
        // Example use: localStorage.add('library','angular');
        function addToLocalStorage(key, value) {

            // If this browser does not support local storage use cookies
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }

            // 0 and "" is allowed as a value but let's limit other falsey values like "undefined"
            if (!value && value !== 0 && value !== "") return false;

            try {
                localStorage.setItem(prefix + key, JSON.stringify(value));
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
            return true;
        }

        // Directly get a value from local storage
        // Example use: localStorage.get('library'); // returns 'angular'
        function getFromLocalStorage(key) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }

            var item = localStorage.getItem(prefix + key);
            if (!item) return null;
            return JSON.parse(item);
        }

        // Remove an item from local storage
        // Example use: localStorage.remove('library'); // removes the key/value pair of library='angular'
        function removeFromLocalStorage(key) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }

            try {
                localStorage.removeItem(prefix + key);
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
            return true;
        }

        function getAllFromLocalStorageByPrefix(localPrefix) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
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
                    result[localKey] = getFromLocalStorage(localKey);
                }
            }
            return result;
        }

        // Remove all data for this app from local storage
        // Example use: localStorage.clearAll();
        // Should be used mostly for development purposes
        function clearAllFromLocalStorage(pattern) {

            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }

            var prefixLength = prefix.length;

            for (var key in localStorage) {
                // Only remove items that are for this app
                if (localStorage.hasOwnProperty(key) && key.substr(0, prefixLength) === prefix && (!pattern || key.substr(prefixLength).match(pattern))) {
                    try {
                        removeFromLocalStorage(key.substr(prefixLength));
                    } catch (e) {
                        api.dispatch(api.events.ERROR, e.Description);
                        return false;
                    }
                }
            }
            return true;
        }

        api.prefix = function (value) {
            if (value !== undefined) {
                pfx = value;
                prefix = pfx + ':';
            }
            return pfx;
        };
        api.isSupported = browserSupportsLocalStorage;
        api.enabled = localStorageEnabled;
        api.put = addToLocalStorage;
        api.get = getFromLocalStorage;
        api.getAll = getAllFromLocalStorageByPrefix;
        api.remove = removeFromLocalStorage;
        api.clearAll = clearAllFromLocalStorage;

        dispatcher(api);

        return api;
    }());

    return ls;
});

