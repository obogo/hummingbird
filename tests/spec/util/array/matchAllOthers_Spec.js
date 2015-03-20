hb.define('matchAllOthersSpec', ['matchAllOthers'], function(matchAllOthers) {
    describe('matchAllOthers', function () {
        it("should create a new array", function() {
            var ary = [0, 1, 2];
            matchAllOthers(ary, 3);
            expect(ary.length).toBe(3);
        });

        it("should not remove any if the items do not match", function() {
            var ary = [0, 1, 2];
            var result = matchAllOthers(ary, 3, 4);
            expect(result.length).toBe(3);
        });

        it("should remove any items that match", function() {
            var ary = [0, 1, 2];
            var result = matchAllOthers(ary, 2, 1);
            console.log(result);
            expect(result.length).toBe(1);
        });

        it("should remove any items that match with objects", function() {
            var ary = [{id:0}, {id:1}, {id:1}];
            var result = matchAllOthers(ary, {id:1});
            expect(result.length).toBe(1);
            expect(result[0].id).toBe(0);
        });
    })
});