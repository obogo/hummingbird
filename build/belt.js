(function(exports, global) {
    global["belt"] = exports;
    var async = {};
    async.dispatcher = function(target, scope, map) {
        var listeners = {};
        function off(event, callback) {
            var index, list;
            list = listeners[event];
            if (list) {
                if (callback) {
                    index = list.indexOf(callback);
                    if (index !== -1) {
                        list.splice(index, 1);
                    }
                } else {
                    list.length = 0;
                }
            }
        }
        function on(event, callback) {
            listeners[event] = listeners[event] || [];
            listeners[event].push(callback);
            return function() {
                off(event, callback);
            };
        }
        function once(event, callback) {
            function fn() {
                off(event, fn);
                callback.apply(scope || target, arguments);
            }
            return on(event, fn);
        }
        function getListeners(event) {
            return listeners[event];
        }
        function fire(callback, args) {
            return callback && callback.apply(target, args);
        }
        function dispatch(event) {
            if (listeners[event]) {
                var i = 0, list = listeners[event], len = list.length;
                while (i < len) {
                    fire(list[i], arguments);
                    i += 1;
                }
            }
        }
        if (scope && map) {
            target.on = scope[map.on] && scope[map.on].bind(scope);
            target.off = scope[map.off] && scope[map.off].bind(scope);
            target.once = scope[map.once] && scope[map.once].bind(scope);
            target.dispatch = scope[map.dispatch].bind(scope);
        } else {
            target.on = on;
            target.off = off;
            target.once = once;
            target.dispatch = dispatch;
        }
        target.getListeners = getListeners;
    };
    var browser = {};
    browser.localStorage = function() {
        var api = {
            events: {
                WARNING: "localStorage:warning",
                ERROR: "localStorage:error"
            },
            UNSUPPORTED: "LOCAL_STORAGE_NOT_SUPPORTED"
        }, pfx = "global", prefix = pfx + ":";
        function browserSupportsLocalStorage() {
            try {
                return "localStorage" in window && window.localStorage !== null;
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
        }
        function localStorageEnabled() {
            try {
                var has = browserSupportsLocalStorage(), key = "__localStorageSupportTest__", r;
                if (has) {
                    r = Date.now().toString();
                    localStorage.setItem(key, r);
                    return localStorage.getItem(key) === r;
                }
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
        }
        function addToLocalStorage(key, value) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            if (!value && value !== 0 && value !== "") return false;
            try {
                localStorage.setItem(prefix + key, JSON.stringify(value));
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
            return true;
        }
        function getFromLocalStorage(key) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            var item = localStorage.getItem(prefix + key);
            if (!item) return null;
            return JSON.parse(item);
        }
        function removeFromLocalStorage(key) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            try {
                localStorage.removeItem(prefix + key);
            } catch (e) {
                api.dispatch(api.events.ERROR, e.Description);
                return false;
            }
            return true;
        }
        function getAllFromLocalStorageByPrefix(localPrefix) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            var prefixKey = prefix + (localPrefix || ""), prefixKeyLength = prefixKey.length, prefixLength = prefix.length, localKey, result = {};
            for (var key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.substr(0, prefixKeyLength) === prefixKey) {
                    localKey = key.substr(prefixLength);
                    result[localKey] = getFromLocalStorage(localKey);
                }
            }
            return result;
        }
        function clearAllFromLocalStorage(pattern) {
            if (!browserSupportsLocalStorage()) {
                api.dispatch(api.events.WARNING, api.UNSUPPORTED);
                return false;
            }
            var prefixLength = prefix.length;
            for (var key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.substr(0, prefixLength) === prefix && (!pattern || key.substr(prefixLength).match(pattern))) {
                    try {
                        removeFromLocalStorage(key.substr(prefixLength));
                    } catch (e) {
                        api.dispatch(api.events.ERROR, e.Description);
                        return false;
                    }
                }
            }
            return true;
        }
        api.prefix = function(value) {
            if (value !== undefined) {
                pfx = value;
                prefix = pfx + ":";
            }
            return pfx;
        };
        api.isSupported = browserSupportsLocalStorage;
        api.enabled = localStorageEnabled;
        api.put = addToLocalStorage;
        api.get = getFromLocalStorage;
        api.getAll = getAllFromLocalStorageByPrefix;
        api.remove = removeFromLocalStorage;
        api.clearAll = clearAllFromLocalStorage;
        async.dispatcher(api);
        return api;
    }();
    var timers = {};
    timers.Stopwatch = function(options) {
        options = options || {};
        var scope = this, timer, _currentTime = 0, currentTime = 0, countdownTime = 0, startTime = options.startTime || 0, endTime = options.endTime || 0, tick = options.tick || 1e3, frequency = 10;
        function init() {
            scope.options = options;
            countdownTime = endTime;
            setupTimer();
            setupDispatcher();
            setupAPI();
            setupListeners();
            setTimeout(function() {
                scope.dispatch(timers.Stopwatch.events.READY);
            });
        }
        function setupTimer() {
            timer = new timers.Timer({
                frequency: frequency
            });
        }
        function setupDispatcher() {
            async.dispatcher(scope);
        }
        function setupAPI() {
            scope.start = start;
            scope.stop = stop;
            scope.reset = reset;
            scope.getTime = getTime;
            scope.getCountdown = getCountdown;
            scope.getTimeRemaining = getTimeRemaining;
            scope.getState = getState;
        }
        function setupListeners() {
            timer.on("start", onStart);
            timer.on("change", onChange);
            timer.on("stop", onStop);
            timer.on("reset", onReset);
        }
        function getTime() {
            var time = Math.floor(currentTime / tick) * tick;
            return time + startTime;
        }
        function getCountdown() {
            return countdownTime;
        }
        function getTimeRemaining() {
            var time = getTime();
            if (endTime) {
                return endTime - time;
            }
            return 0;
        }
        function roundTime(time) {
            return Math.floor(time / tick) * tick;
        }
        function getState() {
            return timer.current;
        }
        function updateTime(time) {
            currentTime = roundTime(time);
            if (endTime) {
                countdownTime = endTime - currentTime;
            }
        }
        function start() {
            if (getState() === "ready") {
                timer.start();
            }
        }
        function stop() {
            timer.stop();
        }
        function reset() {
            timer.reset();
        }
        function onStart(evt, time) {
            updateTime(time);
            scope.dispatch(timers.Stopwatch.events.START);
        }
        function onChange(evt, time) {
            _currentTime = currentTime;
            updateTime(time);
            if (_currentTime !== currentTime) {
                _currentTime = currentTime;
                scope.dispatch(timers.Stopwatch.events.CHANGE);
                if (endTime) {
                    if (getTime() >= endTime) {
                        onDone(evt, time);
                    }
                }
            }
        }
        function onStop(evt, time) {
            updateTime(time);
            scope.dispatch(timers.Stopwatch.events.STOP);
        }
        function onReset(evt, time) {
            updateTime(time);
            scope.dispatch(timers.Stopwatch.events.RESET);
        }
        function onDone(evt, time) {
            done = true;
            scope.dispatch(timers.Stopwatch.events.DONE);
            timer.stop();
        }
        init();
    };
    timers.Stopwatch.events = {
        READY: "ready",
        START: "start",
        STOP: "stop",
        RESET: "reset",
        CHANGE: "change",
        DONE: "done",
        ERROR: "error"
    };
    timers.Timer = function(options) {
        var scope = this, startTime = 0, totalTime = 0, elapsedTime = 0, timer;
        function init() {
            setupStateMachine();
            setupDispatcher();
        }
        function setupStateMachine() {
            patterns.StateMachine.create({
                target: scope,
                initial: "ready",
                error: onError,
                events: [ {
                    name: "start",
                    from: "ready",
                    to: "running"
                }, {
                    name: "start",
                    from: "stop",
                    to: "running"
                }, {
                    name: "stop",
                    from: "running",
                    to: "stop"
                }, {
                    name: "reset",
                    from: "stop",
                    to: "ready"
                } ],
                callbacks: {
                    onafterstart: onStart,
                    onafterstop: onStop,
                    onafterreset: onReset
                }
            });
        }
        function setupDispatcher() {
            async.dispatcher(scope);
        }
        function onStart() {
            startTime = Date.now();
            timer = setInterval(function() {
                elapsedTime = getTime();
                scope.dispatch(timers.Timer.events.CHANGE, getTotalTime());
            }, options.frequency || 1e3);
            scope.dispatch(timers.Timer.events.START, totalTime);
        }
        function onStop() {
            clearInterval(timer);
            elapsedTime = getTime();
            totalTime += elapsedTime;
            scope.dispatch(timers.Timer.events.STOP, totalTime);
        }
        function onReset() {
            totalTime = 0;
            scope.dispatch(timers.Timer.events.RESET, totalTime);
        }
        function onError(eventName, from, to, args, errorCode, errorMessage) {
            scope.dispatch(timers.Timer.events.ERROR, {
                name: eventName,
                from: from,
                to: to,
                args: args,
                errorCode: errorCode,
                errorMessage: errorMessage
            });
        }
        function getTime() {
            if (scope.current === "ready") {
                return 0;
            }
            return Date.now() - startTime;
        }
        function getTotalTime() {
            var elapsedTime = getTime();
            return totalTime + elapsedTime;
        }
        scope.getTime = getTime;
        scope.getTotalTime = getTotalTime;
        init();
    };
    timers.Timer.events = {
        START: "start",
        STOP: "stop",
        RESET: "reset",
        CHANGE: "change",
        ERROR: "error"
    };
    exports["async"] = async;
    exports["browser"] = browser;
    exports["timers"] = timers;
})({}, function() {
    return this;
}());