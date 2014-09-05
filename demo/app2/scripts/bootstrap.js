/* global obogo */
(function () {
    var framework = obogo.app.framework;
    var $ = obogo.query;
    var cors = obogo.ajax.cors;

    var module = framework.module('app');

    module.service('DataService', function () {
        var scope = this;
        scope.name = 'World';
        scope.show = true;

        var $rootScope = module.get('$rootScope');

        cors.get('https://freegeoip.net/json/98.202.127.113', function (response) {
            var data = JSON.parse(response);
            scope.name = data.region_name;
            $rootScope.$broadcast('service::changed', scope.name);
        });

    });

    module.filter('upper', function () {
        return function (val) {
            return (val + '').toUpperCase();
        };
    });

    module.directive('goCloak', function () {
        return {
            link: function (scope, el) {
                el.removeAttribute('go-cloak');
            }
        };
    });

    module.directive('goShow', function () {
        return {
            link: function (scope, el) {

                var modelName = el.getAttribute('go-show');

                scope.$watch(modelName, function (newVal) {
                    if(newVal) {
                        $(el).css('display', null);
                    } else {
                        $(el).css('display', 'none');
                    }
                });

            }
        };
    });

    module.directive('goModel', function () {
        return {
            link: function (scope, el) {

                var modelName = el.getAttribute('go-model');

                scope.$watch(modelName, function (newVal) {
                    el.value = newVal;
                });

                function eventHandler(evt) {
                    scope.$resolve(modelName, el.value);
                    scope.$apply();
                }

                $(el).bind('change keyup blur', eventHandler);

                scope.$on('$destroy', function () {
                    $(el).unbindAll();
                });
            }
        };
    });

    module.directive('uiMain', function (DataService) {
        return {
            link: function (scope, el) {
                scope.dataService = DataService;

                scope.toggleShow = function(){
                    DataService.show = !DataService.show;
                };

                scope.$on('service::changed', function (event, value) {
                    scope.$apply();
                });
            }
        };
    });

})();
