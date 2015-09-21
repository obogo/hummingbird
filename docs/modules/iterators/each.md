each
===

Iterates over a list of elements, yielding each in turn to an iteratee function.

##Usage

```js
each(list:Array, [,params:Object] ,handler:Function [, done:Function])
```
##Example

```js
var arr = ['a','b','c'];

each(arr, function(item, index, list) {
    console.log('VAL >', item, index, list);
});

each(arr, {name: "John"}, function(item, index, list, params, next) {
    console.log('ITEM >', item, index, list, params)
    next();
}, function(err){
    if(err) {
        console.log('err', err);
        return;
    }
    console.log('done');
});
```
