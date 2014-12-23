// Quick Sort reference http://blog.mgechev.com/2012/11/24/javascript-sorting-performance-quicksort-v8/
// Using QuickSort instead of Bubble Sort method. Speed on large arrays is HUGE.
// Once over 1000 items, the bubble sort is very slow. QuickSort is faster than native sort.
define('sort', function () {

    function partition(array, left, right, fn) {
        var cmp = array[right - 1],
            minEnd = left,
            maxEnd,
            dir = 0;
        for (maxEnd = left; maxEnd < right - 1; maxEnd += 1) {
            dir = fn(array[maxEnd], cmp);
            if (dir < 0) {
                if (maxEnd !== minEnd) {
                    swap(array, maxEnd, minEnd);
                }
                minEnd += 1;
            }
        }
        if (fn(array[minEnd], cmp)) {// 1 || -1
            swap(array, minEnd, right - 1);
        }
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

});

