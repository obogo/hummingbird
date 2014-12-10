/* global directives, utils */
directives.ignore = function (module) {
    module.directive('hbIgnore', function () {
        return {
            scope: true,
            link: function (scope, el, alias) {
                scope.$ignore(true);
            }
        };
    });
};
