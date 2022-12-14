"use strict";

const Editor = {
  getProgram: function() {
    return this.editor.getValue();
  },

  setProgram: function(value) {
    return this.editor.setValue(value);
  },

  insert: function(text) {
    this.editor.replaceSelection(text);
    this.editor.focus();
  },

  clear: function() {
    this.editor.setValue("");
    this.editor.focus();
  }
}

window.addEventListener("DOMContentLoaded", event => {
  Editor.editor.setOption("extraKeys", {
    "Tab": function(cm) {
      if (cm.somethingSelected()) cm.indentSelection("add");
      else cm.replaceSelection(Array(cm.getOption("indentUnit") + 1).join(" "), "end", "+input");
    },
    "Shift-Tab": function(cm) {
      cm.execCommand("indentLess");
    },
    "Ctrl-Enter": function(cm) {
      BatchCodeTest.run();
    }
  });
});
