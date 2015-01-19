define('parseRoute', ['each'], function(each) {

    function keyValues(key, index, list, result, parts) {
        if (key[0] === ':') {
            result[key.replace(':', '')] = parts[index];
        }
    }

    function urlKeyValues(str, result) {
        var parts = str.split('=');
        result[parts[0]] = parts[1];
    }

    function extractParams(patternUrl, url) {
        url = url.replace(/^\w+:\/\//, '');// replace protocol
        url = url.replace(/^\w+:\d+\//, '');// replace port
        var parts = url.split('?'),
            searchParams = parts[1],
            result = {};
        parts = parts[0].split('/');
        each.call({all: true}, patternUrl.split('/'), keyValues, result, parts);
        if (searchParams) {
            each(searchParams.split('&'), urlKeyValues, result);
        }
        return result;
    }

    function match(patternUrl, url) {
//TODO: :value needs to be params, and ?key=value needs to be query. So they are separated.
        var patternParams = patternUrl.indexOf('?') !== -1 ? patternUrl.split('?').pop().split('&') : null;
        var params = extractParams(patternUrl.split('?').shift(), url);
        var hasParams = !!patternParams;
        if (hasParams) {
            each(patternParams, function(value) {
                if (!params.hasOwnProperty(value)) {
                    hasParams = false;
                }
            });
            if (!hasParams) {
                return null;// it did not match all of the required params.
            }
        }
        // now we need to fix up the url so that it can be matched on.
        var matchUrl = url.replace(/\\\/:(\w+)\\\//g, function(match, g1) {
            return '/' + params[g1]  + '/';
        });
        return url.indexOf(matchUrl) !== -1;
    }

    return {
        extractParams: extractParams,
        match: match
    };
});