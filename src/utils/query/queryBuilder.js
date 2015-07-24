/**
 * selector
 * @deps function.each, data.filter
 */
//TODO: Needs unit tests. This needs jquery to run unit tests for selections since it uses filters.
define('queryBuilder', ['filter', 'each', 'fromCamelToDash', 'fromDashToCamel'], function (filter, each, fromCamelToDash, fromDashToCamel) {

    var omitAttrs, uniqueAttrs, classFilters, classFiltersFctn, queryBuilder;
    // Simple query selection that will use eq filter.
    function query(selectorStr, el) {
        el = el || queryBuilder.config.doc.body;
        var rx = /:eq\((\d+)\)$/, match = selectorStr.match(rx), result, count;
        // filter out eq.
        if (match && match.length) {
            selectorStr = selectorStr.replace(rx, '');
            count = match[1];
        }
        result = el.querySelectorAll(selectorStr);
        if (result && count !== undefined) {
            return result[count];
        }
        return result;
    }

    function buildIntoFilterList(name, list) {
        addToList(list, name);
    }

    function buildFilterList(items) {
        var list = [];
        each(items, buildIntoFilterList, list);
        return list;
    }

    function cleanParams(params) {
        if (params instanceof Array) {
            params = {ignoreClasses:params};// handle legacy input.
        }
        return {
            uniqueAttrs: buildFilterList(params.uniqueAttrs || []),
            ignoreClasses: buildIgnoreFunction(params.ignoreClasses || []),
            includeAttrs: buildFilterList(params.includeAttrs || []),
            omitAttrs: buildFilterList(params.omitAttrs || [])
        };
    }

    /**
     * ##getCleanSelector##
     * Generate a clean readable selector. This is accurate, but NOT performant.
     * The reason this one takes longer is because it takes many queries as it goes to determine when it has
     * built a query that is unique enough trying to do this as early on as possible to keep it short.
     * @param {DOMElement} el
     * @param {{uniqueAttrs:Array.<String|RegExp|Function>, ignoreClasses:Array.<String|RegExp|Function>, includeAttrs:Array.<String|RegExp|Function>, omitAttrs:Array.<String|RegExp|Function>}|Array.<String|RegExp|Function>} params - an array of strings or regExp
     */
    function getCleanSelector(el, params) {
        el = validateEl(el);
        var filters = {};
        if (el) {
            filters = cleanParams(params);
            var matches, index, str,
                maxParent = queryBuilder.config.doc.body,
                selector = getSelectorData(el, maxParent, filters, null, true);
            while (selector.parent && selector.count > 1) {
                selector = selector.parent;
            }
            selector = selector.parent || selector;// once we find the top level. we need to move up one.
            str = selector.str || selectorToString(selector);
            if (selector.str) {
                var child = selector.child;
                while (child) {
                    str += ' ' + child.str;
                    child = child.child;
                }
            }
            if (selector.count > 1 || (selector.child && selector.child.count)) {
                matches = Array.prototype.slice.apply(query(str, maxParent));
                if (matches.length > 1) {
                    index = matches.indexOf(el);
                    str += ':eq(' + index + ')';
                }
            }
            return str;
        }
        return '';
    }

    /**
     * ##<a name="quickSelector">quickSelector</a>##
     * build the string selector for the element. This is more performant, but hardly readable.
     * It is faster because it doesn't check to determine how unique it is. It just keeps building until
     * it gets to the maxParent.
     * @param {DomElement} element
     * @param {DomElement=} maxParent
     * @param {Function=} ignoreClass
     * @returns {string}
     */
    function quickSelector(element, maxParent, params) {
        element = validateEl(element);
        if (element) {
            var filters = cleanParams(params),
                selector = getSelectorData(element, maxParent, filters);
            return selectorToString(selector) + getVisible();
        }
        return '';
    }


    function validateEl(el) {
        if (queryBuilder.config.checkVisibility) {
            return el && isVisible(el) ? el : undefined;
        }
        return el || undefined;
    }

    function isVisible(el) {
        return !(el.offsetWidth <= 0 && el.offsetHeight <= 0 || (el.style && el.style.display === "none"));
    }

    function matchesClass(item, matcher) {
        if (typeof matcher === "string" && matcher === item) {
            return true;
        }
        if (typeof matcher === "object" && item.match(matcher)) {
            return true;
        }
        return false;
    }


    function getSelectorData(element, maxParent, filters, child, smartSelector) {
        var result;
        if (!validateEl(element)) {
            return "";// not visible or no item found.
        }

        maxParent = maxParent || queryBuilder.config.doc;

        result = {
            element: element,
            filters: filters,
            maxParent: maxParent,
            classes: getClasses(element, filters.ignoreClasses),
            attributes: getAttributes(element, child, filters.uniqueAttrs, filters.includeAttrs, filters.omitAttrs),
            type: element.nodeName && element.nodeName.toLowerCase() || '',
            child: child
        };
        if (!result.attributes.$unique || child || smartSelector) {
            if (smartSelector) {
                result.str = selectorToString(result, 0, null, true);
                result.count = maxParent.querySelectorAll(result.str).length;
                if (result.count > 1) {
                    result.parent = getParentSelector(element, maxParent, filters, result, smartSelector);
                }
            } else { // dumb selector. keeps building it. Not checking to see if it is unique.
                result.parent = getParentSelector(element, maxParent, filters, result, smartSelector);
            }
        }
        return result;
    }

    function filterNumbers(item) {
        return typeof item !== 'number';
    }

    function buildIgnoreFunction(ignoreClasses) {
        ignoreClasses = ignoreClasses || [];
        if (typeof ignoreClasses === "function") {
            return ignoreClasses;
        }
        return function (cls) {
            if (ignoreClasses instanceof Array) {
                var i = 0, iLen = ignoreClasses.length;
                while (i < iLen) {
                    if (matchesClass(cls, ignoreClasses[i])) {
                        return false;
                    }
                    i += 1;
                }
            } else if (matchesClass(cls, ignoreClasses)) {
                return false;
            }
            return true;
        };
    }

    function getClasses(element, ignoreClass) {
        var classes = filter(element.classList, filterNumbers);
        classes = filter(classes, classFiltersFctn);
        return filter(classes, ignoreClass);
    }

    function getAttributes(element, child, uniqueAttrs, includeAttrs, omitAttrs) {
        var i = 0, len = element.attributes ? element.attributes.length : 0, attr, attributes = [],
            uniqueAttr = getUniqueAttribute(element.attributes, uniqueAttrs, omitAttrs);
        // first see if it has a unique attribute.
        if (uniqueAttr) {
            if (uniqueAttr.name === "id") {
                attributes.push("#" + uniqueAttr.value);
            } else {
                attributes.push(createAttrStr(uniqueAttr));
            }
            if (attributes.length) {
                attributes.$unique = true;
                return attributes;
            }
        }
        if (queryBuilder.config.allowAttributes) {
            while (i < len) {
                attr = element.attributes[i];
                if (!isOmitAttribute(attr.name, omitAttrs) && !isUniqueAttribute(attr.name, uniqueAttrs, omitAttrs) && isIncludeAttr(attr.name, includeAttrs)) {
                    attributes.push(createAttrStr(attr));
                }
                i += 1;
            }
        }
        return attributes;
    }

    function createAttrStr(attr) {
        return "[" + attr.name + "='" + escapeQuotes(attr.value) + "']";
    }

    function getUniqueAttribute(attributes, uniques, omits) {
        var attr, i, len = attributes ? attributes.length : 0;
        for (i = 0; i < len; i += 1) {
            attr = attributes[i];
            if (isUniqueAttribute(attr.name, uniques, omits)) {
                return attr;
            }
        }
        return null;
    }

    function isUniqueAttribute(name, uniques, omits) {
        var i, len = uniqueAttrs.length, ua;
        for(i = 0; i < len; i += 1) {
            ua = uniques && uniques[i] || uniqueAttrs[i];
            if (ua.type === "string" && ua.value === name) {
                return true;
            } else if (ua.type === 'rx' && ua.value.test(name) && !isOmitAttribute(name, omits)) {
                return true;
            }
        }
        return false;
    }

    function isIncludeAttr(name, includes) {
        if(!includes) {
            return false;
        }
        var i, len = includes.length, ua;
        for(i = 0; i < len; i += 1) {
            ua = includes[i];
            if (ua.type === "string" && ua.value === name) {
                return true;
            } else if (ua.type === 'rx' && ua.value.test(name)) {
                return true;
            }
        }
        return false;
    }

    function isOmitAttribute(name, omits) {
        var i, len = omitAttrs.length, oa;
        for(i = 0; i < len; i += 1) {
            oa = omits && omits[i] || omitAttrs[i];
            if (oa.type === "string" && oa.value === name) {
                return true;
            } else if (oa.type === 'rx' && oa.value.test(name)) {
                return true;
            }
        }
        return false;
    }

    function escapeQuotes(str) {
        return str.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    }

    function selectorToString(selector, depth, overrideMaxParent, skipCount) {
        var matches, str, parent;
        depth = depth || 0;
        str = selector && !selector.attributes.$unique ? selectorToString(selector.parent, depth + 1) : '';
        if (selector) {
            str += (str.length ? ' ' : '') + getSelectorString(selector);
        }
        if (!depth && !skipCount) {
            parent = overrideMaxParent || selector.maxParent;
            matches = parent.querySelectorAll && parent.querySelectorAll(str) || [];
            if (matches.length > 1) {
                str += ':eq(' + getIndexOfTarget(matches, selector.element) + ')';
            }
        }
        return str;
    }

    function getSelectorString(selector) {
        if (selector.attributes.$unique) {
            return selector.attributes[0];
        }
        return selector.type + selector.attributes.join('') + (selector.classes.length ? '.' + selector.classes.join('.') : '');
    }

    function getParentSelector(element, maxParent, filters, child, detailed) {
        var parent = element.parentNode;
        if (parent && parent !== maxParent) {
            return getSelectorData(element.parentNode, maxParent, filters, child, detailed);
        }
        return null;
    }

    function getIndexOfTarget(list, element) {
        var i,
            iLen = list.length;
        for (i = 0; i < iLen; i += 1) {
            if (element === list[i]) {
                return i;
            }
        }
        return -1;
    }

    function getList(obj) {
        var ary = [], i;
        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                ary.push(obj[i]);
            }
        }
        return ary;
    }

    function addToList(list, name) {
        var item = {
            type: typeof name === "string" ? "string" : "rx",
            value: name
        };
        if (item.type === "string") {
            item.name = fromCamelToDash(name);
            list.push({type: item.type, value:fromDashToCamel(name)});
        }
        list.push(item);
    }

    queryBuilder = {
        config: {
            doc: window.document,
            allowAttributes: true,
            checkVisibility: false
        },
        /* @deprecated */
        addOmitAttrs: function (name) {
            each(arguments, function (name) {
                addToList(omitAttrs, name);
            });
            return this;
        },
        /* @deprecated */
        getOmitAttrs: function () {
            return omitAttrs;
        },
        /* @deprecated */
        resetOmitAttrs: function () {
            omitAttrs = [{type:"string", value:"class"}, {type:"string", value:"style"}];
        },
        // UNIQUE
        /* @deprecated */
        addUniqueAttrs: function (name) {
            each(arguments, function (name) {
                addToList(uniqueAttrs, name);
            });
            return this;
        },
        /* @deprecated */
        getUniqueAttrs: function () {
            return uniqueAttrs;
        },
        /* @deprecated */
        resetUniqueAttrs: function () {
            uniqueAttrs = [{type:"string", value:"id"}, {type:"string", value:"uid"}];
        },
        // CLASS OMIT OMIT FILTERS
        /* @deprecated */
        addClassOmitFilters: function () {
            each(arguments, function (filter) {
                classFilters.push(filter);
            });
            classFiltersFctn = buildIgnoreFunction(classFilters);
            return this;
        },
        /* @deprecated */
        removeClassOmitFilters: function () {
            each(arguments, function (filter) {
                var index = classFilters.indexOf(filter);
                if (index !== -1) {
                    classFilters.splice(index, 1);
                }
            });
            classFiltersFctn = buildIgnoreFunction(classFilters);
            return this;
        },
        /* @deprecated */
        getClassOmitFilters: function () {
            return classFilters.slice(0);
        },
        /* @deprecated */
        resetClassOmitFilters: function () {
            classFilters = [];
            classFiltersFctn = buildIgnoreFunction(classFilters);
        },
        query: query,
        get: getCleanSelector,
        getCleanSelector: getCleanSelector,
        quickSelector: quickSelector,
        /* @deprecated */
        reset: function () {
            queryBuilder.resetOmitAttrs();
            queryBuilder.resetUniqueAttrs();
            queryBuilder.resetClassOmitFilters();
        }
    };

    queryBuilder.reset();
    return queryBuilder;

});

