/* global module, hb, console */
module.service('model', function ($rootScope, http) {
    var scope = this;
//    var http = hb.utils.ajax.http;
    scope.state = 'launcher';
    scope.activeConversation = null;
    scope.user = null;
    scope.conversations = [];

    setTimeout(function () {
        scope.newMessage = 'Hey there. Just got your message. Yeah, I would love to answer...';
        $rootScope.$apply();
    }, 2000);

    scope.getUser = function () {
        http.get('user.json', function (response) {
            scope.user = JSON.parse(response);
            $rootScope.$apply();
        });
    };

    scope.getConversations = function () {
        http.get('conversations.json', function (response) {
            scope.conversations = JSON.parse(response);
            $rootScope.$apply();
        });
    };

    scope.getUnreadCount = function () {
        var unreadCount = 0;
        var convs = scope.conversations;
        for (var e in convs) {
            if (!convs[e].read) {
                unreadCount += 1;
            }
        }
        return unreadCount;
    };

    scope.createNewConversation = function () {
        var self = this;
        scope.activeConversation = {
            read: false,
            user: self.user,
            company: {
                name: 'Moxy'
            },
            displayName: 'Rob Taylor',
            profile: {
                firstName: 'Rob',
                lastName: 'Taylor'
            },
            avatar: 'images/gd2.jpg',
            summary: '',
            messages: []
        };
        this.setState('conversation-new');
    };

    scope.setState = function (state) {
        scope.state = state;
//            console.log('state', state);
    };

//        cors.get('https://freegeoip.net/json/98.202.127.113', function (response) {
//            var data = JSON.parse(response);
//            scope.name = data.region_name;
////            console.log('name', scope.name);
//            console.log(JSON.stringify(scope.conversations));
//            $rootScope.$broadcast('service::changed', scope.name);
//        });

});