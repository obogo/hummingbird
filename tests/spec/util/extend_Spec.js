hb.define('extendSpec', ['extend'], function (extend) {
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

        describe("options", function () {

            it("keepDefaults should keep default values", function () {
                var a = {a: 1}, b = {a: 2}, result = extend.apply({keepDefaults: true}, [a, b]);
                expect(result.a).toBe(1);
            });

            it("arrayAsObject should convert arrays to objects", function () {
                var a = {a: [2, 3]}, b = {a: [1]}, result = extend.apply({arrayAsObject: true}, [a, b]);
                expect(result.a).toEqual({'0': 1, '1': 3});
            });

            it("objectsAsArray should convert arrays to objects", function () {
                var a = {a: {'0': 1, '1': 3, length: 2}}, b = {
                    a: {
                        '0': 2,
                        length: 1
                    }
                }, result = extend.apply({objectsAsArray: true}, [a, b]);
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

            it("keepDefaults, arrayAsObject, and concat should concat arrays and return them as objects while keeping original values", function () {
                var a = {a: [2, 3], b: 1}, b = {a: [1], b: 2},
                    result = extend.apply({
                            keepDefaults: true,
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
