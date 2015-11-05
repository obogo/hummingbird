//! pattern /hb\-resizable(\s|\=|>)/
define('hb.resizable', ['hb.directive', 'resizable'], function(directive, resizable) {
    directive('hbResizable', function() {
        return {
            link: ['scope', 'el', function(scope, el) {
                var item = resizable(el);
                var unwatchers = [];
                var $emit = scope.$emit.bind(scope);
                unwatchers.push(item.on(item.events.RESIZABLE_DRAG, $emit));
                unwatchers.push(item.on(item.events.RESIZABLE_DRAG_START, $emit));
                unwatchers.push(item.on(item.events.RESIZABLE_DRAG_STOP, $emit));

                scope.$on('$destroy', function() {
                    while(unwatchers.length) {
                        unwatchers.pop()();
                    }
                    item.destroy();
                    item = null;
                })
            }]
        }
    });
});