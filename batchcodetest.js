"use strict";

const BatchCodeTest = {
  addTestCase: function(input, output) {
    let i = 1;
    while (document.getElementById(`testcase${i}_input`)) i++;
    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>入力例${i}<br /><textarea id="testcase${i}_input">${input.replaceAll("")}</textarea></td>
    <td>出力例${i}<br /><textarea id="testcase${i}_output">${output}</textarea></td>
    <td>実際の結果${i} <span id="testcase${i}_time"></span><br /><textarea id="testcase${i}_result" readonly></textarea></td>
    `.trim();
    document.getElementById("testcases").appendChild(tr);
    document.getElementById(`testcase${i}_input` ).value =  input;
    document.getElementById(`testcase${i}_output`).value = output;
  },

  disableRunButton: function() {
    this.runButton.disabled = true;
    this.runButton.innerHTML = "実行中";
  },

  enableRunButton: function() {
    this.runButton.disabled = false;
    this.runButton.innerHTML = "▶実行 (Ctrl+Enter)";
  },

  copyProgram: function() {
    navigator.clipboard.writeText(Editor.getProgram());
  },

  run: async function() {
    if (this.runButton.disabled) return;
    this.disableRunButton();
    const autocopy = document.getElementById("autocopy");
    if (!autocopy || autocopy.checked) this.copyProgram();
    this.initializeResult();

    setTimeout(async function() {
      let allPassed = true;
      const program = Editor.getProgram();
      let i = 1;
      while (document.getElementById(`testcase${i}_input`)) {
        await new Promise(resolve => requestAnimationFrame(resolve));
        const result = await BatchCodeTest.test(i, program);
        if (result != "AC") allPassed = false;
        i++;
      }
      BatchCodeTest.enableRunButton();
    }, 20);
  },

  initializeResult: function() {
    let i = 1;
    while (document.getElementById(`testcase${i}_input`)) {
      document.getElementById(`testcase${i}_result`).innerText = "";
      document.getElementById(`testcase${i}_result`).style.backgroundColor = "";
      document.getElementById(`testcase${i}_time`).innerText = "";
      i++;
    }
  },

  test: async function(i, program) {
    const input = document.getElementById(`testcase${i}_input`).value.trimEnd() + "\n";
    const expectedOutput = document.getElementById(`testcase${i}_output`).value;
    const startTime = performance.now();
    let result = "AC";
    let output = "";
    try {
      output = await this.runProgram(program, input);
      if (!this.assert_equal(expectedOutput.trimEnd(), output.trimEnd())) result = "WA";
    } catch (e) {
      output = e.toString();
      result = "RE";
    }
    const execTime = (performance.now() - startTime).toFixed(0) + " ms";
    document.getElementById(`testcase${i}_result`).innerHTML = output;
    document.getElementById(`testcase${i}_result`).style.backgroundColor = result == "AC" ? "#ccffcc" : "#ffcccc";
    document.getElementById(`testcase${i}_time`).innerText = `(${execTime})`;
    return result;
  },

  assert_equal: function(expected, actual) { return expected == actual; },

  escape: function(str) {
    return str.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
  }
};

window.addEventListener("DOMContentLoaded", event => {
  document.getElementById("add_testcase").onclick = function(){
    BatchCodeTest.addTestCase("", "");
  };

  const snipets = document.getElementsByClassName("snipet");
  for (let snipet of snipets) {
    snipet.onclick = function() {
      Editor.insert(this.innerText + "\n");
    }
  };

  BatchCodeTest.runButton = document.getElementById("run");
  BatchCodeTest.runButton.disabled = true;
  BatchCodeTest.runButton.onclick = () => { BatchCodeTest.run() };
});
