//! pattern /(\s|query)\(.*?\)\.getCursorPosition\(/
//! pattern /(\s|query)\(.*?\)\.setCursorPosition\(/
//! pattern /(\s|query)\(.*?\)\.getSelection\(/
//! pattern /(\s|query)\(.*?\)\.getSelectionStart\(/
//! pattern /(\s|query)\(.*?\)\.getSelectionEnd\(/
//! pattern /(\s|query)\(.*?\)\.setSelection\(/
//! pattern /(\s|query)\(.*?\)\.setSelectionRange\(/
//! import query.val
// TODO: Fix this so it works on "contenteditable" DOM
define('query.cursor', ['query'], function (query) {

    query.fn.getCursorPosition = function () {
        if (this.length === 0) {
            return -1;
        }
        return query(this, this.context).getSelectionStart();
    };

    query.fn.setCursorPosition = function (position) {
        if (this.length === 0) {
            return this;
        }
        return query(this, this.context).setSelection(position, position);
    };

    query.fn.getSelection = function () {
        if (this.length === 0) {
            return -1;
        }
        var s = query(this, this.context).getSelectionStart();
        var e = query(this, this.context).getSelectionEnd();
        return this[0].value.substring(s, e);
    };

    query.fn.getSelectionStart = function () {
        if (this.length === 0) {
            return -1;
        }
        var input = this[0];

        var pos = input.value.length;

        if (input.createTextRange) {
            var r = document.selection.createRange().duplicate();
            r.moveEnd('character', input.value.length);
            if (r.text === '') {
                pos = input.value.length;
            } else {
                pos = input.value.lastIndexOf(r.text);
            }
        } else if (typeof(input.selectionStart) !== "undefined") {
            pos = input.selectionStart;
        }

        return pos;
    };

    query.fn.getSelectionEnd = function () {
        if (this.length === 0) {
            return -1;
        }
        var input = this[0];

        var pos = input.value.length;

        if (input.createTextRange) {
            var r = document.selection.createRange().duplicate();
            r.moveStart('character', -input.value.length);
            if (r.text === '') {
                pos = input.value.length;
            }
            pos = input.value.lastIndexOf(r.text);
        } else if (typeof(input.selectionEnd) !== "undefined") {
            pos = input.selectionEnd;
        }

        return pos;
    };

    query.fn.setSelection = function (selectionStart, selectionEnd) {
        if (this.length === 0) {
            return this;
        }
        var input = this[0];

        if (input.createTextRange) {
            var range = input.createTextRange();
            range.collapse(true);
            range.moveEnd('character', selectionEnd);
            range.moveStart('character', selectionStart);
            range.select();
        } else if (input.setSelectionRange) {
//            input.focus();
            input.setSelectionRange(selectionStart, selectionEnd);
        }

        return this;
    };

    query.fn.setSelectionRange = function (range) {
        var element = query(this, this.context);
        switch (range) {
            case 'start':
                element.setSelection(0, 0);
                break;
            case 'end':
                element.setSelection(element.val().length, element.val().length);
                break;
            case true:
            case 'all':
                element.setSelection(0, element.val().length);
                break;
        }
        return this;
    };

    query.fn.select = function () {
        this.setSelectionRange(true);
        return this;
    };

});
