/* global module, hb */
module.directive('composer', function (model) {

    var htmlify = hb.utils.parsers.htmlify;

    return {
        scope: true,
        link: function (scope, el) {
//                console.log('blastComposer');
            var messages = model.activeConversation.messages;
            scope.text = '';

            scope.send = function () {
                messages.push({
                    user: 1,
                    displayName: 'Rob Taylor',
                    text: htmlify(scope.text),
                    createdOn: Date.now()
                });

                console.log('messages', messages);
                scope.text = '';

                el.querySelector('textarea').select();
            };

            el.querySelector('textarea').select();
        }
    };
});