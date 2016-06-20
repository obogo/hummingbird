//! pattern /hb\-repeat\=/
define('hbRepeat', ['hb.directive', 'each', 'asyncRender', 'hb.debug', 'hb.eventStash', 'filter', 'apply', 'debounce'], function (directive, each, asyncRender, debug, events, filter, apply, debounce) {
    events.REPEAT_RENDER_CHUNK_COMPLETE = 'repeat::render_chunk_complete';
    events.REPEAT_RENDER_COMPLETE = 'repeat::render_complete';
    directive('hbRepeat', function () {

        var DOWN = 'down';
        var UP = 'up';

        function trimStrings(str, index, list) {
            list[index] = str && str.trim();
        }

        var db = debug.register('hb-repeat');
        var asyncEvents = db.stat('async events');
        var pattern = /(\w+)\s+in\s+([\w\.]+)(\|(.*?)$)?$/;

        return {
            //scope:true,
            link: ['scope', 'el', 'alias', 'attr', '$app', function (scope, el, alias, attr, $app) {
                var template = el.children[0].outerHTML;
                var postDigest;
                el.removeChild(el.children[0]);
                var statement = alias.value;
                var match = statement.match(pattern);
                statement = [];
                if (match && match.length) {
                    for (var i = 1; i < match.length; i += 1) {
                        statement.push(match[i]);
                    }
                }
                each(statement, trimStrings);
                var itemName = statement[0],
                    watch = statement[1],
                    filterFn = statement[3] && statement[3].split(':');

                var intv;
                var intvAfter;
                var currentList;
                var async = false;

                // async rendering properties
                var topDown = attr.topDown && scope.$eval(attr.topDown) || 0;
                var bottomUp = attr.bottomUp && scope.$eval(attr.bottomUp) || 0;
                var asyncEnabled = topDown || bottomUp || false;
                var ar = asyncRender.create();
                var firstPass = true;
                var pending = false;

                ar.on(events.ASYNC_RENDER_CHUNK_END, asyncRenderNext);
                ar.on(events.ASYNC_RENDER_COMPLETE, renderComplete);

                function removeUntil(len) {
                    var child;
                    while (el.children.length > len) {
                        child = el.children[el.children.length - 1];// remove from bottom up.
                        if (child.scope && child.scope !== scope) {
                            child.scope.$destroy();
                        }
                        el.removeChild(child);
                    }
                }

                function preRender(list, oldList) {
                    var len = list && list.length || 0;
                    clearTimeout(intvAfter);
                    intvAfter = 0;
                    if (!pending) {
                        asyncEvents.next();
                        currentList = list;
                        ar.setup(bottomUp && firstPass ? UP : DOWN, topDown || bottomUp || len, len);
                        //ar.next();
                        render(list, oldList);
                    } else if (async) {
                        pending = true;
                        currentList = list;
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
                    if (ar.next()) {
                        render(currentList);
                        if (asyncEnabled && async) {
                            asyncEvents.inc();
                            scope.$emit(events.REPEAT_RENDER_CHUNK_COMPLETE, currentList, ar.index, ar.maxLen);
                        }
                    }
                }

                function renderComplete() {
                    clearInterval(intv);
                    clearInterval(intvAfter);
                    intv = null;
                    intvAfter = null;
                    if (asyncEnabled && async) {
                        asyncEvents.inc();
                        scope.$emit(events.REPEAT_RENDER_COMPLETE, currentList);
                    }
                    firstPass = !(currentList && currentList.length);
                    if (pending) {
                        async = false;
                        pending = false;
                        intv = setTimeout(function () {
                            clearTimeout(intv);
                            preRender(currentList);
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

                function destroy() {
                    clearInterval(intv);// stop any async stuff.
                }

                function findChildIndex(index) {
                    var s, e;
                    for (var i = 0, len = el.children.length; i < len; i += 1) {
                        e = el.children[i];
                        s = el.children[i].scope;
                        if (s && s.$index === index) {
                            return e;
                        }
                    }
                }

                function render(list, oldList) {
                    var len, child;
                    if (list && (len = list.length)) {
                        removeUntil(len);
                        while (!ar.complete && !ar.atChunkEnd && list[ar.index]) {
                            child = findChildIndex(ar.index);
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

                function setHideShowClasses(index, active, inactive) {
                    if (!el.children[index].classList.contains(active)) {
                        el.children[index].classList.add(active);
                        if (el.children[index].classList.contains(inactive)) {
                            el.children[index].classList.remove(inactive);
                        }
                    }
                }

                function releasePost() {
                    postDigest = null;
                }

                function onPostDigestFor$filter() {
                    var fn = filterFn[0];
                    var show = scope.$eval(filterFn[1]);
                    var hide = scope.$eval(filterFn[2]);
                    for(var i = 0; i < scope.$c.length; i += 1) {
                        var val = scope.$c[i].$eval(fn);
                        if (val) {
                            setHideShowClasses(i, show, hide);
                        } else if (!val) {
                            setHideShowClasses(i, hide, show);
                        }
                    }
                    releasePost();
                }

                function checkFoPost() {
                    if (!postDigest) {
                        postDigest = onPostDigestFor$filter;
                        scope.$$postDigest(postDigest);
                    }
                }

                scope.$watch(watch, preRender, true);

                if (filterFn) {
                    scope.$watch(checkFoPost);
                }
                scope.$on('$destroy', destroy);
            }]
        };
    });
});
