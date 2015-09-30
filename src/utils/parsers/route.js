define('route', ['each'], function(each) {
    var rx1 = /:(\w+)/g;
    var rx2 = /\/:(\w+)/g;

    function keyValues(key, index, list, params) {
        if (key[0] === ':') {
            params.result[key.replace(':', '')] = params.parts[index];
        }
    }

    function urlKeyValues(str, index, list, result) {
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
        each(patternUrl.split('/'), {result:params, parts:parts}, keyValues);
        if (searchParams) {
            each(searchParams.split('&'), queryParams, urlKeyValues);
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

    function matchParam(value, index, list, params) {
        if (value === '') {
            // ignore that param.
        } else if (!params.values.hasOwnProperty(value) || params.values[value] === undefined) {
            params.hasParams = false;
        }
    }

    function match(patternUrl, url) {
        var patternParams = patternUrl.indexOf('?') !== -1 ? patternUrl.split('?').pop().split('&') : [];
        patternUrl.replace(rx1, function(match, g) {
            patternParams.push(g);
            return match;
        });
        var params = {
            values: extractParams(patternUrl.split('?').shift(), url, true),
            hasParams: !!patternParams.length
        };
        if (params.hasParams) {
            each(patternParams, params, matchParam);
            if (!params.hasParams) {
                return null;// it did not match all of the required params.
            }
        }
        // now we need to fix up the url so that it can be matched on.
        var matchUrl = patternUrl.split('?').shift().replace(rx2, function(match, g1) {
            return '/' + params.values[g1];
        });
        // stips url down to path, then only matches from the end what was built.
        var endOfPathName = getPathname(url, true);
        return endOfPathName === matchUrl;
    }

    return {
        params: params,
        match: match
    };
});