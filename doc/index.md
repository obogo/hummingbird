Hummingbird
===

Hummingbird provides many common utility functions for your application. You can think of it as a conglomerate of jQuery functionality, underscore functions and other common functions used in an application. Some of the functions were created by the Hummingbird team. Others were developed by other individuals and then assimilated into our library.

##Declaring a module
---

Hummingbird works similarly to AMD structures like require.js. However, hummingbird will perform a treeshake and only compile what is other modules that are referenced. There are two ways to declare a custom module.

####define()

Allows others to publicly interface with your module on the global namespace your application provides;

```js
define(name:String, [dependencies:String, ...], function(args...) {});
```

####internal()

Private declaration that does not permit access on the global namespace your application provides.

```js
internal(name:String, [dependencies:String, ...], function(args...) {});
```

###Module example

This example demonstrates how to you might declare and consume other modules.

In this example we are declare a **sum()** function. In addition, we consume the utility function **forEach()** to be used within our own function. We return the **sum()** function a the end which will act as a singleton in this case.

```js
internal('mycompany.math.sum', ['each'], function(each){
	function sum() {
		var total = 0;
		each(arguments, function(val) {
			total += Number(val);
		});
		return total;
	};
	return sum;
});
```
##Consuming a module

In the example above we already saw how to consume one of the built in utilities provided by Hummingbird. We can consume our own modules in the same manner.

```js
internal('mycompany.widgets.calculator', ['mycompany.math.sum'], function(sum){
	function Calculator() {
		this.sum = sum;
	}
	return new Calculator();
});
```
Note! The return value of your module can be anything. If you don't return anything then a string containing the name of the module will be used instead.
