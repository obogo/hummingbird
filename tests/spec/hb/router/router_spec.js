/*global describe, beforeEach, it, expect, hb */
describe('router', function () {
    'use strict';
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
        loc.href = "http://www.test.com/";
        router.resolveUrl();
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
        router.add('test', {
            url: '/test/:mine'
        });
        loc.hash = '/test/2';
        router.resolveUrl();
        expect(router.params.mine).toBe('2');
    });

    it("should resolve to otherwise", function() {
        router.add('home', {url:'/home'});
        router.otherwise = '/home';
        loc.hash = '/';
        expect(hist.url).toBe('/home');
    });
});