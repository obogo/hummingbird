/**
 * lpad
 * lpad a string till it reaches the len. (charPack)
 * @param {String} str
 * @param {String} char
 * @param {Number} len
 * @returns {string}
 */

define('lpad', function () {
    var lpad = function (str, char, len) {
        str = str + '';
        while (str.length < len) {
            str = char + str;
        }
        return str;
    };
    return lpad;
});
