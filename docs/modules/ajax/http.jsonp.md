http.jsonp
===

Makes http calls using JSONP syntax.

###Usage

```js
http(options:Object)
```

###Example

```js
// default headers can be setup beforehand
http.defaults.headers['Content-Type'] = 'application/json;charset=UTF-8';

// http call
http({
  method: 'POST', // 'GET', 'POST', 'PUT', 'DELETE'
  url: 'http://mycompany.com/articles',
  success: function(response) {
    // response here...
  },
  error: function(response) {
    // response here...
  },
  data: {
    title: 'My Article',
    content: 'Here is my content...'
  },
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  }
});
```
