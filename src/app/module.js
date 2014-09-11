/* global Scope, Injector, Interpolator, Compiler, formatters */
function Module(name) {

    var self = this;
    self.name = name;

    var rootEl;
    var rootScope = new Scope();
    var bootstraps = [];
    var injector = new Injector();
    var interpolator = new Interpolator(injector);
    var compiler = new Compiler(self, injector, interpolator);
    var compile = compiler.compile;
    var interpolate = interpolator.exec;
    var injectorGet = injector.get;
    var injectorSet = injector.set;

    /**
     * Searches through elements for a scope
     * @param el
     * @returns {*}
     */
        // TODO: deprecate?
    function findScope(el) {
        if (!el) {
            return null;
        }
        if (el.scope) {
            return el.scope;
        }
        return findScope(el.parentNode);
    }

    function bootstrap(el) {
        if (el) {
            this.element(el);
            this.ready();
        }
    }

    function addChild(parentEl, htmlStr) {
        if (parentEl !== rootEl && rootEl.contains && !rootEl.contains(parentEl)) {
            throw new Error('parent element not found in %o', rootEl);
        }
        parentEl.insertAdjacentHTML('beforeend', formatters.stripHTMLComments(htmlStr));
        var scope = findScope(parentEl),
            child = compile(parentEl.children[parentEl.children.length - 1], scope),
            s = child.scope && child.scope();
        return child;
    }

    function removeChild(childEl) {
        var scope = childEl.scope,
            i = 0, p, len;
        if (!scope) {
            throw 'no scope';
        }
        scope.$destroy();
        childEl.remove();
    }

    function element(el) {
        if (typeof el === 'undefined') {
            rootEl = el;
            compile(rootEl, rootScope);
        }
        return rootEl;
    }

    function service(name, ClassRef) {
        return injectorSet(name, new ClassRef());
    }

    function ready() {
        var self = this;
        while (bootstraps.length) {
            injector.invoke(bootstraps.shift(), self);
        }
        rootScope.$apply();
    }

    self.bootstrap = bootstrap;
    self.findScope = findScope;
    self.addChild = addChild;
    self.removeChild = removeChild;
    self.interpolate = interpolate;
    self.element = element;
    self.get = injectorGet;
    self.set = injectorSet;
    self.directive = injectorSet;
    self.filter = injectorSet;
    self.service = service;
    self.ready = ready;
}
