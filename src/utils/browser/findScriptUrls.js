define('findScriptUrls', [], function () {
    return function (pattern, returnTags) {
        var type = typeof pattern, i, tags = document.querySelectorAll('script'), matches = [], src, resultTags = [];
        for (i = 0; i < tags.length; i++) {
            src = tags[i].src || '';
            if (type === 'string') {
                if (src.indexOf(pattern) !== -1) {
                    matches.push(src);
                    if (returnTags) {
                        resultTags.push(tags[i]);
                    }
                }
            } else if (pattern.test(src)) {
                matches.push(src);
                if (returnTags) {
                    resultTags.push(tags[i]);
                }
            }
        }
        return returnTags ? resultTags : matches;
    };
});