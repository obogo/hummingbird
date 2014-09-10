/* global app */
(function () {

    app.directives.show = function (module, namespace) {

        namespace = namespace || app.consts.PREFIX;

        module.directive(namespace + 'show', function (module) {
            return {
                scope: true,
                link: function (scope, el, alias) {
                    var enabled = true;

                    function enable() {
                        if (!enabled) {
                            enabled = true;
                            moveListeners(scope.$$$listeners, scope.$$listeners);
                            scope.$$childHead = scope.$$$childHead;
                            scope.$$childTail = scope.$$$childTail;
                            el.style.display = null;
                        }
                    }

                    function disable() {
                        if (enabled) {
                            enabled = false;
                            moveListeners(scope.$$listeners, scope.$$$listeners);
                            scope.$$$childHead = scope.$$childHead;
                            scope.$$childHead = null;
                            scope.$$$childTail = scope.$$childTail;
                            scope.$$childTail = null;
                            el.style.display = 'none';
                        }
                    }

                    function moveListeners(list, target) {
                        var i = 0, len = list.length;
                        while (i < len) {
                            if (!list[i].keep) {
                                target.push(list.splice(i, 1));
                                i -= 1;
                                len -= 1;
                            }
                            i += 1;
                        }
                    }

                    scope.$watch(alias.value, function (newVal, oldVal) {
                        if (newVal) {
                            enable();
                        } else {
                            disable();
                        }
                    });
                    scope.$$watchers[0].keep = true;
                    scope.$$$listeners = [];

                    scope.$on('$destroy', function () {
                        scope.enable();
                        delete scope.$$$listeners;
                    });
                }
            };
        });
    };

})();
