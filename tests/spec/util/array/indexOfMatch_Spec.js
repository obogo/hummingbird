hb.define('indexOfMatchSpec', ['indexOfMatch'], function(indexOfMatch) {
    describe('indexOfMatch', function () {
        it("should return the index of the matched item in the list", function () {
            var ary = [{id: 1}, {id: 2}, {id: 3}];
            expect(indexOfMatch(ary, {id: 2})).toBe(1);
        });
    });
});