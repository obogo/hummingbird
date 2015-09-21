sortKeys
===

Sorts the keys on an object.

Refer to this article: [http://am.aurlien.net/post/1221493460/sorting-javascript-objects](http://am.aurlien.net/post/1221493460/sorting-javascript-objects)

##Usage

```js
sortKeys(obj:Object, type:*, caseSensitive:Boolean=false):Object;
```
##Example

```js
var obj = {c:'b',a:'c',b:'a'};

// Sort by key
sortObj(obj);
// {a:'c',b:'a',c:'b'}

// Sort by value
sortObj(obj, 'value');
// {b:'a',c:'b',a:'c'}

// Sort by predicate function
sortObj(obj, function(a,b) {
  var data = {a:2,b:1,c:3};
  var x = data[a];
  var y = data[b];
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
});
// {b:'a',a:'c':c:'a'}
```
If you want the sort to be case-sensitive, set the second parameter of .sort() to true.

As always when extending Object.prototype, don’t forget to use hasOwnProperty when iterating over the object. But you’re of course doing that already, right?

Attention! Be careful using this with Chrome. If your object has both numbers and strings as keys, Chrome will sort the object with the number-keys first, even when sorting by value.

**Chrome Example**

```js
var obj = {a:2, b:1, 1:'a'};
obj.sort('value'); // Other browsers: {b:1, a:2, 1:'a'}, Chrome: {1:'a', b:1, a:2}
```
