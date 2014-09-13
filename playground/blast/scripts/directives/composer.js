/* global module, hb */
module.directive('composer', function (model) {

    var htmlify = hb.utils.parsers.htmlify;

    return {
        scope: true,
        link: function (scope, el) {
            var messages = model.activeConversation.messages;
            scope.text = '';

            scope.send = function () {
                var message = {
                    user: 1,
                    displayName: 'Rob Taylor',
                    text: htmlify(scope.text),
                    createdOn: Date.now()
                };

                messages.push(message);

                scope.text = '';

                el.querySelector('textarea').select();

                scope.$broadcast('message::created', message);
            };

            el.querySelector('textarea').select();
        }
    };
});