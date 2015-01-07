/*!
 import hbd.app
 import hbd.model
 import hbd.events
 import hb.directive
 import hb.errors.build
 */
define('module', ['hb', 'hb.compiler', 'hb.scope', 'hb.directive', 'hb.filter', 'injector', 'interpolator', 'removeHTMLComments', 'each', 'ready'],
    function (hb, compiler, scope, directive, filter, injector, interpolator, removeHTMLComments, each, ready) {

        var modules = {};

        function Module(name) {

            var self = this;
            self.name = name;

            var rootEl;
            var rootScope = scope();
            var bootstraps = [];
            var _injector = this.injector = injector();
            var _interpolator = this.interpolator = interpolator(_injector);
            var _compiler = compiler(self);
            var compile = _compiler.compile;
            var interpolate = _interpolator.invoke;
            var val = _injector.val.bind(_injector);

            // injector supports a pre processor so we can make our services instantiate
            // on the first call.
            _injector.preProcessor = function (key, value) {
                if (value && value.isClass) {
                    // instantiate and then override.
                    // we only do this for services because they must be singletons.
                    return _injector.instantiate(value);
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
                    self.element(el);
                    if (self.preInit) {
                        self.preInit();
                    }
                    while (bootstraps.length) {
                        _injector.invoke(bootstraps.shift(), self);
                    }
                    rootScope.$broadcast("hb::ready", self);
                    rootScope.$apply();
                }
            }

            function addChild(parentEl, htmlStr, overrideScope, data) {
                if (!htmlStr) {
                    return;
                }
                if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                    throw new Error('parent element not found in %o', rootEl);
                }
                parentEl.insertAdjacentHTML('beforeend', removeHTMLComments(htmlStr));
                var scope = overrideScope || findScope(parentEl);
                var child = parentEl.children[parentEl.children.length - 1];
                return compileEl(child, overrideScope || scope, !!overrideScope, data);
            }

            function compileEl(el, scope, sameScope, data) {
                var s = sameScope && scope || scope.$new(), i;
                if (data) {
                    for (i in data) {
                        if (data.hasOwnProperty(i) && !s[i] !== undefined) {
                            s[i] = data[i];
                        }
                    }
                }
                _compiler.link(el, s);
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
                    each(list, removeChild);
                }
                childEl.remove();
            }

            function element(el) {
                if (typeof el !== 'undefined') {
                    rootEl = el;
                    _compiler.link(rootEl, rootScope);
                    compile(rootEl, rootScope);
                }
                return rootEl;
            }

            function service(name, ClassRef) {
                if (ClassRef === undefined) {
                    return val(name);
                }
                ClassRef.isClass = true;
                return val(name, ClassRef);
            }

            self.bindingMarkup = ['{{', '}}'];
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
        }

        // force new is handy for unit tests to create a new module with the same name.
        return function (name, forceNew) {
            if (!name) {
                throw exports.errors.MESSAGES.E8;
            }
            var module = (modules[name] = (!forceNew && modules[name]) || new Module(name));
            if (!module.val('module')) {
                module.val('module', module);
                module.val('$app', module);
                module.val('$window', window);

                setTimeout(function () {
                    directive.init(module);
                    filter.init(module);

                    ready(function () {
                        var el = document.querySelector('[' + name + '-app]');
                        if (el) {
                            module.bootstrap(el);
                        }
                    });
                });
            }

            return module;
        };

    });
