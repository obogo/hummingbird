internal('hbRouter', ['hb', 'each', 'routeParser', 'dispatcher', 'extend'], function (hb, each, routeParser, dispatcher, extend) {

//TODO: figure out html5 to make it not use the #/
    function Router($app, $rootScope, $window) {
        var self = dispatcher(this),
            events = {
                //TODO: need to fire before change.
                BEFORE_CHANGE: 'router::beforeChange',
                CHANGE: 'router::change',
                AFTER_CHANGE: 'router::afterChange'
            },
            $location = $window.document.location,
            $history = $window.history,
            routes = {},
            base = $location.pathname,
            lastHashUrl,
            data = {};

        function add(route) {
            if (typeof route === "string") {
                return addRoute(arguments[1], route);
            }
            each(route, addRoute);//expects each route to have an id
            return self;
        }

        function addRoute(route, id) {
            route.id = id;
            routes[id] = route;
            route.templateName = route.templateName || id;
            if (route.template) {
                $app.val(route.templateName, route.template);
            }
            return self;
        }

        function remove(id) {
            delete routes[id];
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
            var route = getRouteFromPath(url);
            if (!route) {
                failedUrl = url;
                url = self.otherwise;
                skipPush = true;
                route = getRouteFromPath(url);
            }
            var params = routeParser.extractParams(route.url, url);
            if (failedUrl) {
                params.params.failedUrl = failedUrl;
            }
            go(route.id, params.params, skipPush);
        }

        function doesRouteMatchPath(route, index, list, params) {
            if (!params.url) {
                return;
            }
            var escUrl = route.url.replace(/[-[\]{}()*+?.,\\^$|#\s\/]/g, "\\$&");
            var rx = new RegExp("^" + escUrl.replace(/(:\w+)/g, '\\w+') + "$", 'i');
            if (params.url.match(rx)) {
                params.route = route;
                return params.route;
            }
        }

        function getRouteFromPath(url) {
            var item = {url:url.split('?').shift(), route:''};
                each(routes, item, doesRouteMatchPath);
            if (item.route && item.route.url) {
                return item.route;
            }
            return null;
        }

        function go(routeName, params, skipPush) {
            var route = routes[routeName];
            if (!route) {
                resolveToUrl(routeName, skipPush);
                return;
            }
            var path = generateUrl(route.url, params), url = path.url || route.url;
            //TODO: resolve here.
            if ($history.pushState) {
                if (skipPush || !$history.route) {
                    $history.replaceState({url: url, params: params}, '', base + '#' + url);
                } else if ($history.route && $history.route.url !== url) {
                    $history.pushState({url: url, params: params}, '', base + '#' + url);
                }
            } else if (!skipPush) {
                if ($location.hash === '#' + url) {
                    return;
                }
                $location.hash = '#' + url;
            }
            change(route, params);
        }

        function change(route, params) {
            var evt = self.fire(events.BEFORE_CHANGE, data);
            if (!evt.defaultPrevented) {
                lastHashUrl = $location.hash.replace('#', '');
//                console.log("change from %s to %o", prev, current);
                extend(data, {current:route, params:params, prev:data.current});
                self.fire(events.CHANGE, data);
                // the change fires and $apply in hbView. So the afterChange would be after the apply.
                self.fire(events.AFTER_CHANGE, data);
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
        self.go = go;
        self.resolveUrl = resolveUrl;
        self.otherwise = '/';
        self.add = add;
        self.remove = remove;
        self.routes = routes;
        self.data = data;
        $rootScope.$on("module::ready", resolveUrl);
    }

    return function (module) {
        var router = (module.router = module.router || module.injector.instantiate(Router));
        module.on(module.events.READY, router.resolveUrl);
        return module.injector.val("$router", router);
    };
});