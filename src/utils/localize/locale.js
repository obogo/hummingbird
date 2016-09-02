/*
locale('name', 'Fred'); // saves the value
locale('name'); // returns "Fred"
locale('countries.USA', "United States of America"); // saves the value
locale('countries.USA'); // returns "United States of America"
locale({countries:{USA:"United States of America"}}); // saves the value. It also returns is and can be chained if passing objects.
*/
define('locale', ['extend', 'resolve', 'format'], function (extend, resolve, format) {
    // format is required to localize the dates.
    //TODO: this needs to be updated to support date patterns like European date formats.
    var r;
    var defaults = {
        monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    var locale = function (key, value) {
        if (value !== undefined) {
            r.set(key, value);
        }
        if (typeof key === 'object') {
            extend(locale, key);
            Date.setLocalization(locale.monthNames, locale.dayNames);
            return locale;
        }
        return r.get(key);
    };

    r = resolve(locale);
    extend(locale, defaults);
    Date.setLocalization(locale.monthNames, locale.dayNames);

    return locale;
});