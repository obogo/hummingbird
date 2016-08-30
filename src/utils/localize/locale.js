define('locale', ['http', 'defer', 'extend', 'resolve', 'format'], function (http, defer, extend, resolve, format) {
    var r;
    var defaults = {
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    var locale = function (key, value) {
        if (value !== undefined) {
            r.set(key, value);
        }
        return r.get(key);
    };
    locale.$load = function (lang) {
        var d = defer();
        lang = lang.toLowerCase();
        locale("language.label", lang);
        http.get({
            url: 'locale/' + lang + '.json',
            success: function (response) {
                extend(locale, response.data);
                Date.setLocalization(locale.monthNames, locale.dayNames);
                d.resolve(locale);
            },
            error: function (e) {
                d.reject(e);
                locale.$load('en-us');
            }
        });
        return d.promise;
    };

    r = resolve(locale);
    extend(locale, defaults);
    Date.setLocalization(locale.monthNames, locale.dayNames);
    locale.$load(window.navigator.language || window.navigator.userLanguage);

    return locale;
});