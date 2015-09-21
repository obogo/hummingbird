cache
===

Provides the ability set and get data based on a namespace.

##Usage

```js
cache([name:String]):Cache;

// Sets the value of a key
Cache.set(key:String, value:*):*

// Returns the value from the key. If no value is found the defaultValue value
// can be used if provided.
Cache.get(key:String, defaultValue):*

// Returns a copy of of the key value
Cache.getCopy(key:String, defaultValue):*;

// Creates or merges value data into set, then returns the new merged item
Cache.merge(key:String, value:*):*

// Returns a list of keys that have been stored in the cache under the namespace provided.
Cache.keys():Array

// Returns all cached values for namespace
Cache.all():Object

// Removes all keys that have been cached under namespace
Cache.clear():Void

// Increment a counter (key must be a number)
Cache.inc():Number

// Decrement a counter (key must be a number)
Cache.dec():Number

```
##Example

```js
cache('persons').set('count', 10); // count set to 10
cache('persons').set('count', 20); // count set to 20
cache('persons').inc('count'); // count set to 21
cache.clear(); // count no longer exists
```
