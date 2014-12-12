/* global exports, directives, plugins, filters, utils */
var module = (function () {
    var modules = {};

    function Module(name) {

        var self = this;
        self.name = name;

        var rootEl;
        var rootScope = exports.scope();
        var bootstraps = [];
        var injector = this.injector = exports.injector();
        var interpolator = this.interpolator = exports.interpolator(injector);
        var compiler = exports.compiler(self);
        var compile = compiler.compile;
        var interpolate = interpolator.exec;
        var injectorGet = injector.get;
        var injectorSet = injector.set;

        injector.set('$rootScope', rootScope);
        rootScope.interpolate = function (scope, exp, data) {
            if (typeof exp === "function") {
                return exp(scope, data);
            }
            return interpolate(scope, exp);
        };

        function _val(name, value) {
            if (name && value === undefined) {
                return injectorGet(name);
            }
            return injectorSet(name, value);
        }

        /**
         * Searches through elements for a scope
         * @param el
         * @returns {*}
         */
        function findScope(el) {
            if (!el) {
                return null;
            }
            if (el.scope) {
                return el.scope;
            }
            return findScope(el.parentNode);
        }

        function bootstrap(el) {
            if (el) {
                this.element(el);
                this.ready();
            }
        }

        function addChild(parentEl, htmlStr) {
            if (!htmlStr) {
                return;
            }
            if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                throw new Error('parent element not found in %o', rootEl);
            }
            parentEl.insertAdjacentHTML('beforeend', utils.formatters.stripHTMLComments(htmlStr));
            var scope = findScope(parentEl);
            var child = parentEl.children[parentEl.children.length - 1];
            compiler.link(child, scope.$new());
            compile(child, scope);
            return child;
        }

        function removeChild(childEl) {
            var list;
            if (childEl.scope) {
                childEl.scope.$destroy();
            } else {
                //TODO: need to look up if the element has child elements that have a scope.
                // query for go-id.
                list = childEl.querySelectorAll(name + '-id');
                utils.each(list, removeChild);
            }
            childEl.remove();
        }

        function element(el) {
            if (typeof el !== 'undefined') {
                rootEl = el;
                compiler.link(rootEl, rootScope);
                compile(rootEl, rootScope);
            }
            return rootEl;
        }

        function service(name, ClassRef) {
            if(ClassRef === undefined) {
                return _val(name);
            }
            ClassRef.isClass = true;
            return _val(name, ClassRef);
        }

        function use(list, namesStr) {
            var name;
            var names = namesStr.split(' ');
            for (var e in names) {
                name = names[e];
                if (list.hasOwnProperty(name)) {
                    list[name](this);
                }
            }
        }

        function useDirectives(namesStr) {
            use.apply(self, [directives, namesStr]);
        }

        function usePlugins(namesStr) {
            use.apply(self, [plugins, namesStr]);
        }

        function useFilters(namesStr) {
            use.apply(self, [filters, namesStr]);
        }

        function ready() {
            while (bootstraps.length) {
                injector.invoke(bootstraps.shift(), self);
            }
            rootScope.$apply();
            rootScope.$broadcast("module::ready");
        }

        self.bindingMarkup = [':=','=:'];
        self.elements = {};
        self.bootstrap = bootstrap;
        self.findScope = findScope;
        self.addChild = addChild;
        self.removeChild = removeChild;
        self.interpolate = interpolate;
        self.element = element;
        self.val = _val;
        self.directive = _val;
        self.filter = _val;
        self.factory = _val;
        self.service = service;
        self.template = _val;
        self.useDirectives = useDirectives;
        self.usePlugins = usePlugins;
        self.useFilters = useFilters;
        self.ready = ready;
    }

    // force new is handy for unit tests to create a new module with the same name.
    return function (name, forceNew) {
        if (!name) {
            throw exports.errors.MESSAGES.E8;
        }
        var module = (modules[name] = (!forceNew && modules[name]) || new Module(name));
        if (!module.injector.get('module')) {
            module.injector.set('module', module);
            module.injector.set('$window', window);
        }
        return module;
    };

}());
