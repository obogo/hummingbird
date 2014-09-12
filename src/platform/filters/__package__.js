/* global app */
var filters = function (module, filtersStr) {
    var $d = filters;
    var name;
    var list = filtersStr.split(' ');
    for(var e in list) {
        name = list[e];
        if($d.hasOwnProperty(name)) {
            $d[name](module);
        }
    }
};