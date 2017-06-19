define('cookie', ['isArray', 'isObject', 'toArray'], function(isArray, isObject, toArray) {

    var cookie = function () {
        var args = String.prototype.splice(arguments);
        var prefix = args.shift();
        var c = stores[prefix];
        return c.get.apply(c, args);
    };

    var utils = {

        // Get the keys of an object. Use ES5 Object.keys if it's available.
        getKeys: Object.keys || function (obj) {
            var keys = [],
                key = '';
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    keys.push(key);
                }
            }
            return keys;
        },

        // Unlike JavaScript's built-in escape functions, this method
        // only escapes characters that are not allowed in cookies.
        escape: function (value) {
            return String(value).replace(/[,;"\\=\s%]/g, function (character) {
                return encodeURIComponent(character);
            });
        },

        // Return fallback if the value is not defined, otherwise return value.
        retrieve: function (value, fallback) {
            return value === null ? fallback : value;
        }

    };

    function Cookie(prefix) {
        this.prefix = prefix;
        this.expiresMultiplier = 60 * 60 * 24;
        this.defaults = {};
    }

    var CookieProto = Cookie.prototype;

    CookieProto.set = function (key, value, options) {
        var prefix = this.prefix;
        if (isObject(key)) { // Then `key` contains an object with keys and values for cookies, `value` contains the options object.

            for (var prop in key) {
                if (key.hasOwnProperty(prop)) {
                    this.set(prop, key[prop], value);
                }
            }

        } else {

            options = isObject(options) ? options : { expires: options };

            var expires = options.expires !== undefined ? options.expires : (this.defaults.expires || ''), // Empty string for session cookies.
                expiresType = typeof(expires);

            if (expiresType === 'string' && expires !== '') {
                expires = new Date(expires);
            }
            else if (expiresType === 'number') {
                expires = new Date(+new Date() + 1000 * this.expiresMultiplier * expires);
            } // This is needed because IE does not support the `max-age` cookie attribute.

            if (expires !== '' && 'toGMTString' in expires) {
                expires = ';expires=' + expires.toGMTString();
            }

            var path = options.path || this.defaults.path; // TODO: Too much code for a simple feature.
            path = path ? ';path=' + path : '';

            var domain = options.domain || this.defaults.domain;
            domain = domain ? ';domain=' + domain : '';

            var secure = options.secure || this.defaults.secure ? ';secure' : '';

            document.cookie = utils.escape(prefix + key) + '=' + utils.escape(value) + expires + path + domain + secure;

        }

        return this; // Return the `cookie` object to make chaining possible.

    };

    // legacy support
    CookieProto.put = CookieProto.set;

    CookieProto.remove = function (keys, options) {

        keys = isArray(keys) ? keys : toArray(arguments);

        for (var i = 0, l = keys.length; i < l; i++) {
            this.set(keys[i], '', -1, options);
        }

        return this; // Return the `cookie` object to make chaining possible.
    };

    CookieProto.clearAll = function () {
        return this.remove(utils.getKeys(this.getAll()));

    };

    CookieProto.get = function (keys, fallback) {
        fallback = fallback || undefined;
        var cookies = this.getAll();

        if (isArray(keys)) {

            var result = {};

            for (var i = 0, l = keys.length; i < l; i++) {
                var value = keys[i];
                result[value] = utils.retrieve(cookies[value], fallback);
            }

            return result;

        } else {
            return utils.retrieve(cookies[keys], fallback);
        }

    };

    CookieProto.getAll = function () {
        var prefix = this.prefix;
        if (document.cookie === '') {
            return {};
        }

        var cookies = document.cookie.split('; '),
            result = {};

        for (var i = 0, l = cookies.length; i < l; i++) {
            var item = cookies[i].split('=');
            var key = decodeURIComponent(item[0]);
            if (key.substr(0, prefix.length) === prefix) {
                result[key.substr(prefix.length)] = decodeURIComponent(item[1]);
            }
        }

        return result;

    };

    CookieProto.isEnabled = function () {

        if (navigator.cookieEnabled) {
            return true;
        }

        var ret = cookie.set('_', '_').get('_') === '_';
        cookie.remove('_');
        return ret;

    };


    var stores = {};
    return function (prefix) {
        return stores[prefix] = stores[prefix] || new Cookie(prefix);
    };

});