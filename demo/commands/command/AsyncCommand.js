function AsyncCommand(name) {

    console.log('AsyncCommand.name', name);

    this.construct = function (obj, num, example) {
        console.log('AsyncCommand.construct()', obj, num, example, name);
    };

    this.execute = function (obj, num, example) {
        console.log('AsyncCommand.execute()', obj, num, example, name);
        var scope = this;
        setTimeout(function () {
            scope.complete();
        }, 3000);
    };

    this.destruct = function () {
        console.log('AsyncCommand.destruct()');
    };

    // if a complete is present, command is responsible for calling it
    this.complete = function () {
        console.log('AsyncCommand.complete()');
    };
}