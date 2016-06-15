/* global internal, angular, ace, vkbeautify */
/*
 .resizable-handle {
     width: 8px;
     border-left: 1px solid #999;
     //background-color: red;
     position: absolute;
     top: 0;
     right: -8px;
     bottom: 0;
     cursor: ew-resize;
     z-index: 1;
 }

 .nonselectable, .resizing {
     -webkit-user-select: none; // Chrome all / Safari all
     -moz-user-select: none; // Firefox all
     -ms-user-select: none; // IE 10+

     // No support for these yet, use at own risk
     -o-user-select: none;
     user-select: none;
 }
 */
define('resizable', ['dispatcher', 'hb.eventStash', 'debounce', 'query'], function (dispatcher, events, debounce, query) {
    events.RESIZABLE_DRAG = 'resizable::drag';
    events.RESIZABLE_DRAG_START ='resizable::drag_start';
    events.RESIZABLE_DRAG_STOP = 'resizable::drag_stop';

    var cls = 'hb-resizing';

    return function resizable(el) {
        var elm = el[0] || el;
        var $el = query(elm);
        var startX, startY, startWidth, startHeight,
            api = {
                events: events
            };

        dispatcher(api);

        function startDrag(e) {
            if (e.button) {
                return;// only accept left mouse.
            }
            var busy = $el.attr('busy');
            if (busy && busy !== cls) {
                return;
            }
            $el.addClass(cls);
            $el.attr('busy', cls);
            startX = e.clientX;
            startY = e.clientY;
            var d = document.defaultView;
            var de = document.documentElement;
            startWidth = parseInt(d.getComputedStyle(elm).width, 10);
            startHeight = parseInt(d.getComputedStyle(elm).height, 10);
            var width = (startWidth + e.clientX - startX);
            api.dispatch(events.RESIZABLE_DRAG_START, {
                width: width
            });
            de.addEventListener('mousemove', drag, false);
            de.addEventListener('mouseup', stopDrag, false);
        }

        function drag(e) {
            // el[0].style.height = (startHeight + e.clientY - startY) + 'px';
            var width = (startWidth + e.clientX - startX);
            elm.style.width = width + 'px';
            api.dispatch(events.RESIZABLE_DRAG, {
                width: width
            });
        }

        function stopDrag(e) {
            $el.removeClass(cls);
            $el.attr('busy', '');
            var de = document.documentElement;
            de.removeEventListener('mousemove', drag, false);
            de.removeEventListener('mouseup', stopDrag, false);

            var width;
            width = (startWidth + e.clientX - startX);
            api.dispatch(events.RESIZABLE_DRAG_STOP, {
                width: width
            });

            width = (startWidth + e.clientX - startX);
            elm.style.width = width + 'px';
            api.dispatch(events.RESIZABLE_DRAG, {
                width: width
            });
        }

        var resizer = document.createElement('div');
        resizer.className = 'resizable-handle';
        elm.appendChild(resizer);

        resizer.addEventListener('mousedown', startDrag, false);

        var resizeHandler = debounce(function () {
            var width = el.offsetWidth;
            api.dispatch(events.RESIZABLE_DRAG_STOP, {
                width: width
            });
        }, 10);

        window.addEventListener('resize', resizeHandler);

        // :: cleanup :: //
        api.destroy = function() {
            resizer.removeEventListener('mousedown', startDrag);
            window.removeEventListener('resize', resizeHandler);
        };

        return api;
    }
});