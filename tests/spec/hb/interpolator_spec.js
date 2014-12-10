'use strict';
describe("Interpolator", function () {
    var injector, interpolator;

    beforeEach(function () {
        injector = hb.injector();
        interpolator = hb.interpolator(injector);
    });

    it("should parse a single variable name and scope it to this", function () {
        expect(interpolator.exec({name:'Hummingbird'}, 'name')).toBe('Hummingbird');
    });

    it("should parse multiple variables in an equation", function() {
        expect(interpolator.exec({a:1, b:2}, 'a + b')).toBe(3);
    });

    it("should parse them if there are no spaces", function() {
        expect(interpolator.exec({a:1, b:2}, 'a+b')).toBe(3);
    });

    it("should parse correctly if there are strings.", function() {
        expect(interpolator.exec({name:"Hummingbird", weight:"light", speed:"fast"}, "'A ' + name + ' is very ' + weight + ' and ' + speed + '. Just like this framework'"))
            .toBe("A Hummingbird is very light and fast. Just like this framework");
    });

    it("should be able to parse with dot syntax", function() {
        expect(interpolator.exec({a:{c:1}, b:{name:{first:'Super', last:'Hummingbird'}}}, 'a.c + " " + b.name.first + " " + b.name.last' )).toBe("1 Super Hummingbird");
    });

    it("should be able to parse with $ variables", function() {
        expect(interpolator.exec({$$phase:'digest'}, '$$phase')).toBe('digest');
    });

    it("should be able to parse with _ variables", function() {
        expect(interpolator.exec({_phase:'digest'}, '_phase')).toBe('digest');
    });

    it("should be able to handle logical statements", function() {
        expect(interpolator.exec({a:1, b:2}, 'a && "test" || b')).toBe("test");
    });

    it("should return blank string for NaN", function() {
        expect(interpolator.exec({a: 1, b: 2}, 'a / b + c')).toBe('');
    });

    it("should capture errors in it's handler function", function() {
        var called = false;
        interpolator.setErrorHandler(function() {
            called = true;
            return false;
        });
        interpolator.exec({a: 1, b: 2}, 'a / b + c.d', true);
        expect(called).toBe(true);
    });

    it("should make use of filters", function() {
        injector.set('upper', function () {
            return function(str) {
                return str.toUpperCase();
            };
        });
        expect(interpolator.exec({name:'hummingbird'}, 'name|upper')).toBe('HUMMINGBIRD');
    });
});