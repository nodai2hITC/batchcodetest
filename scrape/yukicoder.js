"use strict";

BatchCodeTest.scrapes.push({
    check: (html) => html.includes("yukicoder</title>"),

    scrape: function(html) {
        const inputs  = Array.from(html.matchAll(/<h6>入力<\/h6>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
        const outputs = Array.from(html.matchAll(/<h6>出力<\/h6>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
        return [inputs, outputs];
    }
})
