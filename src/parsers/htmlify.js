parsers.htmlify = (function () {
    function htmlify($text) {
        var tlnk = []; //Create an array to hold the potential links
        var hlnk = []; //Create an array to hold the HTML translation

        var ac, htm;

        // First, translate special characters to HTML
        $text = specialCharsToHtml($text);

        // Loop through the clear text
        var i = 0;
        for (i = 0; i < 4; i++) // Set ;i<20; to a reasonable limit here
        {
            // Get a potential link and mark where it came from
            $text = $text.replace(/(\S+\.\S+)/, '<' + i + '>'); // look for dots that are surrounded by non-whitespace characters
            tlnk[i] = RegExp.$1;
        } // EOLoop
        ac = i;

        //?** too many loops - need a break **
        // Loop through the array of potential links and make replacements
        for (i = 0; i < ac; i++) {
            // If this is a number, (e.g. 6.4sec; $5.00 etc.) OR too short; restore original and skip it
            if (tlnk[i].search(/\d\.\d/) > -1 || tlnk[i].length < 5) // Search for digit.digit OR len < 5 in this potential link
            {
                $text = $text.replace('<' + i + '>', tlnk[i]);
            }
            else {
                // Make this URL into a real link - move brackets and punctuation outside of the anchor tag
                htm = linkify(tlnk[i]);
                $text = $text.replace('<' + i + '>', htm);
            }
        }

        // Now put the breaks on
        $text = $text.replace(/\n/g, '<br/>');
        // And deal with multiple spaces
        $text = $text.replace(/\ \ /g, ' &nbsp;');
//            $text = $text.replace(/\s+/g, ' &nbsp;');
        // And any other specials
        $text = $text.replace(/"/g, '&quot;');
        $text = $text.replace(/\$/g, '&#36;');

        return $text;
    }

    function linkify(txt) // Make a real link from this potential link
    {
        txt = htmlToSpecialChars(txt); // Undo any html special characters in this link
        var i = 0, pN, ch, prea, posta, turl, tlnk, hurl;

        // Clean the front end
        pN = txt.length - 1;
        for (i = 0; i < pN; i++) {
            ch = txt.substr(i, 1); // Look at each character
            if (ch.search(/\w/) > -1) {
                break;
            } // Stop looping when a word char is found
        }
        prea = txt.substring(0, i); // Copy the pre anchor stuff
        prea = specialCharsToHtml(prea); // Redo any html special characters in this link
        txt = txt.substr(i); // Trim the preamble from the link

        // Clean the trailing end
        for (i = pN; i > 0; i--) {
            ch = txt.substr(i, 1); // Look back at each character
            if (ch.search(/\w|_|-|\//) > -1) {
                break;
            } // Loop until a legal trailing char is found
        }
        posta = txt.substring(i + 1); // Copy the post anchor stuff
        posta = specialCharsToHtml(posta); // Redo any html angle bracket codes in this link

        turl = txt.substring(0, i + 1); // and detach it from the rest - this is the legit URL

        // If the URL is an email address, link as a mailto:
        if (turl.search(/@/) > 0) {
            tlnk = '<a href="mailto:' + turl + '">' + turl + '</a>';
            return prea + tlnk + posta;
        }
        // Not a mailto, treat as a document URL
        hurl = '';
        if (turl.search(/\w+:\/\//) < 0) {
            hurl = 'http://';
        } // Add http:// if no xxxx:// already there
        tlnk = '<a href="' + hurl + turl + '">' + turl + '</a>';
        return prea + tlnk + posta;
    }

    function specialCharsToHtml(str) {
        str = str.replace(/&/g, '&amp;');
        str = str.replace(/</g, '&lt;'); // Convert angle brackets to HTML codes in string
        str = str.replace(/>/g, '&gt;');
        return str;
    }

    function htmlToSpecialChars(str) {
        str = str.replace(/&lt;/g, '<'); // Undo any angle bracket codes in this link
        str = str.replace(/&gt;/g, '>');
        str = str.replace(/&amp;/g, '&');
        return str;
    }

    return htmlify;
})()