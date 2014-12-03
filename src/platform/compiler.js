/* global module.bindingMarkup, utils */
var compiler = (function () {
    function Compiler(module) {

        var ID = module.name + '-id';
        var each = utils.each;
        var injector = module.injector;
        var interpolator = module.interpolator;

        /**
         * Merges the properties of one object into another
         * @param target
         * @param source
         * @returns {*}
         */
        function extend(target, source) {
            var args = Array.prototype.slice.call(arguments, 0), i = 1, len = args.length, item, j;
            while (i < len) {
                item = args[i];
                for (j in item) {
                    if (item.hasOwnProperty(j)) {
                        target[j] = source[j];
                    }
                }
                i += 1;
            }
            return target;
        }

        /**
         * Removes comments to they are not processed during compile
         * @param el
         * @param parent
         * @returns {boolean}
         */
        function removeComments(el, parent) {
            if (el) {// after removing elements we will get some that are not there.
                if (el.nodeType === 8) {// comment
                    parent.removeChild(el);
                } else if (el.childNodes) {
                    each(el.childNodes, removeComments, el);
                }
            } else {
                return true;// if we get one not there. exit.
            }
        }

        /**
         * Looks for {{}} in html to interpolate
         * @param str
         * @param o
         * @returns {*}
         */
        function parseBinds(str, o) {
            if (str) {
                var regExp = new RegExp(module.bindingMarkup[0] + '(.*?)' + module.bindingMarkup[1], 'mg');
                return str.replace(regExp, function (a, b) {
                    var r = interpolator.exec(o, b.trim(), true);
                    return typeof r === 'string' || typeof r === 'number' ? r : (typeof r === 'object' ? JSON.stringify(r) : '');
                });
            }
            return str;
        }

        /**
         * Invokes the link function on the directive. Injects items into the link function to be used.
         * @param directive
         * @param index
         * @param list
         * @param el
         */
        function invokeLink(directive, el) {
            var scope = module.findScope(el);
            injector.invoke(directive.options.link, scope, {
                scope: scope,
                el: el,
                alias: directive.alias
            });
        }

        /**
         * links a scope to an element
         * @param el
         * @param scope
         */
        function link(el, scope) {
            if (el) {
                el.setAttribute(ID, scope.$id);
                module.elements[scope.$id] = el;
                el.scope = scope;
            }
        }

        /**
         * Searches through element and finds any directives based on registered attributes
         * @param el
         * @returns {Array}
         */
        function findDirectives(el) {
            var attrs = el.attributes;
            var attr;
            var returnVal = [];
            var i = 0, len = attrs.length;
            while (i < len) {
                attr = attrs[i];
                var name = attr ? attr.name.split('-').join('') : '';
                var directiveFn = injector.get(name);
                if (directiveFn) {
                    returnVal.push({
                        options: injector.invoke(directiveFn),
                        alias: {
                            name: attr.name,
                            value: el.getAttribute(attr.name)
                        }
                    });
                }
                i += 1;
            }
//TODO: if any directives are isolate scope, they all need to be.
            return returnVal;
        }

        function createChildScope(parentScope, el, isolated, data) {
            var scope = parentScope.$new(isolated);
            link(el, scope);
            extend(scope, data);
            return scope;
        }

        function createWatchers(node, scope) {
            if (node.nodeType === 3) {
                if (node.nodeValue.indexOf(module.bindingMarkup[0]) !== -1 && !hasNodeWatcher(scope, node)) {
                    var value = node.nodeValue;
                    scope.$watch(function () {
                        return parseBinds(value, scope);
                    }, function (newVal) {
                        node.nodeValue = newVal;
                    });
                    scope.$w[0].node = node;
                }
            } else if (!node.getAttribute(ID) && node.childNodes.length) {
                // keep going down the dom until you find another directive or bind.
                each(node.childNodes, createWatchers, scope);
            }
        }

        function hasNodeWatcher(scope, node) {
            var i = 0, len = scope.$w.length;
            while (i < len) {
                if (scope.$w[i].node === node) {
//                    console.log('%s already has watcher on this node', scope.$id, node);
                    return true;
                }
                i += 1;
            }
            return false;
        }

        function compile(el, scope) {
            each(el.childNodes, removeComments, el);
            var directives = findDirectives(el), links = [];
            if (directives && directives.length) {
                each(directives, compileDirective, el, scope, links);
                each(links, invokeLink, el);
            }
            if (el) {
                scope = el.scope || scope;
                var i = 0, len = el.children.length;
                while (i < len) {
                    compile(el.children[i], scope);
                    i += 1;
                }

                if (el.getAttribute(ID)) {
                    compileWatchers(el, scope);// if we update our watchers. we need to update our parent watchers.

                    // TODO? MAY NEED or MAY NOT
//                if (s && s.$parent) {
//                    compileWatchers(elements[s.$parent.$id], s.$parent);
//                }
                }


            }
            return el;
        }

        function compileWatchers(el, scope) {
            each(el.childNodes, createWatchers, scope);
        }

        function compileDirective(directive, el, parentScope, links) {
            if (!el.scope && directive.options.scope) {
                createChildScope(parentScope, el, typeof directive.options.scope === 'object', directive.options.scope);
            }
            links.push(directive);
        }

        this.link = link;
        this.compile = compile;
    }

    return function (module) {
        return new Compiler(module);
    };
}());