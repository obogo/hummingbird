define('worker', ['apply'], function (apply) {
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
        return new Worker(URL.createObjectURL(blob));
    }

    return createWorker;
});