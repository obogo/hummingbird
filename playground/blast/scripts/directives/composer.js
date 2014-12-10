/* global module, hb */
module.directive('blastComposer', function (model) {

    var htmlify = hb.utils.parsers.htmlify;

    return {
        scope: true,
        link: function (scope, el) {
            var messages = model.activeConversation.messages;
            scope.text = '';

            scope.send = function () {
                var message = {
                    user: model.user._id,
                    displayName: model.user.displayName,
                    text: htmlify(scope.text),
                    createdOn: Date.now()
                };

                messages.push(message);

                scope.text = '';

//                el.querySelector('textarea').select();

                scope.$emit('message::added', message);
            };

//            el.querySelector('textarea').select();
        }
    };
});