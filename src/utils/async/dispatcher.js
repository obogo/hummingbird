/**
 * ##dispatcher##
 * Behavior modifier for event dispatching.
 * @param {Object} target - the object to apply the methods to.
 * @param {Object} scope - the object that the methods will be applied from
 * @param {object} map - custom names of what methods to map from scope. such as _$emit_ and _$broadcast_.
 */

define('dispatcher', ['apply'], function (apply) {

    var dispatcher = function (target, scope, map) {
        target = target || {};
        var listeners = {};

        /**
         * ###off###
         * removeEventListener from this object instance. given the event listened for and the callback reference.
         * @param event
         * @param callback
         */
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

        /**
         * ###on###
         * addEventListener to this object instance.
         * @param {String} event
         * @param {Function} callback
         * @returns {Function} - removeListener or unwatch function.
         */
        function on(event, callback) {
            listeners[event] = listeners[event] || [];
            listeners[event].push(callback);
            return function () {
                off(event, callback);
            };
        }

        /**
         * ###once###
         * addEventListener that gets remove with the first call.
         * @param event
         * @param callback
         * @returns {Function} - removeListener or unwatch function.
         */
        function once(event, callback) {
            function fn() {
                off(event, fn);
                apply(callback, scope || target, arguments);
            }

            return on(event, fn);
        }

        /**
         * ###getListeners###
         * get the listeners from the dispatcher.
         * @param {String} event
         * @param {Boolean} strict
         * @returns {*}
         */
        function getListeners(event, strict) {
            var list, a = '*';
            if (event || strict) {
                list = [];
                if (listeners[a]) {
                    list = listeners[a].concat(list);
                }
                if (listeners[event]) {
                    list = listeners[event].concat(list);
                }
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
            var list = getListeners(event, true), len = list.length, i;
            if (len) {
                for (i = 0; i < len; i += 1) {
                    fire(list[i], arguments);
                }
            }
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
