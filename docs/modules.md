Modules
===

The modules are organized based on the tasks they perform.

Note! Some of the documentation will use <i class="fa fa-external-link"></i> external links to reference websites document similar functionality in their libraries.

##Commonly Used Modules

These are a list of the modules commonly imported into applications.

- **dispatcher** - Turns any object into a event dispatcher
- **each** - Invokes the iterator function once for each item in obj collection.
- **stateMachine** - A finite state machine javascript micro framework.
- **Validators** - *most of them*
- **Formatters** - *many of them*
- **debounce** - Creates a debounced function that delays invoking func until after wait milliseconds have elapsed since the last time the debounced function was invoked.
- **query** - A replacement to jQuery at the fraction of the size (only include what you use)
- **string.supplant** - performs string substitution on a string.
- **localStorage** and **cookie** - Get and set data in browser
- **resolve** - Get and set values at any level in an object using string with dot syntax.

##Ajax

| Name | Description |
|-|-|
|[http](#!modules/ajax/http.md)|A module for http calls (similar to jQuery's http).|
|[http.interceptor](#!modules/ajax/http.interceptor.md)|Intercepts an http call before it is called to the server.|
|[http.jsonp](#!modules/ajax/http.jsonp.md)|Makes http calls using JSONP syntax.|

##Array

| Name | Schema | Description |
|-|-|-|
|sort|sort(array:Array, compareFunction:Function)|Sort fixes issues that the native short has regarding some edge cases. This sort also improves performance issues when dealing with large amounts of data in an array ([More information here.](http://goo.gl/l3QQMG)). This is a low-level implementation. Most likely you will use **sortOn()** in your code.|
|sortOn|sortOn(array:Array, property:String [, desc:Boolean=false])|Sorts the array based on a property in the array list. Pass "desc" if you want to reverse the sort


##Async

| Name | Schema | Description |
|-|-|-|
|<a href="https://lodash.com/docs#debounce" target="_blank">debounce <i class="fa fa-external-link"></i></a>|debounce(func, [wait=0])|Creates a debounced function that delays invoking func until after wait milliseconds have elapsed since the last time the debounced function was invoked.|
|<a href="https://lodash.com/docs#defer" target="_blank">defer <i class="fa fa-external-link"></i></a>|defer(func, [args])|Defers invoking the func until the current call stack has cleared. Any additional arguments are provided to func when it’s invoked.|
|<a href="#!modules/dispatcher.md">dispatcher</a>|dispatcher([target])|Extends target with dispatcher functionality.|
|<a href="https://lodash.com/docs#throttle" target="_blank">throttle <i class="fa fa-external-link"></i></a>|throttle(func, [wait=0])|Creates a throttled function that only invokes func at most once per every wait milliseconds.|
|<a href="https://github.com/caolan/async#waterfall" target="_blank">waterfall <i class="fa fa-external-link"></i></a>|waterfall(tasks, [callback])|Runs the tasks array of functions in series, each passing their results to the next in the array. However, if any of the tasks pass an error to their own callback, the next function is not executed, and the main callback is immediately called with the error.|

##Browser

| Name | Schema | Description |
|-|-|-|
|[addFileToHead](#!addFileToHead.md)|addFileToHead(filename:String)|Appends a JS or CSS file to the head of the browser page|
|[browserState](#!browserState.md)|browserState.on("change", callback:Function)|Determines if the browser tab is the current active browser. It will dispatch a "change" event when the state has changed.|
|<a href="https://github.com/js-coder/cookie.js" target="_blank">cookie <i class="fa fa-external-link"></i></a>||Cookie is capable of setting, getting and removing cookies, accepts a variety of parameters, and supports chaining.|
|<a href="http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript" target="_blank">cssRules <i class="fa fa-external-link"></i></a>||Add and remove css rules. Does not create stylesheets. Just appends to last one.|
|[findScriptUrls](#!findScriptUrls.md)|findScriptUrls([pattern:String]):Array|Searches DOM for all or a spscript tags and returns array of urls derived from the "src" attribute. |
|<a href="https://github.com/obogo/lazyload" target="_blank">loader <i class="fa fa-external-link"></i></a>|loader.load(urls:Array, callback:Function)|This is a forked version of LazyLoad. It loads external JavaScript and CSS files on demand.|
|localStorage|||
|<a href="https://api.jquery.com/ready/" target="_blank">ready <i class="fa fa-external-link"></i></a>|ready(callback:Function)|Specify a function to execute when the DOM is fully loaded.|


##Color

| Name | Description |
|-|-|
|shades|**TODO:** Desc here...|

##Crypt

| Name | Schema | Description |
|-|-|
|[decrypt](#!modules/crypt/decrypt.md)|decrypt(str:String, password:String):String|Decrypts an encrypted string.|
|[encrypt](#!modules/crypt/encrypt.md)|encrypt(str:String, password:String):String|Encrypts a string.|
|[keygen](#!modules/crypt/keygen.md)|kegen([pattern:String]):String|Desc here...|
|<a href="https://github.com/blueimp/JavaScript-MD5/blob/master/README.md#api" target="_blank">md5 <i class="fa fa-external-link"></i></a>|ready(callback:Function)|JavaScript MD5 implementation.|

##Data

| Name | Description |
|-|-|
|[apply](#!modules/data/apply.md)|A faster implementation of the native Function.apply().|
|[cache](#!modules/data/cache.md)|Provides the ability set and get data based on a namespace.|
|[diff](#!modules/data/diff.md)|A simple differentiator to compare two objects and return the differences.|
|[extend](#!modules/data/extend.md)|Extends the destination object dst by copying own enumerable properties from the **src** object(s) to **dst**.|
|[filter](#!modules/data/filter.md)|Looks through each value in the list, returning an array of all the values that pass a truth test (predicate).|
|[resolve](#!modules/data/resolve.md)|Gets and sets properties on an object using a delimited string.|
|[sortKeys](#!modules/data/sortKeys.md)|Sorts the keys on an object.

##Display

| Name | Description |
|-|-|
|align|**TODO:** Desc here...|
|display|**TODO:** Desc here...|
|sorting|**TODO:** Desc here...|

##Formatters

| Name | Schema | Description |
|-|-|-|
|capitalize|capitalize(str:String):String|Capitalizes the first letter of a string.
|<a href="http://php.net/manual/en/function.htmlspecialchars-decode.php" target="_blank">decodeHTML</a>  <i class="fa fa-external-link"></i>|decodeHTML(str:String):String|Convert special HTML entities back to characters|
|escapeRegExp|escapeRegExp(str:String):String|Escapes a Regular Expression string to be used with **RegExp()**.|
|fromCamelToDash|fromCamelToDash(str:String):String|Converts camel case to dash. <br />Ex. CamelCase to camel-case.|
|fromDashToCamel|fromDashToCamel(str:String):String|Converts dash to camel case. <br />Ex. camel-case to CamelCase.|
|fromJson|fromJson(str:String):Object|Converts a JSON string to an object. This can work with or without quotes.|
|fromXML|fromXML(str:String):Object|Converts an XML string to an object.|
|<a href="https://code.google.com/p/inflection-js/" target="_blank">inflection</a>  <i class="fa fa-external-link"></i>|decodeHTML(str:String):String|Convert special HTML entities back to characters|
|lpad|lpad(str:String, char:String="", len=0)|Adds padding to the left of a string|
|removeExtraSpaces|removeExtraSpaces(phrase:String):String|Formats multiples spaces to single spaces.<br />var word = 'a   b   c';<br/>removeExtraSpaces(word); // "a b c"|
|removeHTMLComments|removeHTMLComments(str:String):String|Removes HTML comments from strings.|
|removeLineBreaks|removeLineBreaks(str:String):String|Removes new lines and return breaks from strings.|
|rpad|rpad(str:String, char:String="", len=0)|Adds padding to the right of a string|
|toArray|toArray(val:*):Array|Returns value as an array, If value is Array then return same array, otherwise value is returned as first item in array.|
|toBoolean|toBoolean(val:*):Boolean|Returns value as boolean. Strings "true" and "false" are returned as literal boolean values.|
|toDOM|toDOM(html:String):DOM|Converts a string to a DOM element|
|toObject|toObject(val:*):Object| Returnsformat an object, if the item is string, number or boolean it will return an object with the value set as the property "value" in the object|
|toString|toString(..rest))|Turns a object into a readable string.|
|[toTimeAgo](#!modules/formatters/toTimeAgo.md)|toTimeAgo(date:[Date,String,Number] [,strings:Object]):String|Returns a string in a time ago format.|
|toXML|toXML(xmlString:String):XMLDocument|Converts an XML String to an XML Document|
|toXMLString|toXMLString(xml:XMLDocument):String|Converts an XML document to an XML string|

##Geometry

Used to convert one value to another.

| Name | Schema |
|-|-|
|degreesToRadians|degreesToRadians(deg:Number):Number|
|getAngle|getAngle(x1:Number, y1:Number, x2:Number, y2:Number):Number *(in radians)*|
|getDistance|getDistance(x1:Number, y1:Number, x2:Number, y2:Number):Number|
|getPointOnCircle|getPointOnCircle(centerX:Number, centerY:Number, radius:Number, angle:Nubmer):Number|
|radiansToDegrees|radiansToDegrees(radians:Number):Number|
|<a href="http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/geom/Rectangle.html" target="_blank">rect <i class="fa fa-external-link"></i></a>|rect(x:Number, y:Number, width:Number, height:Number):Rect|

##Iterators
| Name | Schema | Description |
|-|-|-|
|[each](#!modules/iterators/each.md)|each(list:Array, [,params:Object] ,handler:Function [, done:Function])|Iterates over a list of elements, yielding each in turn to an iteratee function.|
|[indexOfMatch](#!XXXXX.md)||Iterates over a list of elements, yielding each in turn to an iteratee function Desc here...|
|[matchAll](#!XXXXX.md)||**TODO:** Desc here...|
|[matchAllOthers](#!XXXXX.md)||**TODO:** Desc here...|
|[matchesAny](#!XXXXX.md)||**TODO:** Desc here...|
|[selection](#!XXXXX.md)||**TODO:** Desc here...|

##Localization

| Name | Description |
|-|-|
|[translate](#!XXXXX.md)|Desc here...|

##Parsers

| Name | Description |
|-|-|
|[functionArgs](#!XXXXX.md)|Desc here...|
|[functionName](#!XXXXX.md)|Desc here...|
|[htmlify](#!XXXXX.md)|Desc here...|
|[interpolate](#!XXXXX.md)|Desc here...|
|[parseRoute](#!XXXXX.md)|Desc here...|
|[urls](#!XXXXX.md)|Desc here...|

##Patterns

| Name | Description |
|-|-|
|<a href="https://github.com/jakesgordon/javascript-state-machine" target="_blank">command</a>|A finite state machine javascript micro framework|
|<a href="https://github.com/jakesgordon/javascript-state-machine" target="_blank">injector</a>|An implementation of Injection of Control (IoC) to inject anything into a function|
|<a href="https://github.com/jakesgordon/javascript-state-machine" target="_blank">singleton</a>|Ensures the same instance of the JavaScript Class is return each time.|
|<a href="https://github.com/jakesgordon/javascript-state-machine" target="_blank">stateMachine</a>|A finite state machine javascript micro framework|

<!--|[command](#!XXXXX.md)|Desc here...|
|[injector](#!XXXXX.md)|Desc here...|
|[Singleton](#!XXXXX.md)|Desc here...|
|[stateMachine](#!XXXXX.md)|Desc here...|
-->
##Polyfills

These polyfills can be included to ensure browser compatibility or an extension to current browser functionality.

| Name | Description |
|-|-|
|<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf" target="_blank">array.indexOf <i class="fa fa-external-link"></i></a>|The indexOf() method returns the first index at which a given element can be found in the array, or -1 if it is not present.|
|<a href="https://github.com/jacwright/date.format" target="_blank">date.format <i class="fa fa-external-link"></i></a>|Extends date so that dates can be formatted similar to PHP's date() function.|
|<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString" target="_blank">date.toISOString <i class="fa fa-external-link"></i></a>|The toISOString() method returns a string in simplified extended ISO format (ISO 8601), which is always 24 characters long: YYYY-MM-DDTHH:mm:ss.sssZ. The timezone is always zero UTC offset, as denoted by the suffix "Z".|
|<a href="https://gist.github.com/roboncode/bac91b42989ce9880819" target="_blank">string.supplant <i class="fa fa-external-link"></i></a>|supplant() does variable substitution on the string|
|<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim" target="_blank">string.trim <i class="fa fa-external-link"></i></a>|The trim() method removes whitespace from both ends of a string.|

##Query

Query is a tiny, API-compatible subset of jQuery that allows Hummingbird to manipulate the DOM in a cross-browser compatible way. Query implements only the most commonly needed functionality with the goal of having a very small footprint. Query will just use jQuery documentation relating to the functions it provides.

| Name | Schema | Description |
|-|-|-|
|<a href="https://api.jquery.com/jQuery/" target="_blank">query <i class="fa fa-external-link"></i></a>|query(selector, [, context])|Return a collection of matched elements either found in the DOM based on passed argument(s) or created by passing an HTML string.|

Query supports plugins. A plugin is nothing more than an extension to the query object that can be performed on the selected elements. To include the Query function in your build use the *import* comment tag like so...

    //! import query.focus
    //! import query.toggleClass

####Event

Query events binds to and triggers events on the selected elements.

| Name | Import Tag | Description |
|-|-|-|
|<a href="https://api.jquery.com/bind/" target="_blank">bind <i class="fa fa-external-link"></i></a>|query.bind|Attach a handler to an event for the elements.|
|<a href="https://api.jquery.com/change/" target="_blank">change <i class="fa fa-external-link"></i></a>|query.change|Bind an event handler to the "change" JavaScript event, or trigger that event on an element.|
|<a href="https://api.jquery.com/click/" target="_blank">click <i class="fa fa-external-link"></i></a>|query.click|Bind an event handler to the "click" JavaScript event, or trigger that event on an element.|
|<a href="https://api.jquery.com/trigger/" target="_blank">trigger <i class="fa fa-external-link"></i></a>|query.trigger|Execute all handlers and behaviors attached to the matched elements for the given event type.|
|<a href="https://api.jquery.com/unbind/" target="_blank">unbind <i class="fa fa-external-link"></i></a>|query.unbind|Remove a previously-attached event handler from the elements.|
|unbindAll|query.unbindAll|Removes all previously-attached event handlers from the elements|

####Focus

Query focus allows the browser to focus an element or place focus on a selected text input element.

| Name | Import Tag | Description |
|-|-|-|
|<a href="https://api.jquery.com/focus/" target="_blank">focus <i class="fa fa-external-link"></i></a>|query.focus|Bind an event handler to the "focus" JavaScript event, or trigger that event on an element.|
|[getCursorPosition](#!modules/query/focus/cursor.md)|query.cursor|Returns the cursor position within a text element.|
|[setCursorPosition](#!modules/query/focus/cursor.md)|query.cursor|Sets the cursor position in a text element.|
|[getSelection](#!modules/query/focus/cursor.md)|query.cursor|Returns the selected string in a text element.|
|[getSelectionStart](#!modules/query/focus/cursor.md)|query.cursor|Returns the cursor start position.|
|[getSelectionEnd](#!modules/query/focus/cursor.md)|query.cursor|Returns the cursor end position.|
|[setSelection](#!modules/query/focus/cursor.md)|query.cursor|Sets the cursor selection or cursor selection range in a text element.|
|[setSelectionRange](#!modules/query/focus/cursor.md)|query.cursor|Sets the cursor selection range in a text element.|
|[select](#!modules/query/focus/cursor.md)|query.cursor|Selects the entire contents of a text element.|

####Measure

Query measure gets and sets the the size of the selected elements.

| Name | Import Tag | Description |
|-|-|-|
|<a href="https://api.jquery.com/height/" target="_blank">height <i class="fa fa-external-link"></i></a>|query.height|Get the current computed height for the first element in the set of matched elements.|
|<a href="https://api.jquery.com/innerHeight/" target="_blank">innerHeight <i class="fa fa-external-link"></i></a>|query.innerHeight|Get the current computed height for the first element in the set of matched elements, including padding but not border.|
|<a href="https://api.jquery.com/innerWidth/" target="_blank">innerWidth <i class="fa fa-external-link"></i></a>|query.innerWidth|Get the current computed inner width for the first element in the set of matched elements, including padding but not border.|
|<a href="https://api.jquery.com/offset/" target="_blank">offset <i class="fa fa-external-link"></i></a>|query.offset|Get the current coordinates of the first element in the set of matched elements, relative to the document.|
|<a href="https://api.jquery.com/outerHeight/" target="_blank">outerHeight <i class="fa fa-external-link"></i></a>|query.outerHeight|Get the current computed height for the first element in the set of matched elements, including padding, border, and optionally margin. Returns a number (without "px") representation of the value or null if called on an empty set of elements.|
|<a href="https://api.jquery.com/outerWidth/" target="_blank">outerWidth <i class="fa fa-external-link"></i></a>|query.outerWidth|Get the current computed width for the first element in the set of matched elements, including padding and border.|
|<a href="https://api.jquery.com/width/" target="_blank">width <i class="fa fa-external-link"></i></a>|query.width|Get the current computed width for the first element in the set of matched elements.|

####Modify

Query modify manipulates the selected elements' classes, values and properties.

| Name | Import Tag | Description |
|-|-|-|
|<a href="https://api.jquery.com/addClass/" target="_blank">addClass <i class="fa fa-external-link"></i></a>|query.addClass|Adds the specified class(es) to each element in the set of matched elements.|
|<a href="https://api.jquery.com/attr/" target="_blank">attr <i class="fa fa-external-link"></i></a>|query.attr|Get the value of an attribute for the first element in the set of matched elements.|
|<a href="https://api.jquery.com/css/" target="_blank">css <i class="fa fa-external-link"></i></a>|query.css|Get the computed style properties for the first element in the set of matched elements.|
|<a href="https://api.jquery.com/hasClass/" target="_blank">hasClass <i class="fa fa-external-link"></i></a>|query.hasClass|Determine whether any of the matched elements are assigned the given class.|
|<a href="https://api.jquery.com/prop/" target="_blank">prop <i class="fa fa-external-link"></i></a>|query.prop|Get the value of a property for the first element in the set of matched elements.|
|<a href="https://api.jquery.com/removeClass/" target="_blank">removeClass <i class="fa fa-external-link"></i></a>|query.removeClass|Remove a single class, multiple classes, or all classes from each element in the set of matched elements.|
|<a href="https://api.jquery.com/toggleClass/" target="_blank">toggleClass <i class="fa fa-external-link"></i></a>|query.toggleClass|Add or remove one or more classes from each element in the set of matched elements, depending on either the class's presence or the value of the state argument.|
|<a href="https://api.jquery.com/val/" target="_blank">val <i class="fa fa-external-link"></i></a>|query.val|Get the current value of the first element in the set of matched elements.|
|[vendor](#!modules/query/modify/vendor.md)|query.vendor|Applies vendor prefixed styles onto matched elements (ex. "webkit", "moz", "MS", "o").|

####Mutate

Query mutate manipulates the DOM by adding, removing and updating elements.

| Name | Import Tag | Description |
|-|-|-|
|<a href="https://api.jquery.com/after/" target="_blank">after <i class="fa fa-external-link"></i></a>|query.after|Insert content, specified by the parameter, after each element in the set of matched elements.|
|<a href="https://api.jquery.com/append/" target="_blank">append <i class="fa fa-external-link"></i></a>|query.append|Insert content, specified by the parameter, to the end of each element in the set of matched elements.|
|<a href="https://api.jquery.com/before/" target="_blank">before <i class="fa fa-external-link"></i></a>|query.before|Insert content, specified by the parameter, before each element in the set of matched elements.|
|<a href="https://api.jquery.com/empty/" target="_blank">empty <i class="fa fa-external-link"></i></a>|query.empty|Remove all child nodes of the set of matched elements from the DOM.|
|<a href="https://api.jquery.com/html/" target="_blank">html <i class="fa fa-external-link"></i></a>|query.html|Get the HTML contents of the first element in the set of matched elements.|
|<a href="https://api.jquery.com/prepend/" target="_blank">prepend <i class="fa fa-external-link"></i></a>|query.prepend|Insert content, specified by the parameter, to the beginning of each element in the set of matched elements.|
|<a href="https://api.jquery.com/remove/" target="_blank">remove <i class="fa fa-external-link"></i></a>|query.remove|Remove the set of matched elements from the DOM.|
|<a href="https://api.jquery.com/replaceAll/" target="_blank">replace <i class="fa fa-external-link"></i></a>|query.replaceAll|Replace each target element with the set of matched elements.|
|<a href="https://api.jquery.com/text/" target="_blank">text <i class="fa fa-external-link"></i></a>|query.text|Get the combined text contents of each element in the set of matched elements, including their descendants.|

####Select

Query select returns elements based on the function criteria.

| Name | Import Tag | Description |
|-|-|-|
|<a href="https://api.jquery.com/children/" target="_blank">children <i class="fa fa-external-link"></i></a>|query.children|Get the children of each element in the set of matched elements, optionally filtered by a selector.|
|<a href="https://api.jquery.com/find/" target="_blank">find <i class="fa fa-external-link"></i></a>|query.find|Get the descendants of each element in the current set of matched elements, filtered by a selector, jQuery object, or element.|
|<a href="https://api.jquery.com/first/" target="_blank">first <i class="fa fa-external-link"></i></a>|query.first|Reduce the set of matched elements to the first in the set.|
|<a href="https://api.jquery.com/get/" target="_blank">get <i class="fa fa-external-link"></i></a>|query.get|Retrieve one of the elements matched by the jQuery object.|
|<a href="https://api.jquery.com/last/" target="_blank">last <i class="fa fa-external-link"></i></a>|query.last|Reduce the set of matched elements to the final one in the set.|
|<a href="https://api.jquery.com/next/" target="_blank">next <i class="fa fa-external-link"></i></a>|query.next|Get the immediately following sibling of each element in the set of matched elements. If a selector is provided, it retrieves the next sibling only if it matches that selector.|
|<a href="https://api.jquery.com/not/" target="_blank">not <i class="fa fa-external-link"></i></a>|query.not|Remove elements from the set of matched elements.|
|<a href="https://api.jquery.com/parent/" target="_blank">parent <i class="fa fa-external-link"></i></a>|query.parent|Get the parent of each element in the current set of matched elements, optionally filtered by a selector.|
|<a href="https://api.jquery.com/prev/" target="_blank">prev <i class="fa fa-external-link"></i></a>|query.prev|Get the immediately preceding sibling of each element in the set of matched elements, optionally filtered by a selector.|


##Timers
| Name | Schema | Description |
|-|-|-|
|<a href="URL_HERE" target="_blank">repeater</a>|repeater(limit:Int, delay:Int, repeat:Int):Repeater|A callback interval that supports a delay, limits and frequency of repeats|
|<a href="URL_HERE" target="_blank">stopwatch</a>|stopwatch(options:Object):Stopwatch|An extension to **timer**, adding startTime, endTime, tick frequency, remaining time, so it can perform countdowns.|
|<a href="URL_HERE" target="_blank">timer</a>|timer(options:Object):Timer|A callback interval that supports a delay, limits and frequency of repeats|

##Validators

Provides a declarative way of validating javascript objects.

Attention! Though referencing external, ignore "_." or "validator.". Hummingbird does not support nor require dot notation.

| Name | Schema | Description |
|-|-|-|
|<a href="https://lodash.com/docs#isArguments" target="_blank">isArguments <i class="fa fa-external-link"></i></a>|isArguments(val):Boolean|Checks if value is classified as an arguments object.|
|<a href="https://lodash.com/docs#isArray" target="_blank">isArray <i class="fa fa-external-link"></i></a>|isArray(val):Boolean|Check if the given value is an array.|
|<a href="https://github.com/darsain/isarraylike" target="_blank">isArrayLike <i class="fa fa-external-link"></i></a>|isArrayLike(val):Boolean|Check if value is a simple or complex array-like object.|
|<a href="https://lodash.com/docs#isBoolean" target="_blank">isBoolean <i class="fa fa-external-link"></i></a>|isBoolean(val):Boolean|Checks if value is classified as a boolean primitive or object.|
|<a href="https://lodash.com/docs#isDate" target="_blank">isDate <i class="fa fa-external-link"></i></a>|isDate(val):Boolean|Check if the given value is a Date instance.|
|<a href="http://validatejs.org/#utilities-is-defined" target="_blank">isDefined <i class="fa fa-external-link"></i></a>|isDefined(val):Boolean|Check if the given value is not null or undefined.|
|isEmail|isEmail(src):Boolean|Check if the value is a properly formatted email address.|
|<a href="https://lodash.com/docs#isEmpty" target="_blank">isEmpty <i class="fa fa-external-link"></i></a>|isEmpty(src, target, deep:Boolean):Boolean|Check if the given value is non empty.|
|isFile|isFile(val):Boolean|Check if the value a File instance.|
|<a href="https://lodash.com/docs#isFunction" target="_blank">isFunction <i class="fa fa-external-link"></i></a>|isFunction(val):Boolean|Check if the given value is a function. If this returns true the value will be callable.|
|<a href="http://validatejs.org/#utilities-is-integer" target="_blank">isInt <i class="fa fa-external-link"></i></a>|isInt(val):Boolean|Check if the given value is an integer. If this returns true isNumber will also return true.|
|isJson|isJson(val):Boolean|Check if a string is a valid JSON string|
|[isMatch](#!modules/isMatch.md)|isMatch(val, comparison):Boolean|Checks if the value matches the comparison|
|<a href="https://github.com/kaimallea/isMobile" target="_blank">isMobile <i class="fa fa-external-link"></i></a>|*See documentation*|A simple JS library that detects mobile devices.|
|<a href="https://lodash.com/docs#isNumber" target="_blank">isNumber <i class="fa fa-external-link"></i></a>|isNumber(val):Boolean|Checks if value is classified as a Number primitive or object.|
|<a href="https://github.com/leecrossley/isNumeric" target="_blank">isNumeric <i class="fa fa-external-link"></i></a>|isNumeric(val):Boolean|Checks if value could be cast as a Number|
|<a href="https://lodash.com/docs#isObject" target="_blank">isObject <i class="fa fa-external-link"></i></a>|isObject(val):Boolean|Checks if value is the language type of Object. (e.g. arrays, functions, objects, regexes, new Number(0), and new String(''))|
|<a href="https://lodash.com/docs#isRegExp" target="_blank">isRegExp <i class="fa fa-external-link"></i></a>|isRegExp(val):Boolean|Checks if value is classified as a RegExp object.|
|isRequired|isRequired(val, errorMessage:String):Void|Checks if the value is undefined, if it is it throws an error message.|
|<a href="https://lodash.com/docs#isString" target="_blank">isString <i class="fa fa-external-link"></i></a>|isString(val):Boolean|Checks if value is classified as a String primitive or object.|
|isTouchDevice|isTouchDevice():Boolean|Checks if device supports touch events|
|<a href="https://lodash.com/docs#isUndefined" target="_blank">isUndefined <i class="fa fa-external-link"></i></a>|isUndefined(val):Boolean|Checks if value is undefined.|
|<a href="http://api.jcom/jiswindow" target="_blank">isWindow <i class="fa fa-external-link"></i></a>|isWindow(val:Object):Boolean|Determine whether the argument is a window.|
