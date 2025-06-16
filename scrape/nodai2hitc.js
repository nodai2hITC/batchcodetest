"use strict";

BatchCodeTest.scrapes.push({
    check: (html) => html.includes("OnBrowserJudge"),

    scrape: function(html) {
        const inputs  = Array.from(html.matchAll(/<h2>入力例 *\d+<\/h2>\s*<pre[^>]*>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
        const outputs = Array.from(html.matchAll(/<h2>出力例 *\d+<\/h2>\s*<pre[^>]*>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
        let input = undefined;
        const matched1 = html.match(/<h2>\s*入力\s*<\/h2>\s*<p>入力は[^<]*<\/p>\s*<div class="io_format">(.+?)<\/div>/s)
        if (matched1) {
            input = matched1[1].replaceAll(/<[^>]*>/g, " ").replaceAll(/  +/g, " ").replaceAll(/ \n/g, "\n").replaceAll(/\n /g, "\n").replaceAll(/\\[\(\)]/g, "")
        }
        let constraints = undefined;
        const matched2 = html.match(/<h2>\s*制約\s*<\/h2>\s*<ul>(.+?)<\/ul>/s)
        if (matched2) {
            constraints = matched2[1].replaceAll(/<\/?code[^>]*>/g, "`").replaceAll(/<[^>]*>/g, "").replaceAll(/\\[\(\)]/g, "")
        }
        return [inputs, outputs, input, constraints];
    }
})
