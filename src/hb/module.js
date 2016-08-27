/*!
 import hbd.app
 import hbd.model
 import hbEvents
 import hb.directive
 */
define('module', ['hb', 'hb.compiler', 'hb.scope', 'hb.val', 'injector', 'interpolator', 'removeHTMLComments', 'each', 'ready', 'hb.debug', 'hb.eventStash', 'debounce', 'dispatcher', 'loader'],
    function (hb, compiler, scope, val, injector, interpolator, removeHTMLComments, each, ready, debug, events, debounce, dispatcher, loader) {
//TODO: make events private. get rid of public event cache.
        events.READY = 'ready';
        events.RESIZE = 'resize';

        var mod;
        var bootPending = [];
        var bootReady = [];

        function Module() {

            var self = this;
            self.name = 'h';
            self.bootWait = 10;

            var rootEl;
            var _injector = this.injector = injector();
            var _interpolator = this.interpolator = interpolator(_injector);
            var _compiler = compiler(self);
            var compile = _compiler.compile;
            var interpolate = _interpolator.invoke;
            var injectorVal = _injector.val.bind(_injector);
            var rootScope = scope(interpolate);
            rootScope.$$bootPending = bootPending;
            var docRready = false;
            var waitForLoader;
            var onAppReady = function () {
                var br;
                debug.log("\tloading " + loader.getPendingCount() + " files");
                val.init(self);// flushes it to the injector val.
                if (!docRready || loader.getPendingCount()) {// wait until browser ready, and all pending files are loaded before final boot call.
                    if (!waitForLoader) {
                        waitForLoader = true;
                        loader.allFinished(finalizeBootstrap);// listen for all files loaded
                    }
                    return;// exit if not done loading.
                }
                if (!self.element()) {
                    self.element(document.body);// always setups up on body unless set explicitly with app.element(el)
                }
                // fire all boot methods.
                while(bootReady.length) {
                    br = bootReady.shift();
                    debug.info("%c\tFIRE Boot Callback for " + br.name, "color:#F60");
                    br.cb(self);
                }
                debug.log("%cMODULE READY", "color:#F60");
                // self.fire(events.READY, self);
                // rootScope.$broadcast(events.HB_READY, self);
                rootScope.$apply();
            };
            ready(function() {
                debug.log("docReady");
                docRready = true;
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

            function findPendingIndex(name) {
                for(var i = 0; i < bootPending.length; i += 1) {
                    if (bootPending[i].name === name) {
                        return i;
                    }
                }
                return -1;
            }

            function bootstrap(bootName, options, callback) {
                debug.log("bootstrap " + bootName, options);
                var index = findPendingIndex(bootName);// each bootName added must be removed before final boot will call.
                if (index !== -1) {
                    bootPending.splice(index, 1);
                }
                if (options) {
                    for(var i in options) {
                        if(options.hasOwnProperty(i)) {
                            debug.warn('val("' + i + '", ' + (typeof options[i] === "string" ? '"' + options[i] + '"' : options[1]) + ');');
                            val(i, options[i]);// stored temporarily. Until the val.init these are not injectable.
                        }
                    }
                    val.init(self);// flushes it to the injector val.
                }
                if (callback) {
                    bootReady.push({name: bootName, cb: callback || function() {}});
                }
                finalizeBootstrap();
            }

            var finalizeBootstrap = debounce(onAppReady, self.bootWait);

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
        // force new is handy for unit tests to create a new module with the same name.
        return function (name) {
            if (!name) {
                throw Error("Bootstrap requires name");
            }
            var app = mod || new Module(), index;
            if ((index = bootPending.indexOf(name)) === -1) {
                debug.log('register ' + name);
                bootPending.push({name:name});
            } else {
                return bootPending[index].app;
            }
            if (!app.val('$app')) {
                app.val('$app', app);
                app.val('$window', window);
            }

            return app;// all get reference back to the same module instance.
        };

    });
