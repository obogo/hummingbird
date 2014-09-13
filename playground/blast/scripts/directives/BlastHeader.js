/* global module */
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