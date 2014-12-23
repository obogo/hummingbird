/* global parsers */
define('toDOM', function () {

    var htmlToDOM = function (htmlStr) {
        var container = document.createElement('div');
        container.innerHTML = htmlStr;
        return container.firstChild;
    };

    return htmlToDOM;

});
