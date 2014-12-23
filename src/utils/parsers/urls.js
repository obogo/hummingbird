/**
 * Returns a list of items (urls) based on the types that were passed in.
 * @param str
 * @param type ex. jpg|png|gif
 * @return {*}
 */
define('urls', function () {
    var urls = function (str, type) {
        var urls, i, len;
        if (typeof str === 'string') {
            var rx = new RegExp('=\\"([^\\"]+\\.(' + type + ')\\")', 'gi');
            urls = str.match(rx);
            for (i = 0, len = urls ? urls.length : 0; i < len; ++i) {
                urls[i] = urls[i].replace(/(\"|=)/g, '');
            }
        }
        return urls || [];
    };

    return urls;
});
