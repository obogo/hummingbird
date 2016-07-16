/**
 * ##dispatcher##
 * Behavior modifier for event dispatching.
 * @param {Object} target - the object to apply the methods to.
 * @param {Object} scope - the object that the methods will be applied from
 * @param {object} map - custom names of what methods to map from scope. such as _$emit_ and _$broadcast_.
 */

define('dispatcher', ['apply', 'isFunction', 'dispatcherEvent'], function (apply, isFunction, Event) {

    function validateEvent(e) {
        if (!e) {
            throw Error('event cannot be undefined');
        }
    }

    var dispatcher = function (target, scope, map) {
        // if you try to make the same item a dispatcher, it will just do nothing.
        if (target && target.on && target.on.dispatcher) {
            return target;// it is already a dispatcher.
        }
        target = target || {};
        var listeners = {};

        function getIndexOfListener(event, callback) {
            var list = listeners[event];
            if (list) {
                for (var i = 0; i < list.length; i += 1) {
                    if (list[i].cb === callback) {
                        return i;
                    }
                }
            }
            return -1;
        }

        /**
         * ###off###
         * removeEventListener from this object instance. given the event listened for and the callback reference.
         * @param event
         * @param callback
         */
        function off(event, callback) {
            validateEvent(event);
            var index = getIndexOfListener(event, callback), list = listeners[event];
            if (index !== -1) {
                list.splice(index, 1);
            }
            //var index, list;
            //list = listeners[event];
            //if (list) {
            //    if (callback) {
            //        index = list.indexOf(callback);
            //        if (index !== -1) {
            //            list.splice(index, 1);
            //        }
            //    } else {
            //        list.length = 0;
            //    }
            //}
        }

        /**
         * ###on###
         * addEventListener to this object instance.
         * @param {String} event
         * @param {Function} callback
         * @param {int=10} priority
         * @returns {Function} - removeListener or unwatch function.
         */
        function on(event, callback, priority) {
            if(isFunction(callback)) {
                validateEvent(event);
                listeners[event] = listeners[event] || [];
                listeners[event].push({cb:callback, priority:priority !== undefined ? priority : 10});
                listeners[event].sort(prioritySort);// sorts the objects lowest priority first.
                return function () {
                    off(event, callback);
                };
            }
        }
        on.dispatcher = true;

        /**
         * ###once###
         * addEventListener that gets remove with the first call.
         * @param {String} event
         * @param {Function} callback
         * @param {int=10} priority
         * @returns {Function} - removeListener or unwatch function.
         */
        function once(event, callback, priority) {
            if(isFunction(callback)) {
                validateEvent(event);
                function fn() {
                    off(event, fn);
                    apply(callback, scope || target, arguments);
                }

                return on(event, fn, priority);
            }
        }

        /**
         * @param {{cb:Function, priority:int}} a
         * @param {{cb:Function, priority:int}} b
         * @returns {number}
         */
        function prioritySort(a, b) {
            return a.priority - b.priority;
        }

        /**
         * @param {{cb:Function, priority:int}} item
         * @param {int} number
         * @param {Array} list
         */
        function mapListeners(item, number, list) {
            list[number] = item.cb;
        }

        /**
         * ###getListeners###
         * get the listeners from the dispatcher.
         * @param {String} event
         * @param {Boolean} strict
         * @returns {*}
         */
        function getListeners(event, strict) {
            validateEvent(event);
            var list, a = '*';
            if (event || strict) {
                list = [];
                if (listeners[a]) {
                    list = listeners[a].concat(list);
                }
                if (listeners[event]) {
                    list = listeners[event].concat(list);
                }
                list.map(mapListeners);// We need to return just the callbacks not the objects.
                return list;
            }
            return listeners;
        }

        function removeAllListeners() {
            listeners = {};
        }

        /**
         * ###fire###
         * fire the callback with arguments.
         * @param {Function} callback
         * @param {Array} args
         * @returns {*}
         */
        function fire(callback, args) {
            return callback && apply(callback, target, args);
        }

        /**
         * ###dispatch###
         * fire the event and any arguments that are passed.
         * @param {String} event
         */
        function dispatch(event) {
            validateEvent(event);
            var list = getListeners(event, true), len = list.length, i, event = typeof event === 'object' ? event : new Event(event);
            if (len) {
                arguments[0] = event;
                for (i = 0; i < len; i += 1) {
                    if (!event.immediatePropagationStopped) {
                        fire(list[i], arguments);
                    }
                }
            }
            return event;
        }

        if (scope && map) {
            target.on = scope[map.on] && scope[map.on].bind(scope);
            target.off = scope[map.off] && scope[map.off].bind(scope);
            target.once = scope[map.once] && scope[map.once].bind(scope);
            target.dispatch = target.fire = scope[map.dispatch].bind(scope);
        } else {
            target.on = on;
            target.off = off;
            target.once = once;
            target.dispatch = target.fire = dispatch;
        }
        target.getListeners = getListeners;
        target.removeAllListeners = removeAllListeners;

        return target;
    };

    return dispatcher;

});
