//! pattern /hb\-(src|alt|title|pattern|id|for|name|checked|disabled|value|href)\=/
define('hbAttr', ['hb.directive'], function(directive) {

    // make sure if you update this list, you update the patterns above as well.
    var names = ['src', 'alt', 'title', 'pattern', 'id', 'for', 'name', 'checked', 'disabled', 'value', 'href', 'placeholder'];

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

    for(var i = 0; i < names.length; i += 1) {
        var n = names[i];
        directive('hb' + n.charAt(0).toUpperCase() + n.substr(1, n.length), function () {
            return {
                link: ['scope', 'el', 'alias', generate]
            };
        });
    }
});