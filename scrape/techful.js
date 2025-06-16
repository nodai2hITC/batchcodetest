"use strict";

BatchCodeTest.scrapes.push({
    check: (html) => html.includes("TechFUL"),

    scrape: function(html) {
        const ios = Array.from(html.matchAll(/>サンプルケース \d+<\/h4>(.+?<h5>期待される出力値<\/h5>.+?)<\/div><\/button><\/div><\/div>/gis), m => m[1]);
        const inputs  = ios.map((s) => { const m = s.match(/<h5>入力値<\/h5>.+?<code>(.+?)<\/code>/is); return m[1] });
        const outputs = ios.map((s) => { const m = s.match(/<h5>期待される出力値<\/h5>.+?<code>(.+?)<\/code>/is); return m[1] });
        return [inputs, outputs];
    }
})
