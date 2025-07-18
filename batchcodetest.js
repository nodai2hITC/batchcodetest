"use strict";

const BatchCodeTest = {
  worker: null,
  timer: null,
  currentTestCase: 0,
  testCases: [],
  words: {
    "▶Run": "▶Run (Ctrl+Enter)",
    "Input ": "Input ",
    "Output ": "Output ",
    "Result ": "Result ",
    "■Stop": "■Stop",
    "【TLE】": "【TLE】\nThe program did not finish within the set time.",
    "in preparation": "in preparation"
  },
  scrapes: [],
  make_input: undefined,


  workerEvent: function(e) {
    switch(e.data[0]){
      case "init":
        this.setRunButton(this.words["▶Run"], this.run);
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
      ${this.words["Input "]}${i}<br />
      <textarea id="testcase${i}_input" class="input"></textarea>
    </td>
    <td>
    ${this.words["Output "]}${i}<br />
      <textarea id="testcase${i}_output" class="output"></textarea>
    </td>
    <td>${this.words["Result "]}${i} <span id="testcase${i}_time"></span><br />
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
    let inputs = [], outputs = [], input = undefined, constraints = undefined;
    for (const i of this.scrapes) {
      if (i.check(html)) [inputs, outputs, input, constraints] = i.scrape(html);
      if (input) input = input.replaceAll(/^\s+/mg, "").replaceAll(/\s+$/mg, "")
      if (constraints) constraints = constraints.replaceAll(/^\s+/mg, "").replaceAll(/\s+$/mg, "")
    }

    for (let i = 0; i < inputs.length; i++) {
      if (! outputs[i]) break;
      this.addTestCase(inputs[i], outputs[i]);
    }
    const make_input_elm = document.getElementById("make_input");
    if (make_input_elm && make_input_elm.checked && this.make_input) {
      Editor.clear();
      const input_code = input ? this.make_input(input, constraints || "") : "";
      if (input_code) Editor.insert(input_code);
      else            Editor.insert("# 入力コードの生成ができませんでした。ご注意ください。\n");
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
    this.setRunButton(this.words["■Stop"], this.stop);
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
      this.setRunButton(this.words["▶Run"], this.run);
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
    result.value = this.words["【TLE】"]
    result.style.backgroundColor = "#ffcccc";
    clearTimeout(this.timer);
    this.stop();
  },

  stop: function() {
    this.setRunButton(this.words["in preparation"]);
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
      document.getElementById("html").focus();
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

    this.setRunButton(this.words["in preparation"]);

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
