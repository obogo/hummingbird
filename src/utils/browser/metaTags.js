define('metaTags', function() {
    var data = {
        $refresh: function() {
            data = refresh();
            return this;
        }
    };
    function refresh() {
        var m = document.querySelectorAll("meta");
        for (var i = 0; i < m.length; i += 1) {
            data[m[i].getAttribute("name")] = m[i].getAttribute("content")
        }
    }
    refresh();
    return data;
});