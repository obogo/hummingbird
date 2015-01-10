/**!
 * pattern /hb\-auto\-scroll(\s|\=)/
 * import query.bind
 * import query.unbindAll
 */
internal('hbd.autoscroll', ['hb.directive', 'query'], function (directive, query) {
    directive('hbAutoscroll', function ($app) {
        var $ = query;
        var win = window;

        function outerHeight(el) {
            var height = el.offsetHeight;
            var style = getComputedStyle(el);
            height += parseInt(style.marginTop) + parseInt(style.marginBottom);
            return height;
        }

        // ease in out function thanks to:
        // http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
        var easeInOutCubic = function (t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        };

        // calculate the scroll position we should be in
        // given the start and end point of the scroll
        // the time elapsed from the beginning of the scroll
        // and the total duration of the scroll (default 500ms)
        var position = function (start, end, elapsed, duration) {
            if (elapsed > duration) {
                return end;
            }
            return start + (end - start) * easeInOutCubic(elapsed / duration); // <-- you can change the easing funtion there
            // return start + (end - start) * (elapsed / duration); // <-- this would give a linear scroll
        };

        var smoothScroll = function (scrollEl, scrollFrom, scrollTo, duration, callback) {
            duration = duration === undefined ? 500 : duration;
            scrollTo = parseInt(scrollTo);

            var clock = Date.now();
            var requestAnimationFrame = win.requestAnimationFrame ||
                win.mozRequestAnimationFrame || win.webkitRequestAnimationFrame ||
                function (fn) {
                    win.setTimeout(fn, 15);
                };

            var step = function () {
                var elapsed = Date.now() - clock;
                scrollEl.scrollTop = (0, position(scrollFrom, scrollTo, elapsed, duration));
                if (elapsed > duration) {
                    if (typeof callback === 'function') {
                        callback(scrollEl);
                    }
                } else {
                    requestAnimationFrame(step);
                }
            };
            step();
        };

        return {
            link: function (scope, el, alias) {
                var inputs = el.querySelectorAll('input,textarea');
                var options = $app.interpolate(scope, alias.value);
                var scrollEl = el.querySelector('*');

                function scrollIt() {
                    setTimeout(function () {
                        var clock = Date.now();
                        smoothScroll(el, el.scrollTop, outerHeight(scrollEl) - outerHeight(el), options.duration);
                    }, options.delay || 10);
                }

                scope.$watch(options.watch, scrollIt);

                for (var e in inputs) {
                    $(inputs[e]).bind('focus', scrollIt);
                }

                scope.$on('$destroy', function () {
                    for (var e in inputs) {
                        $(inputs[e]).unbindAll();
                    }
                });
            }
        };
    });

});
