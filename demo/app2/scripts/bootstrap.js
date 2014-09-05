var module = app.framework.module('app');
module.directive('uiMain', function () {
    return {
        link: function (scope, el) {
            console.log('link here');
        }
    }
});
