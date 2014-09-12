/* global app, query */
hummingbird.directives.ignore = function (module) {
    module.directive(module.name + 'ignore', function () {
        return {
            scope: true,
            link: function (scope, el, alias) {
                scope.$ignore(true);
            }
        };
    });
};
