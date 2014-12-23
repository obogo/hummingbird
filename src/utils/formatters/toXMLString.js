define('toXMLString', function () {
    var toXMLString = function (xmlObject) {
        var str;
        if (window.ActiveXObject) {
            str = xmlObject.xml;
        } else {
            str = (new XMLSerializer()).serializeToString(xmlObject);
        }
        str = str.replace(/\sxmlns=".*?"/gim, '');
        return str;
    };
    return toXMLString;
});