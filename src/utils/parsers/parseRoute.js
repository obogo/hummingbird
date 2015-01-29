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

    function getPathname(url, dropQueryParams) {
        if (dropQueryParams) {
            url = url.split('?').shift();
        }
        url = url.replace(/^\w+:\/\//, '');// replace protocol
        url = url.replace(/^\w+:\d+\//, '/');// replace port
        url = url.replace(/^\w+\.\w+\//, '/');// replace domain
        return url;
    }

    function extractParams(patternUrl, url, combined) {
        url = getPathname(url);
        var parts = url.split('?'),
            searchParams = parts[1],
            params = {},
            queryParams = {};
        if (patternUrl[0] === '/' && parts[0][0] !== '/') {
            parts[0] = '/' + parts[0];// make sure the indexes line up.
        }
        parts = parts[0].split('/');
        each.call({all: true}, patternUrl.split('/'), keyValues, params, parts);
        if (searchParams) {
            each(searchParams.split('&'), urlKeyValues, queryParams);
        }
        return combined ? combine({}, [params, queryParams]) : {params:params, query: queryParams};
    }

    function combine(target, objects) {
        var i, j, len = objects.length, object;
        for(i = 0; i < len; i += 1) {
            object = objects[i];
            for (j in object) {
                if (object.hasOwnProperty(j)) {
                    target[j] = object[j];
                }
            }
        }
        return target;
    }

    function match(patternUrl, url) {
        var patternParams = patternUrl.indexOf('?') !== -1 ? patternUrl.split('?').pop().split('&') : [];
        patternUrl.replace(/:(\w+)/g, function(match, g) {
            patternParams.push(g);
            return match;
        });
        var values = extractParams(patternUrl.split('?').shift(), url, true);
        var hasParams = !!patternParams.length;
        if (hasParams) {
            each(patternParams, function(value) {
                if (value === '') {
                    // ignore that param.
                } else if (!values.hasOwnProperty(value) || values[value] === undefined) {
                    hasParams = false;
                }
            });
            if (!hasParams) {
                return null;// it did not match all of the required params.
            }
        }
        // now we need to fix up the url so that it can be matched on.
        var matchUrl = patternUrl.split('?').shift().replace(/\/:(\w+)/g, function(match, g1) {
            return '/' + values[g1];
        });
        // stips url down to path, then only matches from the end what was built.
        var endOfPathName = getPathname(url, true);
        return endOfPathName === matchUrl;
    }

    return {
        extractParams: extractParams,
        match: match
    };
});