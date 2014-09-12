/* global app */
var directives = function (module, dirStr) {
    var $d = directives;
    var name;
    var list = dirStr.split(' ');
    for(var e in list) {
        name = list[e];
        if($d.hasOwnProperty(name)) {
            $d[name](module);
        }
    }
};