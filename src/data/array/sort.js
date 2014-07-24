/**
 * **sort** apply array sort with a custom compare function.
 * > The ECMAScript standard does not guarantee Array.sort is a stable sort.
 * > According to the ECMA spec, when two objects are determined to be equal in a custom sort,
 * > JavaScript is not required to leave those two objects in the same order.
 * > replace sort from ECMAScript with this bubble sort to make it accurate
 */
data.array.sort = function (ary, compareFn) {
    var c, len, v, rlen, holder;
    if (!compareFn) { // default compare function.
        compareFn = function (a, b) {
            return a > b ? 1 : (a < b ? -1 : 0);
        };
    }
    len = ary.length;
    rlen = len - 1;
    // bubble sort.
    for (c = 0; c < len; c+=1) {
        for (v = 0; v < rlen; v+=1) {
            if (compareFn(ary[v], ary[v + 1]) > 0) {
                holder = ary[v + 1];
                ary[v + 1] = ary[v];
                ary[v] = holder;
            }
        }
    }
    return ary;
}