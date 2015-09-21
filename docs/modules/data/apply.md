apply
===

A faster implementation of the native Function.apply()

##Usage

```js
apply(func:Function [,scope:Object, args:Arguments]);
```
##Example

```js
function sendMessage(from, message) {
  console.log(from, 'said:', message);
  return true;
}
var success = apply(sendMessage, null, 'John', 'Hello, world!');
console.log('success', success);
```
