define('addFileToHead', function () {
    return function (filename) {
        var headEl = document.getElementsByTagName("head")[0];
        var attachEl;

        if (filename.match(/.*?\.js$/gim)) {
            attachEl = document.createElement('script');
            attachEl.setAttribute("type", "text/javascript");
            attachEl.setAttribute("src", filename);
        }
        else if (filename.match(/.*?\.css$/gim)) {
            attachEl = document.createElement("link");
            attachEl.setAttribute("rel", "stylesheet");
            attachEl.setAttribute("type", "text/css");
            attachEl.setAttribute("href", filename);
        }
        if (headEl) {
            headEl.appendChild(attachEl);
        }
    };
});
