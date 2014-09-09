/**
 * lpad
 * lpad a string till it reaches the len. (charPack)
 * @param char
 * @param len
 * @returns {string}
 */
/* global formatters */
formatters.stripHTMLComments = function (htmlStr) {
    htmlStr = htmlStr + '';
    return htmlStr.replace(/<!--[\s\S]*?-->/g, '');
};