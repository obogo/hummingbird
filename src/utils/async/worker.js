define('worker', ['apply'], function (apply) {
    var isIE10 = navigator.appVersion.indexOf("MSIE 10") !== -1;
    function createWorker(fn) {
        // URL.createObjectURL
        window.URL = window.URL || window.webkitURL;

        // "Server response", used in all examples
        var response = "self.onmessage=" + fn.toString();

        var blob;
        try {
            blob = new Blob([response], {type: 'application/javascript'});
        } catch (e) { // Backwards-compatibility
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
            blob = new BlobBuilder();
            blob.append(response);
            blob = blob.getBlob();
        }
        // if IE10. It throws a security exception. So fake the worker.
        if (isIE10) {
            return {
                onmessage: null,
                postMessage: function (txt) {
                    var e = {data: txt};
                    var self = this;
                    //fn = fn.split("postMessage(").join("this.postMessage(");
                    fn = fn.replace(/^function\s[\w\d]+\(.*?\)\s+\{/, '');
                    fn = fn.substr(0, fn.length - 2);
                    var f = apply(new Function('with(this) {' + fn + '}'), {
                        e: e, postMessage: function (result) {
                            setTimeout(function () {
                                self.onmessage({data: result});
                            });
                        }
                    }, [e]);
                },
                terminate: function () {
                }
            };
        }
        return new Worker(URL.createObjectURL(blob));
    }

    return createWorker;

});