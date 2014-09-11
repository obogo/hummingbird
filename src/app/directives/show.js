/* global app, query */
app.directives.show = function (module) {
    module.directive(module.name + 'show', function () {
        return {
            scope: true,
            link: function (scope, el, alias) {
                var enabled = true;
                scope.$watch(
                    alias.value,
                    function (newVal, oldVal) {
                        if (newVal) {
                            enabled = false;
                            el.style.display = 'none';
                        } else {
                            enabled = true;
                            el.style.display = null;
                        }
                    },
                    function (newVal, oldVal) {
                        return enabled;
                    });
            }
        };
    });
};
