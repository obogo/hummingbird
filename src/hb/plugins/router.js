/**
 * Examples for adding routes.
 *
 *
 *
 * // add a simple route.
 * routes.add('e404', {
 *     url: '/e404',
 *     template: 'e404/admin-e404.html'
 * });
 * // add a multiple route that will match with viewIds.
 * ﻿routes.add('home-details', {
 *     url: '/home/details',
 *     resolve: function(done) {done()},// resolves before any routes
 *     views: {
 *         main: {
 *             resolve: function(done) {done();},// resolves before the route is ready
 *             template: 'dashboard/admin-dashboard1.html'// loaded before route ready
 *         },
 *         popup: {
 *             resolve: function(done) {done('error');},// done(err)// router will dispatch route::error with that error
 *             // a route::resolve event will fire for each resolve as it completes.
 *             template: 'dashboard/admin-dashboard1.html'
 *         }
 *     },
 *     // add any custom data you want to the main route, or view routes.
 *     data: {
 *     }
 * });
 * // router should dispatch an "router::change" after all are done.
 */

internal('hbRouter', ['hb', 'each', 'routeParser', 'dispatcher', 'extend', 'functionArgs', 'hb.template', 'hb.debug'], function (hb, each, routeParser, dispatcher, extend, functionArgs, template, debug) {

//TODO: figure out html5 to make it not use the #/
    function Router($app, $window) {
        var self = dispatcher(this),
            events = {
                //TODO: need to fire before change.
                BEFORE_CHANGE: 'router::beforeChange',
                RESOLVE_VIEW: 'router::resolveView',
                CHANGE: 'router::change',
                AFTER_CHANGE: 'router::afterChange',
                ERROR: 'router::error'
            },
            $location = $window.document.location,
            $history = $window.history,
            routes = {},
            base = $location.pathname,
            lastHashUrl,
            data = {},
            pending = [],
            processing = null;

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
            var route = routes[routeName], item = {routeName:routeName, params:params, skipPush:skipPush};
            if (!route) {
                resolveToUrl(routeName, skipPush);
                return;
            }
            if (processing) {
                pending.push(item);
                return;
            }
            processing = item;
            var path = generateUrl(route.url, params), url = path.url || route.url;
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
            debug.log('before change');
            var evt = self.fire(events.BEFORE_CHANGE, data);
            if (!evt.defaultPrevented) {
                lastHashUrl = $location.hash.replace('#', '');
//                console.log("change from %s to %o", prev, current);
                extend(data, {current:route, params:params, prev:data.current});
                // if we need to resolve the whole route. Do that first. Then resolve the views.
                if (route.resolve) {
                    var args = functionArgs(route.resolve);
                    if (args.length) {
                        route.resolve(onResolve);
                        return;
                    }
                    route.resolve();
                }
                onResolve();
            }
        }

        function onResolve(err) {
            var evt;
            if (err) {
                debug.warn('onResolve error', err);
                evt = self.fire(events.ERROR, {error:err, data:data});
            }
            if (!evt || !evt.defaultPrevented) {
                debug.log('resolved', data.current.id);
                self.fire(events.RESOLVE_VIEW, data);
            }
            loadTemplates(onChangeComplete);
        }

        function getViewTemplate(view, id, list, result) {
            result.push(view.template);
        }

        function loadTemplates(callback) {
            var result = [];
            if (data.current.template) {
                result.push(data.current.template);
            }
            each(data.current.views, result, getViewTemplate);
            debug.log('load templates', result);
            template.get($app, result, callback);
        }

        function onChangeComplete() {
            var next;
            debug.log('All Templates loaded');
            processing = null;
            self.fire(events.CHANGE, data);
            // the change fires and $apply in hbView. So the afterChange would be after the apply.
            debug.log('Route Change Complete');
            self.fire(events.AFTER_CHANGE, data);
            if (pending.length) {
                next = pending.shift();
                go(next.routeName, next.params, next.skipPush);
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
        self.isProcessing = function() {
            return !!processing;
        };
    }

    return function (module) {
        var router = (module.router = module.router || module.injector.instantiate(['$app', '$window', Router]));
        module.on(module.events.READY, router.resolveUrl);
        return module.injector.val("$router", router);
    };
});