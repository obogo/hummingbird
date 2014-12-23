define('cache', function () {

    var cache = (function () {

        var Cache, ns;
        ns = {}; // namespaces
        Cache = function () {

            var _cachedItems = [];

            /**
             * Sets a value
             * @param key
             * @param value
             */
            this.set = function (key, value) {
                _cachedItems[key] = value;
                return value;
            };

            /**
             * Retrieves a value. (A defaultValue can be
             * @param key
             * @param defaultValue
             * @return {*}
             */
            this.get = function (key, defaultValue) {
                if (_cachedItems.hasOwnProperty(key)) {
                    return _cachedItems[key];
                }
                return defaultValue;
            };

            this.getCopy = function (key, defaultValue, overwrite) {
                var data = this.get(key, defaultValue, overwrite);
                return data.copy(data);
            };

            /**
             * Creates or merges value data into set, then returns the new merged item
             */
            this.merge = function (key, value) {
                if (_cachedItems[key]) {
                    _cachedItems[key] = extend(_cachedItems[key], value);
                } else {
                    _cachedItems[key] = value;
                }
                return _cachedItems[key];
            };

            this.keys = function () {
                var keys = [];
                for (var key in _cachedItems) {
                    if (_cachedItems.hasOwnProperty(key)) {
                        keys.push(key);
                    }
                }
                return keys;
            };

            /**
             * Return all cached items for namespace
             * @return {Array}
             */
            this.all = function () {
                return _cachedItems;
            };

            /**
             * Determines if key exists
             * @param key
             * @return {*}
             */
            this.has = function (key) {
                return _cachedItems.hasOwnProperty(key);
            };

            /**
             * Removes key / value pairs from cache
             * @param key
             */
            this.remove = function (key) {
                delete _cachedItems[key];
            };

            /**
             * Removes all key / value pairs form cache
             */
            this.clear = function () {
                _cachedItems = {};
            };

            /**
             * Increments a counter
             * @param key
             * @returns {Number}
             */
            this.inc = function (key) {
                var id = key + 'Counter';
                if (!_cachedItems[id]) {
                    _cachedItems[id] = 0;
                }
                _cachedItems[id] += 1;
                return _cachedItems[id];
            };

            /**
             * Decrements a counter
             * @param key
             * @returns {Number}
             */
            this.dec = function (key) {
                var id = key + 'Counter';
                if (!_cachedItems[id]) {
                    _cachedItems[id] = 0;
                }
                _cachedItems[id] -= 1;
                return _cachedItems[id];
            };
        };

        return function (name) {
            name = name || '__default__';
            if (!ns[name]) {
                ns[name] = new Cache();
            }
            return ns[name];
        };

    })();

    return cache;

});
