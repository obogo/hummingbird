/*global describe, beforeEach, it, expect, hb */
describe('router', function () {
    'use strict';

    var urls = [
        'http://www.test.com/',
        'http://www.test.com/folder/',
        'http://www.test.com/index.html',
        'http://test.com/folder/tmp/index.html'
    ];
    while (urls.length) {
        runTests(urls.shift());
    }
    function runTests(testUrl) {
        describe("testing on " + testUrl, function () {
            var module, router, hist, loc;
            beforeEach(function () {
                module = hb.module('route', true);
                hb.plugins.mocks(module);
                var win = module.injector.val('$window');
                hist = win.history;
                loc = win.document.location;
                loc.href = testUrl;
                router = hb.plugins.router(module);
            });

            it("should create a state", function () {
                var state = {
                    url: '/'
                };
                router.add("home", state);
                expect(router.states.home).toBe(state);
            });

            it("should set the state when go is invoked", function () {
                router.add('home', {
                    url: '/'
                });
                router.add('test', {
                    url: '/test'
                });
                loc.href = "http://www.test.com/";
                router.resolveUrl();
                router.go('test');
                expect(hist.state.url).toBe('/test');
            });

            it("should parse values into the url", function () {
                router.add('home', {
                    url: '/'
                });
                router.add('test', {
                    url: '/test/:mine'
                });
                router.go('test', {mine: 'a'});
                expect(hist.state.url).toBe('/test/a');
            });

            it("should parse values from the url", function () {
                router.add('home', {
                    url: '/'
                });
                router.add('test', {
                    url: '/test/:mine'
                });
                loc.hash = '/test/2';
                router.resolveUrl();
                expect(router.params.mine).toBe('2');
            });

            it("should resolve to otherwise", function () {
                router.add('home', {
                    url: '/'
                });
                router.add('home', {url: '/home'});
                router.otherwise = '/home';
                loc.hash = '';
                router.resolveUrl();
                expect(hist.url).toBe(loc.pathname + '#/home');
            });

            it("should dispatch an event on the change", function() {
                var state = {
                    url: '/'
                }, fired = false;
                router.add("home", state);
                module.injector.val('$rootScope').$on(router.events.CHANGE, function() {
                    fired = true;
                });
                router.resolveUrl();
                expect(fired).toBe(true);
            });

            it("should dispatch an event with the correct arguments", function() {
                var response = {}, params = {id:1};
                router.add("home", {
                    url: '/'
                });
                router.add("test", {
                    url: '/test'
                });
                module.injector.val('$rootScope').$on(router.events.CHANGE, function(evt, state, params, prevState) {
                    response.state = state;
                    response.params = params;
                    response.prevState = prevState;
                });
                router.resolveUrl();
                router.go('test', params);
                expect(router.states.test).toBe(response.state);
                expect(params).toBe(response.params);
                expect(router.states.home).toBe(response.prevState);
            });

            it("should parse the variables from the url", function() {
                router.add('home', {
                    url: '/'
                });
                router.add('test', {
                    url: '/test/:mine/:yours'
                });
                loc.hash = '/test/4/8';
                router.resolveUrl();
                expect(router.params.mine).toBe('4');
                expect(router.params.yours).toBe('8');
            });

            it("should add extra params as search vars to the url", function() {
                router.add('home', {
                    url: '/'
                });
                router.add('test', {
                    url: '/test'
                });
                router.resolveUrl();
                router.go('test', {a:1, b:2, c:3});
                expect(hist.url).toBe(loc.pathname + '#/test?a=1&b=2&c=3');
            });

            it("should set the right state when passing extra params", function() {
                router.add('home', {
                    url: '/'
                });
                router.add('test', {
                    url: '/test'
                });
                router.resolveUrl();
                router.go('test', {a:1, b:2, c:3});
                expect(router.current.id).toBe('test');
            });

            it("should parse search vars from the url", function() {
                router.add('home', {
                    url: '/'
                });
                router.add('test', {
                    url: '/test'
                });
                loc.href = '/#/test?a=8&b=that is all&c=test';
                router.resolveUrl();
                expect(router.current.id).toBe('test');
                expect(router.params.a).toBe('8');
                expect(router.params.b).toBe('that is all');
                expect(router.params.c).toBe('test');
            });
        });
    }
});