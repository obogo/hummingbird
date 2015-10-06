hb.define('parseRouteSpec', ['route'], function (route) {
    describe('route', function () {

        it("should parse and find params in the url", function() {
            var result = route.match('/services/login/:id', 'http://localhost:63342/services/login/123');
            expect(!!result).toBe(true);
        });

        it("should parse without a port", function() {
            var result = route.match('/services/login/:id', 'http://test.com/services/login/123');
            expect(!!result).toBe(true);
        });

        it("should fail on this route because it did not match all params requested", function() {
            var result = route.match('/services/login/:id?a&b&c', 'http://localhost:63342/services/login/123?a=1&b=2');
            expect(!!result).toBe(false);
        });

        it("should match with all params in the route pattern", function() {
            var result = route.match('/services/login/:id?a&b', 'http://localhost:63342/services/login/123?a=1&b=2');
            expect(!!result).toBe(true);
        });

        it("should match multiple params", function() {
            var result = route.match('/services/login/:id/:name', 'http://localhost:63342/services/login/123/name');
            expect(!!result).toBe(true);
        });

        it("should match extract params", function() {
            var result = route.extractParams('/services/login/:id/:name', 'http://localhost:63342/services/login/123/name');
            expect(result.params).toEqual({id:'123', name:'name'});
        });

        it("should match extract query params", function() {
            var result = route.extractParams('/services/login/?a&b', 'http://localhost:63342/services/login?a=1&b=2');
            expect(result.query).toEqual({a:'1', b:'2'});
        });

        it("should match extract both params combined", function() {
            var result = route.extractParams('/services/login/:id/:name/?a&b', 'http://localhost:63342/services/login/123/name?a=1&b=2', true);
            expect(result).toEqual({id:'123', name:'name', a:'1', b:'2'});
        });

        it("should NOT find the pattern in the following url because it starts after the domain", function() {
            var result = route.match('/v1/config/:id', 'http://localhost:63342/blast/demo/v1/config/wes');
            expect(result).toBe(false);
        });

        it("should NOT find the pattern in the following url because it starts after the domain", function() {
            var result = route.match('/:id', 'http://localhost:63342/blast/demo/v1/config/wes');
            expect(result).toBe(false);
        });

        it("should find the pattern in the following url", function() {
            var result = route.match('/:id', 'http://localhost:63342/blast');
            expect(result).toBe(true);
        });
    });
});
