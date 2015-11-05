/* global internal, angular, ace, vkbeautify */
internal('draggable', ['dispatcher', 'hb.eventStash', 'debounce', 'query', 'extend'], function (dispatcher, events, debounce, query, extend) {
    events.DRAGGABLE_DRAG = 'draggable::drag';
    events.DRAGGABLE_DRAG_START = 'draggable::drag_start';
    events.DRAGGABLE_DRAG_STOP = 'draggable::drag_stop';
    return function draggable(el, options) {
        var elm = el[0] || el;
        var opts = {lockX: false, lockY: false, selector: ''};
        extend(opts, options);
        var $el = query(elm);
        var startX, startY, origX, origY,
            api = {
                events: events
            };
        var dragStart;
        var d = document.defaultView;
        var de = document.documentElement;

        dispatcher(api);

        function update(e, sendEvt) {
            var left = opts.lockX ? origX : (origX + e.clientX - startX);
            var top = opts.lockY ? origY : (origY + e.clientX - startY);
            elm.style.left = left + 'px';
            elm.style.top = top + 'px';
            api.dispatch(sendEvt, {
                left: left,
                top: top
            });
        }

        function startDrag(e) {
            startX = e.clientX;
            startY = e.clientY;
            origX = parseInt(d.getComputedStyle(elm).left, 10);
            origY = parseInt(d.getComputedStyle(elm).top, 10);
            $el.addClass('dragging');
            update(e, events.DRAGGABLE_DRAG_START);
            de.addEventListener('mousemove', drag, false);
            de.addEventListener('mouseup', stopDrag, false);
        }

        function drag(e) {
            update(e, events.DRAGGABLE_DRAG);
        }

        function stopDrag(e) {
            $el.removeClass('dragging');
            if (dragStart) {
                elm.removeEventListener('mousedown', startDrag);
            }
            de.removeEventListener('mousemove', drag, false);
            de.removeEventListener('mouseup', stopDrag, false);

            update(e, events.DRAGGABLE_DRAG);
            update(e, events.DRAGGABLE_DRAG_STOP);
        }

        function onDragStartSelector(e) {
            elm.addEventListener('mousedown', startDrag, false);
        }

        if (opts.selector) {
            dragStart = elm.querySelector(opts.selector);
            dragStart.addEventListener('mousedown', onDragStartSelector, false);
        } else {
            onDragStartSelector();
        }

        // :: cleanup :: //
        api.destroy = function () {
            if (dragStart) {
                dragStart.removeEventListener('mousedown', onDragStartSelector);
            }
            elm.removeEventListener('mousedown', startDrag);
        };

        return api;
    }
});