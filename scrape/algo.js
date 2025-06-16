"use strict";

BatchCodeTest.scrapes.push({
    check: (html) => html.includes("アルゴ式</title>"),

    scrape: function(html) {
        const inputs  = Array.from(html.matchAll(/入力例 \d+\\r\\n```IOExample\\r\\n(.*?)\\r\\n```/gis), m => m[1].replaceAll("\\r\\n", "\n"));
        const outputs = Array.from(html.matchAll(/出力例 \d+\\r\\n```IOExample\\r\\n(.*?)\\r\\n```/gis), m => m[1].replaceAll("\\r\\n", "\n"));
        return [inputs, outputs];
    }
})
