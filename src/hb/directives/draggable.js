//! pattern /hb\-resizable(\s|\=|>)/
define('hb.draggable', ['hb.directive', 'draggable'], function(directive, draggable) {
    directive('hbDraggable', function() {
        return {
            link: ['scope', 'el', 'alias', function(scope, el, alias) {
                var item = draggable(el, scope.$eval(alias.value));
                var unwatchers = [];
                var $emit = scope.$emit.bind(scope);
                unwatchers.push(item.on(item.events.DRAGGABLE_DRAG, $emit));
                unwatchers.push(item.on(item.events.DRAGGABLE_DRAG_START, $emit));
                unwatchers.push(item.on(item.events.DRAGGABLE_DRAG_STOP, $emit));

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