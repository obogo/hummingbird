'use strict';
describe("Injector", function () {

    describe("invoke", function () {
        var injector;
        beforeEach(function () {
            injector = hb.injector();
        });

        it("should inject values from locals", function () {
            var resultName;
            injector.invoke(function (name) {
                resultName = name;
            }, {}, {name: 'Hummingbird'});
            expect(resultName).toBe('Hummingbird');
        });

        it("should be albe to inject multiple arguments", function () {
            expect(injector.invoke(function (a, b, c) {
                return a + b + c;
            }, {}, {a: 1, b: 2, c: 3})).toBe(6);
        });

        it("should scope the invocation to the scope", function () {
            expect(injector.invoke(function (a) {
                return a + this.b;
            }, {b: 2}, {a: 1})).toBe(3);
        });

        it("should invoke from an array so it works while minified", function () {
            expect(injector.invoke(['first', 'last', function (a, b) {
                return a + ' ' + b;
            }], {}, {first: 'Obogo', last: 'Hummingbird'})).toBe('Obogo Hummingbird');
        });

        it("should invoke with the $inject property on the function if it exists", function () {
            var fn = function (a, b) {
                return a + ' ' + b;
            };
            fn.$inject = ['first', 'last'];
            expect(injector.invoke(fn, {}, {first: 'Obogo', last: 'Hummingbird'})).toBe('Obogo Hummingbird');
        });

        it("should inject values that are globally registered", function () {
            var rs = {};
            injector.set("rootScope", rs);
            expect(injector.invoke(function (rootScope) {
                return rootScope;
            }, {}, {})).toBe(rs);
        });
    });

    describe("instantiate", function () {
        var injector;
        beforeEach(function () {
            injector = hb.injector();
        });

        it("should create a new instance of an object.", function () {
            function Test() {
                this.name = 'test';
            }

            expect(injector.instantiate(Test, {}).name).toBe('test');
        });

        it("should create a new instance and inject the values", function () {
            function Test(name) {
                this.name = name;
            }

            expect(injector.instantiate(Test, {name: 'Hummingbird'}).name).toBe('Hummingbird');
        });

        it("should instantiate with injections when in an array for minification", function () {
            function Test(a) {
                this.name = a;
            }

            expect(injector.instantiate(['name', Test], {name: 'Hummingbird'}).name).toBe('Hummingbird');
        });

        it("should instantiate with injections that are globally registered", function () {
            injector.set("name", "Hummingbird");
            function Test(a) {
                this.name = a;
            }

            expect(injector.instantiate(['name', Test], {}).name).toBe('Hummingbird');
        });
    });

    describe("get/set", function () {
        var injector;
        beforeEach(function () {
            injector = hb.injector();
        });

        it("should get a value that was added", function () {
            injector.set('test', 1);
            expect(injector.get('test')).toBe(1);
        });
    });
//
//    describe("getInjection", function () {
//        var injector;
//        beforeEach(function () {
//            injector = hb.injector();
//        });
//
//        it("should get the variables from the function", function () {
//            function fn(a, b, c) {
//            }
//
//            expect(injector.getInjection(fn, {}, {a: 1, b: 2, c: 3})).toEqual([1, 2, 3]);
//        });
//    });
});