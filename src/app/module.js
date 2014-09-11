/* global app, Scope */
(function () {
    var modules = {};
    function Module(name) {

        var self = this;
        self.name = name;

        var rootEl;
        var rootScope = app.scope();
        var bootstraps = [];
        var injector = app.injector();
        var interpolator = app.interpolator(injector);
        var compiler = app.compiler(self, injector, interpolator);
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

        /**
         * Searches through elements for a scope
         * @param el
         * @returns {*}
         */
            // TODO: deprecate?
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
            if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                throw new Error('parent element not found in %o', rootEl);
            }
            parentEl.insertAdjacentHTML('beforeend', formatters.stripHTMLComments(htmlStr));
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
                each(list, removeChild);
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
            return injectorSet(name, injector.instantiate(['$rootScope', ClassRef]));
        }

        function ready() {
            var self = this;
            while (bootstraps.length) {
                injector.invoke(bootstraps.shift(), self);
            }
            rootScope.$apply();
        }

        self.elements = {};
        self.bootstrap = bootstrap;
        self.findScope = findScope;
        self.addChild = addChild;
        self.removeChild = removeChild;
        self.interpolate = interpolate;
        self.element = element;
        self.get = injectorGet;
        self.set = injectorSet;
        self.directive = injectorSet;
        self.filter = injectorSet;
        self.service = service;
        self.ready = ready;
    }
    // force new is handy for unit tests to create a new module with the same name.
    app.module = function(name, forceNew) {
        return (modules[name] = (!forceNew && modules[name]) || new Module(name));
    };

})();
