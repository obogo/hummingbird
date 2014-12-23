/**
 * lpad
 * lpad a string till it reaches the len. (charPack)
 * @param char
 * @param len
 * @returns {string}
 */
/* global formatters */
define('removeExtraSpaces', function () {
    var removeExtraSpaces = function (str) {
        str = str + '';
        return str.replace(/\s+/g, ' ');
    };

    return removeExtraSpaces;
});
