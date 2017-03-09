/*
locale('name', 'Fred'); // saves the value
locale('name'); // returns "Fred"
locale('countries.USA', "United States of America"); // saves the value
locale('countries.USA'); // returns "United States of America"
locale({countries:{USA:"United States of America"}}); // saves the value. It also returns is and can be chained if passing objects.
*/
define('locale', ['resolve', 'date.format', 'localeReport', 'supplant'], function (resolve, format, localeReport, supplant) {
    // format is required to localize the dates.
    //TODO: this needs to be updated to support date patterns like European date formats.
    var r;
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
                localeReport(locale, key, value);
            } else if (typeof key === 'object') {
                localeReport(locale, key);
                Date.setLocalization(locale.monthNames, locale.dayNames);
                return locale;
            }
        }
        return r.get(key);
    };
    r = resolve(locale);
    localeReport(locale, defaults);
    Date.setLocalization(locale.monthNames, locale.dayNames);

    return locale;
});