define('hb.resizable', ['directive', 'resizable'], function(directive, resizable) {
    directive('hbResizable', function() {
        return {
            link: ['scope', 'el', function(scope, el) {
                var item = resizable(el);
                var unwatchers = [];
                unwatchers.push(item.on(item.events.DRAG, scope.$emit.bind(scope)));
                unwatchers.push(item.on(item.events.DRAG_START, scope.$emit.bind(scope)));
                unwatchers.push(item.on(item.events.DRAG_STOP, scope.$emit.bind(scope)));

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