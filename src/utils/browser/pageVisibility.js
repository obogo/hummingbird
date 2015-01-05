define('pageVisibility', ['dispatcher'], function (dispatcher) {
    var hidden = "hidden",
        CHANGE = 'pageVisibility::change',
        doc = document,
        visible = false,
        result = {};

    // Standards:
    if (hidden in doc) {
        doc.addEventListener("visibilitychange", onchange);
    } else if ((hidden = "mozHidden") in doc) {
        doc.addEventListener("mozvisibilitychange", onchange);
    } else if ((hidden = "webkitHidden") in doc) {
        doc.addEventListener("webkitvisibilitychange", onchange);
    } else if ((hidden = "msHidden") in doc) {
        doc.addEventListener("msvisibilitychange", onchange);
        // IE 9 and lower:
    } else if ("onfocusin" in doc) {
        doc.onfocusin = doc.onfocusout = onchange;
        // All others:
    } else {
        window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onchange;
    }

    function onchange(evt) {
        var v = "visible", h = "hidden", value,
            evtMap = {
                focus: v, focusin: v, pageshow: v, blur: h, focusout: h, pagehide: h
            };

        evt = evt || window.event;
        value = evt.type in evtMap ? evtMap[evt.type] : this[hidden];
        visible = doc[hidden] !== 'undefined' ? doc['hidden'] : value === v || h;
        if (visible) {
            doc.body.classList.remove('page-hidden');
            doc.body.classList.add('page-visible');
        } else {
            doc.body.classList.add('page-hidden');
            doc.body.classList.remove('page-visible');
        }
        result.visible = visible;
        result.dispatch(CHANGE, visible);
    }

    // set the initial state (but only if browser supports the Page Visibility API)
    if (doc[hidden] !== undefined) {
        onchange({type: doc[hidden] ? "blur" : "focus"});
    }

    return dispatcher(result);
});