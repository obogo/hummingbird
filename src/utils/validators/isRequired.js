utils.validators.isRequired = function (value, message) {
    if (typeof value === 'undefined') {
        throw new Error(message || 'The property "' + value + '" is required');
    }
};