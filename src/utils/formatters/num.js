define('num', function () {
    return function (val, decimals, separator) {
        separator = separator || ',';
        var parts = val.toFixed(decimals || 0).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        return parts[0] + (parts[1] ? '.' + parts[1] : '');
    };
});