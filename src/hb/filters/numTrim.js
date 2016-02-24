//! pattern /(\|numtrim)/
define('hbNumTrim', ['hb.filter', 'numTrim'], function (filter, numTrim) {
    filter('numTrim', function () {
        return numTrim;
    });
});
