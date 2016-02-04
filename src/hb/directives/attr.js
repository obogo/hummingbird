//! pattern /hb\-(src|alt|title|pattern|id|for|name)\=/
define('hbAttr', ['hb.directive'], function(directive) {

    function generate(scope, el,  alias) {
        var attr = alias.name.split('-').pop();
        scope.$watch(alias.value, function (newVal) {
            if (newVal) {
                el.setAttribute(attr, newVal);
            } else {
                el.removeAttribute(attr);
            }
        });
    }

    var names = ['src', 'alt', 'title', 'pattern', 'id', 'for', 'name'];
    for(var i = 0; i < names.length; i += 1) {
        var n = names[i];
        directive('hb' + n.charAt(0).toUpperCase() + n.substr(1, n.length), function () {
            return {
                link: ['scope', 'el', 'alias', generate]
            };
        });
    }
});