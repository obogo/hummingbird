define('isRequired', function () {
    var isRequired = function (value, message) {
        if (typeof value === 'undefined') {
            throw new Error(message || 'The property "' + value + '" is required');
        }
    };
    return isRequired;
});