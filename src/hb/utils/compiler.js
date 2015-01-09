/* global module.bindingMarkup, utils */
internal('hb.compiler', ['each'], function (each) {

    function Compiler($app) {

        var ID = $app.name + '-id';
        var injector = $app.injector;
        var interpolator = $app.interpolator;
        var self = this;

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
                var regExp = new RegExp($app.bindingMarkup[0] + '(.*?)' + $app.bindingMarkup[1], 'mg');
                return str.replace(regExp, function (a, b) {
                    var r = interpolator.invoke(o, b.trim(), true);
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
            var scope = $app.findScope(el);
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
                $app.elements[scope.$id] = el;
                el.scope = scope;
            }
        }

        /**
         * Searches through element and finds any directives based on registered attributes
         * @param el
         * @returns {Array}
         */
        function findDirectives(el) {
            var attributes = el.attributes, attrs = [{name: el.nodeName.toLowerCase(), value: ''}],
                attr, returnVal = [], i, len = attributes.length, name, directiveFn;
            for (i = 0; i < len; i += 1) {
                attr = attributes[i];
                attrs.push({name: attr.name, value: el.getAttribute(attr.name)});
            }
            len = attrs.length;
            for (i = 0; i < len; i += 1) {
                attr = attrs[i];
                name = attr ? attr.name.split('-').join('') : '';
                directiveFn = injector.val(name);
                if (directiveFn) {
                    returnVal.push({
                        options: injector.invoke(directiveFn),
                        alias: {
                            name: attr.name,
                            value: attr.value
                        }
                    });
                }
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
                if (node.nodeValue.indexOf($app.bindingMarkup[0]) !== -1 && !hasNodeWatcher(scope, node)) {
                    var value = node.nodeValue;
                    scope.$watch(function () {
                        return parseBinds(value, scope);
                    }, function (newVal) {
                        if (newVal === undefined || newVal === null || newVal + '' === 'NaN') {
                            newVal = '';
                        }
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

        // you can compile an el that has already been compiled. If it has it just skips over and checks its children.
        function compile(el, scope) {
            if (!el.compiled) {
                el.compiled = true;
                each(el.childNodes, removeComments, el);
                var directives = findDirectives(el), links = [];
                if (directives && directives.length) {
                    each(directives, compileDirective, el, scope, links);
                    each(links, invokeLink, el);
                }
            }
            if (el) {
                scope = el.scope || scope;
                var i = 0, len = el.children.length;
                while (i < len) {
                    if (!el.children[i].compiled) {
                        compile(el.children[i], scope);
                    }
                    i += 1;
                }
                // this is smart enough to check which nodes already have watchers.
                if (el.getAttribute(ID)) {
                    compileWatchers(el, scope);// if we update our watchers. we need to update our parent watchers.
                }
            }
            return el;
        }

        function compileWatchers(el, scope) {
            each(el.childNodes, createWatchers, scope);
        }

        function compileDirective(directive, el, parentScope, links) {
            var options = directive.options, scope;
            if (!el.scope && options.scope) {
                scope = createChildScope(parentScope, el, typeof directive.options.scope === 'object', directive.options.scope);
            }
            if (options.tpl) {
                el.innerHTML = typeof options.tpl === 'string' ? options.tpl : injector.invoke(options.tpl, scope || el.scope, {
                    scope: scope || el.scope,
                    el: el,
                    alias: directive.alias
                });
            }
            if (options.tplUrl) {
                el.innerHTML = $app.val(typeof options.tplUrl === 'string' ? options.tplUrl : injector.invoke(options.tplUrl, scope || el.scope, {
                    scope: scope || el.scope,
                    el: el,
                    alias: directive.alias
                }));
            }
            if ($app.preLink) {
                $app.preLink(el, directive);
            }
            links.push(directive);
        }

        self.link = link;
        self.compile = compile;
        self.preLink = null;
    }

    return function (module) {
        return new Compiler(module);
    };

});