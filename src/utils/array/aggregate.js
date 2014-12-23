/* global data */
define('aggregate', function () {

    var aggregate = function (array, formatter) {
        var i = 0,
            len = array.length,
            returnVal = [],
            hash = {};

        while (i < len) {
            formatter(hash, array[i]);
            i += 1;
        }

        for (i in hash) {
            if (hash.hasOwnProperty(i)) {
                returnVal.push(hash[i]);
            }
        }
        return returnVal;
    };

    // formatters
    aggregate.minute = function (prop) {
        var key;
        this.format = function (hash, data) {
            key = data[prop].getMinutes();
            hash[key] = hash[key] || { date: data[prop].getTime(), value: 0 };
            hash[key].value += 1;
        };
    };

    aggregate.hour = function (prop) {
        var key;
        return function (hash, data) {
            key = data[prop].getHours();
            hash[key] = hash[key] || { date: data[prop].getTime(), value: 0 };
            hash[key].value += 1;
        };
    };

    return aggregate;

});
