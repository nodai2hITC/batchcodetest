"use strict";

window.addEventListener("DOMContentLoaded", event => {
  document.getElementById("scraping").onclick = function() {
    const html = document.getElementById("atcoder_html").value;
    const inputs  = Array.from(html.matchAll(/<h3>入力例 *\d+<\/h3>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
    const outputs = Array.from(html.matchAll(/<h3>出力例 *\d+<\/h3>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
    for (let i = 0; i < inputs.length; i++) {
      if (! outputs[i]) break;
      BatchCodeTest.addTestCase(inputs[i], outputs[i]);
    }
    document.getElementById("atcoder").style.display = "none";
  }
});
