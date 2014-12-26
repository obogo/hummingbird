append('debug.scope', ['framework'], function (framework) {

    var api = {};

    function count(scope, prop) {
        prop = prop || '$$watchers';
        var c = scope[prop].length, result = {$id: scope.$id}, next = scope.$$childHead, child;
        result[prop] = c;
        result.childTotal = 0;
        result._children = [];
        while (next) {
            child = count(next);
            result._children.push(child);
            result.childTotal += (child[prop] + child.childTotal);
            next = next.$$nextSibling;
        }
        return result;
    }

    api.count = count;
    framework.debug.scope = api;

});