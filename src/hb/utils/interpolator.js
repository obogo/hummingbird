internal('interpolator', ['each', 'removeLineBreaks', 'removeExtraSpaces'], function (each, removeLineBreaks, removeExtraSpaces) {

    function Interpolator(injector) {

        var self = this;
        var ths = 'this';
        var filters = [];

        var errorHandler = function (er, extraMessage, data) {
            if (window.console && console.warn) {
                console.warn(extraMessage + '\n' + er.message + '\n' + (er.stack || er.stacktrace || er.backtrace), data);
            }
        };

        function setErrorHandler(fn) {
            errorHandler = fn;
        }

        function interpolateError(er, scope, str, errorHandler) {
            if (errorHandler) {
                errorHandler(er, 'Error evaluating: "' + str + '" against %o', scope);
            }
        }

        function fixStrReferences(str, scope) {
            var c = 0, matches = [], i = 0, len;
            str = str.replace(/('|").*?\1/g, function (str) {
                var result = '*' + c;
                matches.push(str);
                c += 1;
                return result;
            });
            str = str.replace(/(\.?[a-zA-Z\$\_]+\w?\b)(?!\s?\:)/g, function (str) {
                if (str.charAt(0) === '.') {
                    return str;
                }
                return lookupStrDepth(str, scope);
            });
            len = matches.length;
            while (i < len) {
                str = str.split('*' + i).join(matches[i]);
                i += 1;
            }
            return str;
        }

        function lookupStrDepth(str, scope) {
            // str is a single property string.
            str = str.trim();
            // we are going to check the first property off of the this.
            // if it is undefined we want it to inherit because of scope prototypes.
            // So we will remove it from the scope.
            if (scope[str] === undefined && scope.hasOwnProperty(str)) {
                delete scope[str];
            }
            // handle booleans and don't put a this. in front of them.
            var bool = str.toLowerCase();
            if (bool !== 'true' && bool !== 'false') {
                return ths + '.' + str;
            }
            return str;
        }

        function parseFilter(str, scope) {
            if (str.indexOf('|') !== -1 && str.match(/("|')?\w+\s?\1?\|\s?\w+/)) {
                str = str.replace('||', '~~');
                var parts = str.trim().split('|');
                parts[1] = parts[1].replace('~~', '||');
                each.call({all: true}, parts, trimStrings);
                parts[1] = parts[1].split(':');
                var filterName = parts[1].shift().split('-').join(''),
                    filter = injector.val(filterName),
                    args;
                if (!filter) {
                    return parts[0];
                } else {
                    args = parts[1];
                }
                each.call({all: true}, args, injector.getInjection, scope);
                return {
                    filter: function (value) {
                        args.unshift(value);
                        return injector.invoke(filter, scope, {alias: filterName}).apply(scope, args);
                    },
                    str: parts[0]
                };
            }
            return undefined;
        }

        function interpolate(scope, str, ignoreErrors) {
            var fn = Function, result, filter, i, len;
            if (str === null || str === undefined) {
                return;
            }
            for(i = 0, len = filters.length; i < len; i += 1) {
                str = filters[i](str);
            }
            if (!str) {
                return;
            }
            filter = parseFilter(str, scope);
            if (filter) {
                str = filter.str;
            }
            str = fixStrReferences(str, scope);
            result = (new fn('var result; try { result = ' + str + '; } catch(er) { result = er; } finally { return result; }')).apply(scope);
            if (result) {
                if (typeof result === 'object' && (result.hasOwnProperty('stack') || result.hasOwnProperty('stacktrace') || result.hasOwnProperty('backtrace'))) {
                    if (!ignoreErrors) {
                        interpolateError(result, scope, str, errorHandler);
                    }
                    result = undefined;
                }
            }
            return filter ? filter.filter(result) : result;
        }

        function trimStrings(str, index, list) {
            list[index] = str && str.trim();
        }

        function addFilter(fn) {
            filters.push(fn);
        }

        function removeFilter(fn) {
            var index = filters.indexOf(fn);
            if (index !== -1) {
                filters.splice(index, 1);
            }
        }

        self.addFilter = addFilter;
        self.removeFilter = removeFilter;
        self.invoke = interpolate;
        self.setErrorHandler = setErrorHandler;

        self.addFilter(removeLineBreaks);
        self.addFilter(removeExtraSpaces);
    }

    return function (injector) {
        return new Interpolator(injector);
    };

});

