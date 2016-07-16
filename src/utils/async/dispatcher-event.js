define('dispatcherEvent', function() {
    function Event(type) {
        this.type = type;
        this.defaultPrevented = false;
        this.propagationStopped = false;
        this.immediatePropagationStopped = false;
    }
    Event.prototype.preventDefault = function() {
        this.defaultPrevented = true;
    };
    Event.prototype.stopPropagation = function() {
        this.propagationStopped = true;
    };
    Event.prototype.stopImmediatePropagation = function() {
        this.immediatePropagationStopped = true;
    };
    Event.prototype.toString = function() {
        return this.type;
    };
    return Event;
});