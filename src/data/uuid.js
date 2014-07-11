data.uuid = function (pattern) {
    return (pattern || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx').replace(/[xy]/g, function (b) {
        var d = 16 * Math.random() | 0;
        return ('x' == b ? d : d & 3 | 8).toString(16);
    });
};