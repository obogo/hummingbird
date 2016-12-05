//! pattern /\.supplant\(/
define('string.supplant', ['supplant'], function (supplant) {
    if (!String.prototype.supplant) {
        String.prototype.supplant = function(o) {
            return supplant(this, o);
        };
    }
});

