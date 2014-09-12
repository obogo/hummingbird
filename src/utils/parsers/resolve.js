utils.parsers.resolve = function(object, path, value) {

    path = path || '';
    var stack = path.match(/(\w|\$)+/g), property;
    var isGetter = typeof value === 'undefined';

    while (stack.length > 1) {
        property = stack.shift();

        switch (typeof object[property]) {
            case 'object':
                object = object[property];
                break;
            case 'undefined':
                if (isGetter) {
                    return;
                }
                object = object[property] = {};
                break;
            default:
                throw new Error('property is not of type object', property);
        }
    }

    if (typeof value === 'undefined') {
        return object[stack.shift()];
    }

    object[stack.shift()] = value;

    return value;
};