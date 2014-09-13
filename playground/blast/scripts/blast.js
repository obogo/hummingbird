/* global hb */

var module = hb.module('blast');

module.template('launcher', document.getElementById('blast-launcher-template').innerHTML);
module.template('conversations', document.getElementById('blast-conversations-template').innerHTML);
module.template('conversation-new', document.getElementById('blast-conversation-new-template').innerHTML);
module.template('conversation-details', document.getElementById('blast-conversation-details-template').innerHTML);


hb.directives(module, 'app class cloak disabled events html model repeat show src view');
hb.filters(module, 'timeAgo');


