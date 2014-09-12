/* global data */
data.aggregate.hour = function (prop) {
    var key;
    return function (hash, data) {
        key = data[prop].getHours();
        hash[key] = hash[key] || { date: data[prop].getTime(), value: 0 };
        hash[key].value += 1;
    };
};
