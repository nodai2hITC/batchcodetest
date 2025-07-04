BatchCodeTest.make_input = function(_input, constraints) {
    let input = _input.replaceAll(/ *_ */g, "_").trim() + "\n"
    const get_type = function(name) {
        const n = RegExp.escape(name)
        if (constraints.match(new RegExp(`(?:^|, *)${n}.*(?:string|文字列)`, "mi"))) return "str"
        if (constraints.match(new RegExp(`(?:^|, *)${n}.*\`[^\`]\``, "mi"))) return "char"
        if (constraints.match(new RegExp(`(?:^|, *)${n}.*\`[^\`]{2,}\``, "mi"))) return "str"
        if (constraints.match(new RegExp(`(?:^|, *)${n}.*(?:decimal|小数)`, "mi"))) return "float"
        return "int"
    }
    const varname = function(name) {
        if (_input.match(new RegExp(`(?:\\s|^)${RegExp.escape(name.toUpperCase())}[\\s_]`)) &&
            _input.match(new RegExp(`(?:\\s|^)${RegExp.escape(name.toLowerCase())}[\\s_]`))) return name
        return name.toLowerCase()
    }

    let code = ""
    while (input != "") {
        let matched
        if (matched = input.match(/^\s*((.).*)\n(?:\2.*\n)*?.*\\vdots.*\n\2(?:[^_]*_\{?|\s*query\s*(?:[^a-z]+\s*)?)([^},) ]+).*\n/i)) {
            // 複数行の場合
            const n = matched[3]
            const line = matched[1]
            let matched2
            if (matched2 = line.match(/^([a-z])_1 ([a-z])_\{1,\s*1\}.*[cl]?dots/i)) {
                // 先頭が長さ、次以降が配列の場合
                const vn = varname(n), v1 = varname(matched2[1]), v2 = varname(matched2[2])
                code += `${v1} = [0] * ${vn.match(/[\+\-\*\/]/) ? `(${vn})` : vn}\n`
                code += `${v2} = [0] * ${vn.match(/[\+\-\*\/]/) ? `(${vn})` : vn}\n`
                code += `for i in range(${vn}):\n`
                code += `    ${v1}[i], *${v2}[i] = list(map(int, input().split()))\n`
            } else if (matched2 = line.match(/^([a-z]).*[cl]?dots/i)) {
                // 2次元配列の場合
                const v = matched2[1]
                const type = get_type(v)
                code += `${varname(v)} = `
                if (type == "int"  ) code += `[list(map(int, input().split())) for _ in range(${varname(n)})]\n`
                if (type == "float") code += `[list(map(float, input().split())) for _ in range(${varname(n)})]\n`
                if (type == "str"  ) code += `[input().split() for _ in range(${varname(n)})]\n`
                if (type == "char" ) code += `[input() for _ in range(${varname(n)})]\n`
            } else if (matched2 = line.match(/(query|event)/i)) {
                // クエリの場合
                if (constraints.match(/入力.*は(?:すべて|全て)整数/)) {
                    code += `${varname(matched2[1])} = [list(map(int, input().split())) for _ in range(${varname(n)})]\n`
                } else {
                    code += `${varname(matched2[1])} = [input().split() for _ in range(${varname(n)})]\n`
                }
            } else if (matched2 = line.match(/\d\}?\s*[^}\s]/i)) {
                // 複数変数の場合
                const vars = line.replaceAll(/\s*_\s*/g, "_").trim().split(/ +/).map(t => t[0])
                const type = get_type(vars[0])
                const vn = varname(n)
                for (const v of vars) {
                    code += `${varname(v)} = [0] * ${vn.match(/[\+\-\*\/]/) ? `(${vn})` : vn}\n`
                }
                code += `for i in range(${vn}):\n`
                code += "    " + vars.map(varname).join("[i], ") + "[i] = "
                if (type == "int"  ) code += "map(int, input().split())\n"
                if (type == "float") code += "map(float, input().split())\n"
                if (type == "str" || type == "char") code += `input().split()\n`
            } else if (matched2 = line.match(/^([a-z])_(?:\d|\{\d\})$/i)) {
                // 1変数の場合
                const v = matched2[1]
                const type = get_type(v)
                code += `${varname(v)} = `
                if (type == "int"  ) code += `[int(input()) for _ in range(${varname(n)})]\n`
                if (type == "float") code += `[float(input()) for _ in range(${varname(n)})]\n`
                if (type == "str" || type == "char") code += `[input() for _ in range(${varname(n)})]\n`
            } else {
                code += "# 最後まで入力コードの生成ができませんでした。ご注意ください。\n"
                break
            }
        } else if (matched = input.match(/^([a-z])[^a-z ]*\d\}? .*\s*\n/i)) {
            // 1行配列の場合
            const v = matched[1]
            const type = get_type(v)
            code += `${varname(v)} = `
            if (type == "int"  ) code += "list(map(int, input().split()))\n"
            if (type == "float") code += "list(map(float, input().split()))\n"
            if (type == "str" || type == "char") code += "input().split()\n"
        } else if (matched = input.match(/^([a-z] +[a-z].*?) *\n/i)) {
            // 1行複数変数の場合
            const vars = matched[1].split(/ +/)
            const type = get_type(vars[0])
            code += `${vars.map(varname).join(", ")} = `
            if (type == "int"  ) code += "map(int, input().split())\n"
            if (type == "float") code += "map(float, input().split())\n"
            if (type == "str" || type == "char") code += "input().split()\n"
        } else if (matched = input.match(/^([a-z]) *\n/i)) {
            // 1行1変数の場合
            const v = matched[1]
            const type = get_type(v)
            code += `${varname(v)} = `
            if (type == "int"  ) code += "int(input())\n"
            if (type == "float") code += "float(input())\n"
            if (type == "str" || type == "char") code += "input()\n"
        } else {
            code += "# 最後まで入力コードの生成ができませんでした。ご注意ください。\n"
            break
        }
        input = input.slice(matched[0].length)
    }
    return code
}
