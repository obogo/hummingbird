/* global module */
module.directive('header', function (model) {
    return {
        scope: true,
        link: function (scope, el) {
            if (model.activeConversation) {
                model.activeConversation.read = true;
                scope.unreadCount = 0;
                for (var e in model.conversations) {
                    if (!model.conversations[e].read) {
                        scope.unreadCount += 1;
                    }
                }
                scope.$apply();
            }
        }
    };
});