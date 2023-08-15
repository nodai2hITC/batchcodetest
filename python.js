"use strict";

importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.0/full/pyodide.js");

async function loadPyodideAndPackages() {
  self.pyodide = await loadPyodide();
  await self.pyodide.loadPackage(["numpy", "scipy", "scikit-learn", "networkx"]);
  self.postMessage(["init"]);
}
let pyodideReadyPromise = loadPyodideAndPackages();

self.addEventListener("message", async function(e) {
  switch(e.data[0]) {
    case "test":
      await pyodideReadyPromise;
      const data = e.data[1];
      const caseName = data.caseName;
      const program  = data.program;
      const input    = data.input;

      const globals = self.pyodide.toPy({});
      self.pyodide.runPython(`
import sys, io

_in = io.StringIO('''${input.replaceAll("\\", "\\\\").replaceAll("'", "\\'")}''')
sys.stdin = _in
_out = io.StringIO()
sys.stdout = sys.stderr = _out
      `, { globals: globals});
      const startTime = performance.now();
      let output = "";
      try {
        self.pyodide.runPython(program, { globals: self.pyodide.toPy({}) });
        output = self.pyodide.runPython("_out.getvalue()", { globals: globals });
      } catch(err) {
        if (err.toString().indexOf("SystemExit") != -1)
          output = self.pyodide.runPython("_out.getvalue()", { globals: globals });
        else
          output = err.toString();
      }
      const execTime = performance.now() - startTime;
      self.postMessage(["result", { caseName: caseName, output: output, execTime: execTime }]);
  }
});
