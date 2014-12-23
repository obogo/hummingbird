define('display', ['align', 'sorting'], function (align, sorting) {
    return {
        align: function () {
            return new align();
        },
        sorting: function () {
            return new sorting();
        }
    }
});