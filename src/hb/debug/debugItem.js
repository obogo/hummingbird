internal('hb.debug.item', ['hb.debug.colors'], function(colors) {
    function DebugItem(name, color) {
        this.name = name;
        this.mode = 'log';
        this.color = color || colors(name);
    }
    return DebugItem;
});