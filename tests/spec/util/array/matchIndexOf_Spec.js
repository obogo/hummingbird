hb.define('matchIndexOfSpec', ['matchIndexOf'], function(matchIndexOf) {
    describe('matchIndexOf', function () {
        it("should return -1 if the item is not found", function() {
            var ary = [0, 1, 2];
            var result = matchIndexOf(ary, 3);
            expect(result).toBe(-1);
        });

        it("should return the index of the item found", function() {
            var ary = [0, 1, 2];
            var result = matchIndexOf(ary, 2);
            expect(result).toEqual(2);
        });

        it("should keep any items that match with objects", function() {
            var ary = [{id:0}, {id:1}, {id:1}];
            var result = matchIndexOf(ary, {id:1});
            expect(result).toBe(1);
        });
    })
});