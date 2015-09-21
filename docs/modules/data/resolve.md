resolve
===

Gets and sets properties on an object using a delimited string. This is useful when you do not know if property exists and it either needs to be set or get without throwing an error.

##Usage

```js
resolve([scope:Object]):Resolve;

// Sets the value to the path
Resolve.set(path:String, value:*):*

// Returns the value from the path
Resolve.get(path:String, value:* [, delimiter:String="."]):*

// Clears all keys on scope
Resolve.clear():Void

// Sets the path to an empty object
Resolve.path(path):Number

```
##Example

```js
var myObj = {};
var $myObj = resolve(myObj);
$myObj.set('a.b.c', 123);
var val = $myObj.get('a.b.c');
console.log(val); // 123
console.log($myObj); // {a: b: {c: 123 }}
```
