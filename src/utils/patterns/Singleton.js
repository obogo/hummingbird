define('singleton', function () {

    var Singleton = function () {
    };

    Singleton.instances = {};

    Singleton.get = function (classRef) {
        if (typeof classRef === 'function') {
            if (!classRef.__instance__) {

                var args = Array.prototype.slice.call(arguments, 0);
                classRef.__instance__ = new (Function.prototype.bind.apply(classRef, args))();
            }
            return classRef.__instance__;
        }
    };

    Singleton.getById = function (name, classRef) {
        if (typeof classRef === 'function') {
            if (!classRef.__instances__) {
                classRef.__instances__ = {};
            }
            if (!classRef.__instances__[name]) {
                var args = Array.prototype.slice.call(arguments, 0);
                classRef.__instances__[name] = new (Function.prototype.bind.apply(classRef, args))();
            }
            return classRef.__instances__[name];
        }
    };

    return Singleton;
});