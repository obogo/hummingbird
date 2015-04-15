internal('hb.debug.colors', function() {
    var colors = [
        '#3F51B5',// indigo
        '#4CAF50',// green
        '#FF9800',// orange
        '#f93b39',// red
        '#de9c1b',// yellow
        '#008bf5',// blue
        '#708bca',// purple
        '#87a5ae',// grey
        '#ff6092'// pink
    ];
    var cache = {};
    var index = 0;

    function nextColor() {
        var color = colors[index];
        index += 1;
        index %= colors.length;
        return color;
    }

    function getColor(name) {
        return cache[name] = cache[name] || nextColor();
    }

    return getColor;
});