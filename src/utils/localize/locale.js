/*
locale('name', 'Fred'); // saves the value
locale('name'); // returns "Fred"
locale('countries.USA', "United States of America"); // saves the value
locale('countries.USA'); // returns "United States of America"
locale({countries:{USA:"United States of America"}}); // saves the value. It also returns is and can be chained if passing objects.
*/
define('locale', ['resolve', 'date.format', 'supplant', 'extend'], function (resolve, format, supplant, extend) {
    // format is required to localize the dates.
    //TODO: this needs to be updated to support date patterns like European date formats.
    var r;
    var config = {
        localStorageKey: 'language',
        basePath: 'languages',
        defaultLocale: 'en-US',
        fileExtension: '.lang.json',
        persistLanguage: true,
        supported: ['en-US'],
        fallbacks: {'en':'en-US'}
    };
    var language = getLang();
    var defaults = {
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    var locale = function (key, supplantValues) {
        if (typeof key === 'object') {
            return locale.$set(key);
        }
        return supplant(r.get(key), supplantValues);
    };

    locale.$set = function(key, value) {
        if (key) {
            if (typeof key === 'string') {
                r.set(key, value);
            } else if (typeof key === 'object') {
                extend(locale, key);
                Date.setLocalization(locale.monthNames, locale.dayNames);
                return locale;
            }
        }
        return r.get(key);
    };

    function getLang() {
        var lang = language || window.localStorage.getItem(config.localStorageKey) || window.navigator.language || window.navigator.userLanguage;
        if (config.supported.indexOf(lang) === -1) {
            lang = config.fallbacks[lang] || config.defaultLocale;
        }
        return lang;
    }

    Object.defineProperties(locale, {
        $config: {
            enumerable: true,
            get: function() { return config; },
            set: function(value) {
                extend(config, value);
                return config;
            }
        },
        $lang: {
            enumerable: true,
            get: function () {
                return language;
            },
            set: function (lang) {
                if (lang || !language) {
                    lang = lang || window.localStorage.getItem(config.localStorageKey) || window.navigator.language || window.navigator.userLanguage;
                    if (config.supported.indexOf(lang) === -1) {
                        lang = config.fallbacks[lang] || config.defaultLocale;
                    }
                    if (language !== lang) {
                        language = lang;
                        window.localStorage.setItem(config.localStorageKey, language);
                    }
                }
                return language;
            }
        },
        $url: {
            enumerable: true,
            get: function() {
                return config.basePath + '/' + language + config.fileExtension;
            }
        }
    });
    r = resolve(locale);
    extend(locale, defaults);
    Date.setLocalization(locale.monthNames, locale.dayNames);

    return locale;
});