function SyncCommand() {
    this.construct = function (obj, num, example) {
        console.log('SyncCommand.construct()', obj, num, example);
    };

    this.execute = function (obj, num, example) {
        console.log('SyncCommand.execute()', obj, num, example);
    };

    this.destruct = function () {
        console.log('SyncCommand.destruct()');
    };
}