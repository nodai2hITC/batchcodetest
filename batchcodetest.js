"use strict";

const BatchCodeTest = {
  worker: null,
  timer: null,
  currentTestCase: 0,
  testCases: [],


  workerEvent: function(e) {
    switch(e.data[0]){
      case "init":
        this.setRunButton("▶実行 (Ctrl+Enter)", this.run);
        break;
      case "result":
        clearTimeout(this.timer);
        const result = e.data[1];
        this.judge(result.caseName, result.output, result.execTime);
        this.nextTest();
        break;
    }
  },

  newWorkerViaBlob: function(relativePath) {
    const baseURL = window.location.href.replaceAll("\\", "/").replace(/\/[^\/]*$/, "/");
    const array = [`importScripts("${baseURL}${relativePath}");`];
    const blob = new Blob(array, { type: "text/javascript" });
    const url = window.URL.createObjectURL(blob);
    return new Worker(url);
  },

  resetWorker: function() {
    if (this.worker) this.worker.terminate();
    this.worker = this.newWorkerViaBlob(workerFile);
    this.worker.addEventListener("message", (event) => { this.workerEvent(event) }, false);
  },


  resizeObserver: new ResizeObserver((entries) => {
    for (const entry of entries) {
      const matched = entry.target.id.match(/^testcase\d+_/);
      if (!matched) continue;
      const height = entry.target.style.height;
      document.getElementById(matched[0] + "input" ).style.height = height;
      document.getElementById(matched[0] + "output").style.height = height;
      document.getElementById(matched[0] + "result").style.height = height;
    }
  }),

  addTestCase: function(input, output) {
    const i = this.testCaseLength() + 1;
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>
      入力例${i}<br />
      <textarea id="testcase${i}_input" class="input"></textarea>
    </td>
    <td>
      出力例${i}<br />
      <textarea id="testcase${i}_output" class="output"></textarea>
    </td>
    <td>実際の結果${i} <span id="testcase${i}_time"></span><br />
      <textarea id="testcase${i}_result" class="result" readonly></textarea>
    </td>
    `.trim();
    document.getElementById("testcases").appendChild(tr);
    document.getElementById(`testcase${i}_input` ).value =  input;
    document.getElementById(`testcase${i}_output`).value = output;

    this.resizeObserver.observe(document.getElementById(`testcase${i}_input`));
    this.resizeObserver.observe(document.getElementById(`testcase${i}_output`));
    this.resizeObserver.observe(document.getElementById(`testcase${i}_result`));
  },

  scrape: function(html) {
    this.clearTestCases();
    // https://atcoder.jp/
    const inputs1  = Array.from(html.matchAll(/<h3>入力例 *\d+<\/h3>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
    const outputs1 = Array.from(html.matchAll(/<h3>出力例 *\d+<\/h3>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
    // https://yukicoder.me/
    const inputs2  = Array.from(html.matchAll(/<h6>入力<\/h6>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
    const outputs2 = Array.from(html.matchAll(/<h6>出力<\/h6>\s*<pre>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
    // https://nodai2hitc.github.io/problems/
    const inputs3  = Array.from(html.matchAll(/<h2>入力例 *\d+<\/h2>\s*<pre[^>]*>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
    const outputs3 = Array.from(html.matchAll(/<h2>出力例 *\d+<\/h2>\s*<pre[^>]*>\s*(.+?)\s*<\/pre>/gis), m => m[1]);
    // https://www2.ioi-jp.org/joi/2020/2021-yo1/index.html
    const inputs4  = Array.from(html.matchAll(/<b>入力例 *\d+<\/b><br>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", ""));
    const outputs4 = Array.from(html.matchAll(/<b>出力例 *\d+<\/b><br>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", ""));
    // https://techful-programming.com/
    const ios5 = Array.from(html.matchAll(/>サンプルケース \d+<\/h4>(.+?<h5>期待される出力値<\/h5>.+?)<\/div><\/button><\/div><\/div>/gis), m => m[1]);
    const inputs5  = ios5.map((s) => { const m = s.match(/<h5>入力値<\/h5>.+?<code>(.+?)<\/code>/is); return m[1] });
    const outputs5 = ios5.map((s) => { const m = s.match(/<h5>期待される出力値<\/h5>.+?<code>(.+?)<\/code>/is); return m[1] });
    // https://algo-method.com/
    const inputs6  = Array.from(html.matchAll(/入力例 \d+\\r\\n```IOExample\\r\\n(.*?)\\r\\n```/gis), m => m[1].replaceAll("\\r\\n", "\n"));
    const outputs6 = Array.from(html.matchAll(/出力例 \d+\\r\\n```IOExample\\r\\n(.*?)\\r\\n```/gis), m => m[1].replaceAll("\\r\\n", "\n"));
    // https://www2.ioi-jp.org/joi/2022/2023-yo1/index.html
    const inputs7  = Array.from(html.matchAll(/<h2[^>]*>\s*入力例 *\d+<\/h2>\s*<p[^>]*>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", ""));
    const outputs7 = Array.from(html.matchAll(/<h2[^>]*>\s*出力例 *\d+<\/h2>\s*<p[^>]*>\s*(.+?)\s*<\/p>/gis), m => m[1].replaceAll("<br>", ""));

    const inputs  =  inputs1.concat( inputs2).concat( inputs3).concat( inputs4).concat( inputs5).concat( inputs6).concat( inputs7);
    const outputs = outputs1.concat(outputs2).concat(outputs3).concat(outputs4).concat(outputs5).concat(outputs6).concat(outputs7);
    for (let i = 0; i < inputs.length; i++) {
      if (! outputs[i]) break;
      this.addTestCase(inputs[i], outputs[i]);
    }
    if (this.testCaseLength() == 0) this.addTestCase("", "");
  },

  clearTestCases: function() {
    const textareas = document.getElementsByTagName("textarea");
    for (const textarea of textareas) {
      if (!textarea.id.match(/^testcase\d+_/)) continue;
      this.resizeObserver.unobserve(textarea);
    }
    document.getElementById("testcases").innerHTML = "";
  },


  run: function() {
    if (document.getElementById("run").disabled) return;
    this.setRunButton("■停止", this.stop);
    if (document.getElementById("autocopy").checked) this.copyProgram();
    this.initializeResult();

    this.currentTestCase = 0;
    this.testCases = [];
    const max = this.testCaseLength();
    for (let i = 1; i <= max; i++) {
      const test = {
        caseName: `testcase${i}`,
        program: Editor.getProgram(),
        input: document.getElementById(`testcase${i}_input`).value
      };
      this.testCases.push(test);
    }
    this.nextTest();
  },

  initializeResult: function() {
    let i = 1;
    while (document.getElementById(`testcase${i}_result`)) {
      document.getElementById(`testcase${i}_result`).value = "";
      document.getElementById(`testcase${i}_result`).style.backgroundColor = "";
      document.getElementById(`testcase${i}_time`).innerText = "";
      i++;
    }
  },

  nextTest: function() {
    const testCase = this.testCases[this.currentTestCase];
    this.currentTestCase++;
    if (this.currentTestCase > this.testCases.length) {
      this.setRunButton("▶実行 (Ctrl+Enter)", this.run);
      return;
    }
    this.worker.postMessage(["test", testCase]);
    const time = parseInt(document.getElementById("time").value) * 1000;
    this.timer = setTimeout(() => { this.timeLimit(); }, time);
  },

  judge: function(caseName, output, execTime) {
    const expected = document.getElementById(`${caseName}_output`).value.trim();
    const ac = expected == output.trimEnd();
    const result = document.getElementById(`${caseName}_result`);
    if (! result) return;
    result.value = output;
    result.style.backgroundColor = ac ? "#ccffcc" : "#ffcccc";
    if (output.indexOf("Error") != -1) result.scrollTop = result.scrollHeight;
    document.getElementById(`${caseName}_time`).innerText = `- ${execTime.toFixed(0)} ms`;
  },

  timeLimit: function() {
    const result = document.getElementById(`testcase${this.currentTestCase}_result`);
    if (! result) return;
    result.value = "【TLE】\n実行時間以内にプログラムが終了しませんでした。";
    result.style.backgroundColor = "#ffcccc";
    clearTimeout(this.timer);
    this.stop();
  },

  stop: function() {
    this.setRunButton("準備中");
    this.resetWorker();
  },


  save: function() {
    const max = this.testCaseLength();
    let io = [];
    for (let i = 1; i <= max; i++) {
      io.push(document.getElementById(`testcase${i}_input`).value);
      io.push(document.getElementById(`testcase${i}_output`).value);
    }
    localStorage.setItem("io", JSON.stringify(io));
    localStorage.setItem("time", document.getElementById("time").value.toString());
    localStorage.setItem("program", Editor.getProgram());
  },

  load: function() {
    const io_str  = localStorage.getItem("io");
    const time    = localStorage.getItem("time");
    const program = localStorage.getItem("program");
    if (program) Editor.setProgram(program);
    if (time) document.getElementById("time").value = time;
    if (io_str) {
      const io = JSON.parse(io_str);
      if (io.length % 2 == 1) return;
      this.clearTestCases();
      while (io.length > 0) {
        const input = io.shift();
        const output = io.shift();
        this.addTestCase(input, output);
      }
    }
  },


  copyProgram: function() {
    navigator.clipboard.writeText(Editor.getProgram());
  },

  testCaseLength: function() {
    let i = 1;
    while (document.getElementById(`testcase${i}_input`)) i++;
    return i - 1;
  },

  setRunButton: function(text, func = null) {
    const runButton = document.getElementById("run");
    runButton.innerText = text;
    if (! func) {
      runButton.disabled = true;
      runButton.onclick = () => {};
    } else {
      runButton.disabled = false;
      runButton.onclick = () => { func.call(this); };
    }
  },


  init: function() {
    document.getElementById("add_testcase").onclick = () => { this.addTestCase("", ""); };
    document.getElementById("scrape_testcases").onclick = () => {
      document.getElementById("html").value = "";
      MicroModal.show("modal-1");
    };
    document.getElementById("scrape").onclick = () => {
      this.scrape(document.getElementById("html").value);
      MicroModal.close("modal-1");
    };
    MicroModal.init();
    document.getElementById("clear_testcases").onclick = () => {
      this.clearTestCases();
      this.addTestCase("", "");
    };

    this.setRunButton("準備中");

    document.getElementById("clear").onclick = () => { Editor.clear(); };

    const snipets = document.getElementsByClassName("snipet");
    for (let snipet of snipets) {
      snipet.onclick = function() { Editor.insert(this.innerText + "\n"); };
    };

    this.load();
    if (this.testCaseLength() == 0) this.addTestCase("", "");
    setInterval(() => { this.save() }, 5000);
  }
};

window.addEventListener("DOMContentLoaded", function() { BatchCodeTest.init(); });
BatchCodeTest.resetWorker();
