hb.define('getPointOnRectSpec', ['getPointOnRect', 'degreesToRadians'], function (getPointOnRect, degreesToRadians) {
    describe('getPointOnRectangle', function () {

        it("should find a point on the rectangle with the distance at angle 0", function() {
            var pt = getPointOnRect({x:10, y:10, width:10, height:10}, 0);
            expect(pt.x).toBe(20);
            expect(pt.y).toBe(15);
        });

        it("should find a point on the rectangle with the distance at angle -90deg", function() {
            var pt = getPointOnRect({x:10, y:10, width:10, height:10}, degreesToRadians(-90));
            expect(pt.x).toBe(15);
            expect(pt.y).toBe(10);
        });

        it("should find a point on the rectangle with the distance at angle 180deg", function() {
            var pt = getPointOnRect({x:10, y:10, width:10, height:10}, degreesToRadians(180));
            expect(pt.x).toBe(10);
            expect(pt.y).toBe(15);
        });

        it("should find a point on the rectangle with the distance at angle 90deg", function() {
            var pt = getPointOnRect({x:10, y:10, width:10, height:10}, degreesToRadians(90));
            expect(Math.round(pt.x)).toBe(15);
            expect(Math.round(pt.y)).toBe(20);
        });

    });
});
