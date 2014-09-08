app.framework.filter('upper', function () {
    return function (val) {
        return (val + '').toUpperCase();
    };
});