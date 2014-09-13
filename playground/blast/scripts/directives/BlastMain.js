/* global module, console */
module.directive('blastMain', function (BlastService) {
    return {
        link: function (scope, el) {
            scope.blastService = BlastService;

            BlastService.getConversations();

            scope.launch = function () {
                if (BlastService.conversations.length) {
                    BlastService.setState('conversations');
                } else {
                    BlastService.createNewConversation();
                }
            };

            scope.setConversation = function (conversation) {
                BlastService.activeConversation = conversation;
                BlastService.setState('conversation-details');
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