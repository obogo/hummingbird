/**
 * generate a random color. If you don't specify any arguments. Then it is fully random. Otherwise you can make each r, g, or b random.
 */
define("randomColor", ['lpad', 'randInt'], function(lpad, randInt) {
    var white = parseInt('FFFFFF', 16);
    var part = 256;
    /**
     * @param {Number=} r
     * @param {Number=} g
     * @param {Number=} b
     * @returns {string}
     */
    function random(r, g, b) {
        return '#' + (arguments.length ? rand(r) + rand(g) + rand(b) : lpad(randInt(white)).toString(16), '0', 6);
    }
    function rand(enable) {
        return enable ? lpad((randInt(part)).toString(16), '0', 2) : '00';
    }
    return random;
});