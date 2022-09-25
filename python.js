"use strict";

{
  const pythonInitialize = async function() {
    BatchCodeTest.pyodideReadyPromise = await loadPyodide();

    if ("pythonPackages" in BatchCodeTest) {
      await BatchCodeTest.pyodideReadyPromise.loadPackage(BatchCodeTest.pythonPackages);
    }
    BatchCodeTest.enableRunButton();
  }
  window.addEventListener("load", pythonInitialize);
};

BatchCodeTest.runProgram = async function(program, input) {
  const pyodide = await BatchCodeTest.pyodideReadyPromise;
  const globals = pyodide.toPy({});
  pyodide.runPython(`
import sys, io

_in = io.StringIO('''${this.escape(input)}''')
sys.stdin = _in
_out = io.StringIO()
sys.stdout = sys.stderr = _out
`, { globals: globals});
  pyodide.runPython(program, { globals: pyodide.toPy({}) });
  return pyodide.runPython("_out.getvalue()", { globals: globals });
};
