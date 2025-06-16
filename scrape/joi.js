"use strict";

BatchCodeTest.scrapes.push({
    check: (html) => html.includes("mailto:joi@ioi-jp.org"),

    scrape: function(html) {
        const inputs1  = Array.from(html.matchAll(/<b>入力例 *\d+<\/b><br>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", ""));
        const outputs1 = Array.from(html.matchAll(/<b>出力例 *\d+<\/b><br>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", ""));
        const inputs2  = Array.from(html.matchAll(/<h2[^>]*>\s*入力例 *\d+<\/h2>\s*<p[^>]*>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", ""));
        const outputs2 = Array.from(html.matchAll(/<h2[^>]*>\s*出力例 *\d+<\/h2>\s*<p[^>]*>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", ""));
        let input = undefined;
        const matched1 = html.match(/<h2[^>]*>\s*入力\s*<\/h2>\s*<p[^>]*>\s*入力は[^<]*<br>\s*(.+?)<\/p>/s)
        if (matched1) {
            input = matched1[1].replaceAll(/<var>[:︙]<\/var>/g, "\\vdots").replaceAll(/<sub>/g, "_{").replaceAll(/<\/sub>/g, "}").replaceAll(/<[^>]*>/g, " ").replaceAll(/  +/g, " ").replaceAll(/ \n/g, "\n").replaceAll(/\n /g, "\n").replaceAll(/…/g, "\\dots").replaceAll(/&nbsp;/g, " ")
        }
        let constraints = undefined;
        const matched2 = html.match(/<h2[^>]*>\s*制約\s*<\/h2>\s*<ul[^>]*>(.+?)<\/ul>/s)
        if (matched2) {
            constraints = matched2[1].replaceAll(/<\/?code[^>]*>/g, "`").replaceAll(/<[^>]*>/g, "").replaceAll(/\\[\(\)]/g, "")
        }
        return [inputs1.concat(inputs2), outputs1.concat(outputs2), input, constraints];
    }
})
