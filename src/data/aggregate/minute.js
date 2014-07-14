/* global data */
data.aggregate.minute = function (prop) {
    var key;
    this.format = function (hash, data) {
        key = data[prop].getMinutes();
        hash[key] = hash[key] || { date: data[prop].getTime(), value: 0 };
        hash[key].value += 1;
    };
};
