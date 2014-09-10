/* global app, formatters, helpers */
(function () {
    'use strict';
    var api = {};
    var pre = [fixStrReferences];
    var post = [];
    var errorHandler = function (er, extraMessage, data) {
        if (window.console && console.warn) {
            console.warn(extraMessage + '\n' + er.message + '\n' + (er.stack || er.stacktrace || er.backtrace), data);
        }
    };

    function addProcessor(fn, delta, asPostProcessor) {
        var ary = (asPostProcessor ? post : pre);
        if (delta) {// if -delta then put at that spot from the end. if positive, put it at that point from the start.
            ary.splice(delta < 0 ? ary.length + delta : delta, 0, fn);
        } else {
            ary.push(fn);
        }
    }

    function removeProcessor(fn, asPostProcessor) {
        var ary = (asPostProcessor ? post : pre), index = ary.indexOf(fn);
        if (index !== -1) {
            ary.splice(index, 1);
        }
    }

    function setErrorHandler(fn) {
        errorHandler = fn;
    }

    function interpolateError(er, handle, errorHandler) {
        var eh = errorHandler || defaultErrorHandler;
        if (eh) {
            eh(er, MESSAGES.E6a + handle.originalStr + MESSAGES.E6b, handle);
        }
    }

    function fixStrReferences(handle) {
        var c = 0, matches = [], i = 0, len, str = handle.str, scope = handle.scope;
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
        handle.str = str;
    }

    function lookupStrDepth(str, scope) {
        var ary = ['this'];
        while (scope && scope[str] === undefined) {
            scope = scope.$parent;
            ary.push('$parent');
        }
        if (scope && scope[str]) {
            return ary.join('.') + '.' + str;
        }
        return 'this.' + str;
    }

    function processHandle(fn, index, list, handle) {
        fn(handle);
    }

    function interpolate(scope, str, errorHandler) {
        var handle = {originalStr: str, str:str, scope:scope}, result;
        each(pre, processHandle, handle);

        result = (new fn('var result; try { result = ' + handle.str + '; } catch(er) { result = er; } finally { return result; }')).apply(scope);
        if (typeof result === 'object' && (result.hasOwnProperty('stack') || result.hasOwnProperty('stacktrace') || result.hasOwnProperty('backtrace'))) {
            interpolateError(result, handle, errorHandler);
        }
        if (result + '' === 'NaN') {
            result = '';
        }
        handle.result = result;
        each(post, processHandle, handle);
        return handle.result;
    }

    api.exec = interpolate;
    api.addProcessor = addProcessor;
    api.removeProcessor = removeProcessor;
    api.setErrorHandler = setErrorHandler;
}());
