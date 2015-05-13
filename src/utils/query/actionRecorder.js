//! import query.bind
//! import query.unbind
//! import query.unbindAll
//! import query.click
//! import query.focusin
//! import query.focusout
//! import query.keydown
//! import query.keyup
//! import query.val
define('actionRecorder', ['queryBuilder', 'query'], function(queryBuilder, query) {
    'use strict';

    var q = queryBuilder;
    q.config.allowAttributes = false;
    q.addUniqueAttrs('row-id');

    /**
     * @param {String} selector
     * @param {String} eventType
     * @param {String=} label
     * @param {String=} value
     * @constructor
     * @private
     */
    function EventSelector(selector, eventType, label, value) {
        label = label ? label.split("\n").shift() : null;
        label = label || 'label';
        this.selector = selector;
        this.eventType = eventType;
        this.label = label;
        this.value = value;
    }

    /**
     * @constructor
     */
    function ActionRecorder() {
        var queue;
        var eventTypes;
        var ignoreClasses;
        var boundHandler;
        var boundHandled;
        var elements;
        var handling = false;
        var hasPendingInput;
        var selectorFilter = function(selector) {
            return selector;
        };

        function start(evtTypes, ignoreClassList) {
            queue = [];
            eventTypes = evtTypes;
            ignoreClasses = ignoreClassList;
            applyListeners();
        }

        function stop() {
            removeListeners();
        }

        function getList() {
            return queue.slice(0, queue.length);
        }

        function getSelector(element, event) {
            var selector = q.getCleanSelector(element, ignoreClasses);
            if(selector) {
                return new EventSelector(selector, getEventType(selector, event.type), query(selector).text());
            }
            return null;
        }

        function getEventType(selector, eventType) {
            // if the selection is an focusable element, then we set focus.
            var selection = q.query(selector);
            var nodeType = selection ? selection.nodeName : 'unknown';
            if(eventType === 'click' && isInputType(nodeType)) {
                return 'focus';
            } else if(eventType === 'focusin') {
                return 'focus';
            } else if(eventType === 'focusout') {
                return 'blur';
            }
            return eventType;
        }

        function isInputType(type) {
            return type === 'INPUT' || type === 'SELECT' || type === 'TEXTAREA';
        }

        function applyListeners() {
            boundHandler = eventHandler.bind(this);
            boundHandled = function() { handling = false;}.bind(this);
            elements = query(document.body);//document.querySelectorAll("*");

            eventTypes.forEach(function(eventType) {
                elements.bind(eventType, boundHandler);
            });
        }

        function removeListeners() {
            eventTypes.forEach(function (eventType) {
                elements.unbind(eventType, boundHandler);
            });
        }

        function eventHandler(event) {
            if (!handling) {
                // do this little trick so we don't get multiple calls for a single event.
                // and also so we can pick up an event from a parent listener and still make it work.
                handling = true;
                onItemClick(event, event.target);
                setTimeout(boundHandled, 1);
            }
        }

        function onItemClick(event, element) {
            var selector = getSelector(element, event);
            if (filterOutInputs(selector, event)) {
                addToQueue(selector);
            }
        }

        function addToQueue(selector) {
            writeItem(selector);
            queue.push(selector);
        }

        function writeItem(item) {
            var result = "";
            switch(item.eventType) {
                case "val":
                    result = "VALUE: " + item.value + "\t" + selectorFilter(item.selector);
                    break;
                default:
                    result = item.eventType.toUpperCase() + "\t" + selectorFilter(item.selector);
            }
            console.log(result);
        }

        function filterOutInputs(selector, event) {
            var elm;
            if (event.type === 'keyup' && isInputType(document.activeElement.nodeName)) {
                hasPendingInput = true;
                return false;
            } else if (hasPendingInput && event.type === 'focusout') {
                elm = query(selector.selector);
                addToQueue(new EventSelector(selector.selector, 'val', elm.text(), elm.val()));
            }
            return true;
        }

        function pathFilter(filter) {
            selectorFilter = filter;
        }

        this.start = start;
        this.stop = stop;
        this.getList = getList;
        this.setPathFilter = pathFilter;
    }

    return new ActionRecorder();

});