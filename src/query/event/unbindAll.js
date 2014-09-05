/*global query */
query.fn.unbindAll = function (event) {
    var scope = this;
    events = events.match(/\w+/gim);
    var i = 0, event, len = events.length;
    while (i < len) {
        event = events[i];
        this.each(function (index, el) {
            if (el.eventHolder) {
                var removed = 0, handler;
                for (var i = 0; i < el.eventHolder.length; i++) {
                    if (el.eventHolder[i][0] === event) {
                        handler = el.eventHolder[i][1];
                        scope.off(el, event, handler);
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
    }
    return this;
};