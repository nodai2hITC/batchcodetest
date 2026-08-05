"use strict";

BatchCodeTest.scrapes.push({
    check: (html) => html.includes("yukicoder</title>"),

    scrape: function(html) {
        const inputs  = Array.from(html.matchAll(/<h6>入力<\/h6>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
        const outputs = Array.from(html.matchAll(/<h6>出力<\/h6>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
        let input = undefined;
        const matched1 = html.match(/入力<\/h4>\s*<p>入力は.*\s*<pre>([\s\S]*?)<\/pre>/)
        if (matched1) {
            input = matched1[1].replaceAll("$", "").replaceAll(/  +/g, " ").replaceAll(/ \n/g, "\n").replaceAll(/\n /g, "\n").replaceAll(/(\S+)\\/g, "$1")
        }
        let constraints = "";
        const matched2 = html.match(/制約<\/h4>.*?<ul>(.+?)<\/ul>/s)
        if (matched2) {
            constraints = matched2[1].replaceAll(/<\/?code[^>]*>/g, "`").replaceAll(/<[^>]*>/g, "").replaceAll("$", "").replaceAll(/^ +/g, "")
        }
        return [inputs, outputs, input, constraints]
    }
})
