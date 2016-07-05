define('randInt', function() {
    return function(num) {
        return Math.floor(Math.random() * num);
    };
});