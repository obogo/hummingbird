define('contentEditableSelection', ['query', 'apply', 'each'], function(query, apply, each) {

    function countLength(node, data) {
        var tmp = data || {count: 0};
        if (node.nodeType === 3) {
            tmp.count += node.length;
        } else if (node.childNodes.length) {
            each(node.childNodes, countLength, tmp);
        }
        if (!data) {
            return tmp.count;
        }
    }

    /**
     * @external Range
     * @property {Function} getClientRects
     */

    /**
     * @external HTMLElement
     * @property {TE} ces
     */

    /**
     * @type TE
     * @param {HTMLElement} el
     * @returns {TE|*|self}
     * @constructor
     */
    function TE(el) {
        var self = this;
        if (el.ces) {
            return el.ces;
        }
        el.ces = self;
        var $el = query(el);
        var ss = this.saveSelection.bind(this);
        $el.on('blur', ss);
        $el.on('keyup', ss);
        this.el = el;
        this.$el = $el;
        this.ss = ss;
        // @type Range
        this._lastSelection;
        this._preventSelector = null;

        function updateLastIndex() {
            self._lastDir = self._lastCaretIndex > self._currentCaretIndex ? -1 : (self._lastCaretIndex === self._currentCaretIndex ? 0 : 1);
            self._lastCaretIndex = self._currentCaretIndex;
        }

        function updateCurrentIndex() {
            var sel = window.getSelection(), range;
            var last = self._lastCaretIndex;
            var current;
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                current = self._currentCaretIndex = self.getAbsoluteIndex(range);
            }

            if (self._preventSelector) {
                if (range && range.startContainer !== self.el && self.$el.find(self._preventSelector).indexOf(range.startContainer) !== -1) {
                    if (current === last) {
                        self._currentCaretIndex += self._lastDir;
                        if (self._currentCaretIndex < 0) {
                            self._currentCaretIndex = 0;
                        }
                        self.setCaretIndex(self._currentCaretIndex);
                    }
                }
            }
        }

        $el.on('keydown', updateLastIndex);
        $el.on('keyup', updateCurrentIndex);
        $el.on('focus', updateLastIndex);
    }

    var TEP = TE.prototype;

    TEP.destroy = function() {
        this.$el.off('blur', this.ss);
        this.$el.off('keyup', this.ss);
        this.ss = null;
        this.$el = null;
        this.el = null;
    };

    TEP.insertAtCursor = function (html, selectPastedContent) {
        var sel, range;
        this.restoreSelection();
        if (window.getSelection) {
            // IE9 and non-IE
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                // Range.createContextualFragment() would be useful here but is
                // only relatively recently standardized and is not supported in
                // some browsers (IE9, for one)
                var el = document.createElement("div");
                el.innerHTML = html;
                var frag = document.createDocumentFragment(), node, lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                var firstNode = frag.firstChild;
                range.insertNode(frag);

                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    if (selectPastedContent) {
                        range.setStartBefore(firstNode);
                    } else {
                        range.collapse(true);
                    }
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        } else if ((sel = document.selection) && sel.type != "Control") {
            // IE < 9
            var originalRange = sel.createRange();
            originalRange.collapse(true);
            sel.createRange().pasteHTML(html);
            if (selectPastedContent) {
                range = sel.createRange();
                range.setEndPoint("StartToStart", originalRange);
                range.select();
            }
        }
    };

    TEP.saveSelection = function () {
        var sel;
        this._lastSelection = null;
        if (window.getSelection) {
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                this._lastSelection = sel.getRangeAt(0);
            }
        } else if (document.selection && document.selection.createRange) {
            this._lastSelection = document.selection.createRange();
        }
        return this._lastSelection;
    };

    TEP.restoreSelection = function (range) {
        var sel;
        range = range || this._lastSelection;
        if (range) {
            if (window.getSelection) {
                sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            } else if (document.selection && range.select) {
                range.select();
            }
        }
    };

    var setSelectionByCharacterOffsets = null;

    if (window.getSelection && document.createRange) {
        setSelectionByCharacterOffsets = function(containerEl, start, end) {
            var charIndex = 0, range = document.createRange();
            range.setStart(containerEl, 0);
            range.collapse(true);
            var nodeStack = [containerEl], node, foundStart = false, stop = false;

            while (!stop && (node = nodeStack.pop())) {
                if (node.nodeType == 3) {
                    var nextCharIndex = charIndex + node.length;
                    if (!foundStart && start >= charIndex && start <= nextCharIndex) {
                        range.setStart(node, start - charIndex);
                        foundStart = true;
                    }
                    if (foundStart && end >= charIndex && end <= nextCharIndex) {
                        range.setEnd(node, end - charIndex);
                        stop = true;
                    }
                    charIndex = nextCharIndex;
                } else {
                    var i = node.childNodes.length;
                    while (i--) {
                        nodeStack.push(node.childNodes[i]);
                    }
                }
            }

            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    } else if (document.selection) {
        setSelectionByCharacterOffsets = function(containerEl, start, end) {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(containerEl);
            textRange.collapse(true);
            textRange.moveEnd("character", end);
            textRange.moveStart("character", start);
            textRange.select();
        };
    }

    TEP.setCaretIndex = function(index) {
        setSelectionByCharacterOffsets(this.el, index, index);
    };

    TEP.getCaretIndex = function() {
        return this._currentCaretIndex;
    };

    TEP.getNodeIndex = function(node) {
        return apply(Array.prototype.indexOf, this.el.childNodes, node);
    };

    TEP.getAbsoluteIndex = function(range) {
        var c = 0;
        var rangeLen;
        for(var i = 0, len = this.el.childNodes.length; i < len; i += 1) {
            rangeLen = countLength(this.el.childNodes[i]);
            if (range.startContainer === this.el.childNodes[i]) {
                return c + range.startOffset;
            }
            c += rangeLen;
        }
        return c;
    };

    TEP.length = function() {
        var c = 0;
        for(var i = 0, len = this.el.childNodes.length; i < len; i += 1) {
            c += countLength(this.el.childNodes[i]);
        }
        return c;
    };

    TEP.getCaretRects = function() {
        return this._lastSelection && this._lastSelection.getClientRects() || null;
    };

    /**
     * Any elements matching the selector if the caret enters it will move it out.
     * @param selector
     */
    TEP.preventCaretIn = function(selector) {
        this._preventSelector = selector;
    };

    return {
        /**
         * @param {HTMLElement} el
         * @returns {TE}
         */
        create: function(el) {
            return new TE(el);
        }
    };
});