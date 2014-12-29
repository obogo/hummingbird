internal('plugins.mocks', ['framework'], function (framework) {

    function Mocks(module) {
        var injector = module.injector;
        injector.val('$window', new Win());
    }

    function Win() {
        this._hist = [];
        this._listeners = {};
        this.history = new Hist(this);
        this.document = new Doc(this);
        this.document.location.href = 'http://test.com/';
    }

    Win.prototype = {
        addEventListener: function (evt, fn) {
            this._listeners[evt] = this._listeners[evt] || [];
            this._listeners[evt].push(fn);
            this._hist.push({method: 'addEventListener', evt: evt, fn: fn});
        },
        removeEventListener: function (evt, fn) {
            if (this._listeners[evt]) {
                var index = this._listeners[evt].indexOf(fn);
                if (index !== -1) {
                    this._listeners[evt].splice(index, 1);
                }
            }
        },
        dispatchEvent: function (evt) {
            if (this._listeners[evt]) {
                utils.each(this._listeners[evt], function (fn) {
                    fn(evt);
                });
            }
        }
    };

    function Doc(dispatcher) {
        this._hist = [];
        this._dispatcher = dispatcher;
        this.location = new Loc(dispatcher);
    }

    Doc.prototype = {};

    function Hist(dispatcher) {
        this._hist = [];
        this._dispatcher = dispatcher;
    }

    Hist.prototype = {
        state: {},
        pushState: function (state, title, url) {
            this._hist.push({method: 'pushState', state: state, title: title, url: url});
            this.state = state;
            this.title = title;
            this.url = url;
            this._dispatcher.document.location._data.href = url;
        },
        replaceState: function (state, title, url) {
            this._hist.push({method: 'replaceState', state: state, title: title, url: url});
            this.state = state;
            this.title = title;
            this.url = url;
            this._dispatcher.document.location._data.href = url;
        }
    };

    function parseUrl(url, prevData) {
        var parts, searchResult = {}, search, hash, protocol, domain, pathname;
        parts = url.split('#');
        hash = parts[1] || "";
        search = hash && hash.indexOf('?') !== -1 ? hash.split('?').pop() : '';
        parts = parts[0].split(':');
        protocol = parts[0] || prevData.protocol;
        parts = parts[1] ? parts[1].replace('//', '').split('/') : [prevData.domain, prevData.pathname];
        domain = parts.shift().replace('/', '');
        while (!parts[0] && parts.length) {
            parts.shift();
        }
        pathname = ('/' + parts.join('/')).replace('//', '/');
        utils.each(search.split('&'), keyValue, searchResult);
        return {
            domain: domain,
            hash: hash,
            href: url || '',
            pathname: pathname,
            protocol: protocol,
            search: search
        };
    }

    function generateUrl(data) {
        return data.protocol + '://' + data.domain + data.pathname + (data.hash ? '#' + data.hash : '') + (data.search ? '?' + data.search : '');
    }

    function keyValue(str, result) {
        var parts = str.split('');
        result[parts[0]] = parts[1];
    }

    function Loc(dispatcher) {
        this._hist = [];
        this._data = {};
        this._dispatcher = dispatcher;
    }

    Loc.prototype = {
        get href() {
            return this._data.href;
        },
        set href(val) {
            this._data = parseUrl(val, this._data);
            this._dispatcher.dispatchEvent('popstate');
            //TODO: need to fire pushState and/or hashchange.
        },
        get hash() {
            return this._data.hash;
        },
        set hash(val) {
            this._data.hash = val;
            this._data.href = generateUrl(this._data);
            this._dispatcher.dispatchEvent('popstate');
        },
        get pathname() {
            return this._data.pathname;
        }
    };

    return framework.plugins.mocks = function (module) {
        return (module.mocks = module.mocks || module.injector.instantiate(Mocks));
    };

});