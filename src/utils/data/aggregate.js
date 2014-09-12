/* global data */
utils.data.aggregate = function(arrayList, formatter) {
    var i = 0,
        len = arrayList.length,
        returnVal = [],
        hash = {};

    while (i < len) {
        formatter(hash, arrayList[i]);
        i += 1;
    }

    for (i in hash) {
        if (hash.hasOwnProperty(i)) {
            returnVal.push(hash[i]);
        }
    }
    return returnVal;
}