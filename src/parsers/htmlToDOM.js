/* global parsers */
parsers.htmlToDOM = function (htmlStr) {
    var container = document.createElement('div');
    container.innerHTML = htmlStr;
    return container.firstChild;
}