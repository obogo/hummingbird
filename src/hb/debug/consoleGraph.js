define('consoleGraph', ['apply'], function (apply) {
    if (!window.console || !window.console.log) {
        return;
    }

    var canvas,
        context,
        height = 18,
        padding = 1,
        fontSize = 10,
        width = 400,
        labelWidth = 100,
        api = {};

    canvas = document.createElement('canvas');
    canvas.height = height + '';
    canvas.width = width + '';
    context = canvas.getContext('2d');
    document.body.appendChild(canvas);
    canvas.style.cssText = 'position: absolute; left: -' + width + 'px; background-color:#FFF;';
    context.font = fontSize + "px Arial";

    var _graph = function (imageURL, height, width, label) {
        console.log('%c ', '' +
        'font-size: 0px;' +
        'border-left:100px solid #FFF; ' +
        'padding-left: ' + width + 'px;' +
        'padding-bottom: ' + height + 'px;' +
        'background: url("' + imageURL + '"), ' +
        '-webkit-linear-gradient(#CCC, #CCC);' +
        '');
        console.log(label || "\t");
    };

    function graph(data, label, color) {
        //canvas.style.top = api.point.y + 'px';
        //canvas.style.left = api.point.x + 'px';
        var len = data.length;
        var graphWidth = width - labelWidth;
        var units = graphWidth / len;
        var offset = 0;
        var offsetLen = len - offset;
        while (units < 2) {
            offset += 1;
            offsetLen = len - offset;
            units = graphWidth / offsetLen;
        }
        var max = Math.max.apply(Math, data);
        //var min = Math.min.apply(Math, data);
        var barWidth = Math.min(units, 4);
        barWidth = barWidth < 1 ? 1 : barWidth;// don't allow to be < 1px;
        var h;
        var hp = height - padding * 2;
        var last = 0;

        context.clearRect(0, 0, width, height);
        context.fillStyle = color || '#999';
        if (len > 1) {
            for (var i = 0; i < offsetLen; i++) {
                last = data[offset + i];
                h = hp * (last / max);
                context.fillRect(labelWidth + i * barWidth, hp - h + padding, barWidth, h);
            }
        }
        context.textBaseline = 'middle';
        context.fillStyle = color || '#333';
        context.fillText(label, 2, height * 0.25);
        context.fillText("  " + (len > 1 ? len + " / " + max + " / " + last  : data[0]), 2, height * 0.75);
        context.fillStyle = "#EFEFEF";
        context.fillRect(0, height - 1, width, 1);
        return canvas.toDataURL();
    }

    window.console.graph = function (data, max, label) {
        var imgURL = graph(data, max, label);
        _graph(imgURL, height, width, label);
    };

    //api.point = {x: -width, y:0};
    api.graph = graph;
    return api;
});