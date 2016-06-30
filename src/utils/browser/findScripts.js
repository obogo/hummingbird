define('findScripts', [], function () {
    return function (pattern) {
        var type = typeof pattern, i, tags = document.querySelectorAll('script'), src, resultTags = [];
        for (i = 0; i < tags.length; i++) {
            src = tags[i].src || '';
            if (type === 'string') {
                if (src.indexOf(pattern) !== -1) {
                    resultTags.push(tags[i]);
                }
            } else if (pattern.test(src)) {
                resultTags.push(tags[i]);
            }
        }
        return resultTags;
    };
});