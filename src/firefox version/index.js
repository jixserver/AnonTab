let { Cc, Ci } = require("chrome");
var buttons = require('sdk/ui/button/action');
var contextMenu = require('sdk/context-menu');
var data = require('sdk/self').data;
var tabs = require('sdk/tabs');
var pageURI = '../main.html';

var button = buttons.ActionButton({
    id: 'anontab',
    label: 'AnonTab',
    icon: {
        '16': './images/icon_16.png',
        '32': './images/icon_32.png',
        '64': './images/icon_64.png',
    },
    onClick: function() {
        tabs.open(data.url(pageURI));
    },
});

var menuItem = contextMenu.Item({
    label: 'Open Link in AnonTab',
    context: contextMenu.SelectorContext('a'),
    contentScript: "self.on('click', function(node) {" +
                   'self.postMessage(node.href);' +
                   '})',
    onMessage: function(href) {
        tabs.open({
            url: data.url(pageURI),
            onReady: function(tab) {
                var worker = tab.attach({
                    contentScript: "document.getElementById('navbar').value='" +
                        href + "'; document.getElementById('go').click()",
                });
                worker.port.emit("alert", "Message from the add-on");
            },
        });
    },
});

/**
 * Safely parse an HTML fragment, removing any executable
 * JavaScript, and return a document fragment.
 *
 * @param {Document} doc The document in which to create the
 *     returned DOM tree.
 * @param {string} html The HTML fragment to parse.
 * @param {boolean} allowStyle If true, allow <style> nodes and
 *     style attributes in the parsed fragment. Gecko 14+ only.
 * @param {nsIURI} baseURI The base URI relative to which resource
 *     URLs should be processed. Note that this will not work for
 *     XML fragments.
 * @param {boolean} isXML If true, parse the fragment as XML.
 */
function parseHTML(doc, html, allowStyle, baseURI, isXML) {
    let PARSER_UTILS = "@mozilla.org/parserutils;1";

    // User the newer nsIParserUtils on versions that support it.
    if (PARSER_UTILS in Cc) {
        let parser = Cc[PARSER_UTILS]
                               .getService(Ci.nsIParserUtils);
        if ("parseFragment" in parser)
            return parser.parseFragment(html, allowStyle ? parser.SanitizerAllowStyle : 0,
                                        !!isXML, baseURI, doc.documentElement);
    }

    return Cc["@mozilla.org/feed-unescapehtml;1"]
                     .getService(Ci.nsIScriptableUnescapeHTML)
                     .parseFragment(html, !!isXML, baseURI, doc.documentElement);
}

