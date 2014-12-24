/* global hb */
//! var md5 = require('md5');

var jsonp = hb.http.jsonp;

/**!
 * import query.width
 * import query.height
 * import polymers.*
 * import query.event.*
 */
hb.query(document).height();
var $ = hb.query;
$(document).height();

var $doc = $(document);
$doc.height();


// test :: repeater
(function () {
    return;
    var initDelay = 1000;
    var repeatDelay = 500;
    var maxRepeats = 10;
    var repeater = hb.repeater(initDelay, repeatDelay, maxRepeats);
    repeater.start(function (val) {
        console.log('val', val);
    });
})();

var h = hb.query('#box').height();
console.log('height', h);
hb.query('#box').height('200px');

// test :: timer
(function () {
    return;
    var timer = hb.timer();
    timer.on('start', function (evt, totalTime) {
        console.log('started', totalTime);
    });

    timer.on('change', function (evt, totalTime) {
        console.log('change', totalTime);
    });

    timer.start();
})();


// test :: stopwatch
(function () {
    var stopwatch = hb.stopwatch({
        startTime: 2000,
        endTime: 10000,
        tick: 1000
    });
    stopwatch.on('start', function (evt) {
        console.log('start', stopwatch.getTimeRemaining());
    });

    stopwatch.on('change', function (evt) {
        console.log('change', stopwatch.getTimeRemaining());
    });

    stopwatch.on('stop', function(evt){
        console.log('stop');
    });

    stopwatch.on('done', function(){
        console.log('done');
    });

    stopwatch.start();
})();

var myFunc = hb.debounce(function(){
    console.log('myFunc called from {name}'.supplant({ name: "Hummingbird"}));
}, 100);

myFunc();
myFunc();
myFunc();


