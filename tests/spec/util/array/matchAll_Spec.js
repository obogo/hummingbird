hb.define('matchAllSpec', ['matchAll'], function(matchAll) {
    describe('matchAll', function () {
        it("should create a new array", function() {
            var ary = [0, 1, 2];
            var result = matchAll(ary, 3);
            expect(result.length).toBe(0);
        });

        it("should keep any items that match", function() {
            var ary = [0, 1, 2];
            var result = matchAll(ary, 2);
            expect(result).toEqual([2]);
        });

        it("should keep any items that match", function() {
            var ary = [0, 1, 2];
            var result = matchAll(ary, 2, 1);
            expect(result).toEqual([1, 2]);
        });

        it("should keep any items that match with objects", function() {
            var ary = [{id:0}, {id:1}, {id:1}];
            var result = matchAll(ary, {id:1});
            expect(result.length).toBe(2);
            expect(result[0].id).toBe(1);
            expect(result[1].id).toBe(1);
        });
    })
});