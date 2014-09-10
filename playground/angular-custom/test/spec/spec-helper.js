beforeEach(function () {
    jasmine.addMatchers({

        toBeError: function () {
            return {
                compare: function (actual) {
                    return {
                        pass: (actual instanceof Error)
                    };
                }
            };
        },

        toBeEmpty: function () {

            function isEmpty(val) {
                if (typeof val === 'string') {
                    return val === '';
                }

                if (typeof val === 'object' && val.length) {
                    return val.length === 0;
                }

                if (typeof val === 'object') {
                    for (var e in val) {
                        if (val.hasOwnProperty(e)) {
                            return false;
                        }
                    }
                    return true;
                }

                return false;
            }

            return {
                compare: function (actual, expected) {
                    var appliedSchemaData = actual;
                    return {
                        pass: isEmpty(appliedSchemaData) === expected
                    };
                }
            };
        }

    });
});
