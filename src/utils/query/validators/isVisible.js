//! pattern /(\s|query)\(.*?\)\.isVisible\(/
define('query.isVisible', ['query', 'isVisible'], function (query, isVisible) {
    query.fn.isVisible = isVisible;
});