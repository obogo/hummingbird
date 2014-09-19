/* global plugins, exports, utils */
(function () {

    function Mocks(module) {
        var injector = module.injector;
        injector.set('$window', new Win());
    }

    function Win() {
        this._hist = [];
        this._listeners = {};
        this.history = new Hist(this);
        this.document = new Doc(this);
        this.document.location.href = 'http://test.com/';
    }
    Win.prototype = {
        addEventListener: function(evt, fn) {
            this._listeners[evt] = this._listeners[evt] || [];
            this._listeners[evt].push(fn);
            this._hist.push({method:'addEventListener', evt:evt, fn:fn});
        },
        removeEventListener: function(evt, fn) {
            if (this._listeners[evt]) {
                var index = this._listeners[evt].indexOf(fn);
                if (index !== -1) {
                    this._listeners[evt].splice(index, 1);
                }
            }
        },
        dispatchEvent: function (evt) {
            if (this._listeners[evt]) {
                utils.each(this._listeners[evt], function(fn) {
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
    Doc.prototype = {
    };

    function Hist(dispatcher) {
        this._hist = [];
        this._dispatcher = dispatcher;
    }
    Hist.prototype = {
        state: {},
        pushState: function (state, title, url) {
            this._hist.push({method:'pushState', state:state, title:title, url:url});
            this.state = state;
            this.title = title;
            this.url = url;
            this._dispatcher.document.location.href = url;
            this._dispatcher.dispatchEvent('popstate');
        },
        replaceState: function (state, title, url) {
            this._hist.push({method:'replaceState', state:state, title:title, url:url});
            this.state = state;
            this.title = title;
            this.url = url;
        }
    };

    function parseUrl(url) {
        var parts, searchResult = {};
        var search = (parts = url.split('?'))[1] || '';
        var hash = (parts = parts[0].split('#'))[1];
        var protocol = (parts = parts[0].split(':'))[0];
        parts = parts[1].replace('//', '').split('/');
        var domain = parts.shift().replace('/', '');
        var pathname = parts.join('/');
        utils.each(search.split('&'), keyValue, searchResult);
        return {
            domain: domain,
            hash: hash || '',
            href: url || '',
            pathname: pathname || '',
            protocol: protocol,
            search: search
        };
    }

    function generateUrl(data) {
        return data.protocol + '://' + data.domain + data.pathname + "/" + (data.hash ? '#' + data.hash : '') + (data.search ? '?' + data.search : '');
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
            this._data = parseUrl(val);
            //TODO: need to fire pushState and/or hashchange.
        },
        get hash() {
            return this._data.hash;
        },
        set hash(val) {
            this._data.hash = val;
            this._data.href = generateUrl(this._data);
        },
        get pathname() {
            return this._data.pathname;
        }
    };

    plugins.mocks = function (module) {
        return (module.mocks = module.mocks || module.injector.instantiate(Mocks));
    };
}());