define('queueMethods', ['apply'], function(apply) {
    function addFakeMethods(instance, methods) {
        var queue = [];
        instance.$execQueue = function() {
            for(var i = 0; i < queue.length; i += 1) {
                apply(this[queue[i].action], this, queue[i].args);
            }
            delete this.$execQueue;
        };
        for(var i = 0; i < methods.length; i += 1) {
            instance[methods[i]] = createFakeMethod(queue, methods[i]);
        }
        return instance;
    }

    function createFakeMethod(queue, action) {
        return function() {
            queue.push({action: action, args: arguments});
        };
    }

    return addFakeMethods;
});