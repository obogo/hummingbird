define('findScriptUrls', [], function () {
    return function(pattern) {
        var type = typeof pattern, i, tags = document.querySelectorAll("script"), matches = [], src;
        for (i = 0; i < tags.length; i++) {
            src = tags[i].src || "";
            if (type === "string") {
                if (src.indexOf(pattern) !== -1) {
                    matches.push(src);
                }
            } else if (pattern.test(src)) {
                matches.push(src);
            }
        }
        return matches;
    };
});