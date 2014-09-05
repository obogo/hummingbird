/* global angular */
(function () {

    // TODO: Temporary
    var createdOn = new Date();
    createdOn.setMinutes(createdOn.getMinutes() - 10);

    var blast = angular.module('blast', ['ngSanitize']);

    blast.service('blastService', function ($http) {
        var scope = this;

        scope.init = function () {
            scope.user = 0;
            scope.autoScroll = true;
            scope.activeConversation = null;
            scope.conversations = [];
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

            scope.setState = setState;
            scope.getConversations = getConversations;
            scope.updateConversation = updateConversation;
            scope.addConversation = addConversation;

            setState('launcher');
        };

        function setState(state) {
            scope.state = state;
            scope.message = '';
        }

        function getConversations(callback) {
            if (scope.conversations.length) {
                if(callback) {
                    callback(scope.conversations);
                }
                return;
            }

            $http.get('http://localhost:3000/v1/conversations').then(function (response) {
                scope.conversations = response.data;
                if(callback) {
                    callback(response.data);
                }
            });
        }

        function updateConversation(conversation) {
            $http.put(conversation._id, conversation);
        }

        function addConversation(conversation) {
            $http.post(conversation);
        }

    }).run(function (blastService) {
        blastService.init();
    });

    blast.directive('blast', function () {
        return {
            scope: true,
            replace: true,
            templateUrl: 'templates/container.html',
            controller: function ($scope, blastService) {
                $scope.blastService = blastService;
            }
        };
    });

    blast.directive('blastLauncher', function () {
        return {
            scope: true,
            templateUrl: 'templates/launcher.html'
        };
    });

    blast.directive('blastConversationsList', function () {
        return {
            scope: true,
            templateUrl: 'templates/conversations-list.html',
            controller: function ($scope, blastService) {
                console.log('we are here');
                blastService.getConversations();
            }
        };
    });

    blast.directive('blastConversationsListItem', function () {
        return {
            scope: true,
            templateUrl: 'templates/conversations-list-item.html',
            controller: function ($scope, blastService) {
                $scope.setConversation = function (conversation) {
                    blastService.activeConversation = conversation;
                    blastService.setState('conversation');
                };
            }
        };
    });

    blast.directive('blastConversationNew', function () {
        return {
            scope: true,
            templateUrl: 'templates/conversation-new.html',
            controller: function ($scope, blastService) {

                // unread count
                $scope.unreadCount = 0;
                for (var e in blastService.conversations) {
                    if (!blastService.conversations[e].read) {
                        $scope.unreadCount += 1;
                    }
                }

                // empty messages
                $scope.messages = [];
            }
        };
    });

    blast.directive('blastConversationDetails', function () {
        return {
            scope: true,
            templateUrl: 'templates/conversation-details.html',
            controller: function ($scope, blastService) {
                blastService.activeConversation.read = true;
                $scope.unreadCount = 0;
                for (var e in blastService.conversations) {
                    if (!blastService.conversations[e].read) {
                        $scope.unreadCount += 1;
                    }
                }
            }
        };
    });

    blast.directive('blastConversationMessage', function () {
        return {
            scope: true,
            templateUrl: 'templates/conversation-message.html',
            controller: function ($scope, blastService) {
            }
        };
    });

    blast.directive('blastComposer', function () {

        function htmlify($text) {
            var tlnk = []; //Create an array to hold the potential links
            var hlnk = []; //Create an array to hold the HTML translation

            var ac, htm;

            // First, translate special characters to HTML
            $text = specialCharsToHtml($text);

            // Loop through the clear text
            var i = 0;
            for (i = 0; i < 4; i++) // Set ;i<20; to a reasonable limit here
            {
                // Get a potential link and mark where it came from
                $text = $text.replace(/(\S+\.\S+)/, '<' + i + '>'); // look for dots that are surrounded by non-whitespace characters
                tlnk[i] = RegExp.$1;
            } // EOLoop
            ac = i;

            //?** too many loops - need a break **
            // Loop through the array of potential links and make replacements
            for (i = 0; i < ac; i++) {
                // If this is a number, (e.g. 6.4sec; $5.00 etc.) OR too short; restore original and skip it
                if (tlnk[i].search(/\d\.\d/) > -1 || tlnk[i].length < 5) // Search for digit.digit OR len < 5 in this potential link
                {
                    $text = $text.replace('<' + i + '>', tlnk[i]);
                }
                else {
                    // Make this URL into a real link - move brackets and punctuation outside of the anchor tag
                    htm = linkify(tlnk[i]);
                    $text = $text.replace('<' + i + '>', htm);
                }
            }

            // Now put the breaks on
            $text = $text.replace(/\n/g, '<br/>');
            // And deal with multiple spaces
            $text = $text.replace(/\ \ /g, ' &nbsp;');
//            $text = $text.replace(/\s+/g, ' &nbsp;');
            // And any other specials
            $text = $text.replace(/"/g, '&quot;');
            $text = $text.replace(/\$/g, '&#36;');

            return $text;
        }

        function linkify(txt) // Make a real link from this potential link
        {
            txt = htmlToSpecialChars(txt); // Undo any html special characters in this link
            var i = 0, pN, ch, prea, posta, turl, tlnk, hurl;

            // Clean the front end
            pN = txt.length - 1;
            for (i = 0; i < pN; i++) {
                ch = txt.substr(i, 1); // Look at each character
                if (ch.search(/\w/) > -1) {
                    break;
                } // Stop looping when a word char is found
            }
            prea = txt.substring(0, i); // Copy the pre anchor stuff
            prea = specialCharsToHtml(prea); // Redo any html special characters in this link
            txt = txt.substr(i); // Trim the preamble from the link

            // Clean the trailing end
            for (i = pN; i > 0; i--) {
                ch = txt.substr(i, 1); // Look back at each character
                if (ch.search(/\w|_|-|\//) > -1) {
                    break;
                } // Loop until a legal trailing char is found
            }
            posta = txt.substring(i + 1); // Copy the post anchor stuff
            posta = specialCharsToHtml(posta); // Redo any html angle bracket codes in this link

            turl = txt.substring(0, i + 1); // and detach it from the rest - this is the legit URL

            // If the URL is an email address, link as a mailto:
            if (turl.search(/@/) > 0) {
                tlnk = '<a href="mailto:' + turl + '">' + turl + '</a>';
                return prea + tlnk + posta;
            }
            // Not a mailto, treat as a document URL
            hurl = '';
            if (turl.search(/\w+:\/\//) < 0) {
                hurl = 'http://';
            } // Add http:// if no xxxx:// already there
            tlnk = '<a href="' + hurl + turl + '">' + turl + '</a>';
            return prea + tlnk + posta;
        }

        function specialCharsToHtml(str) {
            str = str.replace(/&/g, '&amp;');
            str = str.replace(/</g, '&lt;'); // Convert angle brackets to HTML codes in string
            str = str.replace(/>/g, '&gt;');
            return str;
        }

        function htmlToSpecialChars(str) {
            str = str.replace(/&lt;/g, '<'); // Undo any angle bracket codes in this link
            str = str.replace(/&gt;/g, '>');
            str = str.replace(/&amp;/g, '&');
            return str;
        }

        return {
            scope: {
                messages: '=messages'
            },
            templateUrl: 'templates/composer.html',
            link: function (scope, element, attr) {
                scope.placeholder = attr.blastComposer;
            },
            controller: function ($scope, $element) {
                $scope.send = function () {
                    $scope.messages.push({
                        user: 1,
                        displayName: 'Rob Taylor',
                        text: htmlify($scope.text),
                        createdOn: Date.now()
                    });

                    $scope.text = '';

                    $element[0].querySelector('textarea').select();
                };

                $element[0].querySelector('textarea').select();
            }
        };
    });

    function fakeNgModel(initValue) {
        return {
            $setViewValue: function (value) {
                this.$viewValue = value;
            },
            $viewValue: initValue
        };
    }

    blast.directive('scrollGlue', function () {
        return {
            priority: 1,
            require: ['?ngModel'],
            restrict: 'A',
            link: function (scope, $el, attrs, ctrls) {

                var el = $el[0],
                    ngModel = ctrls[0] || fakeNgModel(true);

                function scrollToBottom() {
                    if (attrs.scrollGlue) {
                        var containerHeight = el.querySelector(attrs.scrollGlue).offsetHeight;
                        el.scrollTop = containerHeight - el.offsetHeight;
                    } else {
                        el.scrollTop = el.scrollHeight;
                    }
                }

                function shouldActivateAutoScroll() {
                    // + 1 catches off by one errors in chrome
                    return el.scrollTop + el.clientHeight + 1 >= el.scrollHeight;
                }

                scope.$watch(function () {
                    if (ngModel.$viewValue) {
                        scrollToBottom();
                    }
                });

                $el.bind('scroll', function () {
                    var activate = shouldActivateAutoScroll();
                    if (activate !== ngModel.$viewValue) {
                        scope.$apply(ngModel.$setViewValue.bind(ngModel, activate));
                    }
                });

            }
        };
    });

    blast.filter('blastTimeAgo', function () {

        var ago = ' ago';

        function timeAgo(date) {
            var interval, seconds;
            seconds = Math.floor((new Date() - date) / 1000);

            interval = Math.floor(seconds / 31536000);
            if (interval >= 1) {
                return interval + ' years' + ago;
            }

            interval = Math.floor(seconds / 2592000);
            if (interval >= 1) {
                return interval + ' months' + ago;
            }

            interval = Math.floor(seconds / 86400);
            if (interval >= 1) {
                return interval + ' days' + ago;
            }

            interval = Math.floor(seconds / 3600);
            if (interval >= 1) {
                return interval + ' hours' + ago;
            }

            interval = Math.floor(seconds / 60);
            if (interval >= 1) {
                return interval + ' mins' + ago;
            }

            interval = seconds < 0 ? 0 : Math.floor(seconds);

            if (interval <= 10) {
                return 'just now';
            }

            return interval + ' secs' + ago;
        }

        return function (date) {
            return timeAgo(date);
        };
    });

})();




