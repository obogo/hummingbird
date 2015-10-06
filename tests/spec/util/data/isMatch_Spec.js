hb.define('isMatchSpec', ['isMatch'], function (isMatch) {
    describe('isMatch', function () {

        it("should match a single property", function () {
            expect(isMatch({id: 'a'}, {id: 'a'})).toBe(true);
        });

        it("should NOT match if values are not the same", function () {
            expect(isMatch({id: 'a'}, {id: 'b'})).toBe(false);
        });

        it("should match a single property and ignore non filter properties", function () {
            expect(isMatch({id: 'a', key: 'value'}, {id: 'a'})).toBe(true);
        });

        it("should NOT match if the property is missing", function () {
            expect(isMatch({key: 'value'}, {id: 'a'})).toBe(false);
        });

        it("should match a nested property", function () {
            expect(isMatch({id: 'a', key: {value: 1}}, {key: {value: 1}})).toBe(true);
        });

        it("should match a regex property in the filter", function () {
            expect(isMatch({id: 'a', key: {value: 1}}, {key: {value: /^\d+$/}})).toBe(true);
        });

        it("should NOT match a regex property in the filter if the regEx does not match", function () {
            expect(isMatch({id: 'a', key: {value: 'X'}}, {key: {value: /^\d+$/}})).toBe(false);
        });

        it("should match a date", function () {
            var date = new Date();
            expect(isMatch({date: date}, {date: new Date(date.getTime())})).toBe(true);
        });

        it("should match a complex filter", function () {
            var item = {
                id: 'a',
                selected: {
                    id: 1,
                    name: "Jim Bo",
                    profile: {
                        firstName: "Jim",
                        lastName: "Bo",
                        address: "P.O. Box 36"
                    }
                }
            };
            var filter = {
                selected: {
                    profile: {
                        address: /^P\.O\./
                    }
                }
            };
            var result = isMatch(item, filter);
            expect(result).toBe(true);
        });
    });
});