diff
===

A simple differentiator to compare two objects and return the differences.

##Usage

```js
diff(source:Object, compareWith:Object):Object;
```
##Example

This is a very simple example but will help you get the point.
```js
var result = diff({a: 1, b: 2, c:4}, {a: 1, c: 3});
console.log(result); // {b: 2, c: 4}
```
