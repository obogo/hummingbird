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

    function TE(el) {
        var $el = query(el);
        var ss = this.saveSelection.bind(this);
        $el.on('blur', ss);
        $el.on('keyup', ss);
        this.el = el;
        this.$el = $el;
        this.ss = ss;
    }

    var TEP = TE.prototype;

    TEP.destroy = function() {
        this.$el.off('blur', this.ss);
        this.$el.off('keyup', this.ss);
        this.ss = null;
        this.$el = null;
        this.el = null;
    };

    TEP.getIndex = function(node) {
        var children = this.el.childNodes;
        var c = 0;
        for(var i = 0, len = children.length; i < len; i += 1) {
            if (children[i] === node) {
                return c;
            }
            if (children[i].textContent) {
                c += children[i].textContent.length;
            } else if (children[i].innerHTML) {
                c += 1;
            }
        }
        return c;
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
                //} else if(node.nodeType == 1 && !node.childNodes.length) {
                //    nextCharIndex = charIndex + 1;
                //    if (start >= charIndex && start <= nextCharIndex) {
                //        range.setStart(node, start - charIndex);
                //        range.setEnd(node, end - charIndex);
                //        foundStart = true;
                //        stop = true;
                //    }
                //    charIndex += 1;
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

    var setCaret = function(element, index) {
        setSelectionByCharacterOffsets(element, index, index);
    };

    function cursorIndex() {
        return window.getSelection().getRangeAt(0).startOffset;
    }

    TEP.setCaretIndex = function(index) {
        setSelectionByCharacterOffsets(this.el, index, index);
    };

    TEP.getNodeIndex = function(node) {
        return apply(Array.prototype.indexOf, this.el.childNodes, node);
    }

    TEP.getAbsoluteIndex = function(range) {
        var sc = range.startContainer;
        var c = 0;
        var rangeLen;
        var node;
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

    TEP.getCaretIndex = function() {
        if (this._lastSelection) {
            return this.getAbsoluteIndex(this._lastSelection);
        }
    };

    return {
        create: function(el) {
            return new TE(el);
        }
    };
});