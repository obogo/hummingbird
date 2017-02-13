define('workPromise', ['worker', 'defer'], function(worker, defer) {
    // worker with built in promise.
    return function workIt(data, fn) {
        var d = defer();
        var str = fn.toString();
        var wkr = worker(str);
        wkr.onmessage = function (e) {
            wkr.terminate();
            d.resolve(e.data);
        };
        wkr.postMessage(data);
        return d.promise;
    }
});