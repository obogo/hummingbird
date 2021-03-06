/* global module.bindingMarkup, utils */
define('hb.compiler', ['each', 'fromDashToCamel', 'hb.template', 'toDOM', 'extend', 'hb.debug'], function (each, fromDashToCamel, template, toDOM, extend, debug) {

    function Compiler($app) {

        var compileCount = 0;
        var compileRegistry = {};
        var ID = $app.name + '-id';
        var injector = $app.injector;
        var interpolator = $app.interpolator;
        var self = this;
        var bindParseRx;
        var transclude = /<hb\-transclude><\/hb-transclude>/i;
        var isUrl = /(\w|\-)+\.\w+$/;

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
        function removeComments(el, index, list, parent) {
            if (el) {// after removing elements we will get some that are not there.
                if (el.nodeType === 8) {// comment
                    parent.removeChild(el);
                } else if (el.childNodes) {
                    each(el.childNodes, el, removeComments);
                }
            } else {
                return true;// if we get one not there. exit.
            }
        }

        function cleanBindOnce(str, scope, watchId) {
            str = str.trim();
            str = scope.$handleBindOnce && scope.$handleBindOnce(str, null, watchId) || str;
            return str;
        }

        /**
         * Looks for {{}} in html to interpolate
         * @param str
         * @param o
         * @param watchId
         * @returns {*}
         */
        function parseBinds(str, o, watchId) {
            if (str && o) {
                bindParseRx = bindParseRx || new RegExp($app.bindingMarkup[0] + '(.*?)' + $app.bindingMarkup[1], 'mg');
                str = str.replace(bindParseRx, function (a, b) {
                    var r = interpolator.invoke(o, cleanBindOnce(b, o, watchId), debug.ignoreErrors);
                    return typeof r === 'string' || typeof r === 'number' ? r : (typeof r === 'object' ? JSON.stringify(r, null, 2) : '');
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
        function invokeLink(directive, index, list, el) {
            var scope = $app.findScope(el);
            injector.invoke(directive.options.link, scope, {
                scope: scope,
                el: el,
                attr: getAttributes(el),
                alias: directive.alias
            });
        }

        /**
         * It will find all of the attributes on a div element. and assign the camel case values to the object.
         * @param el
         */
        function getAttributes(el) {
            var attr = {}, i;
            for (i = 0; i < el.attributes.length; i += 1) {
                var at = el.attributes[i];
                var key = fromDashToCamel((at.name || at.localName || at.nodeName).replace(/^data\-/, ''));
                attr[key] = at.value;
            }
            return attr;
        }

        function unlink() {
            if (this.$id) {
                delete $app.elements[this.$id];
            }
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
                scope.$on('$destroy', unlink);
                el.scope = scope;
                //el.$compile = recompile;
            }
        }

        /**
         * Re-compile a scope.
         */
        //TODO: this is for later to make a scope recompile it's children.
        //function recompile() {
        //    this.compiled = false;
        //    this.scope.
        //    compile(this, this.scope);
        //}

        /**
         * Searches through element and finds any directives based on registered attributes
         * @param el
         * @param scope
         * @returns {Array}
         */
        function findDirectives(el, scope, compileId) {
            var attributes = el.attributes, nodeName = el.nodeName.toLowerCase(), attrs = [],
                attr, returnVal = [], i, len = attributes.length,
                leftovers = [], rLen = 0;
            el.compiledIds = el.compiledIds || {};
            el.compiled = el.compiled || {};
            if (!el.compiled[nodeName]) {
                attrs[0] = {name: nodeName, value: ''};
            }
            for (i = 0; i < len; i += 1) {
                attr = attributes[i];
                if (!el.compiledIds[compileId] && !el.compiled[attr.name]) {
                    attrs.push({name: attr.name, value: el.getAttribute(attr.name)});
                }
            }
            len = attrs.length;
            for (i = 0; i < len; i += 1) {
                attr = attrs[i];
                rLen = returnVal.length;
                getDirectiveFromAttr(attr, returnVal, leftovers);
                if (returnVal.length !== rLen) {
                    el.compiledIds[compileId] = 1;// prevents recursion.
                    el.compiled[attr.name] = 1;// it got added.
                }
            }
            processLeftovers(el, leftovers, scope);
//TODO: if any directives are isolate scope, they all need to be.
            return returnVal;
        }

        function getDirectiveFromAttr(attr, returnVal, leftovers) {
            var name = attr ? attr.name.split('-').join('') : '';
            var directiveFn = injector.val(name);
            if (directiveFn) {
                returnVal.push({
                    options: injector.invoke(directiveFn),
                    alias: {
                        name: attr.name,
                        value: attr.value
                    }
                });
            } else if (attr.value && attr.value.indexOf($app.bindingMarkup[0]) !== -1) {
                leftovers.push(attr);
            }
        }

        function processLeftovers(el, leftovers, scope) {
            // we need to process left overs after the directives.
            // this means any attribute that is not a directive and has curly braces in it can be ran.
            var len = leftovers.length, attr;
            for (var i = 0; i < len; i += 1) {
                attr = leftovers[i];
                if (!el.compiled[attr.name] && attr.value.indexOf('{{') !== -1) {
                    el.compiled[attr.name] = 1;// don't reparse binds more than the first time on that element.
                    el.setAttribute(attr.name, parseBinds(attr.value, el.scope || scope));
                }
            }
        }

        function createChildScope(parentScope, el, isolated, data) {
            var scope = parentScope.$new(isolated);
            link(el, scope);
            extend(scope, data);
            return scope;
        }

        function createWatchers(node, index, list, scope) {
            if (node.nodeType === 3) {
                if (node.nodeValue.indexOf($app.bindingMarkup[0]) !== -1 && !hasNodeWatcher(scope, node)) {
                    var value = node.nodeValue;
                    var watchId = scope.$watch(function () {
                        return parseBinds(value, scope, watchId);
                    }, function (newVal) {
                        if (newVal === undefined || newVal === null || newVal + '' === 'NaN') {
                            newVal = '';
                        }
                        node.nodeValue = newVal;
                    });
                    scope.$w[0].node = node;
                }
                // comments do not have a node.getAttribute
            } else if (node && node.getAttribute && !node.getAttribute(ID) && node.childNodes.length) {
                // keep going down the dom until you find another directive or bind.
                each(node.childNodes, scope, createWatchers);
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
        function compile(el, scope, compileId) {
            compileId = compileId || (function() { compileCount += 1; return compileCount; })();
            if (!compileRegistry[compileId]) {
                compileRegistry[compileId] = 1;
                debug.warn("COMPILE " + compileId);
            }
            if(el) {
                if (el.nodeType !== 8) {// 8 is comment.
                    // each(el.childNodes, el, removeComments);
                    var directives = findDirectives(el, scope, compileId), links = [];
                    if (directives && directives.length) {
                        each(directives, {el:el, scope:scope, links:links}, compileDirective);
                        each(links, el, invokeLink);
                    }
                }
                scope = el.scope || scope;
                var i = 0, len = el.children && el.children.length || 0;
                while (i < len) {
                    // prevent recursion by no allowing a node to be recompiled with the same id.
                    if (!el.children[i].compiledIds || !el.children[i].compiledIds[compileId]) {
                        compile(el.children[i], scope, compileId);
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
            //TODO: wigets mode for making these only render widgets.
            // if (scope.$$id !== "1") {
                each(el.childNodes, scope, createWatchers);
            // }
        }

        function copyAttr(attr, index, list, params) {
            if (attr.name === "class") {
                var classes = attr.value.split(' ');
                for(var i = 0; i < classes.length; i += 1) {
                    params.el.classList.add(classes[i]);
                }
                return;
            }
            if (attr.name === "hb-class") {
                var hbcls = params.el.getAttribute("hb-class") || '';
                hbcls = hbcls && hbcls.replce(/\{|\}/g, '');
                var val = attr.value.replace(/\{|\}/g, '');
                attr.value = '{' + (hbcls ? hbcls + ',' : '') + val + '}';
            }
            params.el.setAttribute(attr.name, attr.value);
            var el = params.el;
            compile(el, el.scope, el.nodeName.toLowerCase() + ':replace-' + compileCount);
            // var leftovers = [];
            // getDirectiveFromAttr(attr, params.directives, leftovers);
            // processLeftovers(params.el, leftovers);
        }

        function compileDirective(directive, index, list, params) {
            var str = 'string';
            var options = directive.options, scope, el = params.el, parentScope = params.scope, links = params.links;
            var tpl;
            if (el.loading) {
                return;
            }
            // make sure if there is a template to load we do that first. If we are going to load it we exit.
            if (options.tplUrl && typeof options.tplUrl === str) {
                tpl = $app.val(options.tplUrl);
                if (!tpl) {
                    el.loading = true;
                    template.get($app, options.tplUrl, function () {
                        el.compiled = false;
                        delete el.loading;
                        compile(params.el, params.scope);// recompile the directive on template load.
                        params.scope.$digest();
                    });
                    return;// exit. compile will be called on success and compile the directive then.
                }
            }
            if (!el.scope && options.scope) {
                if (options.widget) {
                    el.setAttribute('data-ng-non-bindable', '');
                }
                scope = createChildScope(parentScope, el, typeof directive.options.scope === 'object', directive.options.scope);
            }
            if (options.tpl) {
                tpl = typeof options.tpl === str ? options.tpl : injector.invoke(options.tpl, scope || el.scope, {
                    scope: scope || el.scope,
                    el: el,
                    alias: directive.alias
                });
            }
            if (options.tplUrl && !(typeof options.tplUrl === str)) {
                tpl = $app.val(injector.invoke(options.tplUrl, scope || el.scope, {
                    scope: scope || el.scope,
                    el: el,
                    alias: directive.alias
                }));
            }
            if (tpl) {
                if (options.replace) {// replace the dom element.
                    // copy all attributes.
                    var tmpItem = toDOM(tpl);
                    each(tmpItem.attributes, {el:el, directives:list}, copyAttr);
                    tpl = tmpItem.innerHTML;
                }
                if (transclude.test(tpl)) {
                    tpl = tpl.replace(transclude, el.innerHTML);
                }
                if (isUrl.test(tpl)) {
                    console.warn("partial url not found for '" + tpl + "'.");
                }
                el.innerHTML = tpl;
            }
            links.push(directive);
        }

        self.link = link;
        self.compile = compile;
        self.parseBinds = parseBinds;
    }

    return function (module) {
        return new Compiler(module);
    };

});
