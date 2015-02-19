define('isEmail', function () {
    var isEmail = function (val) {
        //    var regExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        // support for new domains can be any length
        var regExp = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9])+$/;
        return regExp.test(val + '');
    };
    return isEmail;
});