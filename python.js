"use strict";

importScripts("https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js");

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
          output = outputError(err.toString(), program);
      }
      const execTime = performance.now() - startTime;
      self.postMessage(["result", { caseName: caseName, output: output, execTime: execTime }]);
  }
});

function outputError(error, program) {
  let [original_error, filename, lineno, in_, script, type, message] = analyze(error);
  let ret = original_error;

  if (!filename) return;
  script = getScript(script, filename, lineno, program)
  let error_message = getMessage(message, type, script, lineno);
  ret += "\n上に表示されているのが本来のエラーメッセージです。エラーについて調べる場合は、上のエラーメッセージで検索して下さい。\n";
  ret += getErrorType(type) + "\n";
  ret += getFileName(filename) + "の " + lineno.toString() + " 行目でエラーが発生しました。\n";
  ret += script.trimEnd() + "\n";
  ret += error_message;
  return ret;
}

function analyze(error) {
  let original_error = error.replace(/(PythonError: Traceback \(most recent call last\):).*?(\s+File "<exec>", line \d)/s, "$1$2").trimEnd();

  let matched = original_error.match(/[\s\S]*  File "([^"]+)", line (\d+)(?:, in (\S+))?\n([\s\S]*?)([^:\s]+):\s*(.*)$/);
  if (matched){
      let filename = matched[1];
      let lineno = parseInt(matched[2]);
      let in_ = matched[3];
      let script = matched[4];
      let error_type = matched[5];
      let error_message = matched[6];
      return [original_error, filename, lineno, in_, script, error_type, error_message];
  } else {
      return [original_error, null, null, null, null, null, null];
  }
}

const error_types = {
  "SyntaxError": "文法エラー",
  "IndentationError": "インデントのエラー",
  "TabError": "タブとスペースの混在エラー",
  "NameError": "名前に関するエラー",
  "AttributeError": "属性に関するエラー",
  "ModuleNotFoundError": "モジュールエラー",
  "IndexError": "インデクス範囲外エラー",
  "ValueError": "値に関するエラー",
  "ZeroDivisionError": "0除算エラー",
  "TypeError": "型に関するエラー"
}

function getErrorType(type) {
  if (error_types[type]){
      return "【" + error_types[type] + "(" + type + ")】";
  } else {
      return "【エラー(" + type + ")】";
  }
}

function getFileName(filename) {
  if (filename == "<exec>") {
      return "プログラム";
  } else if (filename.startsWith("<")) {
      return filename + " ";
  } else {
      return "ファイル " + filename + " ";
  }
}

function getScript(script, filename, lineno, program) {
  if (script != "") return script;
  if (filename != "<exec>") return "";
  return "    " + program.split("\n")[lineno - 1].toString().trim();
}

function getMessage(msg, error_type, script, lineno) {
  let m;
  // SyntaxError
  if ('invalid syntax' == msg) {
      if (script.match(/^\s*for\s+/) && script.indexOf('in') == -1)
          return '文法が正しくありません。in を忘れていませんか？'
      return '文法が正しくありません。入力ミス等が無いか確認してください。';
  }
  if (m = msg.match(/^'([^\']+)' was never closed$/))
      return '「' + m[1] + '」を閉じ忘れています。';
  if (m = msg.match(/^unterminated (?:triple-quoted )?string literal \(detected at line (\d+)\)$/))
      return '文字列が閉じられていません。クォートを忘れていませんか？（' + m[1] + '行目で検出）';
  if (m = msg.match(/^EOF while scanning (?:triple-quoted )?string literal$/))
      return '文字列が閉じられていません。クォートを忘れていませんか？';
  if ("expected ':'" == msg) {
      if (script.match(/^\s*else\s+.+?[=<>].+?\:/))
          return 'else の後に条件式を書くことはできません。elif を使うか、あるいは条件式を消す必要があります。';
      return 'コロン「:」を忘れています。';
  }
  if ('invalid syntax. Perhaps you forgot a comma?' == msg)
      return '文法が正しくありません。コンマ「,」を忘れていませんか？';
  if ("invalid syntax. Maybe you meant '==' or ':=' instead of '='?" == msg)
      return '文法が正しくありません。「=」ではなく「==」や「:=」ではありませんか？';
  if ("cannot assign to expression here. Maybe you meant '==' instead of '='?" == msg)
      return '式に代入することはできません。「=」ではなく「==」ではありませんか？';
  if ("cannot assign to attribute here. Maybe you meant '==' instead of '='?" == msg)
      return 'ここで属性に代入することはできません。「=」ではなく「==」ではありませんか？';
  if ('EOL while scanning string literal' == msg)
      return '文字列が閉じられていません。クォートを忘れていないか確認してください。';
  if ('unexpected EOF while parsing' == msg)
      return 'カッコ等の閉じ忘れをしていないか確認してください。';
  if (m = msg.match(/^unmatched '([^\']+)'$/))
      return '対応するカッコの無い「' + m[1] + '」があります。';
  if (m = msg.match(/^Missing parentheses in call to '([^\']+)'. Did you mean ([^?]+)\?$/))
      return '「' + m[1] + '」を呼び出すにはカッコが必要です。例：' + m[2];
  if ('Generator expression must be parenthesized' == msg)
      return 'ジェネレータ式にはカッコが必要です。';
  if ('did you forget parentheses around the comprehension target?' == msg)
      return '内包表記のターゲットをカッコで囲むのを忘れていませんか？';
  if ('invalid non-printable character U+3000' == msg)
      return '全角空白が使われています。半角空白に直してください。';
  if (m = msg.match(/^invalid character '([（）’”＋－＊／％：＜＞＝！])' \(([^\)]+)\)$/))
      return '全角の ' + m[1] + ' が使われています。英語入力状態で書き直してください。';
  if (m = msg.match(/^invalid character '(.)' \(([^\)]+)\)$/))
      return '不正な文字 ' + m[1] + ' が使われています。';
  if ("Did you mean to use 'from ... import ...' instead?" == msg)
      return 'from ... import ... と書くべきところを、import ... from ... と書いてしまっていませんか？'
  if ('leading zeros in decimal integer literals are not permitted; use an 0o prefix for octal integers' == msg)
      return '数値の前に 0 を入れてはいけません。'
  if ('invalid decimal literal' == msg)
      return '不正な数値データです。数字から始まる変数名を使っていたりしませんか？'
  // IndentationError, TabError
  if ('unexpected indent' == msg)
      return 'インデントが入るべきでない場所に入ってしまっています。';
  if ('expected an indented block' == msg)
      return 'インデントが入るべき場所にありません。';
  if ('unindent does not match any outer indentation level' == msg)
      return '合わせるべきインデントが合っていません。';
  if (m = msg.match(/^expected an indented block after '([^']+)' statement [oi]n line (\d+)$/))
      return `${m[2]}行目の ${m[1]} の次行（つまり ${lineno}行目）に、インデントがありません。`;
  if ('inconsistent use of tabs and spaces in indentation' == msg)
      return 'インデントにタブとスペースが混在しています。';
  // IndexError
  if ('list index out of range' == msg)
      return 'リストの範囲外を参照しようとしています。リストの大きさと参照しようとした位置を確認してください。';
  if ('tuple index out of range' == msg)
      return 'タプルの範囲外を参照しようとしています。タプルの大きさと参照しようとした位置を確認してください。';
  if ('string index out of range' == msg)
      return '文字列の範囲外を参照しようとしています。文字列の長さと参照しようとした位置を確認してください。';
  // NameError
  if (m = msg.match(/^name '([^\']+)' is not defined. Did you mean: '([^\']+)'\?$/))
      return '「' + m[1] + '」という名前の変数などは見つかりませんでした。「' + m[2] + '」の入力ミスではありませんか？';
  if (m = msg.match(/^name '([^\']+)' is not defined$/))
      return '「' + m[1] + '」という名前の変数などは見つかりませんでした。クォーテーションを忘れていたり、スペルミスや大文字小文字の打ち間違いをしていないか確認してください。';
  // UnboundLocalError
  if (m = msg.match(/^cannot access local variable '([^\']+)' where it is not associated with a value$/))
      return '関数内でまだ定義されていない「' + m[1] + '」という名前のローカル変数が使われています。';
  // TypeError
  if (m = msg.match(/^can only concatenate str \(not "([^"]+)"\) to str$/))
      return '文字列に ' + getType(m[1], "のデータ") + 'を結合することはできません。';
  if (m = msg.match(/^unsupported operand type\(s\) for \+: '([^\']+)' and '([^\']+)'$/))
      return getType(m[1]) + 'に ' + getType(m[2], "のデータ") + 'を足すことはできません。';
  if (m = msg.match(/^([^(]+)\(\) missing (\d+) required positional arguments: (.+)$/)){
      let args = m[3].replace(', and ', ', ').replace(' and ', ', ')
      return m[1] + '() に必要な引数が ' + m[2] + ' 個（' + args + '）足りません。';
  }
  if (m = msg.match(/^([^(]+)\(\) takes (\d+) positional arguments but (\d+) were given$/))
      return m[1] + '() は引数（位置引数）を ' + m[2] + ' 個しか受け取りませんが、' + m[3] + ' 個の引数が与えられています。';
  if (m = msg.match(/^([^(]+)\(\) takes from (\d+) to (\d+) positional arguments but (\d+) were given$/))
      return m[1] + '() は引数（位置引数）を ' + m[2] + '～' + m[3] + ' 個しか受け取りませんが、' + m[4] + ' 個の引数が与えられています。';
  if (m = msg.match(/^([^(]+)\(\) got an unexpected keyword argument '([^']+)'$/))
      return m[1] + '() に \'' + m[2] + '\' という未対応のキーワード引数が与えられています。';
  if (m = msg.match(/^'([^']+)' object is not callable$/)) {
      let m2;
      if (m2 = script.match(/(input|print)\(/))
          return m2[1] + '関数が上書きされてしまっているため呼び出せません。この行以前で ' + m2[1] + ' という名前の変数を使ってしまっていませんか？';
      return getType(m[1], '') + 'のデータは () を付けて呼び出すことはできません。'
  }
  // ValueError
  if (m = msg.match(/^invalid literal for int\(\) with base (\d+): (\'[^\']*\')$/)) {
      if (m[1] == '10') return '文字列 ' + m[2] + ' は、整数として不正なので int型（整数）に変換することができません。';
      else              return '文字列 ' + m[2] + ' は、' + m[1] + '進法の数値として不適切です。';
  }
  if (m = msg.match(/^could not convert string to float: (\'[^\']+\')$/))
      return '文字列 ' + m[1] + ' を float 型に変換することはできません。';
  // AttributeError
  if (m = msg.match(/^'([^\']+)' object has no attribute '([^\']+)'. Did you mean: '([^\']+)'\?$/))
      return getType(m[1], "のオブジェクト") + 'には、属性 ' + m[2] + ' はありません。「' + m[3] + '」のスペルミスではありませんか？';
  if (m = msg.match(/^'([^\']+)' object has no attribute '([^\']+)'$/))
      return getType(m[1], "のオブジェクト") + 'には、属性 ' + m[2] + ' はありません。オブジェクトの型は想定通りか、属性名のスペルミスは無いか確認してください。';
  // KeyError
  if (error_type == 'KeyError')
      return msg + ' というキーはありません。スペルミス等をしていないか確認してください。';
  // ModuleNotFoundError, ImportError
  if (m = msg.match(/^No module named '([^\']+)'$/))
      return 'モジュール「' + m[1] + '」が見つかりません。このモジュールがインストールされているか、スペルミスをしていないか確認してください。';
  if (m = msg.match(/^cannot import name '([^\']+)' from '([^\']+)'$/))
      return 'モジュール「' + m[2] + '」に、「' + m[1] + '」という名前のオブジェクトが見つかりません。スペルミスをしていないか等確認してください。';
  // FileNotFoundError
  if (m = msg.match(/^\[Errno \d+\] No such file or directory: '([^\']+)'$/))
      return 'ファイル「' + m[1] + '」が見つかりません。スペルミス等をしていないか確認してください。';
  // ZeroDivisionError
  if (m = msg.match(/^(float )?division by zero$/))
      return '0 で割ることはできません。除数（割る数）が予期せず 0 になっていないか確認してください。';
  // その他のエラー
  return msg
}

const python_types = {
  "str": "文字列",
  "int": "整数",
  "float": "数値",
  "list": "リスト",
  "tuple": "タプル"
}

function getType(type, suffix = "") {
  if (python_types[type]) {
      return python_types[type] + "(" + type + "型)";
  } else {
      return type + "型" + suffix;
  }
}
