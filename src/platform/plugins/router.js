/* global plugins, exports, utils */
// use defer.js
(function () {

    function Router(module, $rootScope, $window) {
        var self = this,
            events = {
                CHANGE: 'router::change'
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
            utils.each.call({all: true}, state, addState);//expects each state to have an id
        }

        function addState(state, id) {
            state.id = id;
            states[id] = state;
            state.templateName = state.templateName || id;
            if (state.template) {
                module.set(state.templateName, state.template);
            }
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
                utils.each.call({all: true}, values, unusedParams, used, unusedUrlParams);
                if (unusedUrlParams.length) {
                    result.url = result.url.split('?').shift() + '?' + unusedUrlParams.join('&');
                }
            }
            return result;
        }

        function unusedParams(value, prop, list, used, unusedUrlParams) {
            if (!used[prop]) {
                unusedUrlParams.push(prop + '=' + value);
            }
        }

        function resolveUrl(evt, skipPush) {
            var url = cleanUrl($location.hash), state;
            if (url === (evt && evt.state && evt.state.url)) {
                skipPush = true;
            }
            state = getStateFromPath(url);
            if (!state) {
                url = self.otherwise;
                state = getStateFromPath(url);
            }
            var params = extractParams(state, url);
            go(state.id, params, skipPush);
        }

        function keyValues(key, index, list, result, parts) {
            if (key[0] === ':') {
                result[key.replace(':', '')] = parts[index];
            }
        }

        function urlKeyValues(str, result) {
            var parts = str.split('=');
            result[parts[0]] = parts[1];
        }

        function extractParams(state, url) {
            var parts = url.split('?'),
                searchParams = parts[1],
                result = {};
            parts = parts[0].split('/');
            utils.each.call({all: true}, state.url.split('/'), keyValues, result, parts);
            if (searchParams) {
                utils.each(searchParams.split('&'), urlKeyValues, result);
            }
            return result;
        }

        function doesStateMatchPath(state, url) {
            if (!url) {
                return;
            }
            var escUrl = state.url.replace(/[-[\]{}()*+?.,\\^$|#\s\/]/g, "\\$&");
            var rx = new RegExp("^" + escUrl.replace(/(:\w+)/, '\\w+') + "$", 'i');
            if (url.match(rx)) {
                return state;
            }
        }

        function getStateFromPath(url) {
            var state = utils.each(states, doesStateMatchPath, url.split('?').shift());
            if (state && state.url) {
                return state;
            }
            return null;
        }

        function go(stateName, params, skipPush) {
            var state = states[stateName], path = generateUrl(state.url, params), url = path.url || state.url;
            //TODO: resolve here.
            if (!skipPush) {
                if ($history.pushState) {
                    $history.pushState({url: url, params: params}, '', base + '#' + url);
                } else {
                    $location.hash = '#' + url;
                }
            }
            change(state, params);
        }

        function change(state, params) {
//            if (force || current !== state) {
                lastHashUrl = $location.href;
                prev = current;
                current = state;
//                console.log("change from %s to %o", prev, current);
                $rootScope.$broadcast(self.events.CHANGE, current, params);
//            }
        }

        function onHashCheck() {
            var hashUrl = $location.href;
            if (hashUrl !== lastHashUrl) {
//                console.log("Hash Change Detected");
                resolveUrl(null, true);
                lastHashUrl = hashUrl;
            }
        }
//TODO: need to make sure that the back button is working with all urls.
        exports.on($window, 'popstate', resolveUrl);
        exports.on($window, 'hashchange', onHashCheck);
        setInterval(onHashCheck, 100);// backup plan. make sure we catch if the url changes.

        self.events = events;
        self.go = $rootScope.go = go;
        self.otherwise = '/';
        self.add = add;
        self.remove = remove;
        self.states = states;
        $rootScope.$on("module::ready", resolveUrl);
    }

    plugins.router = function (module) {
        var result = (module.router = module.router || module.injector.instantiate(Router));
        return module.injector.set("router", result);
    };
}());