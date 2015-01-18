(function () {
    'use strict';

    var globalNamespace = 'hb';
    var q = window[globalNamespace].q;

    window[globalNamespace] = function () {
        var args = Array.prototype.slice.call(arguments);
        var method = args.shift();
        if (hb.hasOwnProperty(method)) {
            hb[method].apply(hb, args);
        }
    };

    var init = function () {
        for (var i = 0; i < q.length; i += 1) {
            var args = Array.prototype.slice.call(q[i]);
            var method = args.shift();
            if (hb.hasOwnProperty(method)) {
                hb[method].apply(hb, args);
            }
        }
    };

    setTimeout(init);


    // :: CUSTOM CODE :: START
    hb.ready = function (callback) {
        if (typeof callback === 'function') {
            setTimeout(callback);
        }
    };

    hb.init = function (settings) {
        console.log('settings', settings);
    };

    hb.custom_action = function () {
        console.log('custom_action called...');
    };


    if(window.hbSettings) {
        hb('init', window.hbSettings);
    }
    // :: CUSTOM CODE :: END


})();