/* global hb */

var module = hb.module('route');
module.bindingMarkup = ['<:', ':>'];
module.template('page1', '<div><:$stateParams:> Page1</div>');
module.template('page2', '<div><:$stateParams:> Page2</div>');
module.useDirectives('app class cloak events html view');
hb.plugins.router(module);
module.router.add({
    home: {
        url: '/',//:id/:name?id=a&name=bob',
        templateName: 'home',
        template: '<div><:$stateParams:> Home</div>'
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

