internal('hb.plugins.router', ['hb', 'each', 'route'], function (hb, each, route) {

//TODO: figure out html5 to make it not use the #/
    function Router($app, $rootScope, $window) {
        var self = this,
            events = {
                //TODO: need to fire before change.
                BEFORE_CHANGE: 'router::beforeChange',
                CHANGE: 'router::change',
                AFTER_CHANGE: 'router::afterChange'
            },
            $location = $window.document.location,
            $history = $window.history,
            prev,
            current,
            states = {},
            base = $location.pathname,
            lastHashUrl;

        function add(state) {
            if (typeof state === "string") {
                return addState(arguments[1], state);
            }
            each(state, addState);//expects each state to have an id
            return this;
        }

        function addState(state, id) {
            state.id = id;
            states[id] = state;
            state.templateName = state.templateName || id;
            if (state.template) {
                $app.val(state.templateName, state.template);
            }
            return this;
        }

        function remove(id) {
            delete states[id];
        }

        function cleanUrl(url) {
            return url.split('#').join('');
        }

        function generateUrl(url, values) {
            url = cleanUrl(url);
            var used = {},
                unusedUrlParams = [],
                result = {
                    url: values && url.replace(/(\:\w+)/g, function (match, p1) {
                        var str = p1.substr(1);
                        used[str] = true;
                        return values[str];
                    })
                };
            if (values) {
                each(values, {used:used, unusedUrlParams:unusedUrlParams}, unusedParams);
                if (unusedUrlParams.length) {
                    result.url = result.url.split('?').shift() + '?' + unusedUrlParams.join('&');
                }
            }
            return result;
        }

        function unusedParams(value, prop, list, params) {
            if (!params.used[prop]) {
                params.unusedUrlParams.push(prop + '=' + value);
            }
        }

        function resolveUrl(evt, skipPush) {
            resolveToUrl($location.hash, skipPush);
        }

        function resolveToUrl(url, skipPush) {
            url = cleanUrl(url) || '/';
            var failedUrl = undefined;
            var state = getStateFromPath(url);
            if (!state) {
                failedUrl = url;
                url = self.otherwise;
                skipPush = true;
                state = getStateFromPath(url);
            }
            var params = route.extractParams(state.url, url);
            if (failedUrl) {
                params.params.failedUrl = failedUrl;
            }
            go(state.id, params.params, skipPush);
        }

        function doesStateMatchPath(state, index, list, params) {
            if (!params.url) {
                return;
            }
            var escUrl = state.url.replace(/[-[\]{}()*+?.,\\^$|#\s\/]/g, "\\$&");
            var rx = new RegExp("^" + escUrl.replace(/(:\w+)/g, '\\w+') + "$", 'i');
            if (params.url.match(rx)) {
                params.state = state;
                return params.state;
            }
        }

        function getStateFromPath(url) {
            var data = {url:url.split('?').shift(), state:''};
                each(states, data, doesStateMatchPath);
            if (data.state && data.state.url) {
                return data.state;
            }
            return null;
        }

        function go(stateName, params, skipPush) {
            var state = states[stateName];
            if (!state) {
                resolveToUrl(stateName, skipPush);
                return;
            }
            var path = generateUrl(state.url, params), url = path.url || state.url;
            //TODO: resolve here.
            if ($history.pushState) {
                if (skipPush || !$history.state) {
                    $history.replaceState({url: url, params: params}, '', base + '#' + url);
                } else if ($history.state && $history.state.url !== url) {
                    $history.pushState({url: url, params: params}, '', base + '#' + url);
                }
            } else if (!skipPush) {
                if ($location.hash === '#' + url) {
                    return;
                }
                $location.hash = '#' + url;
            }
            change(state, params);
        }

        function change(state, params) {
            var evt = $rootScope.$broadcast(self.events.BEFORE_CHANGE, self.current, self.params, self.prev);
            if (!evt.defaultPrevented) {
                lastHashUrl = $location.hash.replace('#', '');
                self.prev = prev = current;
                self.current = current = state;
                self.params = params;
//                console.log("change from %s to %o", prev, current);
                $rootScope.$broadcast(self.events.CHANGE, current, params, prev);
                // the change fires and $apply in hbView. So the afterChange would be after the apply.
                $rootScope.$broadcast(self.events.AFTER_CHANGE, current, params, prev);
            }
        }

        function onHashCheck() {
            var hashUrl = $location.hash.replace('#', '');
            if (hashUrl !== lastHashUrl) {
//                console.log("Hash Change Detected");
                resolveUrl(null, true);
                lastHashUrl = hashUrl;
            }
        }

//TODO: need to make sure that the back button is working with all urls.
        hb.on($window, 'popstate', resolveUrl);
        hb.on($window, 'hashchange', onHashCheck);
        setInterval(onHashCheck, 100);// backup plan. make sure we catch if the url changes.

        self.events = events;
        self.go = $rootScope.go = go;
        self.resolveUrl = resolveUrl;
        self.otherwise = '/';
        self.add = add;
        self.remove = remove;
        self.states = states;
        $rootScope.$on("module::ready", resolveUrl);
    }

    hb.plugins.router = function (module) {
        var result = (module.router = module.router || module.injector.instantiate(Router));
        return module.injector.val("router", result);
    };
    return hb.plugins.router;
});