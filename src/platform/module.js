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
        var val = injector.val.bind(injector);

        // injector supports a pre processor so we can make our services instantiate
        // on the first call.
        injector.preProcessor = function(key, value) {
            if (value && value.isClass) {
                // instantiate and then override.
                // we only do this for services because they must be singletons.
                return injector.instantiate(value);
            }
        };

        val('$rootScope', rootScope);
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

        function addChild(parentEl, htmlStr, overrideScope, data) {
            if (!htmlStr) {
                return;
            }
            if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                throw new Error('parent element not found in %o', rootEl);
            }
            parentEl.insertAdjacentHTML('beforeend', utils.formatters.stripHTMLComments(htmlStr));
            var scope = overrideScope || findScope(parentEl);
            var child = parentEl.children[parentEl.children.length - 1];
            return compileEl(child, overrideScope || scope, !!overrideScope, data);
        }

        function compileEl(el, scope, sameScope, data) {
            var s = sameScope && scope || scope.$new(), i;
            if (data) {
                for(i in data) {
                    if (data.hasOwnProperty(i) && !s[i] !== undefined) {
                        s[i] = data[i];
                    }
                }
            }
            compiler.link(el, s);
            compile(el, scope);
            return el;
        }

        function removeChild(childEl) {
            var list;
            if (childEl.scope) {
                childEl.scope.$destroy();
                childEl.scope = null;
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
                return val(name);
            }
            ClassRef.isClass = true;
            return val(name, ClassRef);
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
            if (self.preInit) {
                self.preInit();
            }
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
        self.compile = compileEl;
        self.interpolate = interpolate;
        self.element = element;
        self.val = val;
        self.directive = val;
        self.filter = val;
        self.factory = val;
        self.service = service;
        self.template = val;
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
        if (!module.injector.val('module')) {
            module.injector.val('module', module);
            module.injector.val('$window', window);
        }
        return module;
    };

}());
