/**
 * Usage:
 * node server.js [--port PORT_NUMBER]
 */
var argv = require('yargs').argv;
var express = require('express');
var app = express();

app.use(express.static('.'));

var port = argv.port || 2412;
var server = app.listen(port, function () {
    console.log('Listening at http://localhost:' + port);
});
