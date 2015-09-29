hb.define('getPointOnCircleSpec', ['getPointOnCircle', 'degreesToRadians'], function (getPointOnCircle, degreesToRadians) {
    describe('getPointOnCircle', function () {

        it("should return a point to the right if angle is 0", function() {
            var point = getPointOnCircle(10, 10, 5, 0);
            expect(point.x).toBe(15);
            expect(point.y).toBe(10);
        });

        it("should return a point to the left if angle is 180", function() {
            var point = getPointOnCircle(10, 10, 5, degreesToRadians(180));
            expect(point.x).toBe(5);
            expect(point.y).toBe(10);
        });

        it("should return a point to the top if angle is -90", function() {
            var point = getPointOnCircle(10, 10, 5, degreesToRadians(-90));
            expect(point.x).toBe(10);
            expect(point.y).toBe(5);
        });

        it("should return a point to the bottom if angle is 90", function() {
            var point = getPointOnCircle(10, 10, 5, degreesToRadians(90));
            expect(point.x).toBe(10);
            expect(point.y).toBe(15);
        });

    });
});
