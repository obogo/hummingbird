hb.define('copySpec', ['copy'], function (copy) {
    describe('copy', function () {
        it("should create a clone", function () {
            var a = {name:'Fred', birth: new Date(1, 1, 2000)};
            var b = copy(a);
            expect(b).not.toBe(a);
            expect(b).toEqual(a);
        });
    });
});
