define('hb.debugger', function() {
    function Debugger() {
        function getEl(scope) {
            return document.querySelector("[go-id='" + scope.$id + "']");
        }

        this.getEl = getEl;
    }
    return new Debugger();
});