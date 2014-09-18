/* global hb */

var module = hb.module('blast');
//module.bindingMarkup = ['{{', '}}'];
module.template('launcher', document.getElementById('blast-launcher-template').innerHTML);
module.template('conversations', document.getElementById('blast-conversations-template').innerHTML);
module.template('conversation-new', document.getElementById('blast-conversation-new-template').innerHTML);
module.template('conversation-details', document.getElementById('blast-conversation-details-template').innerHTML);
module.useDirectives('app autoscroll class cloak disabled events html model repeat show src view');
module.useFilters('timeAgo');

//console.log('isMobile', hb.utils.browser.isMobile.any);