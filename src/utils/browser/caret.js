define('caret', function () {
    return {
        getIndex: function (el) {
            if (el && el.nodeName === "INPUT" && el.getAttribute('type') === 'text') {
                if (document.selection) {
                    el.focus();// IE
                }
                return 'selectionStart' in el ? el.selectionStart : '' || Math.abs(document.selection.createRange().moveStart('character', -el.value.length));
            }
        },
        setIndex: function setCaret(el, index) {
            if (el.setSelectionRange !== undefined) {
                el.setSelectionRange(index, index);
            }
        }
    };
});