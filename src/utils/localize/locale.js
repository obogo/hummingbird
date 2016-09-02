define('locale', ['http', 'defer', 'extend', 'resolve', 'format'], function (http, defer, extend, resolve, format) {
    var r;
    var lang = '';
    var loading = false;
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
    locale.$load = function (language) {
        language = language || lang || window.navigator.language || window.navigator.userLanguage;
        if (lang !== language) {
            lang = language;
            loading = null;
        }
        if (!loading) {
            var d = loading = defer();
            lang = lang.toLowerCase();
            locale("language.label", lang);
            http.get({
                url: 'locale/' + lang + '.json',
                success: function (response) {
                    extend(locale, response.data);
                    Date.setLocalization(locale.monthNames, locale.dayNames);
                    if (loading === d) {
                        loading = null;
                    }
                    d.resolve(locale);
                },
                error: function (e) {
                    if (loading === d) {
                        loading = null;
                    }
                    d.reject(e);
                    locale.$load('en-us');
                }
            });
        }
        return loading.promise;
    };

    r = resolve(locale);
    extend(locale, defaults);
    Date.setLocalization(locale.monthNames, locale.dayNames);
    locale.$load();

    return locale;
});