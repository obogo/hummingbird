//! import string.supplant
define('plugin', ['http', 'interpolate', 'injector'], function (http, interpolate, injector) {

    return function (options, platform, view, next) {
        // 1. load up file

        http.get({
            url: options.url,
            success: function (response) {

                var str = ('(function(){var exports; {content}; return exports;})()').supplant({content: response.data});

                var fn = interpolate({}, str);

                injector(fn, options, {
                    platform: platform,
                    view: view,
                    next: next
                });
            }

        });

    };
});