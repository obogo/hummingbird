(function () {

    function shuffle(array) {
        var copy = [], n = array.length, i;

        // While there remain elements to shuffle…
        while (n) {

            // Pick a remaining element…
            i = Math.floor(Math.random() * n--);

            // And move it to the new array.
            copy.push(array.splice(i, 1)[0]);
        }

        return copy;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getParameter(paramName) {
        var searchString = window.location.search.substring(1),
            i, val, params = searchString.split("&");

        for (i = 0; i < params.length; i++) {
            val = params[i].split("=");
            if (val[0] == paramName) {
                return val[1];
            }
        }
        return null;
    }

    //insights.mock(getParameter('mock'));
    hb.http.mock(true);

    hb.services.registerMock(/session\/me/im, function (next, options) {
        debugger;
        options.url = 'mocks/session/me.json';
        next();
    });

    hb.services.registerMock(/session\/login/im, function (next, options) {
        options.url = 'mocks/session/login.json';
        next();
    });

    hb.services.registerMock(/session\/logout/im, function (next, options) {
        options.url = 'mocks/session/logout.json';
        next();
    });

    hb.services.registerMock(/\/persons$/im, function preCall(next, options, http) {
        // now we are going to load all of the users and then put them together into a list.
        var ary = [], count = 1, max = 7;
        // we keep going until we get a 404.
        function success(response) {
            ary.push(response.data);
            count += 1;
            if (count > max) {
                options.data = ary;
                //setTimeout(next, 4000);
                next();
            } else {
                getPerson(count);
            }
        }

        function error() {
            options.data = ary;
            next();
        }

        function getPerson(c) {
            http.get('mocks/persons/person_' + c + '.json', success, error);
        }

        switch (options.method) {
            case 'POST':
                options.url = 'mocks/persons/create.json';
                break;
            case 'PUT':
                options.url = 'mocks/persons/update.json';
                break;
            case 'DELETE':
                options.url = 'mocks/persons/delete.json';
                break;
            default:
                getPerson(count);
        }
    }, function postCall(next, options) {
        next();
    });

    hb.services.registerMock(/\/contacts\/*/im, function preCall(next, options, http) {

        // now we are going to load all of the users and then put them together into a list.
        var ary = [], count = 1, max = 7, rand = getRandomInt(1, 3);
        // we keep going until we get a 404.
        function success(response) {
            ary.push(response.data);
            count += 1;
            if (count > max) {
                options.data = shuffle(ary).splice(1, rand);
                //setTimeout(next, 4000);
                next();
            } else {
                getPerson(count);
            }
        }

        function error() {
            options.data = ary;
            next();
        }

        function getPerson(c) {
            http.get({
                url: 'mocks/persons/person_' + c + '.json',
                success: success,
                error: error,
                warn: function () {

                }
            });
        }

        getPerson(count);
    }, function postCall(next, options) {
        next();
    });

    hb.services.registerMock(/\/persons\/\w+$/im, function (next, options) {

        switch (options.method) {
            case 'POST':
                options.url = 'mocks/persons/create.json';
                break;
            case 'PUT':
                options.url = 'mocks/persons/update.json';
                break;
            case 'DELETE':
                options.url = 'mocks/persons/delete.json';
                break;
            default:
                var personId = options.url.split('/').pop();
                switch (personId) {
                    case '546abf911d02b3aa3e1b86d5': // Brian Fellows
                        options.url = 'mocks/persons/person_1.json';
                        break;
                    case '54628c57906551630231bff4': // Miles Davis
                        options.url = 'mocks/persons/person_2.json';
                        break;
                    case '546154653acc00bfac8a4b8e': // Blake Shelton
                        options.url = 'mocks/persons/person_3.json';
                        break;
                    case '54175745f554241c28924734': // Jim Halpert
                        options.url = 'mocks/persons/person_4.json';
                        break;
                    case '539a1fc0a7bacb4e67246cf1': // Jim Brown
                        options.url = 'mocks/persons/person_5.json';
                        break;
                    case '538a81df3431edcb5242febc': // Robert Taylor
                        options.url = 'mocks/persons/person_6.json';
                        break;
                    case '5389ce21dbb28a0122acc0ba': // Abe Lincoln
                        options.url = 'mocks/persons/person_7.json';
                        break;
                    default:
                        options.url = 'mocks/persons/person_default.json';
                }
            //console.log('personId', personId);
            //options.url = 'mocks/persons/get.json';
        }
        next();
    }, function (next) {
        next();
    });

})();


