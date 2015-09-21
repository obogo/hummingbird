filter
===

Looks through each value in the list, returning an array of all the values that pass a truth test.

##Usage

```js
filter(list:Array, handler:Function);
```
##Example

```js
var nums = [1,2,3,4,5];
function filterOutEvenNums(item, index) {
  return item % 2;
}
var odds = filter(nums, filterOutEvenNums);
console.log(odds); // [1,3,5];
```
