/* global module, console, hb */
module.directive('main', function (model) {
    return {
        link: function (scope, el) {
            scope.isMobile = hb.utils.browser.isMobile;
//            scope.isMobile.any = true;
            if(scope.isMobile.any) {
                scope.scrollDelay = 500;
//                scope.scrollDuration = 0;
            }
            scope.blastService = model;

            model.getUser();
            model.getConversations();

            scope.launch = function () {
                model.newMessage = null;
                if (model.conversations.length) {
                    model.setState('conversations');
                } else {
                    model.createNewConversation();
                }
            };

            scope.setConversation = function (conversation) {
                conversation.read = true;
                model.activeConversation = conversation;
                model.setState('conversation-details');
            };

            scope.removeNewMessage = function(evt){
                if(evt.animationName !== 'bounceInUp') {
                    scope.startAnime = false;
                    model.newMessage = null;
                }
            };

            scope.closeNewMessage = function (evt) {
                evt.stopPropagation();
                scope.startAnime = true;
            };

            scope.$on('service::changed', function (event, value) {
                console.log('main service changed', value);
//                    scope.$apply();
            });

        }
    };
});