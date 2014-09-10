/* global app */
app.directives = function (module, directives) {
    var $d = app.directives;
    var name;
    var list = directives.split(' ');
    for(var e in list) {
        name = list[e];
        if($d.hasOwnProperty(name)) {
            $d[name](module);
        }
    }
};