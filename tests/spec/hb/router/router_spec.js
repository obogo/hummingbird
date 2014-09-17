describe('router', function () {
    var router, hist, loc;
    beforeEach(function() {
        var module = hb.module('route');
        hb.plugins.mocks(module);
        var win = module.injector.get('$window');
        hist = win.history;
        loc = win.document.location;
        router = hb.plugins.router(module);
    });

    it("should create a state", function() {
        var state = {
            url:'/'
        };
        router.add("home", state);
        expect(router.states.home).toBe(state);
    });

    it("should set the state when go is invoked", function() {
        router.add('test', {
            url: '/test'
        });
        router.go('test');
        expect(hist.state.url).toBe('/test');
    });

    it("should parse values into the url", function() {
        router.add('test', {
            url: '/test/:mine'
        });
        router.go('test', {mine:'a'});
        expect(hist.state.url).toBe('/test/a');
    });

    it("should parse values from the url", function() {

    });
});