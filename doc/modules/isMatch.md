isMatch(val, comparison):Boolean
===

Unlike **isEqual()**, **isMatch()** is not a strict equals, if all the properties defined in the comparison object match then the return value is true. Not all the values have to be defined in the comparison object, nor do they have to be values, they can also be Regular Expressions and functions.

**Examples**

```js
// This returns a true, because all properties in the second argument matched.
isMatch({a:1, b:2}, {a: 1});
// return true

isMatch({name:'Fred', age:5}, {name:/\w+/, tail: true});
// return true

```
