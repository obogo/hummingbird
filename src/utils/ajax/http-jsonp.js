internal('http.jsonp', ['http'], function (http) {

    var defaultName = '_jsonpcb';

    function getNextName() {
        var i = 0, name = defaultName;
        while (window[name]) {
            name = defaultName + i;
            i += 1;
        }
        return name;
    }

    function createCallback(name, callback, script) {
        window[name] = function (data) {
            delete window[name];
            callback(data);
            document.head.removeChild(script);
        };
    }

    http.jsonp = function (url, success, error) {
        var name = getNextName(), paramsAry, i, script, options = {};

        if (url === undefined) {
            throw new Error('CORS: url must be defined');
        }

        if (typeof url === 'object') {
            options = url;
        } else {
            if (typeof success === 'function') {
                options.success = success;
            }
            if (typeof error === 'function') {
                options.error = error;
            }

            options.url = url;
        }
        options.callback = name;

        //if (http.handleMock(options)) {
        //    return;
        //}

        script = document.createElement("script");
        script.type = "text/javascript";
        script.onload = function () {
            setTimeout(function () {
                if (window[name]) {
                    error(url + " failed.");
                }
            });
        };
        createCallback(name, success, script);

        paramsAry = [];
        for (i in options) {
            if (options.hasOwnProperty(i)) {
                paramsAry.push(i + '=' + options[i]);
            }
        }
        script.src = url + "?" + paramsAry.join('&');
        document.head.appendChild(script);
    };
    return http;
});