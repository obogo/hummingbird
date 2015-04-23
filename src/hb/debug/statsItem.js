internal('hb.debug.stats.item', ['hb.debug.colors'], function (colors) {

    function Stat(name, color) {
        this.name = name;
        this.color = color || colors(name);// once set keep it.
        this.clear();
    }

    Stat.prototype.clear = function () {
        this.index = -1;
        this.data = this.data || [];
        this.data.length = 0;
        this.dirty = true;
        this.next();
    };
    Stat.prototype.next = function () {
        this.index += 1;
        this.data[this.index] = 0;
        this.dirty = true;
    };
    Stat.prototype.inc = function (n) {
        this.data[this.index] += n || 1;
        this.dirty = true;
    };
    Stat.prototype.dec = function (n) {
        this.data[this.index] -= n || 1;
        this.dirty = true;
    };

    return Stat;
});