hb.ready(function () {
    // enable the mocks or disable them.
    hb.http.mock(true);

    hb.services.registerMock(/session\/login/im, function (next, options) {
        options.url = 'mocks/session/login.json';
        next();
    });

    hb.services.registerMock(/contacts\/new/im, function (next, options) {
        options.url = 'mocks/contacts/contact_new.json';
        next();
    });
});



