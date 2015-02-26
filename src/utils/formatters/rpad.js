/**
 * rpad
 * rpad pad a string until it reaches the len (alias charPack).
 * @param {String} str
 * @param {String} char
 * @param {String} len
 * @returns {string}
 */
define('rpad', function () {
    var rpad = function (str, char, len) {
        while (str.length < len) {
            str += char;
        }
        return str;
    };
    return rpad;
});
