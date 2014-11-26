utils.validators.isEqual = function (src, target) {
    var srcKeys, targetKeys, srcLen, targetLen, i, s, t;
    if ((typeof src === "string" || typeof src === "number" || typeof src === "boolean")) {
        return src === target;
    }
    srcKeys = Object.keys(src);
    targetKeys = Object.keys(target);
    srcLen = srcKeys.length;
    targetLen = targetKeys.length;

    if (srcLen !== targetLen) {
        console.log("different keys ", srcLen - targetLen);
        return false;
    }
    for (i = 0; i < srcLen; i += 1) {
        s = src[srcKeys[i]];
        t = src[targetKeys[i]];
        if (typeof s === "object" && t && !utils.validators.isEqual(src[srcKeys[i]], target[srcKeys[i]])) {// compare as objects.
            return false;
        }
    }

    return true;
};