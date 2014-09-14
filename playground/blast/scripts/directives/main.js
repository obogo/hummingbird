/* global module, console */
module.directive('main', function (model) {
    return {
        link: function (scope, el) {
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
                if(evt.animationName !== 'bounceIn') {
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