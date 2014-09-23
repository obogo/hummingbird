/*
 ### jQuery XML to JSON Plugin v1.1 - 2008-07-01 ###
 * http://www.fyneworks.com/ - diego@fyneworks.com
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 ###
 Website: http://www.fyneworks.com/jquery/xml-to-json/
 *//*
 # INSPIRED BY: http://www.terracoder.com/
 AND: http://www.thomasfrank.se/xml_to_json.html
 AND: http://www.kawa.net/works/js/xml/objtree-e.html
 *//*
 This simple script converts XML (document of code) into a JSON object. It is the combination of 2
 'xml to json' great parsers (see below) which allows for both 'simple' and 'extended' parsing modes.
 */
// Avoid collisions
/* global ActiveXObject */
(function () {
    var api = {
        extend: utils.extend,
        each: utils.each,
        isArray: utils.validators.isArray
    };
    function typeCast(val) {
        if (val === 'true' || val === 'false') {
            return val === 'true';
        } else if (val !== '' && val && !isNaN(val)) {
            return parseFloat(val);
        }
        return val;
    }

    function parseCondition(item, index, list) {
        if (item.type === 'condition') {
            item.conditions = [];
            var i = 0, iLen = item.steps.length;
            while (i < iLen) {
                api.each(item.steps, parseCondition);
                item.conditions.push(item.steps[i]);
                i += 1;
            }
            item.steps = [];// clear old steps.
        }
    }

    // Add function to jQuery namespace
    api.extend(api, {
        parse: function(str) {
            var result;
            str = this.closeOpenNodes(str);
            str = str.replace(/<(\w+)/g, "<steps type=\"$1\"");
            str = str.replace(/<\/\w+/g, "<\/steps");
            result = this.xml2json(str);

            // we now need to walk the structure looking for conditions and parse them out accordingly.
            this.each(result.steps, parseCondition);

            return result;
        },

        // this will convert closed tags to open tags
        // <reset/> => <reset></reset>
        closeOpenNodes: function (str) {
            str = str.replace(/<(\w+)\/>/gim, "<$1><\/$1>");
            // <reset ... /> => <reset ...></reset>
            str = str.replace(/(<(\w+)[^>]+?)\/>/gim, "$1><\/$2>");
            return str;
        },
        // converts xml documents and xml text to json object
        xml2json: function (xml, extended) {
            if (!xml) {
                return {};
            } // quick fail

            //### PARSER LIBRARY
            // Core function
            function parseXML(node, simple) {
                if (!node) {
                    return null;
                }
                var txt = '', obj = null, att = null, cnn;
                var nt = node.nodeType, nn = jsVar(node.localName || node.nodeName);
                var nv = node.text || node.nodeValue || '';
                /*DBG*/ //if(window.console) console.log(['x2j',nn,nt,nv.length+' bytes']);
                if (node.childNodes) {
                    if (node.childNodes.length > 0) {
                        /*DBG*/ //if(window.console) console.log(['x2j',nn,'CHILDREN',node.childNodes]);
                        api.each(node.childNodes, function (cn, n) {
                            var cnt = cn.nodeType, cnn = jsVar(cn.localName || cn.nodeName);
                            var cnv = cn.text || cn.nodeValue || '';
                            /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>a',cnn,cnt,cnv]);
                            if (cnt === 8) {
                                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>b',cnn,'COMMENT (ignore)']);
                                return; // ignore comment node
                            }
                            else if (cnt === 3 || cnt === 4 || !cnn) {
                                // ignore white-space in between tags
                                if (cnv.match(/^\s+$/)) {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>c',cnn,'WHITE-SPACE (ignore)']);
                                    return;
                                }
                                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>d',cnn,'TEXT']);
                                txt += cnv.replace(/^\s+/, '').replace(/\s+$/, '');
                                // make sure we ditch trailing spaces from markup
                            }
                            else {
                                /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>e',cnn,'OBJECT']);
                                obj = obj || {};
                                if (obj[cnn]) {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>f',cnn,'ARRAY']);

                                    // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
                                    if (!obj[cnn].length) {
                                        obj[cnn] = myArr(obj[cnn]);
                                    }
                                    obj[cnn] = myArr(obj[cnn]);

                                    obj[cnn][ obj[cnn].length ] = parseXML(cn, true/* simple */);
                                    obj[cnn].length = obj[cnn].length;
                                }
                                else {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'node>g',cnn,'dig deeper...']);
                                    obj[cnn] = parseXML(cn);
                                }
                            }
                        });
                    }
                    //node.childNodes.length>0
                }
                //node.childNodes
                if(txt) {
                    txt = typeCast(txt);
                }
                if (node.attributes) {
                    if (node.attributes.length > 0) {
                        /*DBG*/ //if(window.console) console.log(['x2j',nn,'ATTRIBUTES',node.attributes])
                        att = {};
                        obj = obj || {};
                        api.each(node.attributes, function (at, a) {
                            var atn = jsVar(at.name), atv = at.value;
                            if (atn !== 'xmlns') {
                                att[atn] = atv;
                                if (obj[atn]) {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'ARRAY']);

                                    // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
                                    //if(!obj[atn].length) obj[atn] = myArr(obj[atn]);//[ obj[ atn ] ];
                                    obj[cnn] = myArr(obj[cnn]);

                                    obj[atn][ obj[atn].length ] = atv;
                                    obj[atn].length = obj[atn].length;
                                }
                                else {
                                    /*DBG*/ //if(window.console) console.log(['x2j',nn,'attr>',atn,'TEXT']);
                                    obj[atn] = typeCast(atv);
                                }
                            }
                        });
                        //obj['attributes'] = att;
                    }
                    //node.attributes.length>0
                }
                //node.attributes
                if (obj) {
                    if (txt === '') {
                        obj = api.extend({}, /* {text:txt},*/ obj || {}/*, att || {}*/);
                    }
//                    obj = api.extend((txt != '' ? new String(txt) : {}), /* {text:txt},*/ obj || {}/*, att || {}*/);
                    if (obj.text) {
                        if (typeof obj.text === 'object') {
                            txt = obj.text;
                        } else {
//                            txt = [obj.text || ''].concat([txt]);
                            txt = (obj.txt || txt) || '';
                        }
                    } else {
                        txt = txt;
                    }
//                    txt = (obj.text) ? (typeof(obj.text) == 'object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
                    if (txt !== undefined && txt !== '') {
                        obj.text = txt;
                    }
                    txt = '';
                }
                var out = obj || txt;
                //console.log([extended, simple, out]);
                if (extended) {
                    if (txt) {
                        out = {};
                    }//new String(out);
                    txt = out.text || txt || '';
                    if (txt) {
                        out.text = txt;
                    }
                    if (!simple) {
                        out = myArr(out);
                    }
                }
                return out;
            }

            // parseXML
            // Core Function End
            // Utility functions
            var jsVar = function (s) {
                return String(s || '').replace(/-/g, "_");
            };

            // NEW isNum function: 01/09/2010
            // Thanks to Emile Grau, GigaTecnologies S.L., www.gigatransfer.com, www.mygigamail.com
            function isNum(s) {
                // based on utility function isNum from xml2json plugin (http://www.fyneworks.com/ - diego@fyneworks.com)
                // few bugs corrected from original function :
                // - syntax error : regexp.test(string) instead of string.test(reg)
                // - regexp modified to accept  comma as decimal mark (latin syntax : 25,24 )
                // - regexp modified to reject if no number before decimal mark  : ".7" is not accepted
                // - string is "trimmed", allowing to accept space at the beginning and end of string
                var regexp = /^((-)?([0-9]+)(([\.\,]{0,1})([0-9]+))?$)/;
                return (typeof s === "number") || regexp.test(String((s && typeof s === "string") ? s.trim() : ''));
            }

            // OLD isNum function: (for reference only)
            //var isNum = function(s){ return (typeof s == "number") || String((s && typeof s == "string") ? s : '').test(/^((-)?([0-9]*)((\.{0,1})([0-9]+))?$)/); };

            var myArr = function (o) {

                // http://forum.jquery.com/topic/jquery-jquery-xml2json-problems-when-siblings-of-the-same-tagname-only-have-a-textnode-as-a-child
                //if(!o.length) o = [ o ]; o.length=o.length;
                if (!api.isArray(o)) {
                    o = [ o ];
                }
                o.length = o.length;

                // here is where you can attach additional functionality, such as searching and sorting...
                return o;
            };
            // Utility functions End
            //### PARSER LIBRARY END

            // Convert plain text to xml
            if (typeof xml === 'string') {
                xml = api.text2xml(xml);
            }

            // Quick fail if not xml (or if this is a node)
            if (!xml.nodeType) {
                return;
            }
            if (xml.nodeType === 3 || xml.nodeType === 4) {
                return xml.nodeValue;
            }

            // Find xml root node
            var root = (xml.nodeType === 9) ? xml.documentElement : xml;

            // Convert xml to json
            var out = parseXML(root, true /* simple */);

            // Clean-up memory
            xml = null;
            root = null;

            // Send output
            return out;
        },

        // Convert text to XML DOM
        text2xml: function (str) {
            // NOTE: I'd like to use jQuery for this, but jQuery makes all tags uppercase
            //return $(xml)[0];
            var out, xml;
            try {
                xml = (DOMParser) ? new DOMParser() : new ActiveXObject("Microsoft.XMLDOM");
                xml.async = false;
            } catch (e) {
                throw new Error("XML Parser could not be instantiated");
            }
            try {
                if (!DOMParser) {
                    out = (xml.loadXML(str)) ? xml : false;
                } else {
                    out = xml.parseFromString(str, "text/xml");
                }
            } catch (e) {
                throw new Error("Error parsing XML string");
            }
            return out;
        }

    }); // extend $

    ex.xml = api;
}());

/*
 Copyright 2011-2013 Abdulla Abdurakhmanov
 Original sources are available at https://code.google.com/p/x2js/

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

function xmlToJson(config) {
    var VERSION = "1.1.5";

    config = config || {};
    initConfigDefaults();
    initRequiredPolyfills();

    function initConfigDefaults() {
        if(config.escapeMode === undefined) {
            config.escapeMode = true;
        }
        config.attributePrefix = config.attributePrefix || "_";
        config.arrayAccessForm = config.arrayAccessForm || "none";
        config.emptyNodeForm = config.emptyNodeForm || "text";
        if(config.enableToStringFunc === undefined) {
            config.enableToStringFunc = true;
        }
        config.arrayAccessFormPaths = config.arrayAccessFormPaths || [];
        if(config.skipEmptyTextNodesForObj === undefined) {
            config.skipEmptyTextNodesForObj = true;
        }
        if(config.stripWhitespaces === undefined) {
            config.stripWhitespaces = true;
        }
        config.datetimeAccessFormPaths = config.datetimeAccessFormPaths || [];
    }

    var DOMNodeTypes = {
        ELEMENT_NODE 	   : 1,
        TEXT_NODE    	   : 3,
        CDATA_SECTION_NODE : 4,
        COMMENT_NODE	   : 8,
        DOCUMENT_NODE 	   : 9
    };

    function initRequiredPolyfills() {
        function pad(number) {
            var r = String(number);
            if ( r.length === 1 ) {
                r = '0' + r;
            }
            return r;
        }
        // Hello IE8-
        if(typeof String.prototype.trim !== 'function') {
            String.prototype.trim = function() {
                return this.replace(/^\s+|^\n+|(\s|\n)+$/g, '');
            }
        }
        if(typeof Date.prototype.toISOString !== 'function') {
            // Implementation from http://stackoverflow.com/questions/2573521/how-do-i-output-an-iso-8601-formatted-string-in-javascript
            Date.prototype.toISOString = function() {
                return this.getUTCFullYear()
                    + '-' + pad( this.getUTCMonth() + 1 )
                    + '-' + pad( this.getUTCDate() )
                    + 'T' + pad( this.getUTCHours() )
                    + ':' + pad( this.getUTCMinutes() )
                    + ':' + pad( this.getUTCSeconds() )
                    + '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )
                    + 'Z';
            };
        }
    }

    function getNodeLocalName( node ) {
        var nodeLocalName = node.localName;
        if(nodeLocalName == null) // Yeah, this is IE!!
            nodeLocalName = node.baseName;
        if(nodeLocalName == null || nodeLocalName=="") // =="" is IE too
            nodeLocalName = node.nodeName;
        return nodeLocalName;
    }

    function getNodePrefix(node) {
        return node.prefix;
    }

    function escapeXmlChars(str) {
        if(typeof(str) == "string")
            return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
        else
            return str;
    }

    function unescapeXmlChars(str) {
        return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&#x2F;/g, '\/');
    }

    function toArrayAccessForm(obj, childName, path) {
        switch(config.arrayAccessForm) {
            case "property":
                if(!(obj[childName] instanceof Array))
                    obj[childName+"_asArray"] = [obj[childName]];
                else
                    obj[childName+"_asArray"] = obj[childName];
                break;
            /*case "none":
             break;*/
        }

        if(!(obj[childName] instanceof Array) && config.arrayAccessFormPaths.length > 0) {
            var idx = 0;
            for(; idx < config.arrayAccessFormPaths.length; idx++) {
                var arrayPath = config.arrayAccessFormPaths[idx];
                if( typeof arrayPath === "string" ) {
                    if(arrayPath == path)
                        break;
                }
                else
                if( arrayPath instanceof RegExp) {
                    if(arrayPath.test(path))
                        break;
                }
                else
                if( typeof arrayPath === "function") {
                    if(arrayPath(obj, childName, path))
                        break;
                }
            }
            if(idx!=config.arrayAccessFormPaths.length) {
                obj[childName] = [obj[childName]];
            }
        }
    }

    function fromXmlDateTime(prop) {
        // Implementation based up on http://stackoverflow.com/questions/8178598/xml-datetime-to-javascript-date-object
        // Improved to support full spec and optional parts
        var bits = prop.split(/[-T:+Z]/g);

        var d = new Date(bits[0], bits[1]-1, bits[2]);
        var secondBits = bits[5].split("\.");
        d.setHours(bits[3], bits[4], secondBits[0]);
        if(secondBits.length>1)
            d.setMilliseconds(secondBits[1]);

        // Get supplied time zone offset in minutes
        if(bits[6] && bits[7]) {
            var offsetMinutes = bits[6] * 60 + Number(bits[7]);
            var sign = /\d\d-\d\d:\d\d$/.test(prop)? '-' : '+';

            // Apply the sign
            offsetMinutes = 0 + (sign == '-'? -1 * offsetMinutes : offsetMinutes);

            // Apply offset and local timezone
            d.setMinutes(d.getMinutes() - offsetMinutes - d.getTimezoneOffset())
        }
        else
        if(prop.indexOf("Z", prop.length - 1) !== -1) {
            d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()));
        }

        // d is now a local time equivalent to the supplied time
        return d;
    }

    function checkFromXmlDateTimePaths(value, childName, fullPath) {
        if(config.datetimeAccessFormPaths.length > 0) {
            var path = fullPath.split("\.#")[0];
            var idx = 0;
            for(; idx < config.datetimeAccessFormPaths.length; idx++) {
                var dtPath = config.datetimeAccessFormPaths[idx];
                if( typeof dtPath === "string" ) {
                    if(dtPath == path)
                        break;
                }
                else
                if( dtPath instanceof RegExp) {
                    if(dtPath.test(path))
                        break;
                }
                else
                if( typeof dtPath === "function") {
                    if(dtPath(obj, childName, path))
                        break;
                }
            }
            if(idx!=config.datetimeAccessFormPaths.length) {
                return fromXmlDateTime(value);
            }
            else
                return value;
        }
        else
            return value;
    }

    function parseDOMChildren( node, path ) {
        if(node.nodeType == DOMNodeTypes.DOCUMENT_NODE) {
            var result = new Object;
            var nodeChildren = node.childNodes;
            // Alternative for firstElementChild which is not supported in some environments
            for(var cidx=0; cidx <nodeChildren.length; cidx++) {
                var child = nodeChildren.item(cidx);
                if(child.nodeType == DOMNodeTypes.ELEMENT_NODE) {
                    var childName = getNodeLocalName(child);
                    result[childName] = parseDOMChildren(child, childName);
                }
            }
            return result;
        }
        else
        if(node.nodeType == DOMNodeTypes.ELEMENT_NODE) {
            var result = new Object;
            result.__cnt=0;

            var nodeChildren = node.childNodes;

            // Children nodes
            for(var cidx=0; cidx <nodeChildren.length; cidx++) {
                var child = nodeChildren.item(cidx); // nodeChildren[cidx];
                var childName = getNodeLocalName(child);

                if(child.nodeType!= DOMNodeTypes.COMMENT_NODE) {
                    result.__cnt++;
                    if(result[childName] == null) {
                        result[childName] = parseDOMChildren(child, path+"."+childName);
                        toArrayAccessForm(result, childName, path+"."+childName);
                    }
                    else {
                        if(result[childName] != null) {
                            if( !(result[childName] instanceof Array)) {
                                result[childName] = [result[childName]];
                                toArrayAccessForm(result, childName, path+"."+childName);
                            }
                        }
                        (result[childName])[result[childName].length] = parseDOMChildren(child, path+"."+childName);
                    }
                }
            }

            // Attributes
            for(var aidx=0; aidx <node.attributes.length; aidx++) {
                var attr = node.attributes.item(aidx); // [aidx];
                result.__cnt++;
                result[config.attributePrefix+attr.name]=attr.value;
            }

            // Node namespace prefix
            var nodePrefix = getNodePrefix(node);
            if(nodePrefix!=null && nodePrefix!="") {
                result.__cnt++;
                result.__prefix=nodePrefix;
            }

            if(result["#text"]!=null) {
                result.__text = result["#text"];
                if(result.__text instanceof Array) {
                    result.__text = result.__text.join("\n");
                }
                if(config.escapeMode)
                    result.__text = unescapeXmlChars(result.__text);
                if(config.stripWhitespaces)
                    result.__text = result.__text.trim();
                delete result["#text"];
                if(config.arrayAccessForm=="property")
                    delete result["#text_asArray"];
                result.__text = checkFromXmlDateTimePaths(result.__text, childName, path+"."+childName);
            }
            if(result["#cdata-section"]!=null) {
                result.__cdata = result["#cdata-section"];
                delete result["#cdata-section"];
                if(config.arrayAccessForm=="property")
                    delete result["#cdata-section_asArray"];
            }

            if( result.__cnt == 1 && result.__text!=null  ) {
                result = result.__text;
            }
            else
            if( result.__cnt == 0 && config.emptyNodeForm=="text" ) {
                result = '';
            }
            else
            if ( result.__cnt > 1 && result.__text!=null && config.skipEmptyTextNodesForObj) {
                if( (config.stripWhitespaces && result.__text=="") || (result.__text.trim()=="")) {
                    delete result.__text;
                }
            }
            delete result.__cnt;

            if( config.enableToStringFunc && (result.__text!=null || result.__cdata!=null )) {
                result.toString = function() {
                    return (this.__text!=null? this.__text:'')+( this.__cdata!=null ? this.__cdata:'');
                };
            }

            return result;
        }
        else
        if(node.nodeType == DOMNodeTypes.TEXT_NODE || node.nodeType == DOMNodeTypes.CDATA_SECTION_NODE) {
            return node.nodeValue;
        }
    }

    function startTag(jsonObj, element, attrList, closed) {
        var resultStr = "<"+ ( (jsonObj!=null && jsonObj.__prefix!=null)? (jsonObj.__prefix+":"):"") + element;
        if(attrList!=null) {
            for(var aidx = 0; aidx < attrList.length; aidx++) {
                var attrName = attrList[aidx];
                var attrVal = jsonObj[attrName];
                if(config.escapeMode)
                    attrVal=escapeXmlChars(attrVal);
                resultStr+=" "+attrName.substr(config.attributePrefix.length)+"='"+attrVal+"'";
            }
        }
        if(!closed)
            resultStr+=">";
        else
            resultStr+="/>";
        return resultStr;
    }

    function endTag(jsonObj,elementName) {
        return "</"+ (jsonObj.__prefix!=null? (jsonObj.__prefix+":"):"")+elementName+">";
    }

    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    function jsonXmlSpecialElem ( jsonObj, jsonObjField ) {
        if((config.arrayAccessForm=="property" && endsWith(jsonObjField.toString(),("_asArray")))
            || jsonObjField.toString().indexOf(config.attributePrefix)==0
            || jsonObjField.toString().indexOf("__")==0
            || (jsonObj[jsonObjField] instanceof Function) )
            return true;
        else
            return false;
    }

    function jsonXmlElemCount ( jsonObj ) {
        var elementsCnt = 0;
        if(jsonObj instanceof Object ) {
            for( var it in jsonObj  ) {
                if(jsonXmlSpecialElem ( jsonObj, it) )
                    continue;
                elementsCnt++;
            }
        }
        return elementsCnt;
    }

    function parseJSONAttributes ( jsonObj ) {
        var attrList = [];
        if(jsonObj instanceof Object ) {
            for( var ait in jsonObj  ) {
                if(ait.toString().indexOf("__")== -1 && ait.toString().indexOf(config.attributePrefix)==0) {
                    attrList.push(ait);
                }
            }
        }
        return attrList;
    }

    function parseJSONTextAttrs ( jsonTxtObj ) {
        var result ="";

        if(jsonTxtObj.__cdata!=null) {
            result+="<![CDATA["+jsonTxtObj.__cdata+"]]>";
        }

        if(jsonTxtObj.__text!=null) {
            if(config.escapeMode)
                result+=escapeXmlChars(jsonTxtObj.__text);
            else
                result+=jsonTxtObj.__text;
        }
        return result;
    }

    function parseJSONTextObject ( jsonTxtObj ) {
        var result ="";

        if( jsonTxtObj instanceof Object ) {
            result+=parseJSONTextAttrs ( jsonTxtObj );
        }
        else
        if(jsonTxtObj!=null) {
            if(config.escapeMode)
                result+=escapeXmlChars(jsonTxtObj);
            else
                result+=jsonTxtObj;
        }

        return result;
    }

    function parseJSONArray ( jsonArrRoot, jsonArrObj, attrList ) {
        var result = "";
        if(jsonArrRoot.length == 0) {
            result+=startTag(jsonArrRoot, jsonArrObj, attrList, true);
        }
        else {
            for(var arIdx = 0; arIdx < jsonArrRoot.length; arIdx++) {
                result+=startTag(jsonArrRoot[arIdx], jsonArrObj, parseJSONAttributes(jsonArrRoot[arIdx]), false);
                result+=parseJSONObject(jsonArrRoot[arIdx]);
                result+=endTag(jsonArrRoot[arIdx],jsonArrObj);
            }
        }
        return result;
    }

    function parseJSONObject ( jsonObj ) {
        var result = "";

        var elementsCnt = jsonXmlElemCount ( jsonObj );

        if(elementsCnt > 0) {
            for( var it in jsonObj ) {

                if(jsonXmlSpecialElem ( jsonObj, it) )
                    continue;

                var subObj = jsonObj[it];

                var attrList = parseJSONAttributes( subObj )

                if(subObj == null || subObj == undefined) {
                    result+=startTag(subObj, it, attrList, true);
                }
                else
                if(subObj instanceof Object) {

                    if(subObj instanceof Array) {
                        result+=parseJSONArray( subObj, it, attrList );
                    }
                    else if(subObj instanceof Date) {
                        result+=startTag(subObj, it, attrList, false);
                        result+=subObj.toISOString();
                        result+=endTag(subObj,it);
                    }
                    else {
                        var subObjElementsCnt = jsonXmlElemCount ( subObj );
                        if(subObjElementsCnt > 0 || subObj.__text!=null || subObj.__cdata!=null) {
                            result+=startTag(subObj, it, attrList, false);
                            result+=parseJSONObject(subObj);
                            result+=endTag(subObj,it);
                        }
                        else {
                            result+=startTag(subObj, it, attrList, true);
                        }
                    }
                }
                else {
                    result+=startTag(subObj, it, attrList, false);
                    result+=parseJSONTextObject(subObj);
                    result+=endTag(subObj,it);
                }
            }
        }
        result+=parseJSONTextObject(jsonObj);

        return result;
    }

    this.parseXmlString = function(xmlDocStr) {
        var isIEParser = window.ActiveXObject || "ActiveXObject" in window;
        if (xmlDocStr === undefined) {
            return null;
        }
        var xmlDoc;
        if (window.DOMParser) {
            var parser=new window.DOMParser();
            var parsererrorNS = null;
            // IE9+ now is here
            if(!isIEParser) {
                try {
                    parsererrorNS = parser.parseFromString("INVALID", "text/xml").childNodes[0].namespaceURI;
                }
                catch(err) {
                    parsererrorNS = null;
                }
            }
            try {
                xmlDoc = parser.parseFromString( xmlDocStr, "text/xml" );
                if( parsererrorNS!= null && xmlDoc.getElementsByTagNameNS(parsererrorNS, "parsererror").length > 0) {
                    //throw new Error('Error parsing XML: '+xmlDocStr);
                    xmlDoc = null;
                }
            }
            catch(err) {
                xmlDoc = null;
            }
        }
        else {
            // IE :(
            if(xmlDocStr.indexOf("<?")==0) {
                xmlDocStr = xmlDocStr.substr( xmlDocStr.indexOf("?>") + 2 );
            }
            xmlDoc=new ActiveXObject("Microsoft.XMLDOM");
            xmlDoc.async="false";
            xmlDoc.loadXML(xmlDocStr);
        }
        return xmlDoc;
    };

    this.asArray = function(prop) {
        if(prop instanceof Array)
            return prop;
        else
            return [prop];
    };

    this.toXmlDateTime = function(dt) {
        if(dt instanceof Date)
            return dt.toISOString();
        else
        if(typeof(dt) === 'number' )
            return new Date(dt).toISOString();
        else
            return null;
    };

    this.asDateTime = function(prop) {
        if(typeof(prop) == "string") {
            return fromXmlDateTime(prop);
        }
        else
            return prop;
    };

    this.xml2json = function (xmlDoc) {
        return parseDOMChildren ( xmlDoc );
    };

    this.xml_str2json = function (xmlDocStr) {
        var xmlDoc = this.parseXmlString(xmlDocStr);
        if(xmlDoc!=null)
            return this.xml2json(xmlDoc);
        else
            return null;
    };

    this.json2xml_str = function (jsonObj) {
        return parseJSONObject ( jsonObj );
    };

    this.json2xml = function (jsonObj) {
        var xmlDocStr = this.json2xml_str (jsonObj);
        return this.parseXmlString(xmlDocStr);
    };

    this.getVersion = function () {
        return VERSION;
    };

}
