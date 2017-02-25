define('localeReport', ['resolve'], function(resolve) {

    var pending;

    function makeGetter(used, unused, parent, path, prop, value) {
        if (!used[path]) {
            unused[path] = 1;
            used.$total += 1;
            parent.__defineGetter__(prop, function () {
                if (unused[path]) {
                    used[path] = 1;
                    used.$used += 1;
                    delete unused[path];
                    clearTimeout(pending);
                    pending = setTimeout(used.$log, 100);
                }
                return value;
            });
        }
    }

    function defineGetters(used, unused, path, root, data) {
        var p, i;
        for(i in data) {
            if (data.hasOwnProperty(i)) {
                p = (path && path + '.' || '') + i;
                if (typeof data[i] === "string") {
                    makeGetter(used, unused, root, p, i, data[i]);
                } else if (!root.hasOwnProperty(i)) {
                    root[i] = {};
                    defineGetters(used, unused, p, root[i], data[i]);
                }
            }
        }
    }

    return function LocaleReport(root, dataOrKey, value) {
        var used = root.$used = root.$used || {$used:0, $total: 0, $calc: function() {
            return used.$used + '/' + used.$total + ' = ' + used.$used/used.$total;
        }, $log: function() {
            console.log(used.$calc());
        }};
        root.$unused = root.$unused || {};
        root.$calc = root.$calc || used.$calc;
        root.$report = root.$report || function() {
            return root.$unused;
        };
        if (typeof dataOrKey === "string" ) {
            var p = dataOrKey.split('.');
            var k = dataOrKey.pop();
            makeGetter(used, root.$unused, resolve(root).get(p.join('.')), dataOrKey, k, value);
            return;
        }
        defineGetters(used, root.$unused, '', root, dataOrKey);
        console.log("strings", used.$total);
        return root;
    }
});