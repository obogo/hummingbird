(function () {
    app.directives.app = function (module, namespace) {
        namespace = namespace || app.consts.PREFIX;
        console.log('modulename', module.name + 'app');

        module.directive(module.name + 'app', function (module) {
            return {
                link: function (scope, el) {
                    console.log('hello');
                }
            };
        });
    };
}());