/**
 * rpad
 * rpad pad a string until it reaches the len.
 * @param char
 * @param len
 * @returns {string}
 */
define('rpad', function () {

    var rpad = function (char, len) {
        var s = '';
        while (s.length < len) {
            s += char;
        }
        return s;
    };

    return rpad;

});
