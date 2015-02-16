define('isTouchDevice', function() {
    return  'ontouchstart' in window /* works on most browsers */ || 'onmsgesturechange' in window; // works on ie10
});