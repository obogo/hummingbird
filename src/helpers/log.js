function log(name, style) {
    this.name = name;
    this.style = style;
    this._enable = true;
}
log.prototype.log = function log(step) {
        if (this.enable()) {
            var depth, args = Array.prototype.slice.apply(arguments), str;
            if (step && step.uid) {
                depth = step.uid.split('.').length;
                str = exports.charPack("\t", depth) + step.uid + ':' + step.type + ':' + step.status + ':' + step.state + ':[' + step.progress + ']::';
                args.shift();
                args[0] = str + args[0];
            }
            this.applyName(args);
            this.applyStyle(args);
            this.output.apply(console, args);
        }
    };
log.prototype.applyName = function (args) {
    var str = args[0];
    if (this.name) {
        var index = 0;
        if (typeof str === 'string' && str.charAt(index) === "\t") {
            while (str.charAt(index) === "\t") {
                index += 1;
            }
            if (index) {
                str = str.substr(0, index) + this.name + '::' + str.substr(index);
                args[0] = str;
                return;
            }
        }
        str = this.name + '::' + str;
        args[0] = str;
    }
};
log.prototype.applyStyle = function (args) {
    if (this.style) {
        args[0] = '%c' + args[0];
        args.splice(1, 0, this.style);
    }
};
log.prototype.enable = function() {
    return log.enable !== false;
};
log.prototype.output = window['@@packageName'] && window['@@packageName'].output ? window['@@packageName'].output.log : window.console && window.console.log;
