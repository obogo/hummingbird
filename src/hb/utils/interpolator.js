define('interpolator', ['each', 'removeLineBreaks', 'removeExtraSpaces', 'apply'], function (each, removeLineBreaks, removeExtraSpaces, apply) {

    function Interpolator(injector) {

        var self = this;
        var ths = 'this';
        var filters = [];

        // performance variables.
        var strRefRx = /('|").*?[^\\]\1/g;
        var strRefRepRx = /(\.?[a-zA-Z\$\_]+\w?\b)(?!\s?\:)/g;
        var parseRx = /("|')?\w+\s?\1?\|\s?\w+/;
        var fixStrRefChar = '~*';
        var fixStrRefScope;
        var fixStrRefMatches = [];
        var fixStrRefCount;
        var getInjection = injector.getInjection.bind(injector);

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

        function replaceLookupStrDepth(str) {
            if (str.charAt(0) === '.') {
                return str;
            }
            return lookupStrDepth(str, fixStrRefScope);
        }

        function swapStringMatchOut(str) {
            var result = fixStrRefChar + fixStrRefCount;
            fixStrRefMatches.push(str);
            fixStrRefCount += 1;
            return result;
        }

        function fixStrReferences(str, scope) {
            var i, len;
            fixStrRefCount = 0;
            fixStrRefMatches.length = 0;// always reset
            fixStrRefScope = scope;
            str = str.replace(strRefRx, swapStringMatchOut);// adds to fixStrMatches
            str = str.replace(strRefRepRx, replaceLookupStrDepth);
            for (i = 0, len = fixStrRefMatches.length; i < len; i += 1) {
                str = str.split(fixStrRefChar + i).join(fixStrRefMatches[i]);
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

        function unfoundFilter(val) {
            return val;
        }

        function revertTick(val, index, list) {
            list[index] = val.split('`*`').join(':');
        }

        function parseFilter(str, scope, ignoreErrors) {
            if (str.indexOf('|') !== -1 && str.match(parseRx)) {
                str = str.replace('||', '~~');
                var parts = str.trim().split('|');
                parts[1] = parts[1].replace('~~', '||');
                each(parts, trimStrings);
                if (parts[1].indexOf(':') !== -1) {
                    parts[1] = parts[1].replace(/(\')(.*?):(.*?)\1/g, '$1$2`*`$3$1');
                }
                parts[1] = parts[1].split(':');
                var filterName = parts[1].shift().split('-').join(''),
                    filter = injector.val(filterName),
                    args;
                if (!filter) {
                    return {str:parts[0], filter:unfoundFilter};
                } else {
                    args = parts[1];
                    each(args, revertTick);
                }
                for(var i = 0; i < args.length; i += 1) {
                    args[i] = interpolate(scope, args[i], ignoreErrors);
                }
                return {
                    filter: function (value) {
                        args.unshift(value);
                        return apply(injector.invoke(filter, scope, {alias: filterName}), scope, args);
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
            for (i = 0, len = filters.length; i < len; i += 1) {
                str = filters[i](str);
            }
            if (!str) {
                return;
            }
            filter = parseFilter(str, scope, ignoreErrors);
            if (filter) {
                str = filter.str;
            }
            str = fixStrReferences(str, scope);
            result = apply(new fn('var result; try { result = ' + str + '; } catch(er) { result = er; } finally { return result; }'), scope);
            if (result) {
                //10its was caused by this not working in FF before changed to result instanceof Error
                // it cause a new error every time. Value kept changing. always dirty.
                if (result instanceof Error) {// (typeof result === 'object' && (result.hasOwnProperty('stack') || result.hasOwnProperty('stacktrace') || result.hasOwnProperty('backtrace')))) {
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

