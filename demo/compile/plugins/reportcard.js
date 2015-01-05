var abc = 123;
exports = function (platform, view, next) { // make these injectables using locals
    console.log('whois abc', abc, this.url);
    //if(plugin.type === 'platform') {
    //    platform.on('data::changed', function(){
    //
    //    });
    //}
    //
    //// platform.options
    //// application.options
    //// options (plugin)
    next();
};