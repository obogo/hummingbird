/**
 * **sort** apply array sort with a custom compare function.
 * > The ECMAScript standard does not guarantee Array.sort is a stable sort.
 * > According to the ECMA spec, when two objects are determined to be equal in a custom sort,
 * > JavaScript is not required to leave those two objects in the same order.
 * > replace sort from ECMAScript with this bubble sort to make it accurate
 */
//utils.data.array.sort = function (ary, compareFn) {
//    var c, len, v, rlen, holder;
//    if (!compareFn) { // default compare function.
//        compareFn = function (a, b) {
//            return a > b ? 1 : (a < b ? -1 : 0);
//        };
//    }
//    len = ary.length;
//    rlen = len - 1;
//    // bubble sort.
//    for (c = 0; c < len; c+=1) {
//        for (v = 0; v < rlen; v+=1) {
//            if (compareFn(ary[v], ary[v + 1]) > 0) {
//                holder = ary[v + 1];
//                ary[v + 1] = ary[v];
//                ary[v] = holder;
//            }
//        }
//    }
//    return ary;
//};

// Using QuickSort instead of Bubble Sort method. Speed on large arrays is HUGE. Once over 1000 items, the bubble sort is very slow. QuickSort is faster than native sort.
utils.data.array.sort = (function () {

    function partition(array, left, right, fn) {
        var cmp = array[right - 1],
            minEnd = left,
            maxEnd,
            dir = 0;
        for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
            dir = fn(array[maxEnd], cmp);
            if (dir < 0) {
                swap(array, maxEnd, minEnd);
            }
            if(dir <= 0) {// don't move them if they are the same.
                minEnd += 1;
            }
        }
        swap(array, minEnd, right - 1);
        return minEnd;
    }

    function swap(array, i, j) {
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        return array;
    }

    function quickSort(array, left, right, fn) {
        if (left < right) {
            var p = partition(array, left, right, fn);
            quickSort(array, left, p, fn);
            quickSort(array, p + 1, right, fn);
        }
        return array;
    }

    return function (array, fn) {
        var result = quickSort(array, 0, array.length, fn);
        return result;
    };
}());