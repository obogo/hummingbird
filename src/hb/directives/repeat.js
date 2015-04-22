//! pattern /hb\-repeat\=/
internal('hbd.repeat', ['hb.directive', 'each', 'asyncRender', 'debug'], function (directive, each, asyncRender, debug) {
    directive('hbRepeat', function ($app) {

        var DOWN = 'down';
        var UP = 'up';

        function trimStrings(str, index, list) {
            list[index] = str && str.trim();
        }

        var db = debug.register('hb-repeat');
        var asyncEvents = db.stat('async events');

        return {
            //scope:true,
            link: function (scope, el, alias, attr) {
                var template = el.children[0].outerHTML;
                el.removeChild(el.children[0]);
                var statement = alias.value;
                statement = each.call({all: true}, statement.split(/\s+in\s+/), trimStrings);
                var itemName = statement[0],
                    watch = statement[1];

                var intv;
                var currentList;
                var async = false;

                // async rendering properties
                var topDown = scope.$eval(attr.topDown) || 0;
                var bottomUp = scope.$eval(attr.bottomUp) || 0;
                var asyncEnabled = topDown || bottomUp || false;
                var ar = asyncRender.create();
                var firstPass = true;
                var pending = false;

                ar.on('async::chunk_end', asyncRenderNext);
                ar.on('async::complete', renderComplete);

                function removeUntil(len) {
                    var child;
                    while(el.children.length > len) {
                        child = el.children[0];
                        if (child.scope && child.scope !== scope) {
                            child.scope.$destroy();
                        }
                        el.removeChild(child);
                    }
                }

                function preRender(list, oldList) {
                    var len = list && list.length || 0;
                    if (currentList && async) {
                        pending = true;
                        currentList = list;
                    } else {
                        asyncEvents.next();
                        currentList = list;
                        ar.setup(bottomUp && firstPass ? UP : DOWN, topDown || bottomUp || len, len);
                        ar.next();
                        render(list, oldList);
                    }
                }

                function asyncRenderNext() {
                    if (asyncEnabled && async) {
                        clearTimeout(intv);
                        intv = setTimeout(next);
                    } else {
                        next();
                    }
                }

                function next() {
                    clearTimeout(intv);
                    if (!ar.complete && ar.next()) {
                        render(currentList);
                        if (asyncEnabled && async) {
                            asyncEvents.inc();
                            scope.$emit('repeat::render_chunk_complete', currentList, ar.index, ar.maxLen);
                        }
                    }
                }

                function renderComplete() {
                    clearInterval(intv);
                    intv = null;
                    if (asyncEnabled && async) {
                        asyncEvents.inc();
                        scope.$emit('repeat::render_complete', currentList);
                    }
                    firstPass = !(currentList && currentList.length);
                    if (pending) {
                        setTimeout(function() {
                            async = false;
                            preRender(currentList);
                            pending = false;
                            scope.$digest();
                        });
                    }
                }

                function createRow(list, el, index) {
                    var data = {};
                    data[itemName] = list[index];
                    data.$index = index;
                    var s = scope.$new();
                    var child = $app.addChild(el, template, s, data, ar.direction === ar.up);
                    if (ar.size) {
                        s.$digest();
                    }
                    return child;
                }

                function updateRow(list, child, index) {
                    var s = child.scope;
                    s[itemName] = list[index];
                    s.$index = index;
                }

                function render(list, oldList) {
                    var len, child;
                    if (list && (len = list.length)) {
                        removeUntil(len);
                        while (!ar.complete && !ar.atChunkEnd && list[ar.index]) {
                            child = el.children[ar.index];
                            if (child && (!child.scope || child.scope.$index !== ar.index)) {
                                child = null;
                            }
                            if (!child) {
                                async = true;
                                child = createRow(list, el, ar.index);
                            } else if (list[ar.index]) {
                                updateRow(list, child, ar.index);
                                async = false;
                            }
                            ar.inc();
                        }
                    } else {
                        removeUntil(0);
                    }
                }

                scope.$watch(watch, preRender, true);
            }
        };
    });
});
