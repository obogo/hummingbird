internal('interpolator', ['each', 'removeLineBreaks', 'removeExtraSpaces'], function (each, removeLineBreaks, removeExtraSpaces) {

    function Interpolator(injector) {

        var self = this;
        var ths = 'this';
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
            return ths + '.' + str;
        }

        function parseFilter(str, scope) {
            if (str.indexOf('|') !== -1 && str.match(/\w+\s?\|\s?\w+/)) {
                str = str.replace('||', '~~');
                var parts = str.trim().split('|');
                parts[1] = parts[1].replace('~~', '||');
                each.call({all: true}, parts, trimStrings);
                parts[1] = parts[1].split(':');
                var filterName = parts[1].shift(),
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
            var fn = Function, result, filter;
            if (str === null || str === undefined) {
                return;
            }
            str = removeLineBreaks(str);
            str = removeExtraSpaces(str);
            if (!str) {
                return;
            }
            filter = parseFilter(str, scope);
            if (filter) {
                str = filter.str;
            }
            str = fixStrReferences(str, scope);
            if (!ignoreErrors) {
                result = (new fn('return ' + str)).apply(scope);
            } else {
                result = (new fn('var result; try { result = ' + str + '; } catch(er) { result = er; } finally { return result; }')).apply(scope);
                if (result) {
                    if (typeof result === 'object' && (result.hasOwnProperty('stack') || result.hasOwnProperty('stacktrace') || result.hasOwnProperty('backtrace'))) {
                        if (!ignoreErrors) {
                            interpolateError(result, scope, str, errorHandler);
                        }
                        result = undefined;
                    }
                }
            }
            return filter ? filter.filter(result) : result;
        }

        function trimStrings(str, index, list) {
            list[index] = str && str.trim();
        }

        self.invoke = interpolate;
        self.setErrorHandler = setErrorHandler;
    }

    return function (injector) {
        return new Interpolator(injector);
    };

});

