/* global define */
define('rest.resource', ['isArray'], function (isArray) {
    // https://gist.github.com/pduey/2764606

    function clone(hash) {
        return JSON.parse(JSON.stringify(hash));
    }

    function parseUrl(url, hash) {
        for (var e in hash) {
            if (hash.hasOwnProperty(e)) {
                var regExp = new RegExp(':(' + e + ')\\b', 'g');
                if (regExp.test(url)) {
                    url = url.replace(regExp, hash[e]);
                    delete hash[e];
                }
            }
        }
        url = url.replace(/\/:\w+/gi, ""); // strip any "/:ids" that were still remaining
        url = url.replace(/\/$/gi, "") // strip trailing slash "/"
        return url;
    }

    function hashToSearch(hash) {
        var search = '';
        for (var k in hash) {
            if (isArray(hash[k])) {
                for (var i = 0; i < hash[k].length; i++) {
                    search += !search ? '?' : '&';
                    search += encodeURIComponent(k) + '=' + encodeURIComponent(hash[k][i]);
                }
            } else {
                search += !search ? '?' : '&';
                search += encodeURIComponent(k) + '=' + encodeURIComponent(hash[k]);
            }
        }
        return search;
    }

    function Resource(name, id) {
        this.$$id = id;
        if (typeof name === 'string') {
            this.$$name = name.replace(/^\/?(.*?)\/?$/, '$1'); // strip any '/' a the start or end of name
            if(this.$$name[0] === '/') {
                this.$$name = '/' + this.$$name;
            }
        }
        this.$$parent = null;
        this.$$params = null;
    }

    Resource.prototype.id = function (id) {
        if (id === undefined) {
            return this.$$id;
        }
        this.$$id = id;
        return this;
    };

    Resource.prototype.name = function (name) {
        if (name === undefined) {
            return this.$$name;
        }
        this.$$name = name;
        return this;
    };

    Resource.prototype.params = function (params) {
        this.$$params = this.$$params || {};
        if (arguments.length === 2) {
            if (typeof arguments[1] === 'undefined') {
                delete this.$$params[arguments[0]];
            } else {
                this.$$params[arguments[0]] = arguments[1];
            }
        } else if (typeof params === 'object') {
            for (var e in params) {
                if (params.hasOwnProperty(e)) {
                    if (typeof params[e] === 'undefined') {
                        delete this.$$params[e];
                    } else {
                        this.$$params = this.$$params || {};
                        this.$$params[e] = params[e];
                    }
                }
            }
        }
        return this;
    };

    Resource.prototype.resource = function (name, id) {
        var resource = new Resource(name, id);
        resource.$$parent = this;
        return resource;
    };

    Resource.prototype.$$toUrl = function () {
        var url = '';
        if (this.$$parent) {
            url += this.$$parent.$$toUrl();
        }

        if (typeof this.$$baseUrl === 'string') {
            url = this.$$baseUrl;
        } else {
            if (this.$$name) {
                if (this.$$name.match(/^(http(s?)|\/\/)/i)) { // if http(s)
                    url = this.$$name;
                } else {
                    url += '/' + this.$$name;
                }
            }
            if (this.$$id !== undefined) {
                url += '/' + this.$$id;
            }
        }

        return url;
    };

    Resource.prototype.toUrl = function () {
        var url = this.$$toUrl();
        if (this.$$params) {
            var params = clone(this.$$params);
            url = parseUrl(url, params);
            url += hashToSearch(params);
        }

        return url;
    };

    return function (name, id) {
        var resource;
        if (typeof name === 'object') {
            resource = new Resource(name.name, name.id);
            resource.$$baseUrl = name.baseUrl;
        } else {
            resource = new Resource(name, id);
        }
        return resource;
    };

});
