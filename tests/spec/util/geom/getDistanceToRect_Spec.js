hb.define('getDistanceToRectSpec', ['getDistanceToRect'], function (getDistanceToRect) {
    describe('getDistanceToRect', function () {

        it("should return horizontal distance", function () {
            var dist = getDistanceToRect({x:0, y:0, width:10, height:10}, {x:20, y:0});
            expect(dist).toBe(10);
        });

        it("should return vertical distance", function () {
            var dist = getDistanceToRect({x:0, y:0, width:10, height:10}, {x:0, y:20});
            expect(dist).toBe(10);
        });

        it("should return the diagonal distance", function () {
            var dist = getDistanceToRect({x:0, y:0, width:10, height:10}, {x:15, y:20});
            expect(dist.toFixed(3)).toBe('11.180');
        });

        //TODO: check negative angles.

    });
});
