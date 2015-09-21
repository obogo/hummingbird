toTimeAgo
===

Returns a string in a time ago format.

##Usage

```js
toTimeAgo(date:DateorStringorNumber>[,strings:Object]):String
```

##String Options

    y: 'year',
    ys: 'years',
    m: 'month',
    ms: 'months',
    d: 'day',
    ds: 'days',
    h: 'hour',
    hs: 'hours',
    i: 'minute',
    is: 'minutes',
    s: 'second',
    ss: 'seconds',
    now: 'just now',
    ago: 'ago'


##Example

```js
var timeAgo = toTimeAgo(new Date(2015, 10, 10));
```
