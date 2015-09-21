extend
===

Extends the destination object dst by copying own enumerable properties from the src object(s) to dst. You can specify multiple src objects. If you want to preserve original objects, you can do so by passing an empty object as the target: var object = extend({}, object1, object2).

##Usage

```js
extend(dst, src);
```
##Example

This is a very simple example but will help you get the point.

Note! If arrays are present, *extend()* will just override the array.

```js
var a = {a: 1};
var b = {b: 2, d:[1]};
var c = {c: 3, d:[2]};

extend(a, b, c);
console.log(a); // {a:1, b:2, c:3, d:[2]}
```
