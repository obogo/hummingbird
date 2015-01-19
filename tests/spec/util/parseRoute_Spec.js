hb.define('parseRouteSpec', ['parseRoute'], function (parseRoute) {
    describe('parseRoute', function () {

        it("should parse and find params in the url", function() {
            var result = parseRoute.match('services/login/:id', 'http://localhost:63342/services/login/123')
            expect(!!result).toBe(true);
        });

        it("should fail on this route because it did not match all params requested", function() {
            var result = parseRoute.match('services/login/:id?a&b&c', 'http://localhost:63342/services/login/123?a=1&b=2');
            expect(!!result).toBe(false);
        });

        it("should match with all params in the route pattern", function() {
            var result = parseRoute.match('services/login/:id?a&b', 'http://localhost:63342/services/login/123?a=1&b=2');
            expect(!!result).toBe(true);
        });

        it("should match multiple params", function() {
            var result = parseRoute.match('services/login/:id/:name', 'http://localhost:63342/services/login/123/name');
            expect(!!result).toBe(true);
        });
    });
});
