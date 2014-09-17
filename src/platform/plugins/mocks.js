(function () {

    function Mocks(module) {
        var injector = module.injector;
        injector.set('$window', new Win());
    }

    function Win() {
        this._hist = [];
        this._listeners = {};
        this.history = new Hist();
        this.document = new Doc();
        this.document.location.href = 'http://test.com/';
    }
    Win.prototype = {
        addEventListener: function(evt, fn) {
            this._listeners[evt] = this._listeners[evt] || [];
            this._listeners[evt].push(evt, fn);
            this._hist.push({method:'addEventListener', evt:evt, fn:fn});
        }
    };

    function Doc() {
        this._hist = [];
        this.location = new Loc();
    }
    Doc.prototype = {
    };

    function Hist() {
        this._hist = [];
    }
    Hist.prototype = {
        state: {},
        pushState: function (state, title, url) {
            this._hist.push({method:'pushState', state:state, title:title, url:url});
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
        parts = parts[1].split('/');
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
        return data.protocol + '://' + data.domain + data.pathname + (data.hash ? '#' + data.hash : '') + (data.search ? '?' + data.search : '');
    }

    function keyValue(str, result) {
        var parts = str.split('');
        result[parts[0]] = parts[1];
    }

    function Loc() {
        this._hist = [];
        this._data = {};
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