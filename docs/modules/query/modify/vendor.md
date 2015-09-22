query.vendor
===
Applies vendor prefixed styles onto matched elements (ex. "webkit", "moz", "MS", "o").

###Usage

```js
query(selector).vendor(prop:String, val:String):Query
```

###Example

```js
query('.box').vendor('border-radius', '3px');
```
