/*!
 import hbd.app
 import hbd.model
 import hbEvents
 import hb.directive
 */
define('module', ['hb', 'hb.compiler', 'hb.scope', 'hb.val', 'injector', 'interpolator', 'removeHTMLComments', 'each', 'ready', 'hb.debug', 'hb.eventStash', 'debounce', 'dispatcher'],
    function (hb, compiler, scope, val, injector, interpolator, removeHTMLComments, each, ready, debug, events, debounce, dispatcher) {
//TODO: make events private. get rid of public event cache.
        events.READY = 'ready';
        events.RESIZE = 'resize';

        var mod;
        var bootPending = [];
        var bootReady = [];

        function Module() {

            var self = this;
            self.name = 'h';

            var rootEl;
            var _injector = this.injector = injector();
            var _interpolator = this.interpolator = interpolator(_injector);
            var _compiler = compiler(self);
            var compile = _compiler.compile;
            var interpolate = _interpolator.invoke;
            var injectorVal = _injector.val.bind(_injector);
            var rootScope = scope(interpolate);
            var ready = debounce(function () {
                debug.log("%cMODULE READY FIRED", "color:#F60");
                if (!self.element()) {
                    val.init(self);
                    self.element(document.body);
                }
                self.fire(events.READY, self);
                rootScope.$broadcast(events.HB_READY, self);
                rootScope.$apply();
            });
            rootScope.$ignoreInterpolateErrors = true;
            window.addEventListener('resize', function () {
                rootScope && rootScope.$broadcast(events.RESIZE);
            });
            injectorVal('$rootScope', rootScope);

            // injector supports a pre processor so we can make our services instantiate
            // on the first call.
            _injector.preProcessor = function (key, value) {
                if (value && value.isClass) {
                    // instantiate and then override.
                    // we only do this for services because they must be singletons.
                    return _injector.instantiate(value);
                }
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

            function bootstrap(el, options) {
                debug.log("bootstrap " + this.bootName);
                var index = bootPending.indexOf(this.bootName);
                if (index !== -1) {
                    bootPending.splice(index, 1);
                    bootReady.push(this.bootName);
                }
                if (el && bootPending.length === 0) {//TODO: factor out every place passing el so we can just pass options.
                    for(var i in options) {
                        if(options.hasOwnProperty(i)) {
                            val(i, options[i]);
                        }
                    }
                    ready();
                }
            }

            function addChild(parentEl, htmlStr, overrideScope, data, prepend) {
                if (!htmlStr) {
                    return;
                }
                if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
                    throw new Error(debug.errors.E12, rootEl);
                }
                var scope = overrideScope || findScope(parentEl), child;
                if (prepend) {
                    // used by repeat with asyncRender
                    parentEl.insertAdjacentHTML('afterbegin', removeHTMLComments(htmlStr));
                    child = parentEl.children[0];
                } else {
                    parentEl.insertAdjacentHTML('beforeend', removeHTMLComments(htmlStr));
                    child = parentEl.children[parentEl.children.length - 1];
                }
                return compileEl(child, overrideScope || scope, !!overrideScope, data);
            }

            function compileEl(el, scope, sameScope, data) {
                var s = sameScope && scope || scope.$new(), i;
                if (data) {
                    for (i in data) {
                        if (data.hasOwnProperty(i)) {
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
                    list = childEl.querySelectorAll(self.name + '-id');
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
                    return injectorVal(name);
                }
                ClassRef.isClass = true;
                return injectorVal(name, ClassRef);
            }

            self.events = events;
            self.bindingMarkup = ['{{', '}}'];
            self.elements = {};
            self.bootstrap = bootstrap;
            self.findScope = findScope;
            self.addChild = addChild;
            self.removeChild = removeChild;
            self.compile = compileEl;
            self.interpolate = interpolate;
            self.invoke = _injector.invoke.bind(_injector);
            self.element = element;
            self.val = injectorVal;
            self.factory = injectorVal;
            self.service = service;
            self.template = injectorVal;
            self.parseBinds = function (scope, str) {
                return _compiler.parseBinds(str, scope);
            };
            dispatcher(self);
            mod = self;
        }

        function BootApp(bootName) {
            this.bootName = bootName;
            for(var i in mod) {
                if (mod.hasOwnProperty(i)) {
                    this[i] = mod[i];
                }
            }
        }

        // force new is handy for unit tests to create a new module with the same name.
        return function (name) {
            if (!name) {
                throw Error("Bootstrap requires name");
            }
            bootPending.push(name);
            var app = mod || new Module();
            if (!app.val('$app')) {
                app.val('$app', app);
                app.val('$window', window);

                // timeout is so all can declare their definition first
                setTimeout(function () {
                    ready(function () {
                        var el = document.querySelector('[' + mod.name + '-app]');
                        if (el) {
                            app.bootstrap(el);
                        }
                    });
                });
            }

            return new BootApp(name);
        };

    });
