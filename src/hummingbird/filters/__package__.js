/* global app */
hummingbird.filters = function (module, filters) {
    var $d = hummingbird.filters;
    var name;
    var list = filters.split(' ');
    for(var e in list) {
        name = list[e];
        if($d.hasOwnProperty(name)) {
            $d[name](module);
        }
    }
};