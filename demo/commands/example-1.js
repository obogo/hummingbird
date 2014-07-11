/*global belt, SyncCommand, AsyncCommand */
(function () {
    'use strict';

    function Example() {
        this.name = 'Example class';
    }

    // commands call in order they are mapped
    var commandMap = belt.patterns.command;
    commandMap.map('events.test').toCommand(SyncCommand);
    commandMap.map('events.test').toCommand(AsyncCommand); // will cause delay before other commands called
    commandMap.map('events.test').toCommand(SyncCommand); // already mapped - will not be called a second time

    // invoke event and pass in params that can be consumed by commands
    commandMap.dispatch('events.test', { message: 'Hello, world!'}, 123, new Example());

})();