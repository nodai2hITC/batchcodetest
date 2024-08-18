"use strict";

importScripts("https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.6.2/dist/browser.umd.js");

let RubyModule;

const { DefaultRubyVM } = this["ruby-wasm-wasi"];
const main = async () => {
  const response = await fetch(
    "https://cdn.jsdelivr.net/npm/@ruby/3.3-wasm-wasi@2.6.2/dist/ruby+stdlib.wasm"
    );
  RubyModule = await WebAssembly.compileStreaming(response)
  self.postMessage(["init"]);
};
main();

self.addEventListener("message", async function(e) {
  switch(e.data[0]) {
    case "test":
      const data = e.data[1];
      const caseName = data.caseName;
      const program  = data.program;
      const input    = data.input;
      const { vm } = await DefaultRubyVM(RubyModule);
      vm.eval(`
require 'stringio'
$stdin = StringIO.new('${input.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}', 'r')
$stdout = $stderr = StringIO.new(+'', 'w')
      `);
      let output = "";
      const startTime = performance.now();
      try {
        vm.eval(program);
        output = vm.eval("$stdout.string").toString();
      } catch(err) {
        if (err.toString().indexOf("SystemExit") != -1)
          output = vm.eval("$stdout.string").toString();
        else
          output = err.toString();
      }
      const execTime = performance.now() - startTime;
      self.postMessage(["result", { caseName: caseName, output: output, execTime: execTime }]);
  }
});
