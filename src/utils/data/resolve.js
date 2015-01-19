define('resolve', function(){
    /* global angular */

    function Resolve(data) {
        this.data = data || {};
    }

    var proto = Resolve.prototype;
    proto.get = function (path, delimiter) {
        var arr = path.split(delimiter || '.'),
            space = '',
            i = 0,
            len = arr.length;

        var data = this.data;

        while (i < len) {
            space = arr[i];
            data = data[space];
            if (data === undefined) {
                break;
            }
            i += 1;
        }
        return data;
    };

    proto.set = function (path, value, delimiter) {
        var arr = path.split(delimiter || '.'),
            space = '',
            i = 0,
            len = arr.length - 1;

        var data = this.data;

        while (i < len) {
            space = arr[i];
            if (data[space] === undefined) {
                data = data[space] = {};
            } else {
                data = data[space];
            }
            i += 1;
        }
        if (arr.length > 0) {
            data[arr.pop()] = value;
        }
        return this.data;
    };

    proto.path = function (path) {
        return this.set(path, {});
    };

    var resolve = function (data) {
        return new Resolve(data);
    };

    return resolve;
});