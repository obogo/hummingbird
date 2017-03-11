/**
 * Example:
     var object = { 'a': [{ 'b': { 'c': 3 } }] };
     resolve(object).get('a[0].b.c');// 3
     resolve(object).get(['a', '0', 'b', 'c']);// 3
     resolve(object).set('a.b.c', 'default'); // object
     resolve(object).get('a.b.c'); // "default"
 */
define('resolve', ['isUndefined'], function (isUndefined) {
    /* global angular */

    var aryIndexRx = /\[(.*?)\]/g;

    function pathToArray(path, delimiter, data) {
        if (path instanceof Array) {
            return path;
        }
        delimiter = delimiter || '.';
        path = path || '';
        path = path.replace(aryIndexRx, function(m, g1) {
            if (g1.indexOf('"') !== -1 || g1.indexOf("'") !== -1) {
                return delimiter + g1;
            }
            return delimiter + resolve(data).get(g1);
        });
        return path.split(delimiter);
    }

    function Resolve(data) {
        this.data = data || {};
    }

    var proto = Resolve.prototype;
    proto.get = function (path, delimiter) {
        var data = this.data,
            arr = pathToArray(path, delimiter, data),
            space = '',
            i = 0,
            len = arr.length;

        while (data && i < len) {
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
        if(isUndefined(path)) {
            throw new Error('Resolve requires "path"');
        }
        var data = this.data,
            arr = pathToArray(path, delimiter, data),
            space = '',
            i = 0,
            len = arr.length - 1;

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

    proto.default = function(path, value, delimiter) {
        if(isUndefined(this.get(path, delimiter))) {
            this.set(path, value, delimiter);
        }
    };

    proto.clear = function () {
        var d = this.data;
        for (var e in d) {
            if(d.hasOwnProperty(e)) {
                delete d[e];
            }
        }
    };

    proto.path = function (path) {
        return this.set(path, {});
    };

    var resolve = function (data) {
        return new Resolve(data);
    };

    return resolve;
});