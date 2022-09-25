"use strict";

{
  const rubyInitialize = async function() {
    const { DefaultRubyVM } = window["ruby-wasm-wasi"];
    const response = await fetch("https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@0.3.0-2022-09-22-a/dist/ruby+stdlib.wasm");
    const buffer = await response.arrayBuffer();
    const module = await WebAssembly.compile(buffer);
    const { vm } = await DefaultRubyVM(module);
    BatchCodeTest.ruby_vm = vm;
    BatchCodeTest.enableRunButton();
  };
  window.addEventListener("load", rubyInitialize);
};

BatchCodeTest.runProgram = async function(program, input) {
  this.ruby_vm.eval(`
require 'stringio'
$stdin = StringIO.new('${this.escape(input)}', 'r')
$stdout = $stderr = StringIO.new(+'', 'w')
  `)
  this.ruby_vm.eval("Module.new.module_eval('" + this.escape(program) + "', 'main.rb', 1)");
  return this.ruby_vm.eval("$stdout.string").toString();
};
