/* global internal, angular, ace, vkbeautify */
internal('debug.widgets.resizable', ['framework', 'application', 'app.widget', 'loader', 'debounce'],
    function (framework, application, widget, loader, debounce) {
        widget('resizable', function () {
            return {
                link: function (scope, el, attr) {
                    var startX, startY, startWidth, startHeight;

                    function startDrag(e) {
                        startX = e.clientX;
                        startY = e.clientY;
                        startWidth = parseInt(document.defaultView.getComputedStyle(el[0]).width, 10);
                        startHeight = parseInt(document.defaultView.getComputedStyle(el[0]).height, 10);

                        el.addClass('resizing');

                        var width = (startWidth + e.clientX - startX);
                        scope.$emit('resizable::drag_start', {
                            width: width
                        });
                        //angular(document.body).addClass('nonselectable');

                        document.documentElement.addEventListener('mousemove', drag, false);
                        document.documentElement.addEventListener('mouseup', stopDrag, false);
                    }

                    function drag(e) {
                        // el[0].style.height = (startHeight + e.clientY - startY) + 'px';

                        var width = (startWidth + e.clientX - startX);
                        el[0].style.width = width + 'px';
                        scope.$emit('resizable::drag', {
                            width: width
                        });
                    }

                    function stopDrag(e) {

                        el.removeClass('resizing');

                        //angular(document.body).removeClass('nonselectable');

                        document.documentElement.removeEventListener('mousemove', drag, false);
                        document.documentElement.removeEventListener('mouseup', stopDrag, false);

                        var width;
                        width = (startWidth + e.clientX - startX);
                        scope.$emit('resizable::drag_stop', {
                            width: width
                        });

                        width = (startWidth + e.clientX - startX);
                        el[0].style.width = width + 'px';
                        scope.$emit('resizable::drag', {
                            width: width
                        });
                    }

                    var resizer = document.createElement('div');
                    resizer.className = 'resizable-handle';
                    el.append(resizer);

                    resizer.addEventListener('mousedown', startDrag, false);

                    var resizeHandler = debounce(function () {
                        var width = document.querySelector('.debug-panel').offsetWidth;
                        scope.$emit('resizable::drag_stop', {
                            width: width
                        });
                    }, 10);

                    window.addEventListener('resize', resizeHandler);

                    // :: cleanup :: //
                    scope.$on('$destroy', function () {
                        resizer.removeEventListener('mousedown', startDrag);
                        window.removeEventListener('resize', resizeHandler);
                    });
                }
            };
        });

    });