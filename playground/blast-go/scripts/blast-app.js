/* global obogo */
(function () {
    var framework = obogo.app.framework;
    var $ = obogo.query;
    var cors = obogo.ajax.cors;

    var module = framework.module('blast');

    module.service('BlastService', function () {
        var scope = this;
        scope.state = 'launcher';

        var createdOn = new Date();

        scope.conversations = [
            {
                read: false,
                user: 1,
                company: {
                    name: 'Moxy'
                },
                displayName: 'Jim Bo',
                profile: {
                    firstName: 'Jim',
                    lastName: 'Bo'
                },
                avatar: 'images/gd2.jpg',
                summary: 'Hi Sally, Have you opted into the waiting list? We\'re slowly rolling it out to all our users at the minute but',
                messages: [
                    { user: 1, displayName: 'Rob Taylor', text: 'Hello, world', createdOn: createdOn },
                    { user: 2, displayName: 'Jim Bo',
                        text: '<p>Hi Rob,</p>' +
                            '<p>Have you opted into the waiting list? We\'re slowly rolling it out to all our users at' +
                            'the minute but once you have opted in you should get access in the next few' +
                            'days. </p>' +
                            '<p>If you haven\'t opted in you can do so here - <br>' +
                            '<a href="https://app.intercom.io/inapps_optin" rel="nofollow" target="_blank">https://app.intercom.io/inapps_optin</a>' +
                            '</p>' +
                            '<p>Regards,<br>' +
                            'Martin</p>',
                        createdOn: createdOn },
                    { user: 1, displayName: 'Rob Taylor 1', text: 'Goodbye 1', createdOn: createdOn }
                ],
                lastUpdatedOn: Date.now()
            },
            {
                read: false,
                user: 1,
                company: 'Moxy',
                displayName: 'Jim Bo',
                profile: {
                    firstName: 'Jim',
                    lastName: 'Bo'
                },
                avatar: 'images/gd2.jpg',
                summary: 'Hi Rob, Have you opted into the waiting list? We\'re slowly rolling it out to all our users at the minute but',
                messages: [
                    { user: 1, displayName: 'Rob Taylor', text: 'Hello, world', createdOn: createdOn },
                    { user: 2, displayName: 'Jim Bo', text: 'Hello, again', createdOn: createdOn },
                    { user: 1, displayName: 'Rob Taylor 1', text: 'Goodbye 2', createdOn: createdOn }
                ],
                lastUpdatedOn: Date.now()
            },
            {
                read: true,
                user: 1,
                company: 'Moxy',
                displayName: 'Jim Bo',
                profile: {
                    firstName: 'Jim',
                    lastName: 'Bo'
                },
                avatar: 'images/gd2.jpg',
                summary: 'Hi Mike, Have you opted into the waiting list? We\'re slowly rolling it out to all our users at the minute but',
                messages: [
                    { user: 1, displayName: 'Rob Taylor', text: 'Hello, world', createdOn: createdOn },
                    { user: 2, displayName: 'Jim Bo', text: 'Hello, again', createdOn: createdOn },
                    { user: 1, displayName: 'Rob Taylor 1', text: 'Goodbye 3', createdOn: createdOn }
                ],
                lastUpdatedOn: Date.now()
            },
            {
                read: true,
                user: 1,
                company: 'Moxy',
                displayName: 'Jim Bo',
                profile: {
                    firstName: 'Jim',
                    lastName: 'Bo'
                },
                avatar: 'images/gd2.jpg',
                summary: 'Hi Lori, Have you opted into the waiting list? We\'re slowly rolling it out to all our users at the minute but',
                messages: [
                    { user: 1, displayName: 'Rob Taylor', text: 'Hello, world', createdOn: createdOn },
                    { user: 2, displayName: 'Jim Bo', text: 'Hello, again', createdOn: createdOn },
                    { user: 1, displayName: 'Rob Taylor 1', text: 'Goodbye 4', createdOn: createdOn }
                ],
                lastUpdatedOn: Date.now()
            }
        ];

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

    module.directive('blastMain', function (BlastService) {
        return {
            link: function (scope, el) {
                scope.blastService = BlastService;

//                scope.toggleShow = function(){
//                    BlastService.show = !BlastService.show;
//                };
//
//                scope.$on('service::changed', function (event, value) {
//                    scope.$apply();
//                });
            }
        };
    });

})();
