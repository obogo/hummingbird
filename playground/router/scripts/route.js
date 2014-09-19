/* global hb */

var module = hb.module('route');
module.bindingMarkup = ['<(', ')>'];
module.template('page1', '<div><pre><($state)></pre> Page1</div>');
module.template('page2', '<div><pre><($state)></pre> Page2</div>');
module.template('contact', '<div><pre><($state)></pre> Contact</div>');
module.useDirectives('app class cloak events html view');
hb.plugins.router(module);
module.router.add({
    home: {
        url: '/',//:id/:name?id=a&name=bob',
        templateName: 'home',
        template: '<div><pre><($state)></pre> Home</div>'
    },
    page1: {
        url: '/path1'
    },
    page2: {
        url: '/path/:id'
    }
});
module.router.add('contact', {
    url: '/contact/:id'
});

