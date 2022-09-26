# 一括コードテスト

- 競技プログラミング等における複数の入出力例に対して、一括でコードテストを行います。
- Wasm を用いてブラウザ上で動作するため、素早く反応が得られます。
- ソースコードを外部に送信しないので、第三者の目に触れる可能性がありません。
  - 例えば情報オリンピック予選には「アップロードしたソースコードが第三者の目に触れる可能性のある環境を用いることはできません．」との規定がありますが、このシステムであれば問題ないはずです。
- 現在、[Ruby 版](https://nodai2hitc.github.io/batchcodetest/ruby.html) と [Python 版](https://nodai2hitc.github.io/batchcodetest/python.html) があります。

# 使い方

## 通常版

[Ruby 版](https://nodai2hitc.github.io/batchcodetest/ruby.html) ・ [Python 版](https://nodai2hitc.github.io/batchcodetest/python.html) 共通です。

1. 競技プログラミングサイトの問題ページにある「入力例」「出力例」をコピーし、当システムの「入力例」「出力例」のところに貼り付けます。
  - 多くの競技プログラミングサイトでは、入力例・出力例を簡単にコピーできる機能があります。（AtCoder であれば、「Copy」ボタンを押せばコピーできます。）
  - 「テストケースを追加」ボタンを押せば、テストケースを必要なだけ増やすことができます。
2. 解答となるソースコードを下部にあるエディターに入力します。
  - 入力処理など「よくあるコード」はボタンクリックで簡単挿入できる機能もあります。
3. 「▶実行 (Ctrl+Enter)」ボタンを押すと、用意した入力例それぞれに対してプログラムを実行し、結果を表示します。結果が「出力例」のものと等しければ緑色に、異なっていれば赤色になります。
4. すべての入力例に対して正しい出力がなされるソースコードが書けたら、実際の問題ページでソースを提出しましょう。
  - 「実行時にプログラムを自動的にコピーしておく」を有効にしておけば、すぐに問題ページで貼り付けて提出できます。

## AtCoder 版

[Ruby 版](https://nodai2hitc.github.io/batchcodetest/ruby_atcoder.html) ・ [Python 版](https://nodai2hitc.github.io/batchcodetest/python_atcoder.html) 共通です。

1. AtCoder の問題ページの HTML ソースを丸ごとコピーして、当システムの「AtCoder の問題ページの HTML を丸ごとコピペしてください。」と書かれたテキストボックスに貼り付け、「入出力例を取得」ボタンを押します。
2. 以降は 通常版の 2.～ と同じです。

# License

[MIT License](http://opensource.org/licenses/MIT).

# Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/nodai2hITC/onbrowserjudge
