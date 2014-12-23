/**
 * lpad
 * lpad a string till it reaches the len. (charPack)
 * @param char
 * @param len
 * @returns {string}
 */
/* global formatters */
define('removeLineBreaks', function () {
    var removeLineBreaks = function (str) {
        str = str + '';
        return str.replace(/(\r\n|\n|\r)/gm, '');
    };
    return removeLineBreaks;
});
