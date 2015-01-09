internal('hb.errors', function () {
    var errors = {
        E0: '',
        E1: '',
        E2: '',
        E3: '',
        E4: '',
        E5: '',
        E6a: '',
        E6b: '',
        E7: '',
        E8: '',
        E9: '',
        E10: '',
        E11: '',
        E12: ''
    };
    // they need to throw their number so we can find the error.
    // this may be helpful for scripts like capture so it can report the error
    // to the server when it is caught in production.
    for(var i in errors) {
        errors[i] = i;
    }
    return errors;
});
