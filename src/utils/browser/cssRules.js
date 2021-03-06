/**
 * Add and remove css rules. Does not create stylesheets. Just appends to last one.
 */
define('cssRules', function () {
    // Derived from here. But fixed up because it wasn't workng.
    //http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript

    /**
     * Lookup any css rule in all stylesheets.
     * @param ruleName
     * @param deleteFlag
     * @returns {boolean}
     */
    function getCSSRule(ruleName, deleteFlag) {               // Return requested style obejct
        ruleName = ruleName.toLowerCase();                       // Convert test string to lower case.
        var len = document.styleSheets && document.styleSheets.length || 0;
        var styleSheet;
        var ii;
        var i;
        var cssRule;
        if (document.styleSheets) {                            // If browser can play with stylesheets
            for (i = 0; i < len; i += 1) { // For each stylesheet
                styleSheet = document.styleSheets[i];          // Get the current Stylesheet
                ii = 0;                                        // Initialize subCounter.
                cssRule = false;                               // Initialize cssRule.
                do {                                             // For each rule in stylesheet
                    if (styleSheet.cssRules) {                    // Browser uses cssRules?
                        cssRule = styleSheet.cssRules[ii];         // Yes --Mozilla Style
                    } else if (styleSheet.rules) {                                      // Browser usses rules?
                        cssRule = styleSheet.rules[ii];            // Yes IE style.
                    }                                             // End IE check.
                    if (cssRule) {                               // If we found a rule...
                        if (cssRule.selectorText && cssRule.selectorText.toLowerCase() == ruleName) { //  match ruleName?
                            if (deleteFlag == 'delete') {             // Yes.  Are we deleteing?
                                if (styleSheet.cssRules) {           // Yes, deleting...
                                    styleSheet.deleteRule(ii);        // Delete rule, Moz Style
                                } else {                             // Still deleting.
                                    styleSheet.removeRule(ii);        // Delete rule IE style.
                                }                                    // End IE check.
                                return true;                         // return true, class deleted.
                            } else {                                // found and not deleting.
                                return cssRule;                      // return the style object.
                            }                                       // End delete Check
                        }                                          // End found rule name
                    }                                             // end found cssRule
                    ii++;                                         // Increment sub-counter
                } while (cssRule);                               // end While loop
            }                                                   // end For loop
        }                                                      // end styleSheet ability check
        return false;                                          // we found NOTHING!
    }                                                         // end getCSSRule

    /**
     * Remove a css rule. It will not remove !important rules in chrome.
     * @param ruleName
     * @returns {boolean}
     */
    function removeCSSRule(ruleName) {                        // Delete a CSS rule
        return getCSSRule(ruleName, 'delete');                  // just call getCSSRule w/delete flag.
    }                                                         // end killCSSRule

    /**
     * Add a css style rule to the last stylesheet.
     * @param ruleName
     * @param style
     * @returns {*}
     */
    function addCSSRule(ruleName, style) {                    // Create a new css rule
        var lastIndex;
        if (document.styleSheets) {                            // Can browser do styleSheets?
            if (!getCSSRule(ruleName)) {                        // if rule doesn't exist...
                lastIndex = document.styleSheets.length - 1;
                if (document.styleSheets[0].addRule) {           // Browser is IE?
                    document.styleSheets[lastIndex].addRule(ruleName, style, 0);      // Yes, add IE style
                } else {                                         // Browser is IE?
                    document.styleSheets[lastIndex].insertRule(ruleName + ' {' + style + ' }', 0); // Yes, add Moz style.
                }                                                // End browser check
            }                                                   // End already exist check.
        }                                                      // End browser ability check.
        return getCSSRule(ruleName);                           // return rule we just created.
    }

    return {
        get: getCSSRule,
        add: addCSSRule,
        remove: removeCSSRule
    };
});