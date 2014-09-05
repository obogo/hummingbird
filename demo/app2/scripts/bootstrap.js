(function () {
    var framework = obogo.app.framework;
    var query = obogo.query;
    var cors = obogo.ajax.cors;

    var module = framework.module('app');

    module.service('DataService', function () {
        var scope = this;
        scope.name = 'World';

        var $rootScope = module.get('$rootScope');

        cors.get('https://freegeoip.net/json/98.202.127.113', function (response) {
            var data = JSON.parse(response);
            scope.name = data.region_name;
            $rootScope.$broadcast('service::changed', scope.name);
        })

    });

    module.filter('upper', function () {
        return function (val) {
            return (val + '').toUpperCase();
        }
    });

    module.directive('goCloak', function () {
        return {
            link: function (scope, el) {
                el.removeAttribute('go-cloak');
            }
        }
    });

    module.directive('goModel', function () {
        return {
            link: function (scope, el) {

                var modelName = el.getAttribute('go-model'),
                    modelValue = '';

                scope.$watch(function () {
                        return modelValue;
                    },
                    function (newVal, oldVal) {
                        scope.$resolve(modelName, newVal);
                    });

                function eventHandler(evt) {
                    modelValue = evt.target.value;
                    scope.$apply();
                }

                query(el).bind('change keyup blur', eventHandler);

                scope.$on('$destroy', function () {
                    query(el).unbindAll();
                });
            }
        }
    });

    module.directive('uiMain', function (DataService) {
        return {
            link: function (scope, el) {
                scope.dataService = DataService;

                scope.$on('service::changed', function (event, value) {
                    scope.$apply();
                });
            }
        }
    });

})();
