/**
 * lpad
 * lpad a string till it reaches the len. (charPack)
 * @param char
 * @param len
 * @returns {string}
 */
formatters.lpad = function (char, len) {
    var s = '';
    while (s.length < len) { s += char; }
    return s;
};