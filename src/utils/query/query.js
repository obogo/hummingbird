/* global query */

define('query', function () {

    function Query(selector, context) {
        this.init(selector, context);
    }

    var queryPrototype = Query.prototype = Object.create(Array.prototype);
    var eqRx = /:eq\((\d+)\)$/;

    function parseEQFilter(scope, selector) {
        var match, count;
        // parse for :eq(5) type of filters
        match = selector.indexOf(':eq(');
        // filter out eq.
        if (match !== -1) {
            match = selector.match(eqRx);
            selector = selector.replace(eqRx, '');
            count = match[1] !== undefined ? Number(match[1]) : -1;
            var nodes = scope.context.querySelectorAll(selector);
            if (count !== undefined) {
                if (nodes[count]) {
                    scope.push(nodes[count]);
                }
                return true;
            }
        }
        return false;
    }

    queryPrototype.selector = '';

    function getElementClass(context) {
        var win = window;
        if (context) {
            if (context.parentWindow) {
                win = context.parentWindow;
            } else if (context.defaultWindow) {
                win = context.defaultWindow;
            }
        }
        return win.Element;
    }

    queryPrototype.init = function (selector, context) {
        this.context = context; // TODO: TMP -> remove this after testing on Runner
        var ElementClass = getElementClass(context);
        if (typeof selector === 'string') {
            if (selector.substr(0, 1) === '<' && selector.substr(selector.length - 1, 1) === '>') {
                this.parseHTML(selector);
            } else {
                this.parseSelector(selector, context);
            }
        } else if (selector instanceof Array) {
            this.parseArray(selector);
        } else if (selector instanceof ElementClass) {
            this.parseElement(selector);
        }
    };

    queryPrototype.parseHTML = function (html) {
        var container = document.createElement('div');
        container.innerHTML = html;
        this.length = 0;
        this.parseArray(container.children);
    };

    queryPrototype.parseSelector = function (selector, context) {
        var ElementClass = getElementClass(context);
        var i, nodes, len;
        this.selector = selector;

        if (context instanceof ElementClass) {
            this.context = context;
        } else if (context instanceof Query) {
            this.context = context[0];
        } else if (context && context.nodeType === 9) { // is of type document
            this.context = context;
        } else {
            this.context = document;
        }
        if (!parseEQFilter(this, selector)) {
            nodes = this.context.querySelectorAll(selector);
            len = nodes.length;
            i = 0;
            this.length = 0;
            while (i < len) {
                this.push(nodes[i]);
                i += 1;
            }
        }
    };

    queryPrototype.parseArray = function (list) {
        var ElementClass = (this.context.parentWindow || this.context.defaultView).Element;
        var i = 0,
            len = list.length;
        this.length = 0;
        while (i < len) {
            if (list[i] instanceof ElementClass) {
                this.push(list[i]);
            }
            i += 1;
        }
    };

    queryPrototype.parseElement = function (element) {
        this.length = 0;
        this.push(element);
    };

    queryPrototype.toString = function () {
        if (this.length) {
            return this[0].outerHTML;
        }
    };

    queryPrototype.each = function (fn) {
        var i = 0, len = this.length, result;
        while (i < len) {
            result = fn.apply(this[i], [i, this[i]]);
            if (result === false) {
                break;
            }
            i += 1;
        }
        return this;
    };

    var query = function (selector, context) {
        for (var n in query.fn) {
            if (query.fn.hasOwnProperty(n)) {
                queryPrototype[n] = query.fn[n];
                delete query.fn[n];
            }
        }
        return new Query(selector, context);
    };

    query.fn = {};

    return query;

});
