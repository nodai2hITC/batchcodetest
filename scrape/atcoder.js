"use strict";

BatchCodeTest.scrapes.push({
    check: (html) => html.includes("AtCoder Inc."),

    scrape: function(html) {
        const inputs  = Array.from(html.matchAll(/<h3>入力例 *\d+<\/h3>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
        const outputs = Array.from(html.matchAll(/<h3>出力例 *\d+<\/h3>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
        let input = undefined;
        const matched1 = html.match(/<h3>入力<\/h3>\s*<p>入力は以下の形式で標準入力から与えられる[^<]*<\/p>\s*<pre>(.+?)<\/pre>/s)
        if (matched1) {
            input = matched1[1].replaceAll(/<[^>]*>/g, " ").replaceAll(/  +/g, " ").replaceAll(/ \n/g, "\n").replaceAll(/\n /g, "\n");
        }
        let constraints = undefined;
        const matched2 = html.match(/<h3>制約<\/h3>\s*<ul>(.+?)<\/ul>/s)
        if (matched2) {
            constraints = matched2[1].replaceAll(/<\/?code[^>]*>/g, "`").replaceAll(/<[^>]*>/g, "")
        }
        return [inputs, outputs, input, constraints]
    }
})
