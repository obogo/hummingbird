/* global module, console */
module.directive('main', function (model) {
    return {
        link: function (scope, el) {
            scope.blastService = model;

            model.getConversations();

            scope.launch = function () {
                if (model.conversations.length) {
                    model.setState('conversations');
                } else {
                    model.createNewConversation();
                }
            };

            scope.setConversation = function (conversation) {
                model.activeConversation = conversation;
                model.setState('conversation-details');
            };

//                scope.toggleShow = function(){
//                    BlastService.show = !BlastService.show;
//                };
//
            scope.$on('service::changed', function (event, value) {
                console.log('main service changed', value);
//                    scope.$apply();
            });
        }
    };
});