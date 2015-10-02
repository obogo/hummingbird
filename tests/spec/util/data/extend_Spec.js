hb.define('extendSpec', ['extend', 'isDate', 'isRegExp'], function (extend, isDate, isRegExp) {
    describe('extend', function () {

        it("should merge two objects together", function () {
            var a = {a: 1}, b = {b: 2}, result = extend(a, b);
            expect(result.a).toBe(1);
            expect(result.b).toBe(2);
        });

        it("should have the latter arguments override the target", function () {
            var a = {a: 1}, b = {a: 2}, result = extend(a, b);
            expect(result.a).toBe(2);
        });

        it("should merge arrays", function () {
            var a = {a: [1, 2]}, b = {a: [1, 1, 3]}, result = extend(a, b);
            expect(result.a).toEqual([1, 1, 3]);
        });

        it("should create date objects", function() {
            var a = {}, b = {a:new Date()};
            extend(a, b);
            expect(isDate(a.a)).toBe(true);
        });

        it("should create RegExp objects", function() {
            var a = {}, b = {a:/\w+/g};
            extend(a, b);
            expect(isRegExp(a.a)).toBe(true);
        });

        describe("options", function () {

            it("override = false should keep original values", function () {
                var a = {a: 1}, b = {a: 2}, result = extend.apply({override: false}, [a, b]);
                expect(result.a).toBe(1);
            });

            it("override = undefined work the same as override = true", function () {
                var a = {a: 1}, b = {a: 2},
                    result1 = extend.apply({}, [a, b]),
                    result2 = extend.apply({override:true}, [a, b]);
                expect(result1.a).toEqual(result2.a);
            });

            it("arrayAsObject should convert arrays to objects", function () {
                var a = {a: [2, 3]}, b = {a: [1]}, result = extend.apply({arrayAsObject: true}, [a, b]);
                expect(result.a).toEqual({'0': 1, '1': 3});
            });

            it("objectAsArray should convert arrays to objects", function () {
                var a = {a: {'0': 1, '1': 3, length: 2}}, b = {
                    a: {
                        '0': 2,
                        length: 1
                    }
                }, result = extend.apply({objectAsArray: true}, [a, b]);
                expect(result.a).toEqual([2, 3]);
            });

            it("concat should concat arrays", function () {
                var a = {a: [2, 3]}, b = {a: [1]}, result = extend.apply({concat: true}, [a, b]);
                expect(result.a).toEqual([2, 3, 1]);
            });

            it("arrayAsObject and concat should concat arrays and return them as objects", function () {
                var a = {a: [2, 3]}, b = {a: [1]},
                    result = extend.apply({
                            arrayAsObject: true,
                            concat: true
                        },
                        [a, b]);
                expect(result.a).toEqual({'0': 2, '1': 3, '2': 1});
            });

            it("override = false, arrayAsObject, and concat should concat arrays and return them as objects while keeping original values", function () {
                var a = {a: [2, 3], b: 1}, b = {a: [1], b: 2},
                    result = extend.apply({
                            override: false,
                            arrayAsObject: true,
                            concat: true
                        },
                        [a, b]);
                expect(result.a).toEqual({'0': 2, '1': 3, '2': 1});
                expect(result.b).toBe(1);
            });
        });
    });
});
