hb.define('eachSpec', ['each'], function (each) {
    describe('each', function () {

        function createItems(num) {
            var a = [];
            for(var i = 0; i < num; i += 1) {
                a[i] = i;
            }
            return a;
        }

        it("should loop an array synchronously", function() {
            var items = createItems(10);
            var c = 0;
            each(items, function(num) {
                c += num;
            });
            expect(c).toBe(45);
        });

        it("should loop an array and pass index", function() {
            var items = createItems(10);
            var c = 0;
            each(items, function(num, index) {
                c += index;
            });
            expect(c).toBe(45);
        });

        it("should loop an array and pass list", function() {
            var items = createItems(10);
            var c = 0;
            each(items, function(num, index, list) {
                c += list === items ? 1 : 0;
            });
            expect(c).toBe(10);
        });

        it("should loop an array and pass params", function() {
            var items = createItems(10);
            var p = 1;
            var c = 0;
            each(items, p, function(num, index, list, params) {
                c += params;
            });
            expect(c).toBe(10);
        });

        describe("async", function() {

            it("should loop an array with next asynchronously", function (done) {
                var items = createItems(10);
                var c = 0;
                each(items,
                    function (num, index, list, next) {
                        c += 1;
                        next();
                    }, function() {
                        expect(c).toBe(10);
                        done();
                    });
                expect(c).toBe(1);// the first iteration is synchronous.
            });

            it("should loop an array with next asynchronously with params", function (done) {
                var items = createItems(10);
                var c = 0;
                var p = 1;
                each(items,
                    p,
                    function (num, index, list, p, next) {
                        c += p;
                        next();
                    }, function() {
                        expect(c).toBe(10);
                        done();
                    });
                expect(c).toBe(1);// the first iteration is synchronous.
            });

            it("should loop an array with next threshold", function (done) {
                var n = 1000;
                var items = createItems(n);
                var c = 0;
                each(items,
                    function (num, index, list, next) {
                        c += 1;
                        next(1);
                    }, function() {
                        expect(c).toBe(n);
                        done();
                    });
                expect(c).toBeGreaterThan(1);// the first iteration is synchronous.
                expect(c).toBeLessThan(n);// the first iteration is synchronous.
            }, 30000);
        });
    });
});