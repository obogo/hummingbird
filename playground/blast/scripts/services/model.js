/* global module, hb, console */
module.service('model', function ($rootScope) {
    var scope = this;
    var cors = hb.utils.ajax.cors;

    scope.state = 'launcher';

    scope.activeConversation = null;

    var createdOn = new Date();

    scope.user = 1;

    scope.conversations = [];

    scope.getConversations = function () {
        cors.get('conversations.json', function (response) {
            scope.conversations = JSON.parse(response);
//                scope.name = data.region_name;
//                console.log('name', scope.name);
//                console.log(JSON.stringify(scope.conversations));
//            $rootScope.$broadcast('service::changed', scope.name);
        });
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