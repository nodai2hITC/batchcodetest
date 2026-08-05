"use strict";

BatchCodeTest.scrapes.push({
    check: (html) => html.includes("mailto:joi@ioi-jp.org"),

    scrape: function(html) {
        const inputs1  = Array.from(html.matchAll(/<b>入力例 *\d+<\/b><br>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", "").replaceAll(/ *&nbsp; */g, " "));
        const outputs1 = Array.from(html.matchAll(/<b>出力例 *\d+<\/b><br>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", "").replaceAll(/ *&nbsp; */g, " "));
        const inputs2  = Array.from(html.matchAll(/<h2[^>]*>\s*入力例 *\d+<\/h2>\s*<p[^>]*>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", "").replaceAll(/ *&nbsp; */g, " "));
        const outputs2 = Array.from(html.matchAll(/<h2[^>]*>\s*出力例 *\d+<\/h2>\s*<p[^>]*>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", "").replaceAll(/ *&nbsp; */g, " "));
        let input = undefined;
        const matched1 = html.match(/<h2[^>]*>\s*入力\s*<\/h2>\s*<p[^>]*>\s*入力は[^<]*(?:<br>|<\/p>\s*<p[^>]*>)\s*(.+?)<\/p>/s)
        if (matched1) {
            input = matched1[1].replaceAll(/(?:<var>)?[:︙](?:<\/var>)?/g, "\\vdots").replaceAll(/<sub>/g, "_{").replaceAll(/<\/sub>/g, "}").replaceAll(/<[^>]*>/g, "").replaceAll(/&nbsp;/g, " ").replaceAll(/  +/g, " ").replaceAll(/ \n/g, "\n").replaceAll(/\n /g, "\n").replaceAll(/…/g, "\\dots")
        }
        let constraints = undefined;
        const matched2 = html.match(/<h2[^>]*>\s*制約\s*<\/h2>\s*<ul[^>]*>(.+?)<\/ul>/s)
        if (matched2) {
            constraints = matched2[1].replaceAll(/<\/?code[^>]*>/g, "`").replaceAll(/<[^>]*>/g, "").replaceAll(/\\[\(\)]/g, "")
        }
        return [inputs1.concat(inputs2), outputs1.concat(outputs2), input, constraints];
    }
})
