define('caret', function () {
    function acceptable(el) {
        return el && el.nodeName === "INPUT" && el.getAttribute('type') === 'text';
    }
    return {
        getIndex: function (el) {
            if (acceptable(el)) {
                if (document.selection) {
                    el.focus();// IE
                }
                return 'selectionStart' in el ? el.selectionStart : '' || Math.abs(document.selection.createRange().moveStart('character', -el.value.length));
            }
        },
        setIndex: function setCaret(el, index) {
            if (acceptable(el) && el.setSelectionRange !== undefined) {
                el.setSelectionRange(index, index);
            }
        }
    };
});