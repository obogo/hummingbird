/* global xml */
(function () {
    function insert(parentNode, newNode, position) {
        if (position === 0 || parentNode.childElementCount === 0) {
            parentNode.prependChild(newNode);
        } else if (parentNode.childElementCount === position) {
            parentNode.appendChild(newNode);
        } else {
            var referenceNode = parentNode.children[position - 1];
            insertAfter(newNode, referenceNode);
        }
    }

    function insertBefore(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    }

    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function replace(newNode, referenceNode) {
        referenceNode.parentNode.replaceChild(newNode, referenceNode);
    }

    function remove(node) {
        node.parentNode.removeChild(node);
    }

    xml.XMLDocument = {
        insert: insert,
        insertBefore: insertBefore,
        insertAfter: insertAfter,
        remove: remove,
        replace: replace
    };
}());