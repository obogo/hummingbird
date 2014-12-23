/* global validators, data, forEach */
/**
 * @deps validators.isObject
 * @param source
 * @param destination
 * @param stackSource
 * @param stackDest
 * @returns {*}
 */
define('copy', ['isWindow', 'isArray', 'isDate', 'isRegExp', 'isObject'], function (isWindow, isArray, isDate, isRegExp, isObject) {

    var copy = function (source, destination, stackSource, stackDest) {
        if (isWindow(source)) {
            throw Error("Can't copy! Making copies of Window instances is not supported.");
        }

        if (!destination) {
            destination = source;
            if (source) {
                if (isArray(source)) {
                    destination = data.copy(source, [], stackSource, stackDest);
                } else if (isDate(source)) {
                    destination = new Date(source.getTime());
                } else if (isRegExp(source)) {
                    destination = new RegExp(source.source);
                } else if (isObject(source)) {
                    destination = data.copy(source, {}, stackSource, stackDest);
                }
            }
        } else {
            if (source === destination) {
                throw Error("Can't copy! Source and destination are identical.");
            }

            stackSource = stackSource || [];
            stackDest = stackDest || [];

            if (isObject(source)) {
                var index = stackSource.indexOf(source);
                if (index !== -1) {
                    return stackDest[index];
                }

                stackSource.push(source);
                stackDest.push(destination);
            }

            var result;
            if (isArray(source)) {
                destination.length = 0;
                for (var i = 0; i < source.length; i++) {
                    result = data.copy(source[i], null, stackSource, stackDest);
                    if (isObject(source[i])) {
                        stackSource.push(source[i]);
                        stackDest.push(result);
                    }
                    destination.push(result);
                }
            } else {
                forEach(destination, function (value, key) {
                    delete destination[key];
                });
                for (var key in source) {
                    result = data.copy(source[key], null, stackSource, stackDest);
                    if (isObject(source[key])) {
                        stackSource.push(source[key]);
                        stackDest.push(result);
                    }
                    destination[key] = result;
                }
            }

        }
        return destination;
    };

    return copy;

});
