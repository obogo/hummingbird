/*global query */
// import query.query
require('query', function (query) {
    query.fn.unbind = query.fn.off = function (events, handler) {
        if (arguments.length === 1) {
            this.unbindAll(events);
        } else {
            events = events.match(/\w+/gim);
            var i = 0, event, len = events.length;
            while (i < len) {
                event = events[i];
                this.each(function (index, el) {
                    if (el.detachEvent) {
                        el.detachEvent('on' + event, el[event + handler]);
                        el[event + handler] = null;
                    } else {
                        el.removeEventListener(event, handler, false);
                    }
                });
                i += 1;
            }
        }
        return this;
    };
});
