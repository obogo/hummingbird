define('metaTags', function() {
    var d = document;
    var data = {
        $set: function(key, value) {
            var node = d.querySelector("meta[name='" + key + "']");
            if (!node) {
                node = d.createElement('meta');
                d.head.appendChild(node);
            }
            node.setAttribute('name', key);
            node.setAttribute('content', value);
            data[key] = value;
        },
        $refresh: function() {
            data = refresh();
            return this;
        }
    };
    function refresh() {
        var m = d.querySelectorAll("meta");
        for (var i = 0; i < m.length; i += 1) {
            data[m[i].getAttribute("name")] = m[i].getAttribute("content")
        }
    }
    refresh();
    return data;
});