/* global directives, utils */
directives.ignore = function (module) {
    module.directive('ignore', function () {
        return {
            scope: true,
            link: function (scope, el, alias) {
                scope.$ignore(true);
            }
        };
    });
};
