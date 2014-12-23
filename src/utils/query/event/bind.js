internal('query.bind', ['query'], function (query) {
    //! query.bind
    query.fn.bind = utils.query.fn.on = function (events, handler) {
        events = events.match(/\w+/gim);
        var i = 0, event, len = events.length;
        while (i < len) {
            event = events[i];
            this.each(function (index, el) {
                if (el.attachEvent) {
                    el['e' + event + handler] = handler;
                    el[event + handler] = function () {
                        el['e' + event + handler](window.event);
                    };
                    el.attachEvent('on' + event, el[event + handler]);
                } else {
                    el.addEventListener(event, handler, false);
                }

                if (!el.eventHolder) {
                    el.eventHolder = [];
                }
                el.eventHolder[el.eventHolder.length] = [event, handler];
            });
            i += 1;
        }
        return this;
    };
});

