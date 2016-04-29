//! pattern /\)\.unbindAll\(/
internal('query.unbindAll', ['query'], function (query) {
    query.fn.unbindAll = function (event) {
        var scope = this;
        scope.each(function (index, el) {
            if (el.eventHolder) {
                var removed = 0, handler;
                for (var i = 0; i < el.eventHolder.length; i++) {
                    if (!event || el.eventHolder[i][0] === event) {
                        event = el.eventHolder[i][0];
                        handler = el.eventHolder[i][1];
                        if (el.detachEvent) {
                            el.detachEvent('on' + event, el[event + handler]);
                            el[event + handler] = null;
                        } else {
                            el.removeEventListener(event, handler, false);
                        }
                        el.eventHolder.splice(i, 1);
                        removed += 1;
                        i -= 1;
                    }
                }
            }
        });
        return scope;
    };
});