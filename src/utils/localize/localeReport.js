define('localeReport', ['hb.debug', 'resolve', 'extend'], function(debug, resolve, extend) {

    var storageKey = 'locale-report';
    var storage;
    var intv;
    function getStorage() {
        if (!storage) {
            var result = window.localStorage.getItem(storageKey);
            storage = result ? JSON.parse(result) : {};
        }
        return storage;
    }

    function writeStorage(used) {
        var s = getStorage();
        var now = Date.now();
        for(var i in used) {
            if (used.hasOwnProperty(i)) {
                s[i] = now;
            }
        }
        if (localStorage.setItem(storageKey, JSON.stringify(s))) {
            storage = null;
        }
    }

    function startIntv(used) {
        if (!intv) {
            intv = setTimeout(function() {
                writeStorage(used);
                intv = null;
            }, 1000);
        }
    }

    function makeGetter(used, unused, parent, path, prop, value) {
        if (!used[path]) {
            used.$total += 1;
            if (debug.ignoreErrors) {
                parent[prop] = value;// no getter for performance in production. no reports.
            } else {
                unused[path] = 1;
                parent.__defineGetter__(prop, function () {
                    if (unused[path]) {
                        used[path] = 1;
                        used.$used += 1;
                        used.$report[path] = 1;
                        delete unused[path];
                        startIntv(used.$report);
                    }
                    return value;
                });
                parent.__defineSetter__(prop, function (val) {
                    value = val;
                });
            }
        } else {
            parent[prop] = value;
        }
    }

    function defineGetters(used, unused, path, root, data) {
        var p, i;
        for(i in data) {
            if (data.hasOwnProperty(i)) {
                p = (path && path + '.' || '') + i;
                if (typeof data[i] === "string") {
                    makeGetter(used, unused, root, p, i, data[i]);
                } else {
                    root[i] = root[i] || {};
                    defineGetters(used, unused, p, root[i], data[i]);
                }
            }
        }
    }

    return function LocaleReport(root, dataOrKey, value) {
        var used = root.$used = root.$used || {$used:0, $total: 0, $report:{}, $calc: function() {
            if (debug.ignoreErrors) {
                return 'Report disabled. You must have debug.ignoreErrors=false enabled.';
            }
            return used.$used + '/' + used.$total + ' = ' + used.$used/used.$total;
        }, $log: function() {
            console.log(used.$calc());
        }};
        root.$unused = root.$unused || {};
        root.$calc = root.$calc || used.$calc;
        root.$getUsed = root.$getUsed || function() {
            return used.$report;
        };
        root.$getUnused = root.$getUnused || function() {
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