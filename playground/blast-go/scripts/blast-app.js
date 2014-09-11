/* global obogo */
(function () {
    var $ = obogo.query;
    var cors = obogo.ajax.cors;

    var module = obogo.app.module('blast');

    module.set('launcher', document.getElementById('blast-launcher-template').innerHTML);
    module.set('conversations', document.getElementById('blast-conversations-template').innerHTML);
    module.set('conversation-new', document.getElementById('blast-conversation-new-template').innerHTML);
    module.set('conversation-details', document.getElementById('blast-conversation-details-template').innerHTML);

    module.service('BlastService', function ($rootScope) {
        var scope = this;
        scope.state = 'launcher';

        var createdOn = new Date();

        scope.user = 1;

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

        scope.setState = function (state) {
            scope.state = state;
//            console.log('state', state);
        };

        cors.get('https://freegeoip.net/json/98.202.127.113', function (response) {
            var data = JSON.parse(response);
            scope.name = data.region_name;
            $rootScope.$broadcast('service::changed', scope.name);
        });

    });

    obogo.app.directives(module, 'app class cloak disabled events html model repeat show src view');
    obogo.app.filters(module, 'timeAgo');

    module.directive('blastMain', function (BlastService) {
        return {
            link: function (scope, el) {
                scope.blastService = BlastService;

                scope.setConversation = function (conversation) {
//                    console.log('setConversation', conversation);
                    BlastService.activeConversation = conversation;
                    BlastService.setState('conversation-details');
                };

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

    module.directive('blastConversationDetails', function (BlastService) {
        return {
            link: function (scope, el) {
//                console.log('ac', BlastService.activeConversation);
//                BlastService.activeConversation.read = true;
            }
        };
    });

    module.directive('blastHeader', function (BlastService) {
        return {
            scope: true,
            link: function (scope, el) {
                if (BlastService.activeConversation) {
                    BlastService.activeConversation.read = true;
                    scope.unreadCount = 0;
                    for (var e in BlastService.conversations) {
                        if (!BlastService.conversations[e].read) {
                            scope.unreadCount += 1;
                        }
                    }
                    scope.$apply();
                }
            }
        };
    });

    module.directive('blastComposer', function () {

        var htmlify = obogo.parsers.htmlify;

        return {
            scope: true,
            link: function (scope, el) {
//                console.log('blastComposer');

                scope.text = '';

                scope.send = function () {
                    scope.messages.push({
                        user: 1,
                        displayName: 'Rob Taylor',
                        text: htmlify(scope.text),
                        createdOn: Date.now()
                    });

                    scope.text = '';

                    el.querySelector('textarea').select();
                };

                el.querySelector('textarea').select();
            }
        };
    });

})();
