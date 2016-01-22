define('hb.template', ['http', 'hb.debug', 'each'], function(http, debug, each) {
    function loadTemplate($app, url, callback) {
        if (!$app.template(url)) {
            var u = ($app.template('templatesBaseUrl') || '') + url;
            debug.info('load template', u);
            http.get({
                url: u,
                //async: false,// this MUST be synchronous.
                success: function (r) {
                    $app.template(url, r.data);
                    callback($app.template(url));
                },
                error: function () {
                    $app.template(url, '<div class="e404">OOPS! "' + u + '" - 404 Not Found!</div>');
                    callback($app.template(url));
                }
            });
            return;
        }
        callback($app.template(url));
    }

    function loadTemplateItem(item, index, list, $app, next) {
        loadTemplate($app, item, next);
    }

    function loadTemplates($app, url, callback) {
        if (typeof url === "object") {
            debug.log('load templates', url.join(', '));
            each(url, $app, loadTemplateItem, callback);
            return;
        }
        loadTemplate($app, url, callback);
    }

    return {
        get: loadTemplates
    }
});