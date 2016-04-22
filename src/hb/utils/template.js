define('hb.template', ['http', 'hb.debug', 'each'], function(http, debug, each) {
    var loading = {};

    function onLoad($app, url) {
        while (loading[url].length) {
            loading[url].shift()($app.template(url));
        }
        delete loading[url];
    }

    function loadTemplate($app, url, callback) {
        var isLoading = !!loading[url];
        loading[url] = loading[url] || [];
        loading[url].push(callback);
        if (!$app.template(url)) {
            if (!isLoading) {
                var u = ($app.template('templatesBaseUrl') || '') + url;
                debug.info('load template', u);
                http.get({
                    url: u,
                    //async: false,// this MUST be synchronous.
                    success: function (r) {
                        $app.template(url, r.data);
                        onLoad($app, url);
                    },
                    error: function () {
                        $app.template(url, '<div class="e404">OOPS! "' + u + '" - 404 Not Found!</div>');
                        onLoad($app, url);
                    }
                });
            }
            return;
        }
        onLoad($app, url);
    }

    function loadTemplateItem(item, index, list, $app, next) {
        loadTemplate($app, item, next);
    }

    function loadTemplates($app, url, callback) {
        if (typeof url === "object") {
            each(url, $app, loadTemplateItem, callback);
            return;
        }
        loadTemplate($app, url, callback);
    }

    return {
        get: loadTemplates
    }
});