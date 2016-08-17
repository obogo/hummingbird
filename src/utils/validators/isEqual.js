define('isEqual', function () {
    var isEqual = function (src, target, deep) {
        var srcKeys, targetKeys, srcLen, targetLen, i, s, t;
        if ((typeof src === "string" || typeof src === "number" || typeof src === "boolean")) {
            return src === target;
        }
        if (src === target) {
            return true;
        }
        if (src === undefined) {
            return false;
        }
        srcKeys = Object.keys(src);
        targetKeys = Object.keys(target);
        srcLen = srcKeys.length;
        targetLen = targetKeys.length;

        if (srcLen !== targetLen) {
            //console.log("different keys ", srcLen - targetLen);
            return false;
        }
        if (deep) {
            for (i = 0; i < srcLen; i += 1) {
                s = src[srcKeys[i]];
                t = src[targetKeys[i]];
                if (typeof s === "object" && t && !isEqual(src[srcKeys[i]], target[srcKeys[i]], deep)) {// compare as objects.
                    return false;
                }
            }
        }

        return true;
    };

    return isEqual;
});