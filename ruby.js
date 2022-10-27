"use strict";

importScripts("https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@0.3.0-2022-09-29-a/dist/browser.umd.js");

let RubyModule;

const { DefaultRubyVM } = this["ruby-wasm-wasi"];
const main = async () => {
  const response = await fetch(
    "https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@0.3.0-2022-09-29-a/dist/ruby+stdlib.wasm"
    );
  const buffer = await response.arrayBuffer();
  const module = await WebAssembly.compile(buffer);
  RubyModule = module;
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
        output = err.toString();
      }
      const execTime = performance.now() - startTime;
      self.postMessage(["result", { caseName: caseName, output: output, execTime: execTime }]);
  }
});
