/* global app, formatters, helpers */
function Interpolate(injector) {
    'use strict';
    var self = this;
    var ths = 'this';
    var each = helpers.each;
    var errorHandler = function (er, extraMessage, data) {
        if (window.console && console.warn) {
            console.warn(extraMessage + '\n' + er.message + '\n' + (er.stack || er.stacktrace || er.backtrace), data);
        }
    };

    function setErrorHandler(fn) {
        errorHandler = fn;
    }

    function interpolateError(er, scope, str, errorHandler) {
        var eh = errorHandler || defaultErrorHandler;
        if (eh) {
            eh(er, MESSAGES.E6a + str + MESSAGES.E6b, scope);
        }
    }

    function fixStrReferences(str, scope) {
        var c = 0, matches = [], i = 0, len;
        str = str.replace(/('|").*?\1/g, function (str, p1, offset, wholeString) {
            var result = '*' + c;
            matches.push(str);
            c += 1;
            return result;
        });
        str = str.replace(/\b(\.?[a-zA-z]\w+)/g, function (str, p1, offset, wholeString) {
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
        var ary = [ths];
        while (scope && scope[str] === undefined) {
            scope = scope.$parent;
            ary.push('$parent');
        }
        if (scope && scope[str]) {
            return ary.join('.') + '.' + str;
        }
        return ths + '.' + str;
    }

    function parseFilter(str, scope) {
        if (str.indexOf('|') !== -1 && str.match(/\w+\s?\|\s?\w+/)) {
            str = str.replace('||', '~~');
            var parts = str.trim().split('|');
            parts[1] = parts[1].replace('~~', '||');
            each(parts, app.utils.trimStrings);
            parts[1] = parts[1].split(':');
            var filterName = parts[1].shift(),
                filter = injector.invoke.get(filterName),
                args;
            if (!filter) {
                return parts[0];
            } else {
                args = parts[1];
            }
            each(args, injector.getInjection, scope);
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

    function interpolate(scope, str) {
        var fn = Function, result, filter;
        str = formatters.stripLineBreaks(str);
        str = formatters.stripExtraSpaces(str);
        filter = parseFilter(str, scope);
        if (filter) {
            str = filter.str;
        }
        str = fixStrReferences(str, scope);

        result = (new fn('var result; try { result = ' + str + '; } catch(er) { result = er; } finally { return result; }')).apply(scope);
        if (typeof result === 'object' && (result.hasOwnProperty('stack') || result.hasOwnProperty('stacktrace') || result.hasOwnProperty('backtrace'))) {
            interpolateError(result, scope, str, errorHandler);
        }
        if (result + '' === 'NaN') {
            result = '';
        }
        return filter ? filter.filter(result) : result;
    }

    self.exec = interpolate;
    self.setErrorHandler = setErrorHandler;
}
