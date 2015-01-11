/**!
 * all matches must be matched for it to be included.
 * pattern /\w+\.hasClass\(/
 * pattern /("|')query\1/
 */
internal('query.hasClass', ['query'], function (query) {
    query.fn.hasClass = function (className) {
        var returnVal = false;
        this.each(function (index, el) {
            if (!returnVal) {
                if (el.classList) {
                    returnVal = el.classList.contains(className);
                } else {
                    returnVal = new RegExp('(^| )' + className + '( |$)', 'gi').test(el.className);
                }
                if (returnVal){
                    return false;
                }
            }
        });
        return returnVal;
    };
});